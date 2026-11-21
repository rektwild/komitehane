import {readFile} from "node:fs/promises";
import type {Pool} from "pg";
import {committeeDataset} from "./committee-dataset";
import {academicConnection} from "./connections";
import {insertEntities, insertUniversities} from "./seed-entities";
import {insertDraftRules} from "./seed-rules";

/**
 * Imports a normalized committee dataset in one transaction: inactive
 * universities, faculties and programs, committee schemes and DRAFT versions.
 * Re-running is a no-op for rows whose ids already exist. Nothing is published.
 */
export async function seedCommittee(pool: Pool, raw: unknown) {
  const data = committeeDataset.parse(raw);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const universities = await insertUniversities(client, data.universities);
    const entities = await insertEntities(client, {faculties: data.faculties, programs: data.programs, courses: [], schemes: data.schemes});
    const versions = await insertDraftRules(client, data.versions);
    await client.query("COMMIT");
    return {universities, entities, versions};
  } catch (e) {await client.query("ROLLBACK"); throw e;} finally {client.release();}
}

if (process.argv[1]?.endsWith("seed-committee.ts")) {
  const filename = process.argv[2];
  if (!filename) throw new Error("Usage: pnpm academic:seed:committee <committee-dataset.json>");
  const raw = JSON.parse(await readFile(filename, "utf8"));
  const pool = academicConnection("writer");
  try {
    const r = await seedCommittee(pool, raw);
    console.log(`Inserted ${r.universities} universities, ${r.entities} faculties/programs/schemes and ${r.versions} DRAFT versions. Catalog entries are inactive; no rule was published.`);
  } finally {await pool.end();}
}
