<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Komitehane

Next.js 16.3.0 (App Router, Turbopack) + React 19 + Tailwind CSS v4 + shadcn/ui + next-intl + Payload CMS 3.88.0. Public surface includes localized homepages, tools, and the Payload-backed news list/detail routes (`/tr/haberler`, `/en/news`). Payload admin is `/admin`; REST is `/api`; GraphQL is not exposed. Audience is Turkish med students (TUS exam).

## Commands

- `pnpm dev` — dev server. pnpm is the only package manager (`packageManager: pnpm@11.20.0`); don't run npm/yarn.
- `pnpm lint` — eslint (script is plain `eslint`; use `pnpm exec eslint . --fix` to autofix)
- `pnpm build` — runs `tsc` as part of the build; there is NO standalone typecheck script. `pnpm exec next typegen` regenerates the messages declaration (run after editing `messages/*.json`).
- `pnpm build:vercel` — runs `payload migrate` before `next build`; migration failure must fail deployment.
- `pnpm payload:types`, `pnpm payload:importmap`, `pnpm payload:migrate:create <name>`, `pnpm payload:migrate` — CMS code generation and migrations. Commit generated `payload-types.ts`, admin import map, and migrations.
- `pnpm seo:audit` — `node scripts/seo-audit.mjs`; verifies redirects, 200/404s, lang/canonical/hreflang/JSON-LD, robots, sitemap, `llms.txt` against a RUNNING server. Env: `SEO_AUDIT_BASE_URL` (default `http://localhost:3000`), `SEO_AUDIT_EXPECT_INDEXABLE` (default true; set `false` for dev/preview mode, where noindex + empty sitemap are expected)
- `pnpm exec shadcn add <component>` — install a shadcn/ui component (the `shadcn` CLI is already a dependency; `pnpm dlx shadcn@latest` also works). `-b`/`--base` selects the component library (`radix` | `base` | `aria`), NOT the base color; non-interactive init is `shadcn init -d` (base-nova preset).
- Production verification: `pnpm build` then `pnpm start`. Kill a stale server with `lsof -ti:3000 | xargs kill -9` first — killing the pnpm wrapper pid alone leaves the old build serving and produces misleading results.
- Don't touch `allowBuilds` in `pnpm-workspace.yaml` — removing entries makes `pnpm build` fail with `ERR_PNPM_IGNORED_BUILDS`.

## Structure & conventions

