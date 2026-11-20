import type {Metadata} from "next";
import {Fragment} from "react";
import {getLocale, getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {HomeNewsCategorySection} from "@/components/home-news-category-section";
import {HomeToolsCategorySection} from "@/components/home-tools-category-section";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {PageWithAside} from "@/components/layout/page-with-aside";
import {LatestNewsCarousel} from "@/components/news/latest-news-carousel";
import {Button} from "@/components/ui/button";
import {Link} from "@/i18n/navigation";
import {getLocalizedMetadata} from "@/lib/seo/metadata";
import {getWebPageJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";
import {getHomepageNews} from "@/lib/news/data";
import type {NewsLocale} from "@/lib/news/types";
import {toolCategories, tools} from "@/lib/tools";

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
  const [t, metadata, toolsT] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Metadata.home"),
    getTranslations("Tools"),
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
          <header className="flex min-w-0 flex-col gap-4">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("heading")}
            </h1>
            <p className="max-w-3xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {t("intro")}
            </p>
            <nav aria-label={t("quickLinksLabel")}>
              <ul className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <li key={tool.key}>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={tool.href} />}
                    >
                      {toolsT(`items.${tool.key}.title`)}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

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
