# Academic DB implementation status

This is a draft and must not be merged, deployed or migrated to production
until the PRD Definition of Done and real PostgreSQL checks are complete.

Implemented: eight-table academic schema and migration, read views that hide
unpublished versions, a publication transaction and validators, inactive
catalog/entity seed commands and draft-only rule import, a shared calculation
engine, editable final weight, context/version-scoped browser storage and
explicit previous-version recovery, catalog/rule/calculate API, localized
academic routes and sitemap entries, OpenAPI and operating guide. No real
academic rules or production data have been seeded. Candidate universities
and imported faculty/program/course entities start inactive.

Tested in-process: component arithmetic, API adapters, input guards, translated
middleware rewrites, sitemap selection, migration and data constraints, read
view permissions, and idempotent candidate/entity seeds using PGlite. A local
HTTP smoke test returned 200 for all four Turkish generic tools, 404 for an
unavailable academic page, 503 for the unavailable catalog and 200 for a
manual calculation. PGlite is not a substitute for testing a real PostgreSQL instance, concurrent
transactions or networking. Refer to CI/local test results for exact counts.

Still required before completion: run the Docker PostgreSQL integration test
and verify migration, seeds, concurrent publication, read-only grants and TLS on
a real server; run browser end-to-end and SEO smoke tests for all four tools,
locale switching, storage recovery and DB failure; complete a successful build
with an isolated Payload test configuration; verify performance and sitemap
sharding before approaching 50,000 URLs; complete operator review and official
sources/data. The 50,000 entry guard currently fails rather than shard a larger
sitemap. This draft has not met the PRD Definition of Done.

The supplied execution environment had neither Docker nor a PostgreSQL server.
No production migration, seed, publish or deploy was performed. See
`academic-db-operations.md` for the isolated test setup and production steps.
