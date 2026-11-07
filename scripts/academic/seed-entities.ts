import {readFile} from "node:fs/promises";
import {z} from "zod";
import type {Pool} from "pg";
import {academicConnection} from "./connections";
const id=z.uuid();const name=z.string().min(1).max(200);const slug=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);
const scheme=z.object({id,programId:id,courseId:id.nullable(),academicYearStart:z.number().int().min(1900).max(2200),classYear:z.number().int().min(1).max(12),period:z.enum(["ANNUAL","FALL","SPRING"]),system:z.enum(["COMMITTEE","MIDTERM"])}).strict().refine(x=>x.system==="COMMITTEE"?x.courseId===null:x.courseId!==null);
const input=z.object({
  faculties:z.array(z.object({id,universityId:id,name,slug}).strict()).max(10000).default([]),
  programs:z.array(z.object({id,facultyId:id,name,slug,durationYears:z.number().int().min(1).max(12)}).strict()).max(10000).default([]),
  courses:z.array(z.object({id,programId:id,name,slug,courseCode:z.string().max(100).nullable().optional()}).strict()).max(50000).default([]),
  schemes:z.array(scheme).max(50000).default([]),
}).strict();
export async function seedEntities(pool:Pool,raw:unknown) {
  const data=input.parse(raw);const c=await pool.connect();let inserted=0;
  try {
    await c.query("BEGIN");
    for(const x of data.faculties)inserted+=(await c.query("INSERT INTO faculties(id,university_id,name,slug,is_active) VALUES($1,$2,$3,$4,false) ON CONFLICT (id) DO NOTHING",[x.id,x.universityId,x.name,x.slug])).rowCount??0;
    for(const x of data.programs)inserted+=(await c.query("INSERT INTO programs(id,faculty_id,name,slug,duration_years,is_active) VALUES($1,$2,$3,$4,$5,false) ON CONFLICT (id) DO NOTHING",[x.id,x.facultyId,x.name,x.slug,x.durationYears])).rowCount??0;
    for(const x of data.courses)inserted+=(await c.query("INSERT INTO courses(id,program_id,name,slug,course_code,is_active) VALUES($1,$2,$3,$4,$5,false) ON CONFLICT (id) DO NOTHING",[x.id,x.programId,x.name,x.slug,x.courseCode??null])).rowCount??0;
    for(const x of data.schemes)inserted+=(await c.query("INSERT INTO grading_schemes(id,program_id,course_id,academic_year_start,class_year,period,system_type) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING",[x.id,x.programId,x.courseId,x.academicYearStart,x.classYear,x.period,x.system])).rowCount??0;
    await c.query("COMMIT");return inserted;
  } catch(e) {await c.query("ROLLBACK");throw e;} finally {c.release();}
}
if(process.argv[1]?.endsWith("seed-entities.ts")) {
  const filename=process.argv[2];if(!filename)throw Error("Usage: pnpm academic:seed:entities <reviewed-entities.json>");
  const data=JSON.parse(await readFile(filename,"utf8"));const pool=academicConnection("writer");
  try {console.log(`Imported ${await seedEntities(pool,data)} records; entities are inactive until reviewed.`);}finally{await pool.end();}
}
