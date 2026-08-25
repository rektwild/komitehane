import Image from "next/image";
import {getTranslations} from "next-intl/server";

import {Link} from "@/i18n/navigation";
import type {NewsLocale, NewsSummary} from "@/lib/news/types";

type RelatedNewsProps = {
  articles: NewsSummary[];
  locale: NewsLocale;
};

export async function RelatedNews({articles, locale}: RelatedNewsProps) {
  const t = await getTranslations("NewsPage");
  if (articles.length === 0) return null;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section
      aria-labelledby="related-news-title"
      className="mt-14 pt-10 md:mt-16 md:pt-12"
    >
      <h2
        id="related-news-title"
        className="text-2xl font-bold leading-none tracking-tight text-foreground sm:text-3xl"
      >
        {t("relatedTitle")}
      </h2>

      <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => {
          const formattedDate = dateFormatter.format(new Date(article.publishedAt));

          return (
            <Link
              key={article.id}
              href={{pathname: "/news/[slug]", params: {slug: article.slug}}}
              className="group block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted">
                <Image
                  src={article.image.url}
                  alt={article.image.alt || t("articleImage", {title: article.title})}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{article.category.name}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={article.publishedAt}>{formattedDate}</time>
                  <span aria-hidden="true">·</span>
                  <span>{t("readingTime", {minutes: String(article.readingMinutes)})}</span>
                </div>

                <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
                  {article.title}
                </h3>

                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
