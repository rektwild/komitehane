import {SearchIcon} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {ArticleCard} from "@/components/news/article-card";
import {Button} from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {Input} from "@/components/ui/input";
import {getPathname, Link} from "@/i18n/navigation";
import type {NewsLocale, NewsSummary} from "@/lib/news/types";

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
  locale,
  query,
  category,
  page,
  totalPages,
}: {
  articles: NewsSummary[];
  locale: NewsLocale;
  query?: string;
  category?: string;
  page: number;
  totalPages: number;
}) {
  const t = await getTranslations("NewsPage");
  const action = await getPathname({href: "/news", locale});

  return (
    <section aria-labelledby="all-news-heading" className="min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="all-news-heading" className="text-2xl font-bold tracking-tight">
          {t("listTitle")}
        </h2>
        <form role="search" action={action} className="flex w-full max-w-xl gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              defaultValue={query}
              aria-label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              className="h-10 ps-9"
            />
          </div>
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <Button type="submit" size="lg">{t("searchSubmit")}</Button>
        </form>
      </div>

      {query || category ? (
        <div className="mt-3 flex justify-end">
          <Button variant="link" nativeButton={false} render={<Link href="/news" />}>
            {t("clearFilters")}
          </Button>
        </div>
      ) : null}

      {articles.length ? (
        <div className="mt-6 space-y-5">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              locale={locale}
              readingTimeLabel={t("readingTime", {minutes: String(article.readingMinutes)})}
            />
          ))}
        </div>
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
