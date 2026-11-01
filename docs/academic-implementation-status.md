# Academic DB: incomplete implementation checkpoint

This branch is a work in progress and must not be merged, deployed, migrated,
seeded, or published yet. The runtime feature remains disabled. It is not a
complete implementation of the Academic DB PRD.

Implemented in isolation: Drizzle schema and initial migration for eight
tables, a calculation function, publication validation and a transactional
publication service, and unit plus PGlite schema tests. The migration has not
been applied to a real PostgreSQL server. PGlite is not a replacement for
PostgreSQL concurrency, network/TLS, grants, or deployment tests.

Remaining work includes: repository/service completeness; reviewed catalog and
rules seed/validate/publish CLIs; role grants, full operational and restore
runbook; version-history API and all public endpoints with validation and abuse
protection; integration of the shared engine into all four existing tools;
editable final weights, university/faculty/program/course selection and safe
versioned local storage; four localized SEO routes, SSR content, sitemap,
canonical and locale switch; API specification; and real PostgreSQL,
concurrency, UI, end-to-end and SEO tests. PRD Definition of Done is not met.

No production database was accessed. Do not run generated SQL against the blog
database. Before any production action, complete implementation, verify it in
an isolated real PostgreSQL database, review TLS/role privileges and migration,
take a backup, and obtain the separately required authorization.
