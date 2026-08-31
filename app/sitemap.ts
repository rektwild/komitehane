import type {MetadataRoute} from "next";

import {getPathname} from "@/i18n/navigation";
import {routing} from "@/i18n/routing";
import {isIndexableEnvironment} from "@/config/site";
import {getAlternateLanguages} from "@/lib/seo/metadata";
import {getNewsSitemapEntries} from "@/lib/news/data";
import {absoluteUrl} from "@/lib/seo/urls";

const indexableRoutes = ["/", "/tools", "/news", "/privacy"] as const satisfies (
  keyof typeof routing.pathnames
)[];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexableEnvironment) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const href of indexableRoutes) {
    const languages = await getAlternateLanguages(href);

    for (const locale of routing.locales) {
      entries.push({
        url: absoluteUrl(await getPathname({href, locale})),
        alternates: {languages},
      });
    }
  }

  const articles = await getNewsSitemapEntries();
  for (const article of articles) {
    const localizedPaths = Object.fromEntries(
      article.translations.map(({locale, slug}) => [
        locale,
        getPathname({
          href: {pathname: "/news/[slug]", params: {slug}},
          locale,
        }),
      ]),
    );
    const languages = Object.fromEntries(
      Object.entries(localizedPaths).map(([locale, pathname]) => [
        locale,
        absoluteUrl(pathname),
      ]),
    );
    if (localizedPaths[routing.defaultLocale]) {
      languages["x-default"] = absoluteUrl(localizedPaths[routing.defaultLocale]);
    }

    for (const {locale} of article.translations) {
      entries.push({
        url: absoluteUrl(localizedPaths[locale]),
        lastModified: new Date(article.updatedAt),
        alternates: {languages},
      });
    }
  }

  return entries;
}
