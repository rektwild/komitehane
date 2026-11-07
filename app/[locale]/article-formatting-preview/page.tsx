import type {Metadata} from "next";
import Image from "next/image";
import {notFound} from "next/navigation";
import {getLocale, getTranslations} from "next-intl/server";

import {NewsArticleBody} from "@/components/news/news-article-body";
import {NewsPostSummaryAccordion} from "@/components/news/news-post-summary-accordion";
import {
  getArticleFormattingFixture,
  getArticleFormattingFixtureCopy,
} from "@/lib/news/article-formatting-fixture";
import {routing} from "@/i18n/routing";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {index: false, follow: false},
  },
};

export default async function ArticleFormattingPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [locale, t] = await Promise.all([getLocale(), getTranslations("NewsPage")]);
  if (!routing.locales.includes(locale)) notFound();
  const copy = getArticleFormattingFixtureCopy(locale);

  return (
    <article className="w-full min-w-0 pb-12">
      <header className="border-b border-border/60 pb-4">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {copy.title}
        </h1>
        <p
          id="article-excerpt"
          role="doc-subtitle"
          className="mt-3 text-pretty text-base leading-6 text-muted-foreground"
        >
          {copy.excerpt}
        </p>
      </header>

      <div className="grid gap-5 pt-4 xl:grid-cols-[260px_minmax(0,1fr)_300px] xl:gap-6">
        <aside className="hidden xl:block" aria-hidden="true" />
        <div className="min-w-0 space-y-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-card">
            <Image
              src="/fixtures/article-formatting-sample.png"
              alt={copy.heroAlt}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 720px"
              className="object-cover"
            />
          </div>
          <NewsPostSummaryAccordion content={copy.excerpt} />
          <NewsArticleBody
            content={getArticleFormattingFixture(locale)}
            fallbackAlt={t("inlineImageFallbackAlt")}
            creditPrefix={t("imageCreditPrefix")}
            creditOn={t("imageCreditOn")}
            sourceLabel={t("pexelsSource")}
          />
        </div>
        <aside className="hidden xl:block" aria-hidden="true" />
      </div>
    </article>
  );
}
