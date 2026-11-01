# Academic database schema

The academic database is separate from Payload. The initial Drizzle migration
creates exactly eight base tables: `universities` → `faculties` → `programs` →
`courses`, plus `grading_schemes` → `grading_scheme_versions` →
`assessment_components` and `grading_rule_sources`. There is no department or
committee-course table. A midterm scheme has a course; a committee scheme does
not. The composite course/program foreign key rejects cross-program courses.

The scheme scope is program, explicit academic year, class and period; midterm
schemes additionally include the course. Partial unique indexes enforce scope
uniqueness and a single published version per scheme. Version numbers and
component positions are unique within their respective parents. Published and
superseded content and its children are protected by migration triggers;
publication takes a scheme lock and validates the rows inside one transaction.
Review the migration and run the isolated PostgreSQL test before deployment.

The runtime reader uses security-barrier views. Active catalog views omit
inactive entries; published/superseded version views hide drafts. The separate
version-scope view permits explicit historical lookup even if an institution
becomes inactive. The writer and migrator are separate roles. See
`academic-db-operations.md` for provisioning and verification. The source URL,
verification time and formal reviewer process are required to publish; a valid
URL alone does not prove that a rule is correct.
