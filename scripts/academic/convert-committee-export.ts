// Converts the committee (kurul) part of a "komitehane-akademik" research export
// into a normalized dataset for `pnpm academic:seed:committee`. Only committee
// files are read; course/midterm files are ignored. Nothing is published: every
// version stays DRAFT and every catalog entry stays inactive until reviewed.
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {z} from "zod";
import {MEDICAL_UNIVERSITIES} from "../../lib/universities";
import {validateForPublication} from "../../lib/academic/services/publish";
import {committeeDataset, type CommitteeDataset} from "./committee-dataset";
import {slugify, stableUuid, universityId} from "./ids";
import type {DraftRule} from "./seed-rules";

type Row = Record<string, string>;

/** RFC 4180 CSV (quoted fields, embedded newlines, CRLF) with a header row. */
export function parseCsv(text: string): Row[] {
  const records: string[][] = [];
  let field = "", record: string[] = [], quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { record.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      record.push(field); records.push(record); field = ""; record = [];
    } else field += ch;
  }
  if (quoted) throw new Error("CSV_UNTERMINATED_QUOTE");
  if (field || record.length) { record.push(field); records.push(record); }
  const [header, ...body] = records.filter(r => r.length > 1 || r[0] !== "");
  return body.map(r => {
    if (r.length !== header.length) throw new Error(`CSV_COLUMN_COUNT ${r.slice(0, 1).join()}`);
    return Object.fromEntries(header.map((h, i) => [h.replace(/^﻿/, ""), r[i]]));
  });
}

