# SEO, international search, and AI retrieval

This project has a small but standards-oriented SEO foundation for the current
public surface: localized homepages, tools, and a Payload CMS-backed news
section at `/tr/haberler` and `/en/news`. Published localized news detail pages
are represented in the sitemap and structured data.

## Architecture

- `config/site.ts` is the central site, locale, deployment, verification, and
  crawler-policy configuration.
- `lib/seo/urls.ts` normalizes the configured origin and creates absolute URLs.
- `lib/seo/metadata.ts` creates localized canonical, hreflang, robots, Open
  Graph, and Twitter metadata.
- `lib/seo/structured-data.ts` creates the connected Organization, WebSite,
  WebPage, CollectionPage/ItemList, NewsArticle, and BreadcrumbList entity
  graphs.
- `components/json-ld.tsx` safely serializes JSON-LD for server-rendered HTML.
- `app/robots.ts` and `app/sitemap.ts` implement the Next.js metadata file
  conventions.
- `app/[locale]/opengraph-image.tsx` and `twitter-image.tsx` generate cached
  1200×630 social images per locale.
- `scripts/seo-audit.mjs` checks representative routes against the generated
  HTML and XML, rather than only inspecting source files.

The project uses Next.js 16 App Router with `next-intl`. The locale segment is
the root layout, so all localized pages receive the correct `lang` and `dir`
attributes. `proxy.ts` keeps explicit locale URLs crawlable and excludes
metadata resources from locale negotiation.

## Production origin and environments

Set `NEXT_PUBLIC_SITE_URL` to the one canonical production origin, without a
path or trailing slash policy ambiguity. The value is normalized to `http` or
`https` and is used by metadata, JSON-LD, sitemap, robots, and IndexNow.

Production builds with a configured site URL are indexable. Development,
staging, and Vercel preview deployments are `noindex` and return
`Disallow: /` from `robots.txt`. Set `DEPLOYMENT_ENV=preview` or
`DEPLOYMENT_ENV=staging` for non-Vercel environments; Vercel's `VERCEL_ENV`
is respected automatically.

The local fallback origin is `http://localhost:3000`. It is useful for local
rendering only and must not be used as a production deployment value.

## Locale URLs, canonical URLs, and hreflang

The routing policy is `localePrefix: "always"`:

- Turkish homepage: `/tr`
- English homepage: `/en`
- `/` redirects to the default locale `/tr`
- News lists: `/tr/haberler`, `/en/news`
- News details use locale-specific CMS slugs and emit alternates only for
  translations with the localized fields required by the public detail page.

Each localized page canonicalizes to itself. Each page emits reciprocal
`hreflang` links for the actual translated equivalents and an `x-default` link
to the default locale page when that translation is available. Query strings
are not part of canonical or sitemap URLs. Future translated routes must pass
the list of locales that actually have content to `getLocalizedMetadata()`; do
not create alternate links for a missing or incomplete translation.

The sitemap uses the same URL helpers as metadata, so canonical and sitemap
URLs cannot drift through independent string concatenation. Only public,
indexable routes belong in `app/sitemap.ts`.

## Metadata and social sharing

Every indexable localized page should provide:

- localized title and description
- self-referencing canonical
- reciprocal language alternates
- environment-aware robots metadata
- localized Open Graph title, description, URL, and locale
- a `summary_large_image` Twitter card
- a localized social-image alt string where the page has a social image

The root locale layout owns `metadataBase` and the title template. Page-level
metadata uses an absolute homepage title so the homepage does not become
`Komitehane | Komitehane`.

## Structured data

The site emits a connected graph containing:

- `Organization` with only the truthful name and URL known to the repository
- `WebSite` linked to that organization by stable `@id`
- `WebPage` linked to the website and organization, with localized URL, name,
  description, and `inLanguage`

News lists add `CollectionPage` and `ItemList`; published details add
`WebPage`, `NewsArticle`, and `BreadcrumbList` nodes. The page node points to
the article as its `mainEntity`, while the article points back through
`mainEntityOfPage`; breadcrumb items mirror the visible localized breadcrumb.
`NewsArticle` includes the visible author, dates, and hero image. No
credentials, reviews, ratings, or business-location data are fabricated.
JSON-LD is escaped for `<` before insertion to avoid closing-script injection.

## Robots and AI retrieval policy

In an indexable production environment the default policy is:

| Agent | Policy | Purpose |
| --- | --- | --- |
| Googlebot | Allow public content | Google Search, including Google's AI Search features |
| bingbot | Allow public content | Bing search |
| OAI-SearchBot | Allow public content | ChatGPT Search discovery |
| ChatGPT-User | Allow public content | User-directed OpenAI retrieval; OpenAI notes robots rules may not apply to this user-triggered agent |
| PerplexityBot | Allow public content | Perplexity search indexing |
| Perplexity-User | Allow public content | User-directed Perplexity retrieval; Perplexity says this fetcher generally ignores robots rules |
| Claude-SearchBot | Allow public content | Claude search indexing |
| Claude-User | Allow public content | User-directed Claude retrieval |
| GPTBot | Disallow by default | OpenAI model-training crawler |
| ClaudeBot | Disallow by default | Anthropic model-development/training crawler |
| Google-Extended | Disallow by default | Google Gemini training/grounding control token; it does not affect Google Search |

Set `ALLOW_MODEL_TRAINING_CRAWLERS=true` only when the site owner wants to
allow the explicitly listed training crawlers. Search/retrieval agents remain
controlled separately. Public content is not blocked by default, while
reserved private prefixes and their locale-prefixed equivalents are excluded.

