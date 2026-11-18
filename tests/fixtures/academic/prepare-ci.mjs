// Disposable CI service only. Never accepts a supplied URL or production host.
import pg from "pg";
if (process.env.GITHUB_ACTIONS !== "true") throw new Error("CI_FIXTURE_ONLY");
const base="postgresql://academic_test:academic_local_test_only@127.0.0.1:5432";
const admin=new pg.Client({connectionString:`${base}/postgres`});
await admin.connect();
try {
  await admin.query("CREATE DATABASE komitehane_academic TEMPLATE komitehane_academic_test");
  await admin.query("CREATE ROLE academic_app_fixture LOGIN PASSWORD 'academic_fixture_only'");
  await admin.query("REVOKE ALL ON DATABASE komitehane_academic FROM PUBLIC");
  await admin.query("GRANT CONNECT ON DATABASE komitehane_academic TO academic_app_fixture");
} finally {await admin.end();}
const db=new pg.Client({connectionString:`${base}/komitehane_academic`});
await db.connect();
try {
  await db.query("UPDATE faculties SET is_active=true WHERE id='00000000-0000-4000-8000-000000000102'");
  await db.query("UPDATE programs SET is_active=true WHERE id='00000000-0000-4000-8000-000000000103'");
  await db.query("UPDATE courses SET is_active=true WHERE id='00000000-0000-4000-8000-000000000104'");
  const version='00000000-0000-4000-8000-000000000106';
  await db.query("INSERT INTO grading_scheme_versions(id,scheme_id,version_number,passing_grade) VALUES($1,'00000000-0000-4000-8000-000000000105',1,60)",[version]);
  await db.query("INSERT INTO assessment_components(version_id,component_type,position,weight_percent) VALUES($1,'MIDTERM',1,35),($1,'FINAL',1,65)",[version]);
  await db.query("INSERT INTO grading_rule_sources(version_id,source_url,source_type,verified_at) VALUES($1,'https://fictional.test/rule','TEST',now())",[version]);
  await db.query("UPDATE grading_scheme_versions SET status='PUBLISHED',published_at=now() WHERE id=$1",[version]);
  await db.query("REVOKE ALL ON SCHEMA public FROM PUBLIC");
  await db.query("GRANT USAGE ON SCHEMA public TO academic_app_fixture");
  await db.query("GRANT SELECT ON academic_read_universities,academic_read_faculties,academic_read_programs,academic_read_courses,academic_read_grading_schemes,academic_read_grading_scheme_versions,academic_read_assessment_components,academic_read_grading_rule_sources,academic_read_version_scopes TO academic_app_fixture");
} finally {await db.end();}
console.log("Prepared isolated fictional academic fixture and read-only role.");
