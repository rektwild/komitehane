import type {MetadataRoute} from "next";

import {
  allowModelTrainingCrawlers,
  isIndexableEnvironment,
  siteConfig,
} from "@/config/site";
import {
  modelTrainingCrawlers,
  searchAndRetrievalCrawlers,
} from "@/lib/seo/crawlers";
import {absoluteUrl} from "@/lib/seo/urls";

export const dynamic = "force-dynamic";

const privatePrefixes = [
  "/api/",
  "/admin/",
  "/dashboard/",
  "/auth/",
  "/private/",
  "/preview/",
] as const;

const privatePaths = [
  "/api",
  "/admin",
  ...privatePrefixes,
  ...siteConfig.locales.flatMap((locale) =>
    privatePrefixes.map((prefix) => `/${locale}${prefix}`)
  ),
];

function publicRule(userAgent: string) {
  return {
    userAgent,
    allow: "/",
    disallow: privatePaths,
  };
}

export default function robots(): MetadataRoute.Robots {
  if (!isIndexableEnvironment) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      publicRule("*"),
      ...searchAndRetrievalCrawlers.map(publicRule),
      ...modelTrainingCrawlers.map((userAgent) =>
        allowModelTrainingCrawlers
          ? publicRule(userAgent)
          : {userAgent, disallow: "/"}
      ),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