Robots rules are cooperative controls. Use WAF/IP verification separately if
the deployment needs stronger traffic controls. Review provider documentation
when policies change:

- [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots)
- [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [Anthropic crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Google common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)

## Sitemap and `llms.txt`

`/sitemap.xml` is generated by Next.js and contains the localized homepage
URLs, news lists, and every published localized news URL in an indexable
production environment. News details use CMS `updatedAt` for `lastModified`
and include reciprocal alternates only where the translation exists. Search,
category, and pagination query URLs are never added.

`/llms.txt` is a deliberately small, experimental resource listing the public
localized homepages, tools, and news lists. It is not an official search-ranking standard or a ranking
factor. `robots.txt`, canonical tags, and the sitemap remain authoritative.
`llms-full.txt` is not added because the current site has no documentation or
content corpus that would justify one.

## IndexNow

`lib/seo/indexnow.ts` exports `submitIndexNow(urls)`. Payload article hooks call
it on real publish/update/unpublish/delete transitions and skip draft saves. It:

- does nothing when `INDEXNOW_KEY` is absent or invalid
- accepts only URLs on the configured site origin
- removes fragments and deduplicates URLs
- batches up to 10,000 URLs per request
- submits only when the caller has a real create/update/delete event
- never runs during page requests or every deployment
- logs only response status, never the key

The verification key is served at
`/<INDEXNOW_KEY>.txt` at the root of the host. The utility includes that URL as
`keyLocation`.
The hook submits affected localized detail URLs together with both news list
URLs. Future-dated and draft-only changes are not submitted.

## News publishing checklist

- [ ] Complete the localized title, slug, excerpt, body, category, author, and image alt text.
- [ ] Confirm the publication date is not in the future unless scheduling is intended.
- [ ] Preview keyboard focus, hero image crop, and the rendered Lexical body.
- [ ] Publish only completed locales; missing translations must not receive hreflang URLs.
- [ ] Confirm canonical, NewsArticle JSON-LD, Open Graph image, sitemap entry, and IndexNow status.
- [ ] On unpublish/delete, confirm the list and removed detail URLs are submitted to IndexNow.

See the [IndexNow protocol documentation](https://www.indexnow.org/documentation)
for key ownership and endpoint requirements.

## Search Console and Bing Webmaster

Supply real values only when the properties are verified:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_BING_SITE_VERIFICATION=
```

The values are emitted through Next.js Metadata API verification fields. No
placeholder verification token is committed.

## Validation

Build and start the app, then run the audit:

```bash
pnpm lint
pnpm build
pnpm start
SEO_AUDIT_BASE_URL=http://localhost:3000 \
SEO_AUDIT_EXPECT_INDEXABLE=false \
pnpm seo:audit
```

For an indexable-mode audit, start with a production origin configured and run
the same command with `SEO_AUDIT_EXPECT_INDEXABLE=true`. The audit verifies
redirects, 200/404 status codes, title, description, canonical, `lang`, one
H1, reciprocal hreflang, JSON-LD parsing/entity types, robots, sitemap, and
`llms.txt`. To validate a published localized article in addition to the
representative routes, provide its path:

```bash
SEO_AUDIT_BASE_URL=http://localhost:3000 \
SEO_AUDIT_EXPECT_INDEXABLE=true \
SEO_AUDIT_ARTICLE_PATH=/tr/haberler/yayinlanmis-slug \
pnpm seo:audit
```

The article audit checks the `WebPage` → `NewsArticle` → `BreadcrumbList`
links, canonical URL, localized alternates, reciprocal alternate pages, and
the article entry in the sitemap. If no article path is supplied, detail checks
are skipped explicitly; this keeps local databases without published content
auditable.

## New page checklist

- [ ] Add a stable localized route.
- [ ] Add localized title and description messages.
- [ ] Add a self canonical and reciprocal hreflang via `getLocalizedMetadata`.
- [ ] Confirm the correct `html lang` and `dir` values.
- [ ] Use one meaningful H1 and semantic HTML.
- [ ] Keep important text in the server-rendered page.
- [ ] Add same-locale contextual internal links where relevant.
- [ ] Add structured data only for visible, truthful content.
- [ ] Provide an appropriate image and localized alt text when sharing benefits.
- [ ] Decide index/noindex before adding the route to the sitemap.
- [ ] Add the route to `indexableRoutes` only if it is public and returns 200.
- [ ] Confirm detail JSON-LD contains linked WebPage, NewsArticle, and visible BreadcrumbList nodes.
- [ ] Run the SEO audit and inspect generated HTML.

## New locale checklist

1. Add the locale to `i18n/routing.ts` first.
2. Add its message resource and update the typed locale maps in
   `config/site.ts`.
3. Add localized metadata and social-image copy.
4. Verify direct routing, `html lang`, and `dir`.
5. Verify reciprocal hreflang and `x-default`.
6. Verify localized sitemap alternates and Open Graph locale.
7. Verify `inLanguage` in JSON-LD.
8. Run `pnpm build` and `pnpm seo:audit`.

## Content quality notes

The homepage still contains the original create-next-app demo copy and
Next/Vercel links. They were not silently replaced because the repository does
not reveal Komitehane's actual product or editorial purpose. Replace those
strings with truthful, localized product content before treating the homepage
as a finished search landing page. Do not add author, FAQ, review, statistics,
or topical-hub markup until the underlying visible content exists.