- Path alias `@/*` → repo root; app code is in `app/` (no `src/` dir). Use `@/` imports, never relative.
- `components/ui/` holds CLI-installed base-nova components (badge, breadcrumb, button, card, dropdown-menu, empty, field, input-group, input, label, navigation-menu, select, separator, sheet, textarea) + hand-written `components/ui/svgs/` brand icons (ClaudeAI, Gemini, Openai, Perplexity — used by the footer) + `lib/utils.ts` (`cn`); add more via the CLI, don't hand-write. One deliberate hand-edit exception: `button.tsx` has a custom `calculate` variant + `xl` size backed by the `--action` tokens in `globals.css` (used by `CommitteeMinimumFinalForm`) — preserve them if you re-add button via the CLI. Custom code: `components/` root (`json-ld.tsx`, `locale-switcher.tsx`), `components/layout/` (site-header, desktop/mobile-navigation, header-search, header-auth-actions, site-brand, site-container, page-breadcrumb, page-with-aside, site-aside, tus-countdown, theme-switcher, footer-2) and `components/tools/` (tools-catalog, tool-card, committee-minimum-final-form). Vendored, don't refactor as project code: `components/8starlabs-ui/` and `components/kibo-ui/` (theme-switcher UI, uses the extra `motion` dep). The theme system is custom (no next-themes): `layout/theme-switcher.tsx` stores the choice under localStorage key `komitehane-theme` and toggles `.dark` on `<html>`; `footer-2.tsx` is wired in `app/[locale]/layout.tsx` as `<Footer/>` (registry-style filename — keep it); `components/theme-switcher-composition-1.tsx` are orphaned registry examples nothing imports — don't wire them up. The header/footer logos are `<Image>`s of `public/logo_for_light_mode.png` / `logo_for_dark_mode.png` from `site-brand.tsx` (not `components/logo.tsx`).
- `lib/tus.ts` exports `TUS_TARGET_DATE` — the single countdown target used by `TusCountdown` (rendered in `SiteAside`, translations under the `Aside` namespace). Update the date there, not in components.
- `i18n/routing.ts` declares `/news` and `/news/[slug]` as `/tr/haberler[/slug]` and `/en/news[/slug]`. Legacy course URLs permanently redirect to the localized news list.
- Payload schema lives in `collections/` and `payload.config.ts`; server-only normalized frontend access lives in `lib/news/`. Never pass raw Payload documents into UI components. Anonymous reads must retain published/date access checks and `overrideAccess: false`.
- News uses PostgreSQL, Vercel Blob, TR/EN localized fields without fallback, immutable-after-publish localized slugs, drafts/versions, and generated migrations. Preview and production must use separate database/blob resources.
- Tools: `lib/tools.ts` is the single source of truth (key, href, slug, icon, thumbnail gradient). Adding a tool touches four places: `i18n/routing.ts` pathnames, `lib/tools.ts`, `generateStaticParams` in `app/[locale]/tools/[slug]/page.tsx` (which also sets `dynamicParams = false`), and `messages/*.json`. Detail pages force `robots: {index: false}` in `generateMetadata` and are intentionally NOT in the sitemap — only the `/tools` listing is added to `indexableRoutes` in `app/sitemap.ts`.
- Tailwind v4: no `tailwind.config.*` — theme tokens are CSS variables (oklch) in `app/globals.css`, with `.dark` class-based dark mode (`@custom-variant dark`). Keep `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"` above `@theme` and other rules. Hand-written additions in `globals.css` to preserve: `--site-max-width: 108rem` (used by `.site-container`), the `--action`/`--action-foreground` tokens (used by button's `calculate` variant), the `.news-ticker-*` marquee rules (used by the footer), and a deliberate `@media (prefers-color-scheme: dark)` override scoped as `:root:not(.dark) body` (light surface under a dark system scheme unless the app theme is dark).
- Fonts: Wix Madefor Text + JetBrains Mono via `next/font/google` in `app/[locale]/layout.tsx`, mapped in `globals.css` as `--font-sans: var(--font-default)` / `--font-mono: var(--font-jetbrains-mono)`.
- Layout uses Next 16 typed slot props (`LayoutProps<"/[locale]">` in `app/[locale]/layout.tsx`).
- The i18n middleware is the root `proxy.ts` (not `middleware.ts`, deprecated in Next 16); its matcher excludes `api|admin|trpc|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|llms.txt|indexnow` and dotted paths (static assets).

## SEO, robots, indexability

- `docs/SEO.md` is the canonical spec (metadata, structured data, crawler policy, IndexNow) with new-page and new-locale checklists — read it before touching SEO code.
- Indexability is gated by `isIndexableEnvironment` in `config/site.ts`: indexable only when `NEXT_PUBLIC_SITE_URL` is set AND `NODE_ENV=production` AND not preview/staging (`VERCEL_ENV`/`DEPLOYMENT_ENV`). Local `pnpm start` therefore yields `noindex` + empty sitemap — expected, not a bug (the audit script has a mode for it). `config/site.ts` also reads `ALLOW_MODEL_TRAINING_CRAWLERS`, `INDEXNOW_KEY`/`INDEXNOW_ENDPOINT`, site-verification envs.
- `app/robots.ts` (`robots()`): search/retrieval crawlers (Googlebot, bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, ...) allowed; training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`) blocked unless `ALLOW_MODEL_TRAINING_CRAWLERS=true`; reserved prefixes `/api/`, `/admin/`, `/dashboard/`, `/auth/`, `/private/`, `/preview/` (plus locale-prefixed) blocked for all agents.
- New indexable page: add it to `indexableRoutes` in `app/sitemap.ts`, build metadata via `getLocalizedMetadata` (`lib/seo/metadata.ts`, wires canonical/hreflang/x-default/robots/OG/Twitter — pass `imageAlt` to include the per-locale social cards from `app/[locale]/opengraph-image.tsx` + `twitter-image.tsx` via `lib/seo/social-image.tsx`), emit JSON-LD via `lib/seo/structured-data.ts` + `components/json-ld.tsx`, exactly one h1. Route keys are `keyof typeof routing.pathnames`; only list locales that actually have content (no hreflang alternates to missing translations).
- IndexNow lives in `lib/seo/indexnow.ts` and article publish/update/unpublish/delete hooks; draft saves are skipped. Never submit from page requests or every deploy.
- `app/llms.txt/route.ts` serves a static per-locale resource index; it's excluded from locale negotiation by the `proxy.ts` matcher and checked by the audit script.
- Env reference: `.env.example`; site config in `config/site.ts`, URL helpers in `lib/seo/urls.ts`, `lang`/`dir`/OG-locale helpers in `lib/seo/locales.ts`.

## Internationalization

- Never hardcode user-facing strings in UI components; add them to `messages/<locale>.json` instead.
- Use next-intl for application translations: `getTranslations` in Server Components, `useTranslations` in Client Components.
- Keep translation keys semantically named and organized by feature/page.
- Prefer ICU arguments over string concatenation (plurals, variables, select).
- Preserve locale-aware navigation by using utilities from `@/i18n/navigation` (`Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`) — never `next/link` or `next/navigation` inside localized pages.
- Locale config is the single source of truth in `i18n/routing.ts` (`defineRouting`); add new locales there first.
- User/search-engine-visible metadata must also be localized (`lib/seo/metadata.ts`).
- Every locale must have correct `lang`, `dir` (`lib/seo/locales.ts`), canonical, hreflang and OG locale behavior.
- The root layout lives at `app/[locale]/layout.tsx`; do not recreate a pass-through `app/layout.tsx`.
- Do not use `setRequestLocale` or `requestLocale` — the project uses the `next/root-params` integration in `i18n/request.ts` (Next 16.3+).
- Message arguments are type-checked via the generated `messages/en.d.json.ts` (run `pnpm build`/`pnpm exec next typegen` after editing messages) — do not commit or hand-edit that file. Root `global.ts` wires next-intl v4 typing (`AppConfig` with `Locale`/`Messages`) — the per-locale `Messages` union comes from `en.json`, so adding keys to tr but not en breaks typecheck.
- `app/[locale]/breadcrumb-preview/` is an empty leftover directory (no route file, ignored by Next) — don't treat it as a live breadcrumb preview route, and don't delete it unless you confirm nothing references it.
- 404 responses serve a minimal `<html id="__next_error__">` shell with the real localized layout (incl. `lang`) in flight data — this is standard Next 16 error-recovery, not a bug.
- Sanity-check i18n changes against the URL matrix: `/` (307 → `/tr`), `/tr`, `/en`, `/xx` (307 → `/tr/xx`), `/tr/xx` + `/en/xx` (localized 404s), `/robots.txt`, `/sitemap.xml`, `/llms.txt`.
