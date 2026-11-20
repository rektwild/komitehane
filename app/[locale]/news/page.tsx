import type {Metadata} from "next";
import {NewspaperIcon} from "lucide-react";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {PageWithAside} from "@/components/layout/page-with-aside";
import {NewsListing} from "@/components/news/news-listing";
import {getPathname} from "@/i18n/navigation";
import {getCachedNewsListing} from "@/lib/news/data";
import type {NewsLocale} from "@/lib/news/types";
import {getLocalizedMetadata, getRobotsMetadata} from "@/lib/seo/metadata";
import {getNewsCollectionJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";
import {typography} from "@/lib/typography";

type NewsPageProps = {
  params: Promise<{locale: NewsLocale}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type ListingState = {
  query?: string;
  category?: string;
  tag?: string;
  page: number;
  /** A plain `?page=N` (N >= 2) archive page without search or filters. */
  isArchivePage: boolean;
  /** Search, filter, or non-canonical page values (e.g. `?page=1`). */
  isFilteredView: boolean;
};

function getListingState(values: Record<string, string | string[] | undefined>): ListingState {
  const query = firstValue(values.q)?.trim() || undefined;
  const category = firstValue(values.category)?.trim() || undefined;
  const tag = firstValue(values.tag)?.trim() || undefined;
  const rawPage = firstValue(values.page);
  const canonicalPage = rawPage && /^[1-9]\d{0,5}$/.test(rawPage) ? Number(rawPage) : undefined;
  const page = canonicalPage ?? (Number.parseInt(rawPage || "1", 10) || 1);
  const hasFilters = Boolean(query || category || tag);
  const isArchivePage = !hasFilters && canonicalPage !== undefined && canonicalPage >= 2;

  return {
    query,
    category,
    tag,
    page,
    isArchivePage,
    isFilteredView: hasFilters || (rawPage !== undefined && !isArchivePage),
  };
}

function getListing(locale: NewsLocale, state: ListingState) {
  return getCachedNewsListing(locale, state.query, state.category, state.tag, state.page);
}

function getArchivePath(basePath: string, page: number): string {
  return page >= 2 ? `${basePath}?page=${page}` : basePath;
}

export async function generateMetadata({params, searchParams}: NewsPageProps): Promise<Metadata> {
  const [{locale}, values] = await Promise.all([params, searchParams]);
  const state = getListingState(values);
  const t = await getTranslations("Metadata.news");
  const metadata = await getLocalizedMetadata("/news", {
    title: t("title"),
    description: t("description"),
    imageAlt: t("imageAlt"),
    socialImageKey: "news",
    absoluteTitle: true,
  });

  if (state.isArchivePage) {
    // Archive pages are self-canonical and indexable so older articles stay
    // reachable through crawlable pagination. They carry no hreflang: page N
    // in one locale does not list the same articles as page N in another.
    const result = await getListing(locale, state);
    if (state.page > result.totalPages) notFound();

    const canonical = absoluteUrl(
      getArchivePath(await getPathname({href: "/news", locale}), state.page),
    );
    const title = t("pagedTitle", {page: String(state.page)});

    return {
      ...metadata,
      title: {absolute: title},
      alternates: {canonical},
      robots: getRobotsMetadata(),
      openGraph: {...metadata.openGraph, title, url: canonical},
      twitter: {...metadata.twitter, title},
    };
  }

  return state.isFilteredView
    ? {
        ...metadata,
        robots: {
          index: false,
          follow: true,
          googleBot: {index: false, follow: true},
        },
      }
    : metadata;
}

export default async function NewsPage({params, searchParams}: NewsPageProps) {
  const [{locale}, values, t, metadataT] = await Promise.all([
    params,
    searchParams,
    getTranslations("NewsPage"),
    getTranslations("Metadata.news"),
  ]);
  const state = getListingState(values);
  const {query, category, tag} = state;
  const result = await getListing(locale, state);
  if (state.isArchivePage && state.page > result.totalPages) notFound();
  const pagePath = await getPathname({href: "/news", locale});
  const pageUrl = absoluteUrl(
    state.isArchivePage ? getArchivePath(pagePath, state.page) : pagePath,
  );

  return (
    <>
      <PageBreadcrumb
        items={[{label: t("title"), icon: NewspaperIcon}]}
        className="shrink-0 py-4"
      />

      <PageWithAside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 pb-12">
          <JsonLd
            data={getNewsCollectionJsonLd({
              locale,
              url: pageUrl,
              name: state.isArchivePage
                ? metadataT("pagedTitle", {page: String(state.page)})
                : metadataT("title"),
              description: metadataT("description"),
              articles: result.articles.map((article) => ({
                name: article.title,
                url: absoluteUrl(
                  getPathname({
                    href: {pathname: "/news/[slug]", params: {slug: article.slug}},
                    locale,
                  }),
                ),
              })),
            })}
          />

          <header className="max-w-3xl">
            <h1 className={typography.display}>
              {t("title")}
            </h1>
          </header>

          <div className="min-w-0">
            <NewsListing
              articles={result.articles}
              categories={result.categories}
              tags={result.tags}
              locale={locale}
              query={query}
              category={category}
              tag={tag}
              page={result.page}
              totalPages={result.totalPages}
            />
          </div>
        </div>
      </PageWithAside>
    </>
  );
}
