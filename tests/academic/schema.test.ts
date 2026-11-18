import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
import {seedCatalog} from "../../scripts/academic/seed-catalog";
import {seedEntities} from "../../scripts/academic/seed-entities";

// Fictional data only. This exercises PostgreSQL-compatible SQL in-process;
// it does not replace real-server or concurrent-transaction tests.
const db = new PGlite();
const u="00000000-0000-4000-8000-000000000001", f="00000000-0000-4000-8000-000000000002", p="00000000-0000-4000-8000-000000000003", p2="00000000-0000-4000-8000-000000000004", c="00000000-0000-4000-8000-000000000005", s="00000000-0000-4000-8000-000000000006", v="00000000-0000-4000-8000-000000000007";
beforeAll(async () => {
  const sql = await readFile("drizzle/academic/0000_red_iron_lad.sql","utf8");
  for (const part of sql.split("--> statement-breakpoint")) if (part.trim()) await db.exec(part);
  await db.query("INSERT INTO universities(id,name,slug) VALUES ($1,'Test University','fictional')",[u]);
  await db.query("INSERT INTO faculties(id,university_id,name,slug) VALUES ($1,$2,'Test Faculty','faculty')",[f,u]);
  await db.query("INSERT INTO programs(id,faculty_id,name,slug,duration_years) VALUES ($1,$3,'Program','program',6),($2,$3,'Other','other',6)",[p,p2,f]);
  await db.query("INSERT INTO courses(id,program_id,name,slug) VALUES ($1,$2,'Course','course')",[c,p2]);
  await db.query("INSERT INTO grading_schemes(id,program_id,academic_year_start,class_year,period,system_type) VALUES ($1,$2,2026,2,'ANNUAL','COMMITTEE')",[s,p]);
  await db.query("INSERT INTO grading_scheme_versions(id,scheme_id,version_number,passing_grade) VALUES ($1,$2,1,60)",[v,s]);
  await db.query("INSERT INTO assessment_components(version_id,component_type,position,weight_percent) VALUES ($1,'COMMITTEE',1,40),($1,'FINAL',1,60)",[v]);
},30000);
afterAll(async () => {await db.close();});
describe("academic migration", () => {
  it("creates the eight academic tables", async () => {
    const result = await db.query<{count:string}>("SELECT count(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    expect(result.rows[0].count).toBe("8");
  });
  it("rejects duplicate committee scope and cross-program courses", async () => {
    await expect(db.query("INSERT INTO grading_schemes(program_id,academic_year_start,class_year,period,system_type) VALUES ($1,2026,2,'ANNUAL','COMMITTEE')",[p])).rejects.toThrow();
    await expect(db.query("INSERT INTO grading_schemes(program_id,course_id,academic_year_start,class_year,period,system_type) VALUES ($1,$2,2026,2,'FALL','MIDTERM')",[p,c])).rejects.toThrow();
  });
  it("rejects an invalid course/system combination", async () => {
    await expect(db.query("INSERT INTO grading_schemes(program_id,course_id,academic_year_start,class_year,period,system_type) VALUES ($1,$2,2026,2,'FALL','COMMITTEE')",[p2,c])).rejects.toThrow();
  });
  it("keeps drafts out of the read-only views", async () => {
    expect((await db.query("SELECT id FROM academic_read_grading_scheme_versions WHERE id=$1",[v])).rows).toHaveLength(0);
    expect((await db.query("SELECT id FROM academic_read_assessment_components WHERE version_id=$1",[v])).rows).toHaveLength(0);
  });
  it("read-view privileges exclude drafts and do not grant base table access",async()=>{
    await db.exec("CREATE ROLE academic_reader_test; GRANT USAGE ON SCHEMA public TO academic_reader_test; GRANT SELECT ON academic_read_grading_scheme_versions,academic_read_assessment_components TO academic_reader_test; SET ROLE academic_reader_test");
    try {
      expect((await db.query("SELECT id FROM academic_read_grading_scheme_versions WHERE id=$1",[v])).rows).toHaveLength(0);
      await expect(db.query("SELECT id FROM grading_scheme_versions")).rejects.toThrow();
    } finally {await db.exec("RESET ROLE");}
  });
  it("imports inactive catalog candidates idempotently",async()=>{
    const pool={connect:async()=>({query:db.query.bind(db),release:()=>{}})};
    const count=await seedCatalog(pool as never); await seedCatalog(pool as never);
    const result=await db.query<{n:string}>("SELECT count(*)::text n FROM universities WHERE NOT is_active");
    expect(Number(result.rows[0].n)).toBe(count);
  });
  it("imports fictional academic entities without activating them",async()=>{
    const pool={connect:async()=>({query:async(sql:string,args?:unknown[])=>{const r=await db.query(sql,args);return {...r,rowCount:r.affectedRows??0};},release:()=>{}})};
    const fixture=JSON.parse(await readFile("tests/fixtures/academic/fictional-entities.json","utf8"));
    await seedEntities(pool as never,fixture);await seedEntities(pool as never,fixture);
    expect((await db.query("SELECT id FROM academic_read_faculties WHERE id=$1",[fixture.faculties[0].id])).rows).toHaveLength(0);
    expect((await db.query("SELECT id FROM grading_schemes WHERE id=$1",[fixture.schemes[0].id])).rows).toHaveLength(1);
  });
  it("protects published components and versions", async () => {
    await db.query("UPDATE grading_scheme_versions SET status='PUBLISHED',published_at=now() WHERE id=$1",[v]);
    await expect(db.query("UPDATE assessment_components SET weight_percent=50 WHERE version_id=$1",[v])).rejects.toThrow();
    await expect(db.query("UPDATE grading_scheme_versions SET passing_grade=70 WHERE id=$1",[v])).rejects.toThrow();
    await db.query("UPDATE grading_scheme_versions SET status='SUPERSEDED',superseded_at=now() WHERE id=$1",[v]);
    await expect(db.query("DELETE FROM grading_scheme_versions WHERE id=$1",[v])).rejects.toThrow();
  });
});
