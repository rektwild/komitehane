import {SearchIcon} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {AdPlacement} from "@/components/ads/ad-placement";
import {ArticleCard} from "@/components/news/article-card";
import {NewsFilterDropdown} from "@/components/news/news-filter-dropdown";
import {Button} from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {getPathname, Link} from "@/i18n/navigation";
import {adsenseConfig} from "@/config/adsense";
import type {NewsCategory, NewsLocale, NewsSummary} from "@/lib/news/types";

type QueryState = {q?: string; category?: string; page?: number};

function getListingHref({q, category, page}: QueryState) {
  const query: Record<string, string | number> = {};
  if (q) query.q = q;
  if (category) query.category = category;
  if (page && page > 1) query.page = page;
  return {pathname: "/news" as const, ...(Object.keys(query).length ? {query} : {})};
}

export async function NewsListing({
  articles,
  categories,
  locale,
  query,
  category,
  page,
  totalPages,
}: {
  articles: NewsSummary[];
  categories: NewsCategory[];
  locale: NewsLocale;
  query?: string;
  category?: string;
  page: number;
  totalPages: number;
}) {
  const t = await getTranslations("NewsPage");
  const action = await getPathname({href: "/news", locale});
  const shouldRenderInlineAd =
    adsenseConfig.enabled &&
    Boolean(adsenseConfig.slots.LISTING_INLINE) &&
    articles.length > 3;
  const firstArticles = shouldRenderInlineAd ? articles.slice(0, 3) : articles;
  const remainingArticles = shouldRenderInlineAd ? articles.slice(3) : [];

  return (
    <section aria-label={t("title")} className="min-w-0">
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center gap-2">
          <form
            role="search"
            action={action}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <InputGroup className="h-9 min-w-0 flex-1 rounded-xl bg-background shadow-none">
              <InputGroupAddon className="pointer-events-none absolute inset-y-0 start-0 z-10 h-9 !ps-3">
                <SearchIcon aria-hidden="true" className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="news-search"
                name="q"
                type="search"
                defaultValue={query}
                aria-label={t("searchLabel")}
                placeholder={t("searchPlaceholder")}
                className="h-9 !ps-10 !pe-3 text-sm"
              />
            </InputGroup>
            {category ? <input type="hidden" name="category" value={category} /> : null}
          </form>
          <NewsFilterDropdown
            categories={categories}
            selectedCategory={category}
            query={query}
          />
        </div>
      </div>

      {query || category ? (
        <div className="mt-3 flex justify-end">
          <Button variant="link" nativeButton={false} render={<Link href="/news" />}>
            {t("clearFilters")}
          </Button>
        </div>
      ) : null}

      {articles.length ? (
        <>
          <div className="mt-8 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
            {firstArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                locale={locale}
                variant="list"
                readingTimeLabel={t("readingTime", {
                  minutes: String(article.readingMinutes),
                })}
              />
            ))}
          </div>

          {shouldRenderInlineAd ? (
            <AdPlacement placement="LISTING_INLINE" />
          ) : null}

          {remainingArticles.length > 0 ? (
            <div className="mt-4 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
              {remainingArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  locale={locale}
                  variant="list"
                  readingTimeLabel={t("readingTime", {
                    minutes: String(article.readingMinutes),
                  })}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <Empty className="mt-6 min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchIcon aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/news" />}>
              {t("clearFilters")}
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {totalPages > 1 ? (
        <nav aria-label={t("pageLabel", {page: String(page), totalPages: String(totalPages)})} className="mt-8 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            nativeButton={false}
            disabled={page <= 1}
            render={page > 1 ? <Link href={getListingHref({q: query, category, page: page - 1})} /> : undefined}
          >
            {t("previousPage")}
          </Button>
          <span className="text-sm text-muted-foreground">{t("pageLabel", {page: String(page), totalPages: String(totalPages)})}</span>
          <Button
            variant="outline"
            nativeButton={false}
            disabled={page >= totalPages}
            render={page < totalPages ? <Link href={getListingHref({q: query, category, page: page + 1})} /> : undefined}
          >
            {t("nextPage")}
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
