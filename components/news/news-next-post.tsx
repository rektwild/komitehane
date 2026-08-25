import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { NewsLocale, NewsSummary } from "@/lib/news/types";

type NewsNextPostProps = {
  article: NewsSummary;
  locale: NewsLocale;
};

export async function NewsNextPost({ article, locale }: NewsNextPostProps) {
  const t = await getTranslations("NewsPage");
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(article.publishedAt));

  return (
    <Link
      href={{ pathname: "/news/[slug]", params: { slug: article.slug } }}
      aria-label={`${t("nextPost")}: ${article.title}`}
      className="group block rounded-lg border border-border bg-card p-5 text-right transition-colors hover:border-border/80 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6"
    >
      <div className="flex items-center justify-end gap-1.5 text-sm font-normal leading-6 text-muted-foreground">
        <span>{t("nextPost")}</span>
        <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0" />
      </div>
      <div className="mt-1.5 line-clamp-2 text-balance text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-foreground sm:text-xl">
        {article.title}
      </div>
      <time
        dateTime={article.publishedAt}
        className="mt-1.5 block text-sm font-normal leading-6 text-muted-foreground"
      >
        {formattedDate}
      </time>
    </Link>
  );
}
