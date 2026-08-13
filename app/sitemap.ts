import type {MetadataRoute} from "next";

import {getPathname} from "@/i18n/navigation";
import {routing} from "@/i18n/routing";
import {isIndexableEnvironment} from "@/config/site";
import {getAlternateLanguages} from "@/lib/seo/metadata";
import {absoluteUrl} from "@/lib/seo/urls";

const indexableRoutes = ["/"] as const satisfies (keyof typeof routing.pathnames)[];

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

  return entries;
}
