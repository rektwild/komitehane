import type {Metadata} from "next";
import Image from "next/image";
import {RichText} from "@payloadcms/richtext-lexical/react";
import {NewspaperIcon} from "lucide-react";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {AdPlacement} from "@/components/ads/ad-placement";
import {convertLexicalToPlaintext} from "@payloadcms/richtext-lexical/plaintext";

import {NewsAuthorCard} from "@/components/news/news-author-card";
import {NewsNextPost} from "@/components/news/news-next-post";
import {NewsPostSummaryAccordion} from "@/components/news/news-post-summary-accordion";
import {NewsRightRail} from "@/components/news/news-right-rail";
import {NewsShareActions} from "@/components/news/news-share-actions";
import {NewsTopics} from "@/components/news/news-topics";
import {RelatedNews} from "@/components/news/related-news";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {getPathname} from "@/i18n/navigation";
import {
  getNewsArticle,
  getNewsCategories,
  getNextNewsArticle,
  getRelatedNewsArticles,
} from "@/lib/news/data";
import {extractNewsToc} from "@/lib/news/toc";
import type {NewsLocale} from "@/lib/news/types";
import {getDynamicLocalizedMetadata} from "@/lib/seo/metadata";
import {getNewsArticleJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";

type NewsArticlePageProps = {
  params: Promise<{locale: NewsLocale; slug: string}>;
};

async function getArticlePaths(
  translations: Array<{locale: NewsLocale; slug: string}>,
) {
  return Object.fromEntries(
    translations.map(({locale, slug}) => [
      locale,
      getPathname({
        href: {pathname: "/news/[slug]", params: {slug}},
        locale,
      }),
    ]),
  ) as Partial<Record<NewsLocale, string>>;
}

export async function generateMetadata({params}: NewsArticlePageProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const article = await getNewsArticle(locale, slug);
  if (!article) notFound();

  const localizedPaths = await getArticlePaths(article.translations);
  const canonicalPath = localizedPaths[locale];
  if (!canonicalPath) notFound();

  return getDynamicLocalizedMetadata({
    locale,
    canonicalPath,
    localizedPaths,
    title: article.title,
    description: article.excerpt,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authors: [{name: article.authorName}],
    image: article.image,
  });
}

export default async function NewsArticlePage({params}: NewsArticlePageProps) {
  const {locale, slug} = await params;
  const [article, t] = await Promise.all([
    getNewsArticle(locale, slug),
    getTranslations("NewsPage"),
  ]);
  if (!article) notFound();

  const currentPath = getPathname({
    href: {pathname: "/news/[slug]", params: {slug: article.slug}},
    locale,
  });
  const currentUrl = absoluteUrl(currentPath);
  const newsUrl = absoluteUrl(getPathname({href: "/news", locale}));
  const tocItems = extractNewsToc(article.content);
  const plainText = convertLexicalToPlaintext({ data: article.content });
  const [relatedArticles, categories, nextArticle] = await Promise.all([
    getRelatedNewsArticles({
      locale,
      slug: article.slug,
      categorySlug: article.category.slug,
      limit: 4,
    }),
    getNewsCategories(locale),
    getNextNewsArticle({
      locale,
      slug: article.slug,
      publishedAt: article.publishedAt,
    }),
  ]);

  let headingCursor = 0;
  const richTextConverters = ({
    defaultConverters,
  }: {
    defaultConverters: Record<string, unknown>;
  }) => ({
    ...defaultConverters,
    heading: ({node, nodesToJSX}: {node: {tag: string; children: unknown[]}; nodesToJSX: (args: {nodes: unknown[]}) => unknown}) => {
      const tag = node.tag as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      const children = nodesToJSX({nodes: node.children}) as React.ReactNode;
      if (tag === "h2" || tag === "h3") {
        const item = tocItems[headingCursor++];
        if (item?.id) {
          const Heading = tag;
          return <Heading id={item.id}>{children as React.ReactNode}</Heading>;
        }
      }
      const Tag = tag as keyof React.JSX.IntrinsicElements;
      return <Tag>{children as React.ReactNode}</Tag>;
    },
  });

  return (
    <>
      <PageBreadcrumb
        items={[
          {label: t("title"), href: "/news", icon: NewspaperIcon},
          {label: article.title},
        ]}
        className="shrink-0 py-4"
      />

      <article className="w-full min-w-0 pb-12">
        <JsonLd
          data={getNewsArticleJsonLd({
            locale,
            url: currentUrl,
            title: article.title,
            description: article.excerpt,
            image: article.image.url,
            authorName: article.authorName,
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt,
            breadcrumbItems: [
              {name: t("title"), url: newsUrl},
              {name: article.title, url: currentUrl},
            ],
          })}
        />

        <header className="border-b border-border/60 pb-4">
          <h1 className="text-balance text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {article.title}
          </h1>
          <p
            id="article-excerpt"
            role="doc-subtitle"
            className="mt-4 text-pretty text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9"
          >
            {article.excerpt}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <time dateTime={article.publishedAt}>
              {new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(article.publishedAt))}
            </time>
            <span aria-hidden="true">·</span>
            <span>{t("readingTime", {minutes: String(article.readingMinutes)})}</span>
          </div>
        </header>

        <div className="grid gap-5 pt-4 xl:grid-cols-[260px_minmax(0,1fr)_300px] xl:gap-6">
          <aside className="order-2 space-y-6 xl:order-1 xl:sticky xl:top-28 xl:self-start">
            <NewsAuthorCard
              authorName={article.authorName}
              authorRole={article.authorRole}
              locale={locale}
            />
            <NewsShareActions title={article.title} url={currentUrl} />
          </aside>

          <div className="order-1 min-w-0 space-y-8 xl:order-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-card">
              <Image
                src={article.image.url}
                alt={article.image.alt || t("articleImage", {title: article.title})}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 720px"
                className="object-cover"
              />
            </div>

            <NewsPostSummaryAccordion content={article.excerpt} />

            <AdPlacement placement="ARTICLE_TOP" />

            {/* @ts-expect-error RichText converters typing is loose enough for custom heading ids */}
            <RichText data={article.content} className="news-rich-text" converters={richTextConverters} />

            <AdPlacement placement="ARTICLE_MIDDLE" />

            <NewsTopics
              category={article.category}
              tags={article.tags}
              label={t("topics")}
            />

            <AdPlacement placement="ARTICLE_BOTTOM" />

            {nextArticle ? (
              <NewsNextPost article={nextArticle} locale={locale} />
            ) : null}
          </div>

          <aside className="order-3 flex flex-col gap-3 xl:self-stretch">
            <NewsRightRail
              tocItems={tocItems}
              tocTitle={t("onThisPage")}
              categories={categories}
              selectedCategorySlug={article.category.slug}
              locale={locale}
              articleUrl={currentUrl}
              articleTitle={article.title}
              plainText={plainText}
            />
          </aside>
        </div>

        <RelatedNews articles={relatedArticles} locale={locale} />
      </article>
    </>
  );
}
