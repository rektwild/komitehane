import type {Metadata} from "next";
import {NewspaperIcon} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {PageWithAside} from "@/components/layout/page-with-aside";
import {LatestNewsCarousel} from "@/components/news/latest-news-carousel";
import {NewsListing} from "@/components/news/news-listing";
import {NewsSidebar} from "@/components/news/news-sidebar";
import {getPathname} from "@/i18n/navigation";
import {getNewsListing} from "@/lib/news/data";
import type {NewsLocale} from "@/lib/news/types";
import {getLocalizedMetadata} from "@/lib/seo/metadata";
import {getNewsCollectionJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";

type NewsPageProps = {
  params: Promise<{locale: NewsLocale}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({searchParams}: NewsPageProps): Promise<Metadata> {
  const values = await searchParams;
  const filtered = Boolean(firstValue(values.q) || firstValue(values.category) || firstValue(values.page));
  const t = await getTranslations("Metadata.news");
  const metadata = await getLocalizedMetadata("/news", {
    title: t("title"),
    description: t("description"),
    imageAlt: t("imageAlt"),
    absoluteTitle: true,
  });

  return filtered
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
  const query = firstValue(values.q)?.trim() || undefined;
  const category = firstValue(values.category)?.trim() || undefined;
  const parsedPage = Number.parseInt(firstValue(values.page) || "1", 10);
  const result = await getNewsListing({locale, query, category, page: parsedPage});
  const pagePath = await getPathname({href: "/news", locale});
  const pageUrl = absoluteUrl(pagePath);

  return (
    <>
      <PageBreadcrumb
        items={[{label: t("title"), icon: NewspaperIcon}]}
        className="shrink-0 py-4"
      />

      <PageWithAside>
        <div className="flex min-w-0 flex-1 flex-col pb-8">
          <JsonLd
            data={getNewsCollectionJsonLd({
              locale,
              url: pageUrl,
              name: metadataT("title"),
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("title")}
            </h1>
          </header>

          <div className="mt-4">
            <LatestNewsCarousel articles={result.latest} locale={locale} />
          </div>

          <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[21rem_minmax(0,1fr)] xl:gap-14">
            <div className="order-1 min-w-0 lg:order-2">
              <NewsListing
                articles={result.articles}
                locale={locale}
                query={query}
                category={category}
                page={result.page}
                totalPages={result.totalPages}
              />
            </div>
            <div className="order-2 min-w-0 lg:order-1">
              <NewsSidebar
                trending={result.trending}
                popular={result.popular}
                categories={result.categories}
                locale={locale}
                selectedCategory={category}
              />
            </div>
          </div>
        </div>
      </PageWithAside>
    </>
  );
}
