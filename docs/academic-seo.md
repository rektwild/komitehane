# Academic SEO

The existing four generic tools remain the only catalog cards. Eligible academic
pages live below the localized tool path and include institution, faculty,
program and class; year and course are not URL path segments. Only active
relationships and current-year published, structurally validated and sourced
rules can produce an academic page. Midterm pages enumerate verified courses
rather than implying that all courses have identical weights. Invalid paths or
missing eligible rules return 404; an unavailable academic DB leaves the
manual generic calculators available.

The page has a localized title, a description naming the university, faculty
and program, canonical, alternates, one H1, a visible breadcrumb (Tools > Tool >
Page), visible source and academic year, a WebPage linked to a BreadcrumbList
that mirrors the visible breadcrumb, the calculator, and the calculator's
social image. General tools link every eligible academic page, grouped by
university, so none depends on the sitemap alone; the sitemap adds eligible pages
and preserves news entries. Preview environments remain noindex. Academic
pages, generic tool links and sitemap use a 300-second revalidation period.
The sitemap currently rejects more than 50,000 entries; implement and verify
sharding before reaching that scale. No indexing or ranking is guaranteed.

`pnpm seo:audit` checks the generic tools; set `SEO_AUDIT_ACADEMIC_PATH` to an
eligible fixture URL and `SEO_AUDIT_ACADEMIC_MISSING_PATH` to a nonexistent
fixture URL to exercise those paths. Tests require an isolated configured
application and a separate test Payload database.
