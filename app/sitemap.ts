import type {MetadataRoute} from "next";

import {getPathname} from "@/i18n/navigation";
import {routing} from "@/i18n/routing";
import {isIndexableEnvironment} from "@/config/site";
import {getAlternateLanguages} from "@/lib/seo/metadata";
import {getNewsSitemapEntries} from "@/lib/news/data";
import {absoluteUrl} from "@/lib/seo/urls";
import {landingCandidates} from "@/lib/academic/repositories/catalog";
import {academicPath} from "@/lib/academic/seo/paths";
import {tools} from "@/lib/tools";

export const revalidate = 300;

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

  for (const tool of tools) {
    const languages=await getAlternateLanguages(tool.href);
    for (const locale of routing.locales) entries.push({url:absoluteUrl(await getPathname({href:tool.href,locale})),alternates:{languages}});
  }
  const academic=await landingCandidates();
  for (const entry of academic) for (const tool of tools.filter(t=>(t.category==="midterm") === (entry.system==="MIDTERM"))) {
    const paths=Object.fromEntries(routing.locales.map(locale=>[locale,absoluteUrl(academicPath(locale,tool.key,entry.universitySlug,entry.facultySlug,entry.programSlug,entry.classYear))]));
    const languages={...paths,"x-default":paths.tr};
    for (const locale of routing.locales) entries.push({url:paths[locale],alternates:{languages}});
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

  if (entries.length>50000) throw new Error("SITEMAP_CAPACITY_EXCEEDED: configure sitemap sharding before adding more pages");
  return entries;
}
