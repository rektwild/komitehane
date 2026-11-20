import type {Metadata} from "next";
import {Fragment} from "react";
import {getLocale, getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {HomeNewsCategorySection} from "@/components/home-news-category-section";
import {HomeToolsCategorySection} from "@/components/home-tools-category-section";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {PageWithAside} from "@/components/layout/page-with-aside";
import {LatestNewsCarousel} from "@/components/news/latest-news-carousel";
import {getLocalizedMetadata} from "@/lib/seo/metadata";
import {getWebPageJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";
import {getHomepageNews} from "@/lib/news/data";
import type {NewsLocale} from "@/lib/news/types";
import {toolCategories} from "@/lib/tools";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.home");

  return getLocalizedMetadata("/", {
    title: t("title"),
    description: t("description"),
    imageAlt: t("imageAlt"),
    socialImageKey: "home",
    absoluteTitle: true,
  });
}

export default async function Home() {
  const [t, metadata] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Metadata.home"),
  ]);
  const locale = (await getLocale()) as NewsLocale;
  const news = await getHomepageNews(locale);
  const pageUrl = absoluteUrl(`/${locale}`);
  // Tool sections are interleaved with news sections; any category that did
  // not get a slot (e.g. only one news category) is appended so every tool
  // category stays linked from the homepage body.
  const remainingToolCategories = toolCategories.slice(
    Math.min(news.sections.length, toolCategories.length),
  );

  return (
    <>
      <PageBreadcrumb items={[{label: t("title")}]} className="shrink-0 py-4" />
      <PageWithAside>
        <div className="flex min-w-0 flex-1 flex-col gap-10 pb-12">
          <JsonLd
            data={getWebPageJsonLd({
              locale,
              url: pageUrl,
              name: metadata("title"),
              description: metadata("description"),
            })}
          />
          <h1 className="sr-only">{t("heading")}</h1>

          <section aria-label={t("latestNewsLabel")} className="min-w-0">
            <LatestNewsCarousel articles={news.latest} locale={locale} />
          </section>

          {news.sections.map((section, index) => (
            <Fragment key={section.category.id}>
              <HomeNewsCategorySection section={section} locale={locale} />
              <HomeToolsCategorySection
                category={toolCategories[index % toolCategories.length]}
                index={index}
              />
            </Fragment>
          ))}

          {remainingToolCategories.map((category, offset) => (
            <HomeToolsCategorySection
              key={category}
              category={category}
              index={news.sections.length + offset}
            />
          ))}
        </div>
      </PageWithAside>
    </>
  );
}
