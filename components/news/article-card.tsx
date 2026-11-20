import Image from "next/image";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Link} from "@/i18n/navigation";
import type {NewsLocale, NewsSummary} from "@/lib/news/types";
import {typography} from "@/lib/typography";
import {cn} from "@/lib/utils";

function getAuthorInitial(authorName: string): string {
  return authorName.trim().charAt(0).toUpperCase() || "K";
}

type ArticleCardProps = {
  article: NewsSummary;
  locale: NewsLocale;
  readingTimeLabel: string;
  preload?: boolean;
  variant?: "list" | "featured" | "carousel" | "supporting";
};

function getImageSizes(variant: ArticleCardProps["variant"]): string {
  if (variant === "carousel") {
    return "(max-width: 767px) 100vw, 50vw";
  }

  if (variant === "featured") {
    return "(max-width: 1023px) 100vw, 58vw";
  }

  if (variant === "supporting") {
    return "(max-width: 1023px) 100vw, 28vw";
  }

  return "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw";
}

export function ArticleCard({
  article,
  locale,
  readingTimeLabel,
  preload = false,
  variant = "list",
}: ArticleCardProps) {
  const featured = variant === "featured";
  const carousel = variant === "carousel";
  const supporting = variant === "supporting";
  const list = variant === "list";
  const detailHref = {
    pathname: "/news/[slug]" as const,
    params: {slug: article.slug},
  } as const;
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(article.publishedAt));

  return (
    <Link
      href={detailHref}
      className={cn(
        "group min-w-0 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
        list ? "flex h-full flex-col gap-4" : "hover:bg-muted/50 active:bg-muted",
        carousel
          ? "grid h-full gap-4 p-3 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-6"
          : supporting
            ? "flex h-full flex-col gap-2.5 p-2.5"
            : !list && "flex h-full flex-col gap-2 p-3",
        featured && "h-full gap-3 p-3",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg bg-muted",
          list
            ? "border border-border/60"
            : "shadow-md outline outline-offset-3 outline-border/50",
          carousel ? "aspect-[16/9] md:aspect-auto md:min-h-80" : "aspect-[16/9]",
        )}
      >
        <Image
          src={article.image.url}
          alt={article.image.alt || article.title}
          fill
          preload={preload}
          sizes={getImageSizes(variant)}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col px-2 pb-1",
          featured && "gap-3 px-2 pb-3 sm:px-3",
          carousel && "justify-center gap-4 px-2 py-2 md:px-4 md:py-6",
          supporting && "flex-1 gap-2 px-2 pb-1",
          list && "flex-1 gap-2 px-0 pb-0",
        )}
      >
        <h2
          className={cn(
            "line-clamp-2",
            featured || carousel
              ? "text-xl font-semibold leading-tight tracking-tight sm:text-2xl"
              : typography.heading,
            list && "underline-offset-4 decoration-1 group-hover:underline",
          )}
        >
          {article.title}
        </h2>

        <p
          className={cn(
            typography.body,
            featured || carousel ? "line-clamp-3 sm:text-base" : "line-clamp-2",
          )}
        >
          {article.excerpt}
        </p>

        <div
          className={cn(
            "flex items-center justify-between gap-3 border-t border-border/50",
            supporting ? "mt-auto pt-2" : featured ? "gap-4 pt-3" : "mt-auto pt-2.5",
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Avatar
              size={featured || carousel ? "default" : "sm"}
              className={cn(featured || carousel ? "size-8" : "size-6")}
            >
              <AvatarFallback
                className={cn(
                  "font-medium",
                  "text-xs",
                )}
              >
                {getAuthorInitial(article.authorName)}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "min-w-0 truncate font-medium tracking-tight text-foreground",
                featured || carousel ? "text-sm" : "text-xs",
              )}
            >
              {article.authorName}
            </span>
          </div>
          <div
            className={cn(
              "flex shrink-0 items-center gap-1 text-muted-foreground transition-colors group-hover:text-foreground sm:gap-1.5",
              featured || carousel ? "text-xs sm:text-sm" : "text-xs",
            )}
          >
            <time dateTime={article.publishedAt} className="whitespace-nowrap">
              {formattedDate}
            </time>
            <span
              aria-hidden="true"
              className="size-1 shrink-0 rounded-full bg-muted-foreground"
            />
            <span className="whitespace-nowrap">{readingTimeLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
