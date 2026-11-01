import {readFile} from "node:fs/promises";
import type {Pool} from "pg";
import {z} from "zod";
import {academicConnection} from "./connections";
const numberString=z.string().regex(/^\d{1,3}(?:\.\d{1,2})?$/).refine(x=>Number(x)<=100);
const fileSchema=z.array(z.object({
  id:z.uuid(), schemeId:z.uuid(), versionNumber:z.number().int().positive(), passingGrade:numberString,
  components:z.array(z.object({type:z.enum(["COMMITTEE","MIDTERM","FINAL"]),position:z.number().int().min(1).max(11),weightPercent:numberString.refine(x=>Number(x)>0)})).max(11),
  sources:z.array(z.object({url:z.url().refine(s=>new URL(s).protocol==="https:"),type:z.string().min(1).max(100),verifiedAt:z.iso.datetime(),title:z.string().max(500).optional()})).max(20),
}).strict()).max(500);
export async function seedRules(pool:Pool,raw:unknown) {
  const rows=fileSchema.parse(raw);const client=await pool.connect();
  try {
    await client.query("BEGIN");let inserted=0;
    for (const row of rows) {
      const result=await client.query("INSERT INTO grading_scheme_versions(id,scheme_id,version_number,passing_grade,status) VALUES($1,$2,$3,$4,'DRAFT') ON CONFLICT (id) DO NOTHING RETURNING id",[row.id,row.schemeId,row.versionNumber,row.passingGrade]);
      if (!result.rowCount) continue;
      inserted++;
      for (const c of row.components) await client.query("INSERT INTO assessment_components(version_id,component_type,position,weight_percent) VALUES($1,$2,$3,$4)",[row.id,c.type,c.position,c.weightPercent]);
      for (const s of row.sources) await client.query("INSERT INTO grading_rule_sources(version_id,source_url,source_type,verified_at,source_title) VALUES($1,$2,$3,$4,$5)",[row.id,s.url,s.type,s.verifiedAt,s.title??null]);
    }
    await client.query("COMMIT");return inserted;
  } catch(e) {await client.query("ROLLBACK");throw e;} finally {client.release();}
}
if(process.argv[1]?.endsWith("seed-rules.ts")) {
  const filename=process.argv[2];if(!filename)throw new Error("Usage: pnpm academic:seed:rules <draft-rules.json>");
  const raw=JSON.parse(await readFile(filename,"utf8"));const pool=academicConnection("writer");
  try {console.log(`Inserted ${await seedRules(pool,raw)} draft versions. No rule was published.`);} finally {await pool.end();}
}
