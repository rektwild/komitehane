import {ArticleCard} from "@/components/news/article-card";
import type {NewsLocale, NewsSummary} from "@/lib/news/types";
import {cn} from "@/lib/utils";

type NewsShowcaseProps = {
  article: NewsSummary;
  supportingArticles: NewsSummary[];
  locale: NewsLocale;
  readingTime: (minutes: number) => string;
  featuredPosition: "left" | "right";
  preload?: boolean;
};

export function NewsShowcase({
  article,
  supportingArticles,
  locale,
  readingTime,
  featuredPosition,
  preload = false,
}: NewsShowcaseProps) {
  const featureOnRight = featuredPosition === "right";

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:gap-8 lg:items-stretch">
      <div
        className={cn(
          "order-1 min-w-0",
          featureOnRight && "lg:order-2",
          !supportingArticles.length && "lg:col-span-2",
        )}
      >
        <ArticleCard
          article={article}
          locale={locale}
          variant="featured"
          preload={preload}
          readingTimeLabel={readingTime(article.readingMinutes)}
        />
      </div>

      {supportingArticles.length ? (
        <div
          className={cn(
            "order-2 grid min-w-0 gap-4 lg:h-full",
            supportingArticles.length === 1 && "auto-rows-fr",
            supportingArticles.length === 2 && "grid-rows-2 auto-rows-fr gap-5 lg:gap-6",
            featureOnRight && "lg:order-1",
          )}
        >
          {supportingArticles.map((supportingArticle) => (
            <ArticleCard
              key={supportingArticle.id}
              article={supportingArticle}
              locale={locale}
              variant="supporting"
              readingTimeLabel={readingTime(supportingArticle.readingMinutes)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
