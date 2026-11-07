import {createHash} from "node:crypto";
import {MEDICAL_UNIVERSITIES} from "../../lib/universities";
import {academicConnection} from "./connections";

function slugify(s: string): string {
  return s.toLocaleLowerCase("tr").replace(/[ı]/g,"i").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function idFor(slug:string): string {
  const bytes = createHash("sha256").update(`komitehane:university:${slug}`).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h=bytes.subarray(0,16).toString("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
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
