# Academic DB implementation status

The implementation is in a draft PR. Do not merge or deploy until the remaining
local Docker and production-readiness checks are reviewed.

Implemented: eight-table academic schema and migration, read views that hide
unpublished versions, atomic publication and validators, inactive catalog and
entity seed commands and draft-only rule import, a shared calculation engine,
editable final weight, context/version-scoped browser storage with explicit
recovery, API, localized academic routes and sitemap, OpenAPI and operations
guides. Candidate universities, faculties, programs and courses start inactive.
A first real committee dataset (`data/academic/committee-2026-27.json`, 32 DRAFT
versions for 11 Tıp programs at 8 universities, each checked against its
official 2026-27 documents, inactive catalog of all 152 Tıp programs at 114 universities) is prepared
and covered by the isolated PostgreSQL test; it has not been imported into or
published on production, and its sources still need human review.

The isolated CI workflow now verifies the following on disposable PostgreSQL
16 and 18 services and fictional fixture data: clean and repeat migration, idempotent
catalog/entity/rule seeds, constraints, concurrent publishing, publication
immutability, verified TLS and a view-only runtime role. It also built the site
with a separate temporary Payload database, tested SEO for generic and eligible
academic pages, and exercised manual, official, storage-disabled, override,
reset, reload, course selection and locale fallback flows in a real browser.
PostgreSQL 18 CI additionally verified a custom-format dump and restore into
another disposable database, including the eight academic base tables and
published/superseded versions. The PGlite wire test remains an additional fast
check; it does not replace real PostgreSQL or concurrency tests.

Still required: run the supplied Docker PostgreSQL setup on the operator's local
machine if a separate local sign-off is required; perform real VPS/Dokploy
Traefik, backups, restore, and role-grant review;
obtain and manually verify real institutional sources/data before publishing;
review sitemap sharding before approaching the 50,000 URL limit. The sitemap
currently fails safely at that limit rather than silently exceeding it. The
API rate limit is process-local, not a distributed guarantee.

This conversation environment cannot reach the Oracle VPS or Dokploy control
plane. No production migration, seed, publish, merge, or deploy was performed.
See `academic-db-operations.md` for the isolated test setup and
`academic-production-readiness.md` for the production release gates.
