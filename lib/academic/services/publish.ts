import type {Pool} from "pg";

type Component = {component_type: string; position: number; weight_percent: string};
type Source = {source_url: string; verified_at: Date | null};

/** A publisher must manually verify that each source establishes the actual rule. */
export function validateForPublication(system: string, passingGrade: string, components: Component[], sources: Source[]): string[] {
  const errors: string[] = [];
  const expected = system === "COMMITTEE" ? "COMMITTEE" : system === "MIDTERM" ? "MIDTERM" : null;
  const grade = Number(passingGrade);
  if (!Number.isFinite(grade) || grade < 0 || grade > 100) errors.push("INVALID_PASSING_GRADE");
  const intermediate = components.filter(c => c.component_type === expected);
  const finals = components.filter(c => c.component_type === "FINAL");
  if (!expected || intermediate.length < 1 || intermediate.length > 10 || finals.length !== 1 || intermediate.length + finals.length !== components.length) errors.push("UNSUPPORTED_COMPONENTS");
  if (intermediate.some((c,i) => c.position !== i + 1) || finals.some(c => c.position !== 1)) errors.push("INVALID_POSITIONS");
  let total = 0;
  for (const c of components) {
    if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(c.weight_percent)) { errors.push("INVALID_WEIGHT"); continue; }
    const [whole, frac = ""] = c.weight_percent.split(".");
    const weight = Number(whole) * 100 + Number(frac.padEnd(2,"0"));
    if (weight <= 0 || weight > 10000) errors.push("INVALID_WEIGHT");
    total += weight;
  }
  if (total !== 10000) errors.push("INVALID_WEIGHT_TOTAL");
  if (!sources.length || sources.some(s => {
    try { const u = new URL(s.source_url); return u.protocol !== "https:" || !s.verified_at || Number.isNaN(new Date(s.verified_at).getTime()); }
    catch { return true; }
  })) errors.push("MISSING_VERIFIED_SOURCE");
  return [...new Set(errors)];
}

/** Caller provides an isolated writer pool. No public endpoint exposes this operation. */
export async function publishVersion(pool: Pool, versionId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const lock = await client.query<{id:string; system_type:string; class_year:number; duration_years:number}>(`SELECT s.id, s.system_type,s.class_year,p.duration_years FROM grading_schemes s JOIN grading_scheme_versions v ON v.scheme_id=s.id JOIN programs p ON p.id=s.program_id WHERE v.id=$1 FOR UPDATE OF s`,[versionId]);
    if (lock.rowCount !== 1) throw new Error("VERSION_NOT_FOUND");
    if (lock.rows[0].class_year > lock.rows[0].duration_years) throw new Error("CLASS_OUTSIDE_PROGRAM_DURATION");
    const version = await client.query<{status:string;passing_grade:string}>("SELECT status, passing_grade FROM grading_scheme_versions WHERE id=$1 FOR UPDATE",[versionId]);
    if (version.rows[0]?.status !== "DRAFT") throw new Error("VERSION_NOT_DRAFT");
    const components = await client.query<Component>("SELECT component_type, position, weight_percent FROM assessment_components WHERE version_id=$1 ORDER BY component_type, position",[versionId]);
    const sources = await client.query<Source>("SELECT source_url, verified_at FROM grading_rule_sources WHERE version_id=$1",[versionId]);
    const errors = validateForPublication(lock.rows[0].system_type, version.rows[0].passing_grade, components.rows, sources.rows);
    if (errors.length) throw new Error(errors.join(","));
    await client.query("UPDATE grading_scheme_versions SET status='SUPERSEDED', superseded_at=now() WHERE scheme_id=$1 AND status='PUBLISHED'",[lock.rows[0].id]);
    await client.query("UPDATE grading_scheme_versions SET status='PUBLISHED', published_at=now() WHERE id=$1",[versionId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
