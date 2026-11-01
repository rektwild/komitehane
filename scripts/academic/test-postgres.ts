import assert from "node:assert/strict";
import {drizzle} from "drizzle-orm/node-postgres";
import {migrate} from "drizzle-orm/node-postgres/migrator";
import {academicConnection} from "./connections";
import {seedCatalog} from "./seed-catalog";
import {seedRules} from "./seed-rules";
import {seedEntities} from "./seed-entities";
import {readFile} from "node:fs/promises";
import {publishVersion} from "../../lib/academic/services/publish";

// This script deliberately refuses non-loopback targets and non-test DB names.
const pool=academicConnection("test");
const uuid=(n:number)=>`00000000-0000-4000-8000-${n.toString().padStart(12,"0")}`;
try {
  const before=await pool.query<{n:string}>("SELECT count(*)::text n FROM information_schema.tables WHERE table_schema='public'");
  assert.equal(before.rows[0].n,"0","Test requires a fresh, empty database. No tables were dropped.");
  await migrate(drizzle(pool),{migrationsFolder:"./drizzle/academic"});
  await migrate(drizzle(pool),{migrationsFolder:"./drizzle/academic"});
  const tables=await pool.query<{n:string}>("SELECT count(*)::text n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
  assert.equal(tables.rows[0].n,"8");
  const count=await seedCatalog(pool); await seedCatalog(pool);
  const seeded=await pool.query<{n:string}>("SELECT count(*)::text n FROM universities");
  assert.equal(Number(seeded.rows[0].n),count,"Catalog seed must be idempotent");
  await pool.query("INSERT INTO universities(id,name,slug) VALUES ($1,'Fictional University','fictional-test')",[uuid(1)]);
  const entities=JSON.parse(await readFile("tests/fixtures/academic/fictional-entities.json","utf8"));
  assert.equal(await seedEntities(pool,entities),4);
  assert.equal(await seedEntities(pool,entities),0,"Entity seed must be idempotent");
  await pool.query("INSERT INTO faculties(id,university_id,name,slug) VALUES($1,$2,'Faculty','faculty')",[uuid(2),uuid(1)]);
  await pool.query("INSERT INTO programs(id,faculty_id,name,slug,duration_years) VALUES($1,$3,'Program','program',6),($2,$3,'Other','other',6)",[uuid(3),uuid(4),uuid(2)]);
  await pool.query("INSERT INTO courses(id,program_id,name,slug) VALUES ($1,$2,'Course','course')",[uuid(5),uuid(4)]);
  await pool.query("INSERT INTO grading_schemes(id,program_id,academic_year_start,class_year,period,system_type) VALUES($1,$2,2026,2,'ANNUAL','COMMITTEE')",[uuid(6),uuid(3)]);
  await assert.rejects(pool.query("INSERT INTO grading_schemes(program_id,academic_year_start,class_year,period,system_type) VALUES($1,2026,2,'ANNUAL','COMMITTEE')",[uuid(3)]));
  await assert.rejects(pool.query("INSERT INTO grading_schemes(program_id,course_id,academic_year_start,class_year,period,system_type) VALUES ($1,$2,2026,2,'FALL','MIDTERM')",[uuid(3),uuid(5)]));
  const fixture=JSON.parse(await readFile("tests/fixtures/academic/fictional-draft.json","utf8"));
  assert.equal(await seedRules(pool,fixture),1);
  assert.equal(await seedRules(pool,fixture),0,"Draft seed must be idempotent");
  await pool.query("INSERT INTO grading_scheme_versions(id,scheme_id,version_number,passing_grade) VALUES($1,$2,2,60)",[uuid(8),uuid(6)]);
  await pool.query("INSERT INTO assessment_components(version_id,component_type,position,weight_percent) VALUES($1,'COMMITTEE',1,40),($1,'FINAL',1,60)",[uuid(8)]);
  await pool.query("INSERT INTO grading_rule_sources(version_id,source_url,source_type,verified_at) VALUES($1,'https://fictional.test/document','TEST',now())",[uuid(8)]);
  await pool.query("INSERT INTO grading_scheme_versions(id,scheme_id,version_number,passing_grade) VALUES($1,$2,3,60),($3,$2,4,60)",[uuid(9),uuid(6),uuid(10)]);
  await pool.query("INSERT INTO assessment_components(version_id,component_type,position,weight_percent) VALUES($1,'COMMITTEE',1,39.99),($1,'FINAL',1,60),($2,'COMMITTEE',1,40),($2,'FINAL',1,60)",[uuid(9),uuid(10)]);
  await pool.query("INSERT INTO grading_rule_sources(version_id,source_url,source_type,verified_at) VALUES($1,'https://fictional.test/document','TEST',now())",[uuid(9)]);
  await assert.rejects(publishVersion(pool,uuid(9)),/INVALID_WEIGHT_TOTAL/);
  await assert.rejects(publishVersion(pool,uuid(10)),/MISSING_VERIFIED_SOURCE/);
  if (process.argv.includes("--single-connection")) {
    console.warn("PGlite wire mode: publication is sequential; no PostgreSQL concurrency claim is made.");
    await publishVersion(pool,uuid(7));await publishVersion(pool,uuid(8));
  } else {
    await Promise.all([publishVersion(pool,uuid(7)),publishVersion(pool,uuid(8))]);
  }
  const published=await pool.query<{status:string;n:string}>("SELECT status,count(*)::text n FROM grading_scheme_versions WHERE scheme_id=$1 GROUP BY status",[uuid(6)]);
  assert.equal(published.rows.find(r=>r.status==="PUBLISHED")?.n,"1");
  assert.equal(published.rows.find(r=>r.status==="SUPERSEDED")?.n,"1");
  await assert.rejects(pool.query("UPDATE assessment_components SET weight_percent=50 WHERE version_id=$1",[uuid(7)]));
  console.log(process.argv.includes("--single-connection") ? "PGlite wire: migration, idempotent catalog, entity and draft seeds, constraints, sequential publish and immutability passed." : "PostgreSQL: clean migration, idempotent migration and catalog, entity and draft seeds, constraints, concurrent publish and immutability passed.");
} finally {await pool.end();}
