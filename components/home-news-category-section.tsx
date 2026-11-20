import {getTranslations} from "next-intl/server";

import {ArticleCard} from "@/components/news/article-card";
import type {NewsLocale, HomeNewsSection} from "@/lib/news/types";
import {typography} from "@/lib/typography";
import {cn} from "@/lib/utils";

export async function HomeNewsCategorySection({
  section,
  locale,
}: {
  section: HomeNewsSection;
  locale: NewsLocale;
}) {
  const t = await getTranslations("NewsPage");

  return (
    <section
      aria-labelledby={`home-news-category-${section.category.id}`}
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="flex min-w-0 items-center gap-6">
        <h2
          id={`home-news-category-${section.category.id}`}
          className={cn(typography.title, "min-w-0")}
        >
          {section.category.name}
        </h2>
        <span aria-hidden="true" className="h-1 min-w-0 flex-1 bg-action" />
      </div>

      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
        {section.articles.map((article) => (
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
    </section>
  );
}
