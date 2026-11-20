import {NewsStaticBadge} from "@/components/news/news-category-badge";
import {Link} from "@/i18n/navigation";
import type {NewsLocale, NewsSummary} from "@/lib/news/types";
import {typography} from "@/lib/typography";
import {cn} from "@/lib/utils";

type ArticleListRowProps = {
  article: NewsSummary;
  locale: NewsLocale;
};

export function ArticleListRow({article, locale}: ArticleListRowProps) {
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(article.publishedAt));

  return (
    <Link
      href={{pathname: "/news/[slug]", params: {slug: article.slug}}}
      className="group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg px-3 py-3.5 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 md:grid-cols-[minmax(0,1fr)_10rem_8rem]"
    >
      <h3 className="min-w-0 truncate text-sm font-medium text-foreground sm:text-base">
        {article.title}
      </h3>
      <div className="hidden md:block">
        <NewsStaticBadge label={article.category.name} size="compact" />
      </div>
      <time
        dateTime={article.publishedAt}
        className={cn(typography.meta, "whitespace-nowrap text-right tabular-nums sm:text-sm")}
      >
        {formattedDate}
      </time>
    </Link>
  );
}