/** Turkish-aware title case for upper-case ÖSYM names ("TIP FAKÜLTESİ" → "Tıp Fakültesi"). */
export function turkishTitleCase(s: string): string {
  return s.toLocaleLowerCase("tr").replace(/(^|[\s(/])(\p{L})/gu, (_, p: string, c: string) => p + c.toLocaleUpperCase("tr"))
    .replace(/ (Ve|İle) /g, (_, w: string) => ` ${w.toLocaleLowerCase("tr")} `);
}

/** Exact weight in hundredths of a percent as num/den, preferring the source expression. */
function exactHundredths(weightPercent: string, expression: string): {num: number; den: number} {
  const e = expression.replace(/\s*\(AKTS\)\s*$/, "").trim();
  if (e) {
    const m = /^(\d+)(?:\*(\d+))?\/(\d+)$/.exec(e);
    if (!m) throw new Error(`UNSUPPORTED_WEIGHT_EXPRESSION ${expression}`);
    const num = Number(m[1]) * Number(m[2] ?? 1) * 100, den = Number(m[3]);
    if (Math.abs(num / den / 100 - Number(weightPercent)) > 0.0001) throw new Error(`WEIGHT_EXPRESSION_MISMATCH ${expression} ${weightPercent}`);
    return {num, den};
  }
  const m = /^(\d{1,3})(?:\.(\d{1,6}))?$/.exec(weightPercent);
  if (!m) throw new Error(`INVALID_WEIGHT ${weightPercent}`);
  const frac = m[2] ?? "";
  const den = 10 ** Math.max(0, frac.length - 2);
  return {num: Number(m[1] + frac.padEnd(2, "0")), den};
}

/**
 * Rounds weights to two decimals so they total exactly 100.00 (largest remainder;
 * ties go to the earlier component). Only components whose exact value has more
 * than two decimals are adjusted; weights already at two decimals are kept as is.
 */
export function roundWeights(weights: {weightPercent: string; expression: string}[]): string[] {
  const exact = weights.map(w => exactHundredths(w.weightPercent, w.expression));
  const floors = exact.map(x => Math.floor(x.num / x.den));
  const rem = exact.map((x, i) => ({i, num: x.num - floors[i] * x.den, den: x.den}));
  let deficit = 10000 - floors.reduce((a, b) => a + b, 0);
  const adjustable = rem.filter(r => r.num > 0).sort((a, b) => b.num * a.den - a.num * b.den || a.i - b.i);
  if (deficit < 0 || deficit > adjustable.length) throw new Error(`WEIGHTS_DO_NOT_TOTAL_100 (${deficit})`);
  for (const r of adjustable) if (deficit-- > 0) floors[r.i]++;
  return floors.map(h => `${Math.floor(h / 100)}.${String(h % 100).padStart(2, "0")}`);
}

// The export uses current YÖK names; the existing candidate catalog still uses
// these older names. Reusing the catalog ids prevents duplicate universities.
const CATALOG_SLUG_ALIASES: Record<string, string> = {
  "aydin-adnan-menderes-universitesi": "adnan-menderes-universitesi",
  "istanbul-beykent-universitesi": "beykent-universitesi",
  "istanbul-nisantasi-universitesi": "nisantasi-universitesi",
};

const schemeRow = z.object({
  source_key: z.string(), program_key: z.string(), course_key: z.string().nullable(), academic_year_start: z.number().int(),
  class_year: z.number().int(), period: z.enum(["ANNUAL", "FALL", "SPRING"]), system_type: z.string(), verification_status: z.string(), notes: z.string().nullable().optional(),
});
const versionRow = z.object({
  source_key: z.string(), scheme_key: z.string(), version_number: z.number().int().positive(), passing_grade: z.number().nullable(),
  passing_grade_status: z.string(), publishable_candidate: z.boolean(), weights_complete: z.boolean(),
});
/**
 * Record of a person-or-session check of each rule against its official
 * documents. Only schemes marked VERIFIED are converted, and only sources whose
 * document hash was recorded during that check are kept.
 */
export const verificationRecord = z.object({
  checkedAt: z.iso.date(),
  method: z.string().min(1).max(2000),
  documents: z.record(z.url(), z.string().regex(/^[0-9a-f]{64}$/)),
  schemes: z.record(z.string(), z.object({
    status: z.enum(["VERIFIED", "UNVERIFIED", "MISMATCH"]),
    finding: z.string().min(1).max(1000),
    sources: z.array(z.object({url: z.url(), type: z.string().min(1).max(100), title: z.string().max(500), note: z.string().max(1500)}).strict()).optional(),
  }).strict()),
}).strict();
export type VerificationRecord = z.infer<typeof verificationRecord>;

async function jsonl<T>(file: string, schema: z.ZodType<T>): Promise<T[]> {
  return (await readFile(file, "utf8")).split("\n").filter(l => l.trim()).map(l => schema.parse(JSON.parse(l)));
}

export async function convertCommitteeExport(dir: string, verification: VerificationRecord): Promise<CommitteeDataset> {
  const csv = async (name: string) => parseCsv(await readFile(path.join(dir, name), "utf8"));
  const [universities, faculties, programs, components, sources] = await Promise.all(
    ["universities.csv", "faculties.csv", "programs.csv", "committee_assessment_components.csv", "committee_grading_rule_sources.csv"].map(csv));
  const schemes = await jsonl(path.join(dir, "committee_grading_schemes.jsonl"), schemeRow);
  const versions = await jsonl(path.join(dir, "committee_grading_scheme_versions.jsonl"), versionRow);
  const byKey = (rows: Row[]) => new Map(rows.map(r => [r.source_key, r]));
  const uniByKey = byKey(universities), facByKey = byKey(faculties), progByKey = byKey(programs);
  const group = (rows: Row[]) => { const m = new Map<string, Row[]>(); for (const r of rows) m.set(r.version_key, [...(m.get(r.version_key) ?? []), r]); return m; };
  const compsByVersion = group(components), sourcesByVersion = group(sources);
  const versionsByScheme = new Map<string, z.infer<typeof versionRow>[]>();
  for (const v of versions) versionsByScheme.set(v.scheme_key, [...(versionsByScheme.get(v.scheme_key) ?? []), v]);
  const catalogNames = new Map(MEDICAL_UNIVERSITIES.map(name => [slugify(name), name]));
  const years = new Set(schemes.map(s => s.academic_year_start));
  if (years.size !== 1) throw new Error(`EXPECTED_ONE_ACADEMIC_YEAR ${[...years].join(",")}`);
  const [academicYearStart] = years;

  const get = <T>(m: Map<string, T>, k: string) => { const v = m.get(k); if (!v) throw new Error(`MISSING_REFERENCE ${k}`); return v; };
  const out: CommitteeDataset = {
    meta: {exportName: path.basename(path.resolve(dir)), academicYearStart, generatedFrom: "scripts/academic/convert-committee-export.ts", notes: []},
    universities: [], faculties: [], programs: [], schemes: [], versions: [], excluded: [],
  };
  const uniIds = new Map<string, string>(), facIds = new Map<string, string>(), progIds = new Map<string, string>();
  const catalogFor = (programKey: string) => {
    const p = get(progByKey, programKey), f = get(facByKey, p.faculty_key), u = get(uniByKey, f.university_key);
    if (!uniIds.has(u.source_key)) {
      const catalogSlug = CATALOG_SLUG_ALIASES[u.slug] ?? u.slug;
      const id = universityId(catalogSlug);
      uniIds.set(u.source_key, id);
      out.universities.push({id, name: catalogNames.get(u.slug) ?? turkishTitleCase(u.name), slug: u.slug});
    }
    if (!facIds.has(f.source_key)) {
      const id = stableUuid(`komitehane:${f.source_key}`);
      facIds.set(f.source_key, id);
      out.faculties.push({id, universityId: uniIds.get(u.source_key)!, name: turkishTitleCase(f.name), slug: f.slug});
    }
    if (!progIds.has(p.source_key)) {
      const id = stableUuid(`komitehane:${p.source_key}`);
      progIds.set(p.source_key, id);
      if (p.duration_conflict) throw new Error(`PROGRAM_DURATION_CONFLICT ${p.source_key}`);
      out.programs.push({id, facultyId: facIds.get(f.source_key)!, name: p.name, slug: p.slug, durationYears: Number(p.duration_years)});
    }
    return progIds.get(p.source_key)!;
  };

  // Every Tıp program in the export joins the inactive catalog, including those
  // without any committee rule yet (e.g. separately coded English variants).
  const medicalPrograms = programs.filter(p => /^Tıp\b/u.test(p.name) && /TIP/u.test(get(facByKey, p.faculty_key).name));
  for (const p of [...medicalPrograms].sort((a, b) => a.source_key.localeCompare(b.source_key))) catalogFor(p.source_key);

  for (const s of [...schemes].sort((a, b) => a.source_key.localeCompare(b.source_key))) {
    if (s.system_type !== "COMMITTEE" || s.course_key) throw new Error(`NOT_A_COMMITTEE_SCHEME ${s.source_key}`);
    const programId = catalogFor(s.program_key);
    const exclude = (reason: string) => { out.excluded.push({scheme: s.source_key, reason: reason.slice(0, 500)}); };
    const note = (s.notes ?? "").replace(/\s+/g, " ").slice(0, 300);
    if (s.verification_status !== "VERIFIED_CURRENT") { exclude(`${s.verification_status}: ${note}`); continue; }
    const vs = versionsByScheme.get(s.source_key) ?? [];
    if (vs.length !== 1) { exclude(`EXPECTED_ONE_VERSION (${vs.length})`); continue; }
    const v = vs[0];
    if (!v.publishable_candidate || !v.weights_complete) { exclude(`NOT_PUBLISHABLE_CANDIDATE: ${note}`); continue; }
    if (v.passing_grade === null || v.passing_grade_status !== "VERIFIED_CURRENT") { exclude(`PASSING_GRADE_${v.passing_grade_status}: ${note}`); continue; }
    const passing = v.passing_grade;
    if (passing < 0 || passing > 100 || Math.round(passing * 100) !== passing * 100) { exclude(`INVALID_PASSING_GRADE ${passing}`); continue; }

    const comps = [...(compsByVersion.get(v.source_key) ?? [])].sort((a, b) => Number(a.position) - Number(b.position));
    const committees = comps.filter(c => c.component_type === "COMMITTEE"), finals = comps.filter(c => c.component_type === "FINAL");
    if (finals.length !== 1 || committees.length + 1 !== comps.length) { exclude("UNSUPPORTED_COMPONENTS"); continue; }
    let weights: string[];
    try { weights = roundWeights([...committees, ...finals].map(c => ({weightPercent: c.weight_percent, expression: c.weight_expression}))); }
    catch (e) { exclude((e as Error).message); continue; }

    const check = verification.schemes[s.source_key];
    if (!check || check.status !== "VERIFIED") { exclude(`NOT_VERIFIED_AGAINST_SOURCE: ${check?.finding ?? "no verification record"}`); continue; }
    const verifiedAt = `${verification.checkedAt}T00:00:00.000Z`, prefix = `Doğrulama ${verification.checkedAt}: ${check.finding}`;
    const seen = new Set<string>();
    const accepted = [
      ...(sourcesByVersion.get(v.source_key) ?? []).filter(r => r.accessibility === "ACCESSIBLE").map(r => ({
        url: r.source_url, type: r.source_type, title: r.source_title.slice(0, 500),
        note: [r.academic_year && `Yıl: ${r.academic_year}`, r.location && `Konum: ${r.location}`, r.evidence && `Kanıt: ${r.evidence}`].filter(Boolean).join(" | "),
      })),
      ...(check.sources ?? []),
    ].filter(r => {
      if (!r.url.startsWith("https://") || seen.has(r.url) || !verification.documents[r.url]) return false;
      seen.add(r.url); return true;
    });
    if (!accepted.length) { exclude("NO_VERIFIED_HTTPS_SOURCE"); continue; }

    const rule: DraftRule = {
      id: stableUuid(`komitehane:${v.source_key}`),
      schemeId: stableUuid(`komitehane:${s.source_key}`),
      versionNumber: v.version_number,
      passingGrade: passing.toFixed(2),
      components: [
        ...committees.map((_, i) => ({type: "COMMITTEE" as const, position: i + 1, weightPercent: weights[i]})),
        {type: "FINAL" as const, position: 1, weightPercent: weights[committees.length]},
      ],
      sources: accepted.map(r => ({
        url: r.url, type: r.type, verifiedAt, title: r.title,
        note: `${prefix} | SHA-256: ${verification.documents[r.url]} | ${r.note}`.slice(0, 2000),
      })),
    };
    const errors = validateForPublication("COMMITTEE", rule.passingGrade,
      rule.components.map(c => ({component_type: c.type, position: c.position, weight_percent: c.weightPercent})),
      rule.sources.map(r => ({source_url: r.url, verified_at: new Date(r.verifiedAt)})));
    if (errors.length) { exclude(errors.join(",")); continue; }
    out.schemes.push({id: rule.schemeId, programId, courseId: null, academicYearStart: s.academic_year_start, classYear: s.class_year, period: s.period, system: "COMMITTEE"});
    out.versions.push(rule);
  }
  out.meta.notes = [
    "All catalog entries are inactive and all versions are DRAFT; nothing is published by the import.",
    "The catalog lists every Tıp program in the export (ÖSYM 2026 Tablo-4, KKTC excluded), including programs without a committee rule.",
    "Weights with more than two decimals (equal or AKTS-weighted shares such as 60/7) are rounded to two decimals by largest remainder so each version totals exactly 100.00.",
    `Every included version was compared with its official documents on ${verification.checkedAt} (see data/academic/committee-2026-27-verification.json); a person must still approve each one before \`pnpm academic:publish\`.`,
  ];
  return committeeDataset.parse(out);
}

if (process.argv[1]?.endsWith("convert-committee-export.ts")) {
  const [dir, verificationFile, outFile] = process.argv.slice(2);
  if (!dir || !verificationFile || !outFile) throw new Error("Usage: pnpm academic:convert:committee <export-dir> <verification.json> <out.json>");
  const verification = verificationRecord.parse(JSON.parse(await readFile(verificationFile, "utf8")));
  const data = await convertCommitteeExport(dir, verification);
  await writeFile(outFile, JSON.stringify(data, null, 2) + "\n");
  console.log(`Wrote ${outFile}: ${data.universities.length} universities, ${data.faculties.length} faculties, ${data.programs.length} programs, ${data.versions.length} draft committee versions, ${data.excluded.length} excluded schemes.`);
}
