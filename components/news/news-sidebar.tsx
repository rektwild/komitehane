import {getTranslations} from "next-intl/server";

import {
  NewsBadge,
  NewsCategoryBadge,
  NewsStaticBadge,
} from "@/components/news/news-category-badge";
import {Separator} from "@/components/ui/separator";
import {Link} from "@/i18n/navigation";
import type {NewsCategory, NewsLocale, NewsSummary} from "@/lib/news/types";

function RankedList({
  articles,
  locale,
  readingTime,
}: {
  articles: NewsSummary[];
  locale: NewsLocale;
  readingTime: (minutes: number) => string;
}) {
  if (!articles.length) return null;

  return (
    <ol className="mt-4 space-y-5">
      {articles.map((article, index) => (
        <li key={article.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
          <span className="text-2xl font-bold text-muted-foreground/60">
            {index + 1}.
          </span>
          <div className="min-w-0">
            <Link
              href={{pathname: "/news/[slug]", params: {slug: article.slug}}}
              className="font-semibold leading-snug text-foreground outline-none hover:text-primary focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {article.title}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <NewsStaticBadge label={article.category.name} size="default" />
              <span>{readingTime(article.readingMinutes)}</span>
              <time dateTime={article.publishedAt}>
                {new Intl.DateTimeFormat(locale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(article.publishedAt))}
              </time>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export async function NewsSidebar({
  trending,
  popular,
  categories,
  locale,
  selectedCategory,
}: {
  trending: NewsSummary[];
  popular: NewsSummary[];
  categories: NewsCategory[];
  locale: NewsLocale;
  selectedCategory?: string;
}) {
  const t = await getTranslations("NewsPage");
  const readingTime = (minutes: number) => t("readingTime", {minutes: String(minutes)});

  return (
    <aside aria-label={t("categories")} className="min-w-0 space-y-8 lg:sticky lg:top-24 lg:self-start">
      {trending.length ? (
        <section>
          <h2 className="text-lg font-bold tracking-tight">{t("trending")}</h2>
          <RankedList articles={trending} locale={locale} readingTime={readingTime} />
        </section>
      ) : null}

      {trending.length && popular.length ? <Separator /> : null}

      {popular.length ? (
        <section>
          <h2 className="text-lg font-bold tracking-tight">{t("popular")}</h2>
          <RankedList articles={popular} locale={locale} readingTime={readingTime} />
        </section>
      ) : null}

      {(trending.length || popular.length) && categories.length ? <Separator /> : null}

      {categories.length ? (
        <section>
          <h2 className="text-lg font-bold tracking-tight">{t("categories")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <NewsBadge
              label={t("allCategories")}
              href="/news"
              active={!selectedCategory}
              size="default"
            />
            {categories.map((category) => (
              <NewsCategoryBadge
                key={category.id}
                category={category}
                active={selectedCategory === category.slug}
                size="default"
              />
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
