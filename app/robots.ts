import type {MetadataRoute} from "next";

import {
  allowModelTrainingCrawlers,
  isIndexableEnvironment,
  siteConfig,
} from "@/config/site";
import {absoluteUrl} from "@/lib/seo/urls";

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

  const searchCrawlers = [
    "Googlebot",
    "bingbot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "PerplexityBot",
    "Perplexity-User",
    "Claude-SearchBot",
    "Claude-User",
  ];

  const trainingCrawlers = ["GPTBot", "ClaudeBot", "Google-Extended"];

  return {
    rules: [
      publicRule("*"),
      ...searchCrawlers.map(publicRule),
      ...trainingCrawlers.map((userAgent) =>
        allowModelTrainingCrawlers
          ? publicRule(userAgent)
          : {userAgent, disallow: "/"}
      ),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
