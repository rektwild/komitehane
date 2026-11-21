import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import {validateForPublication} from "../../lib/academic/services/publish";
import {MEDICAL_UNIVERSITIES} from "../../lib/universities";
import {committeeDataset} from "../../scripts/academic/committee-dataset";
import {parseCsv, roundWeights, turkishTitleCase, verificationRecord} from "../../scripts/academic/convert-committee-export";
import {slugify, universityId} from "../../scripts/academic/ids";

const data = committeeDataset.parse(JSON.parse(readFileSync("data/academic/committee-2026-27.json", "utf8")));
const verification = verificationRecord.parse(JSON.parse(readFileSync("data/academic/committee-2026-27-verification.json", "utf8")));

describe("committee dataset", () => {
  it("only contains structurally publishable DRAFT committee versions", () => {
    expect(data.versions.length).toBeGreaterThan(0);
    for (const v of data.versions) {
      const errors = validateForPublication("COMMITTEE", v.passingGrade,
        v.components.map(c => ({component_type: c.type, position: c.position, weight_percent: c.weightPercent})),
        v.sources.map(s => ({source_url: s.url, verified_at: new Date(s.verifiedAt)})));
      expect(errors, v.id).toEqual([]);
    }
  });
  it("only cites documents that were checked and hashed", () => {
    const verified = Object.values(verification.schemes).filter(x => x.status === "VERIFIED").length;
    expect(data.versions.length).toBeLessThanOrEqual(verified + verification.derived.length);
    for (const v of data.versions) for (const s of v.sources) {
      expect(verification.documents[s.url], s.url).toMatch(/^[0-9a-f]{64}$/);
      expect(s.verifiedAt).toBe(`${verification.checkedAt}T00:00:00.000Z`);
    }
  });
  it("reuses candidate catalog ids for the same universities", () => {
    const catalogIds = new Set(MEDICAL_UNIVERSITIES.map(name => universityId(slugify(name))));
    expect(data.universities.filter(u => !catalogIds.has(u.id)).map(u => u.name)).toEqual([]);
    expect(data.universities).toHaveLength(MEDICAL_UNIVERSITIES.length);
    expect(data.universities.find(u => u.slug === "aydin-adnan-menderes-universitesi")?.id).toBe(universityId("adnan-menderes-universitesi"));
  });
  it("uses readable names rather than upper-case source names", () => {
    for (const x of [...data.universities, ...data.faculties]) expect(x.name, x.name).not.toBe(x.name.toLocaleUpperCase("tr"));
  });
});

describe("committee export conversion", () => {
  it("rounds repeating weights to two decimals that total 100", () => {
    const w = roundWeights([...Array(7)].map(() => ({weightPercent: "8.5714", expression: "60/7"})).concat({weightPercent: "40.0", expression: ""}));
    expect(w).toEqual(["8.58", "8.57", "8.57", "8.57", "8.57", "8.57", "8.57", "40.00"]);
    expect(roundWeights([{weightPercent: "60", expression: ""}, {weightPercent: "40.0", expression: ""}])).toEqual(["60.00", "40.00"]);
  });
  it("refuses to hide a wrong total behind rounding", () => {
    expect(() => roundWeights([{weightPercent: "59.99", expression: ""}, {weightPercent: "40", expression: ""}])).toThrow(/WEIGHTS_DO_NOT_TOTAL_100/);
    expect(() => roundWeights([{weightPercent: "9", expression: "60/7"}])).toThrow(/WEIGHT_EXPRESSION_MISMATCH/);
  });
  it("title-cases Turkish upper-case names", () => {
    expect(turkishTitleCase("HAMİDİYE ULUSLARARASI TIP FAKÜLTESİ")).toBe("Hamidiye Uluslararası Tıp Fakültesi");
    expect(turkishTitleCase("İNSAN VE TOPLUM BİLİMLERİ FAKÜLTESİ")).toBe("İnsan ve Toplum Bilimleri Fakültesi");
  });
  it("parses quoted CSV fields", () => {
    expect(parseCsv('a,b\r\n"x, ""y""","line\nbreak"\n')).toEqual([{a: 'x, "y"', b: "line\nbreak"}]);
  });
});
