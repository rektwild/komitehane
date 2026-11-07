# Academic DB implementation status

The implementation is in a draft PR. Do not merge or deploy until the remaining
local Docker and production-readiness checks are reviewed.

Implemented: eight-table academic schema and migration, read views that hide
unpublished versions, atomic publication and validators, inactive catalog and
entity seed commands and draft-only rule import, a shared calculation engine,
editable final weight, context/version-scoped browser storage with explicit
recovery, API, localized academic routes and sitemap, OpenAPI and operations
guides. Candidate universities, faculties, programs and courses start inactive.
No real university grading rules or production data have been seeded.

The isolated CI workflow has verified the following on a disposable PostgreSQL
16 service and fictional fixture data: clean and repeat migration, idempotent
catalog/entity/rule seeds, constraints, concurrent publishing, publication
immutability, verified TLS and a view-only runtime role. It also built the site
with a separate temporary Payload database, tested SEO for generic and eligible
academic pages, and exercised manual, official, storage-disabled, override,
reset, reload, course selection and locale fallback flows in a real browser.
The PGlite wire test provides an additional fast check; it does not replace
real PostgreSQL or concurrency tests.

Still required: run the supplied Docker PostgreSQL setup on the operator's local
machine; perform environment-specific deployment and backup/restore review;
obtain and manually verify real institutional sources/data before publishing;
review sitemap sharding before approaching the 50,000 URL limit. The sitemap
currently fails safely at that limit rather than silently exceeding it. The
API rate limit is process-local, not a distributed guarantee.

The execution environment had neither Docker nor a PostgreSQL service. No
production migration, seed, publish or deploy was performed. See
`academic-db-operations.md` for the isolated test setup and production steps.
