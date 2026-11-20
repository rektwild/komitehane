import type {Metadata} from "next";
import {NewspaperIcon} from "lucide-react";
import {notFound} from "next/navigation";
import {getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {PageWithAside} from "@/components/layout/page-with-aside";
import {ArticleCard} from "@/components/news/article-card";
import {getPathname} from "@/i18n/navigation";
import {getAuthorProfile} from "@/lib/news/data";
import type {AuthorProfile, NewsLocale} from "@/lib/news/types";
import {getDynamicLocalizedMetadata} from "@/lib/seo/metadata";
import {getAuthorProfileJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";

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

      <PageWithAside>
        <div className="flex min-w-0 flex-1 flex-col gap-8 pb-8">
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

          <header className="flex min-w-0 items-start gap-5 border-b border-border/60 pb-6">
            <div
              aria-hidden="true"
              className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-medium text-foreground"
            >
              {profile.name.trim().charAt(0).toLocaleUpperCase(locale)}
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {profile.name}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">{roleLabel}</p>
              {profile.bio ? (
                <p className="max-w-3xl text-pretty text-base leading-7 text-muted-foreground">
                  {profile.bio}
                </p>
              ) : null}
            </div>
          </header>

          <section aria-labelledby="author-articles-title" className="min-w-0">
            <h2
              id="author-articles-title"
              className="text-2xl font-bold leading-tight tracking-tight text-foreground"
            >
              {t("articlesTitle")}
            </h2>
            <div className="mt-4 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profile.articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  locale={locale}
                  variant="list"
                  readingTimeLabel={newsT("readingTime", {
                    minutes: String(article.readingMinutes),
                  })}
                />
              ))}
            </div>
          </section>
        </div>
      </PageWithAside>
    </>
  );
}
