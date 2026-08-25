import Image from "next/image";

import {Card} from "@/components/ui/card";
import {NewsCategoryBadge} from "@/components/news/news-category-badge";
import {Link} from "@/i18n/navigation";
import type {NewsLocale, NewsSummary} from "@/lib/news/types";
import {cn} from "@/lib/utils";

type ArticleCardProps = {
  article: NewsSummary;
  locale: NewsLocale;
  readingTimeLabel: string;
  variant?: "list" | "featured";
};

export function ArticleCard({
  article,
  locale,
  readingTimeLabel,
  variant = "list",
}: ArticleCardProps) {
  const featured = variant === "featured";
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(article.publishedAt));
  const detailHref = {
    pathname: "/news/[slug]" as const,
    params: {slug: article.slug},
  };

  return (
    <Card
      className={cn(
        "group gap-0 overflow-hidden py-0 transition-colors hover:ring-foreground/20",
        featured
          ? "grid min-h-[31rem] md:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]"
          : "grid sm:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[18rem_minmax(0,1fr)]",
      )}
    >
      <Link
        href={detailHref}
        className={cn(
          "relative block overflow-hidden bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          featured ? "min-h-64 md:min-h-full" : "aspect-[4/3] sm:aspect-auto sm:min-h-48",
        )}
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={article.image.url}
          alt=""
          fill
          sizes={
            featured
              ? "(max-width: 768px) 100vw, 65vw"
              : "(max-width: 640px) 100vw, 288px"
          }
          className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
        />
      </Link>

      <div
        className={cn(
          "flex min-w-0 flex-col justify-center p-5 sm:p-6",
          featured && "p-6 sm:p-8 lg:p-10",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <NewsCategoryBadge category={article.category} size="default" />
          <time dateTime={article.publishedAt}>{formattedDate}</time>
          <span aria-hidden="true">·</span>
          <span>{readingTimeLabel}</span>
        </div>

        <h2
          className={cn(
            "mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl",
            featured && "text-3xl sm:text-4xl lg:text-5xl",
          )}
        >
          <Link
            href={detailHref}
            className="rounded-sm outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {article.title}
          </Link>
        </h2>

        <p
          className={cn(
            "mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base",
            featured && "mt-4 text-base sm:text-lg",
          )}
        >
          {article.excerpt}
        </p>

        <p className={cn("mt-5 text-sm font-medium", featured && "mt-7")}>
          {article.authorName}
        </p>
      </div>
    </Card>
  );
}
