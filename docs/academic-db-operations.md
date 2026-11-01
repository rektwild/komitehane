# Academic DB operations

Status: the feature is under development. Review the migration, validate the
full PRD and test against an isolated real PostgreSQL before any rollout. The
blog database, blog schema and Payload migrations must never be targeted.

## Isolated local PostgreSQL

From the repository root, on a machine with Docker and Compose:

```sh
docker compose -p komitehane-academic-test -f docker-compose.academic-test.yml up -d --wait
ACADEMIC_TEST_DATABASE_URL=postgresql://academic_test:academic_local_test_only@127.0.0.1:55432/komitehane_academic_test pnpm academic:test:postgres
docker compose -p komitehane-academic-test -f docker-compose.academic-test.yml down
```

The Compose instance is loopback-only and uses tmpfs. The test refuses non-local
hosts, requires the exact test DB name, checks the public schema is empty, runs
migrations twice, seeds the candidate catalog twice, and exercises constraints
and simultaneous publication. It intentionally does not drop tables. Start a
fresh Compose instance for another run. This is not a production URL.

## Production provisioning (operator action; not yet performed)

1. Verify PostgreSQL version, disk space, backup and restore procedures. Create a
   backup of the relevant instance and test restore into a separate environment.
   Obtain authorization before proceeding.
2. On the existing PostgreSQL **instance**, from a privileged session connected
   to its maintenance database, provision dedicated roles and database. The
   following are examples; use your organization’s credential policy and psql's
   interactive `\password` rather than putting passwords in shell history:

```sql
CREATE ROLE academic_migrator LOGIN;
CREATE ROLE academic_writer LOGIN;
CREATE ROLE academic_app LOGIN;
CREATE DATABASE komitehane_academic OWNER academic_migrator;
REVOKE ALL ON DATABASE komitehane_academic FROM PUBLIC;
GRANT CONNECT ON DATABASE komitehane_academic TO academic_writer, academic_app;
```

3. Connect specifically to `komitehane_academic` and verify `SELECT current_database();`.
   Confirm the server certificate and hostname, provision a CA certificate, and
   configure only `ACADEMIC_MIGRATION_DATABASE_URL` and
   `ACADEMIC_POSTGRES_CA_CERT_BASE64` in a restricted operator environment.
   The academic connection functions reject the wrong database name and SSL
   query parameters that could override certificate validation.
4. Review `drizzle/academic/0000_red_iron_lad.sql` and run
   `pnpm academic:migrate` once from an authorized operator session. The
   migration is separate from Payload and never runs during build. Do not use
   `drizzle-kit push` on production.
5. As the academic database owner, still connected to **only**
   `komitehane_academic`, configure access after migration:

```sql
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO academic_app, academic_writer;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, academic_app;
GRANT SELECT ON academic_read_universities, academic_read_faculties,
  academic_read_programs, academic_read_courses, academic_read_grading_schemes,
  academic_read_grading_scheme_versions, academic_read_assessment_components,
  academic_read_grading_rule_sources, academic_read_version_scopes TO academic_app;
GRANT SELECT, INSERT, UPDATE ON universities, faculties, programs, courses,
  grading_schemes, grading_scheme_versions, assessment_components,
  grading_rule_sources TO academic_writer;
```

The application role reads views, not base tables. The views hide drafts;
application services further enforce active hierarchy, current year and source
validation. Historical published/superseded versions remain available only via
explicit historical API selection. The writer is trusted and must use the
validation and publisher scripts; never publish through direct SQL. Test the
actual grants and view ownership using the two roles before rollout. The
migrator owns the views and base tables; check ownership if migrations are run
by a different role. Never grant the app role writer or migrator privileges.

6. Configure `ACADEMIC_WRITER_DATABASE_URL` in the operator environment only.
   `pnpm academic:seed:catalog` adds inactive candidate universities; review
   names, duplicates and current institutional data before activating any.
   Import reviewed faculties, programs, courses and schemes using
   `pnpm academic:seed:entities <file>`; catalog entities start inactive. `pnpm academic:seed:rules <file>` inserts draft versions only;
   `pnpm academic:validate <version-id>` checks structure but does not verify a
   source's truth. After human review of the exact source and scope, use
   `ACADEMIC_SOURCE_MANUALLY_REVIEWED=yes pnpm academic:publish <version-id>`.
   Do not publish invented rules or test fixtures.
7. In the app runtime configure only `ACADEMIC_DATABASE_URL` for academic_app,
   `ACADEMIC_POSTGRES_CA_CERT_BASE64`, `ACADEMIC_CURRENT_YEAR_START` and
   `ACADEMIC_FEATURE_ENABLED=true`. Confirm the DB name, hostname, CA and
   least-privilege grants. Do not put migrator/writer credentials in the app.
   Verify manual fallback, API, current-year rules, localized pages and sitemap
   before wider rollout. Year must be explicitly changed after annual review;
   earlier years are never substituted automatically.
8. For rollback disable `ACADEMIC_FEATURE_ENABLED` and revert application
   code if necessary. Do not automatically delete academic history or apply a
   destructive down migration. Forward-fix the schema, or restore a tested
   academic-only backup into a separate database after assessing data loss.
   Do not restore over the blog database.

The SQL, TLS, grants, actual backup/restore, seed and rollout steps require
verification in an isolated real PostgreSQL environment and subsequent explicit
production authorization. None were executed on production by this task.

## API smoke examples

With a running isolated development server, a manual calculation does not need
academic DB credentials and stores no grades on the server:

```sh
curl -sS http://localhost:3000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"source":"CUSTOM","mode":"MINIMUM_FINAL","components":[{"grade":70,"weight":40}],"finalWeight":60,"passingGrade":60}'
```

The expected `displayValue` is 53.34, rounded upwards to two decimal places.
A configured server can list its active catalog with
`curl -sS 'http://localhost:3000/api/v1/universities?limit=25&offset=0'`.
Refer to `academic-api.openapi.yaml` for all inputs and response shapes. The
built-in rate limiter is process-local and best effort, not a distributed or
identity-secure limit; an external production edge policy may still be needed.

For an additional real PostgreSQL check, `.github/workflows/academic-test.yml`
runs the same guarded test against a disposable PostgreSQL 16 service in a
pull-request CI job. It uses only fixture credentials and has no production
secrets, migration targets or deploy step. CI does not replace the requested
local Docker run or an operator's production-environment checks.
