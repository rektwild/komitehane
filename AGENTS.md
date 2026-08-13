<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Komitehane

Next.js 16.3.0 (App Router, Turbopack) + React 19 + Tailwind CSS v4 + shadcn/ui + next-intl. No unit tests; the only automated check is `pnpm seo:audit` (needs a running server). Template boilerplate was stripped — `app/[locale]/page.tsx` is a minimal i18n placeholder (title + description) awaiting real content.

## Commands

- `pnpm dev` — dev server. pnpm is the only package manager (`packageManager: pnpm@11.20.0`); don't run npm/yarn.
- `pnpm lint` — eslint (script is plain `eslint`; use `pnpm exec eslint . --fix` to autofix)
- `pnpm build` — runs `tsc` as part of the build; there is NO standalone typecheck script
- `pnpm seo:audit` — `node scripts/seo-audit.mjs`; verifies redirects, 200/404s, lang/canonical/hreflang/JSON-LD, robots, sitemap, `llms.txt` against a RUNNING server. Env: `SEO_AUDIT_BASE_URL` (default `http://localhost:3000`), `SEO_AUDIT_EXPECT_INDEXABLE` (default true; set `false` for dev/preview mode, where noindex + empty sitemap are expected)
- `pnpm exec shadcn add <component>` — install a shadcn/ui component (the `shadcn` CLI is already a dependency; `pnpm dlx shadcn@latest` also works). First add re-creates `components/ui/` and `lib/utils.ts`
- Production verification: `pnpm build` then `pnpm start`. Kill a stale server with `lsof -ti:3000 | xargs kill -9` first — killing the pnpm wrapper pid alone leaves the old build serving and produces misleading results.
- Don't touch `allowBuilds` in `pnpm-workspace.yaml` — removing entries makes `pnpm build` fail with `ERR_PNPM_IGNORED_BUILDS`.

## Conventions

- No shadcn/ui components are installed yet — `components/` holds only custom code (`json-ld.tsx`, `locale-switcher.tsx`). `components.json` is preset `base-nova`; add components via the CLI, which also regenerates `lib/utils.ts` (`cn`) and `components/ui/`.
- Tailwind v4: no `tailwind.config.*` — theme tokens are CSS variables (oklch) in `app/globals.css`, with `.dark` class-based dark mode (`@custom-variant dark`). Keep `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"` above `@theme` and other rules.
- Fonts: Inter + JetBrains Mono loaded via `next/font/google` in `app/[locale]/layout.tsx`, mapped in `globals.css` as `--font-sans: var(--font-inter)` / `--font-mono: var(--font-jetbrains-mono)` — no Geist.
- Path alias `@/*` → repo root; app code is in `app/` (no `src/` dir). Use `@/` imports, never relative.
- shadcn CLI gotcha: `-b`/`--base` selects the component library (`radix` | `base` | `aria`), NOT the base color. Non-interactive init is `shadcn init -d` (defaults to base-nova preset).
- Layout uses Next 16 typed slot props (`LayoutProps<"/[locale]">` in `app/[locale]/layout.tsx`).
- The i18n middleware is the root `proxy.ts` (not `middleware.ts`, deprecated in Next 16); its matcher excludes `api|trpc|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|llms.txt|indexnow` and dotted paths (static assets) — any new non-localized route must be added to this exclusion list.

## SEO, robots, indexability

- `docs/SEO.md` is the canonical spec (metadata, structured data, crawler policy, IndexNow) with new-page and new-locale checklists — read it before touching SEO code.
- Indexability is gated by `isIndexableEnvironment` in `config/site.ts`: indexable only when `NEXT_PUBLIC_SITE_URL` is set AND `NODE_ENV=production` AND not preview/staging (`VERCEL_ENV`/`DEPLOYMENT_ENV`). Local `pnpm start` therefore yields `noindex` + empty sitemap — expected, not a bug (the audit script has a mode for it). `config/site.ts` also reads `ALLOW_MODEL_TRAINING_CRAWLERS`, `INDEXNOW_KEY`, site-verification envs.
- `app/robots.ts` (`robots()`): search/retrieval crawlers (Googlebot, Bing, OAI-SearchBot, PerplexityBot, Claude-SearchBot, ...) allowed; training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`) blocked unless `ALLOW_MODEL_TRAINING_CRAWLERS=true`; reserved prefixes `/api/`, `/admin/`, `/dashboard/`, `/auth/`, `/private/`, `/preview/` (plus locale-prefixed) blocked for all agents.
- New indexable page: add it to `indexableRoutes` in `app/sitemap.ts`, build metadata via `getLocalizedMetadata` (`lib/seo/metadata.ts`), exactly one h1. Route keys are `keyof typeof routing.pathnames`.
- IndexNow lives in `lib/seo/indexnow.ts` (utility only; logs status, never the key) and `app/indexnow/[key]/route.ts` (serves the verification key at its path, 404 otherwise). Not wired to any page yet — don't submit on page requests or every deploy.
- Env reference: `.env.example`; site config in `config/site.ts`, URL helpers in `lib/seo/urls.ts`.

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
- Message arguments are type-checked via the generated `messages/en.d.json.ts` (run `pnpm build`/`pnpm exec next typegen` after editing messages) — do not commit or hand-edit that file.
- 404 responses serve a minimal `<html id="__next_error__">` shell with the real localized layout (incl. `lang`) in flight data — this is standard Next 16 error-recovery, not a bug.
- Sanity-check i18n changes against the URL matrix: `/` (307 → `/tr`), `/tr`, `/en`, `/xx` (307 → `/tr/xx`), `/tr/xx` + `/en/xx` (localized 404s), `/robots.txt`, `/sitemap.xml`.
