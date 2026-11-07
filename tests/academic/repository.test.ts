import {afterAll,beforeAll,describe,expect,it,vi} from "vitest";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
const shared=vi.hoisted(()=>({pool:null as unknown}));
vi.mock("@/lib/academic/db/client",()=>({academicPool:()=>shared.pool,academicYear:()=>2026}));
import {landing,landingCandidates,lookupRule,rule,versionById} from "../../lib/academic/repositories/catalog";
const db=new PGlite();
const id=(n:number)=>`00000000-0000-4000-8000-${n.toString().padStart(12,"0")}`;
beforeAll(async()=>{
  const sql=await readFile("drizzle/academic/0000_red_iron_lad.sql","utf8");
  for(const part of sql.split("--> statement-breakpoint"))if(part.trim())await db.exec(part);
  shared.pool={query:db.query.bind(db)};
  await db.query("INSERT INTO universities(id,name,slug) VALUES($1,'Fictional','fictional')",[id(1)]);
  await db.query("INSERT INTO faculties(id,university_id,name,slug) VALUES($1,$2,'Faculty','faculty')",[id(2),id(1)]);
  await db.query("INSERT INTO programs(id,faculty_id,name,slug,duration_years) VALUES($1,$2,'Program','program',6)",[id(3),id(2)]);
  await db.query("INSERT INTO grading_schemes(id,program_id,academic_year_start,class_year,period,system_type) VALUES($1,$3,2026,2,'ANNUAL','COMMITTEE'),($2,$3,2026,3,'ANNUAL','COMMITTEE')",[id(4),id(5),id(3)]);
  for(const n of [6,7,8]) {
    await db.query("INSERT INTO grading_scheme_versions(id,scheme_id,version_number,passing_grade) VALUES($1,$2,$3,60)",[id(n),n===8?id(5):id(4),n===7?2:1]);
    await db.query("INSERT INTO assessment_components(version_id,component_type,position,weight_percent) VALUES($1,'COMMITTEE',1,$2),($1,'FINAL',1,60)",[id(n),n===8?39:40]);
    await db.query("INSERT INTO grading_rule_sources(version_id,source_url,source_type,verified_at) VALUES($1,'https://fictional.test/rule','TEST',now())",[id(n)]);
  }
  await db.query("UPDATE grading_scheme_versions SET status='PUBLISHED',published_at=now() WHERE id=$1",[id(6)]);
  await db.query("UPDATE grading_scheme_versions SET status='SUPERSEDED',superseded_at=now() WHERE id=$1",[id(6)]);
  await db.query("UPDATE grading_scheme_versions SET status='PUBLISHED',published_at=now() WHERE id IN ($1,$2)",[id(7),id(8)]);
  await db.query("INSERT INTO grading_schemes(id,program_id,academic_year_start,class_year,period,system_type) VALUES($1,$2,2026,4,'ANNUAL','COMMITTEE')",[id(9),id(3)]);
  await db.query("INSERT INTO grading_scheme_versions(id,scheme_id,version_number,passing_grade) VALUES($1,$2,1,60)",[id(10),id(9)]);
  await db.query("INSERT INTO assessment_components(version_id,component_type,position,weight_percent) VALUES($1,'COMMITTEE',1,40),($1,'FINAL',1,60)",[id(10)]);
  await db.query("UPDATE grading_scheme_versions SET status='PUBLISHED',published_at=now() WHERE id=$1",[id(10)]);
},30000);
afterAll(async()=>{await db.close()});
describe("academic repository against PostgreSQL-compatible SQL",()=>{
  it("returns a valid current rule and refuses an invalid published rule",async()=>{
    expect(await rule(id(3),2,"ANNUAL","COMMITTEE",null)).toMatchObject({versionId:id(7),passingGrade:"60.00"});
    expect(await rule(id(3),3,"ANNUAL","COMMITTEE",null)).toBeNull();
    expect(await lookupRule(id(3),3,"ANNUAL","COMMITTEE",null)).toMatchObject({status:"UNSUPPORTED_RULE"});
    expect(await lookupRule(id(3),4,"ANNUAL","COMMITTEE",null)).toMatchObject({status:"UNVERIFIED_RULE"});
    expect(await rule(id(3),2,"FALL","COMMITTEE",null)).toBeNull();
  });
  it("preserves explicit historical lookup",async()=>{
    expect(await versionById(id(6),false)).toBeNull();
    expect(await versionById(id(6),true)).toMatchObject({versionId:id(6),status:"SUPERSEDED"});
  });
  it("allows an explicit historical lookup even after a program is deactivated",async()=>{
    await db.query("UPDATE programs SET is_active=false WHERE id=$1",[id(3)]);
    try {
      expect(await versionById(id(6),true)).toMatchObject({status:"SUPERSEDED"});
      expect(await versionById(id(7),false)).toBeNull();
    } finally {await db.query("UPDATE programs SET is_active=true WHERE id=$1",[id(3)]);}
  });
  it("includes only valid current landings and validates the slug hierarchy",async()=>{
    expect(await landing("fictional","faculty","program",2,"COMMITTEE")).toMatchObject({programId:id(3),classYear:2});
    expect(await landing("fictional","wrong","program",2,"COMMITTEE")).toBeNull();
    expect(await landing("fictional","faculty","program",3,"COMMITTEE")).toBeNull();
    expect(await landingCandidates()).toHaveLength(1);
  });
});
