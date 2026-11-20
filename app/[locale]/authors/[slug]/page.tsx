import type {Metadata} from "next";
import {NewspaperIcon} from "lucide-react";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {ArticleCard} from "@/components/news/article-card";
import {ArticleListRow} from "@/components/news/article-list-row";
import {AuthorArticles} from "@/components/news/author-articles";
import {getPathname} from "@/i18n/navigation";
import {getAuthorProfile} from "@/lib/news/data";
import type {AuthorProfile, NewsLocale} from "@/lib/news/types";
import {getDynamicLocalizedMetadata} from "@/lib/seo/metadata";
import {getAuthorProfileJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";
import {typography} from "@/lib/typography";
import {cn} from "@/lib/utils";

type AuthorPageProps = {
  params: Promise<{locale: NewsLocale; slug: string}>;
};

function getAuthorPath(locale: NewsLocale, slug: string): string {
  return getPathname({href: {pathname: "/authors/[slug]", params: {slug}}, locale});
}

function getAuthorPaths(profile: AuthorProfile): Partial<Record<NewsLocale, string>> {
  return Object.fromEntries(
    profile.locales.map((locale) => [locale, getAuthorPath(locale, profile.slug)]),
  );
}

async function loadProfile(params: AuthorPageProps["params"]) {
  const {locale, slug} = await params;
  const profile = await getAuthorProfile(locale, slug);
  if (!profile) notFound();

  return {locale, profile};
}

export async function generateMetadata({params}: AuthorPageProps): Promise<Metadata> {
  const {locale, profile} = await loadProfile(params);
  const t = await getTranslations("Authors");

  return getDynamicLocalizedMetadata({
    locale,
    canonicalPath: getAuthorPath(locale, profile.slug),
    localizedPaths: getAuthorPaths(profile),
    title: t("metaTitle", {name: profile.name}),
    description: profile.bio ?? t("metaDescription", {name: profile.name}),
    type: "website",
  });
}

export default async function AuthorPage({params}: AuthorPageProps) {
  const {locale, profile} = await loadProfile(params);
  const [t, newsT] = await Promise.all([
    getTranslations("Authors"),
    getTranslations("NewsPage"),
  ]);
  const pageUrl = absoluteUrl(getAuthorPath(locale, profile.slug));
  const newsUrl = absoluteUrl(getPathname({href: "/news", locale}));
  const roleLabel = t(`roles.${profile.role}`);
  const description = profile.bio ?? t("metaDescription", {name: profile.name});

  return (
    <>
      <PageBreadcrumb
        items={[
          {label: newsT("title"), href: "/news", icon: NewspaperIcon},
          {label: profile.name},
        ]}
        className="shrink-0 py-4"
      />

      <div className="flex min-w-0 flex-1 flex-col pb-12">
        <JsonLd
          data={getAuthorProfileJsonLd({
            locale,
            url: pageUrl,
            name: profile.name,
            pageTitle: t("metaTitle", {name: profile.name}),
            description,
            jobTitle: roleLabel,
            bio: profile.bio,
            breadcrumbItems: [
              {name: newsT("title"), url: newsUrl},
              {name: profile.name, url: pageUrl},
            ],
          })}
        />

        <header className="flex min-w-0 items-center gap-5 border-b border-border/60 pt-4 pb-10 sm:gap-8">
          <div
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted text-3xl font-semibold text-foreground sm:size-28 sm:text-4xl"
          >
            {profile.name.trim().charAt(0).toLocaleUpperCase(locale)}
          </div>
          <div className="min-w-0 space-y-1.5">
            <h1 className={typography.display}>{profile.name}</h1>
            <p className="text-base text-muted-foreground sm:text-lg">{roleLabel}</p>
            {profile.bio ? (
              <p className={cn(typography.lead, "max-w-3xl pt-1")}>{profile.bio}</p>
            ) : null}
            <p className={cn(typography.meta, "pt-1 sm:text-sm")}>
              {t("articleCount", {count: profile.articles.length})}
            </p>
          </div>
        </header>

        <section aria-labelledby="author-articles-title" className="min-w-0 pt-8">
          <h2 id="author-articles-title" className="sr-only">
            {t("articlesTitle")}
          </h2>
          <AuthorArticles
            items={profile.articles.map((article) => ({
              id: article.id,
              searchText: [article.title, article.excerpt, article.category.name].join(" "),
              card: (
                <ArticleCard
                  article={article}
                  locale={locale}
                  variant="list"
                  readingTimeLabel={newsT("readingTime", {
                    minutes: String(article.readingMinutes),
                  })}
                />
              ),
              row: <ArticleListRow article={article} locale={locale} />,
            }))}
          />
        </section>
      </div>
    </>
  );
}
