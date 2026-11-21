import {MEDICAL_UNIVERSITIES} from "../../lib/universities";
import {academicConnection} from "./connections";
import {slugify, universityId as idFor} from "./ids";

export async function seedCatalog(pool: ReturnType<typeof academicConnection>) {
  const entries=MEDICAL_UNIVERSITIES.map(name=>({name,slug:slugify(name)}));
  if (new Set(entries.map(e=>e.slug)).size !== entries.length) throw new Error("CATALOG_SLUG_COLLISION");
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    for (const e of entries) await client.query("INSERT INTO universities(id,name,slug,is_active) VALUES($1,$2,$3,false) ON CONFLICT (id) DO NOTHING",[idFor(e.slug),e.name,e.slug]);
    await client.query("COMMIT");
  } catch(e) {await client.query("ROLLBACK");throw e;} finally {client.release();}
  return entries.length;
}
if (process.argv[1]?.endsWith("seed-catalog.ts")) {
  const pool=academicConnection("writer");
  try {console.log(`Imported ${await seedCatalog(pool)} inactive catalog candidates; manual review required.`);} finally {await pool.end();}
}
