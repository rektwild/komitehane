import {hasLocale} from "next-intl";
import {getTranslations} from "next-intl/server";

import {isIndexableEnvironment} from "@/config/site";
import {getPathname} from "@/i18n/navigation";
import {routing} from "@/i18n/routing";
import {createRssXml, getRssFeedPath, RSS_CONTENT_TYPE} from "@/lib/rss";
import {rssContentAdapter} from "@/lib/rss/content";
import {absoluteUrl} from "@/lib/seo/urls";

const RETRY_AFTER_SECONDS = 300;

/**
 * Per-locale news feed. The handler stays dynamic (the Next 16 GET default)
 * so builds never need the database; data is cached by unstable_cache under
 * the "news-feed" tag, which article publish hooks revalidate, and the CDN
 * caches the response via Cache-Control.
 */
export async function GET(
  _request: Request,
  {params}: RouteContext<"/[locale]/feeds/news.xml">,
) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    return new Response("Not found", {status: 404});
  }

  let items;
  try {
    items = await rssContentAdapter.getNewsItems(locale);
  } catch (error) {
    console.warn(
      `News feed unavailable: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return new Response("Service unavailable", {
      status: 503,
      headers: {"Retry-After": String(RETRY_AFTER_SECONDS)},
    });
  }

  const t = await getTranslations({locale, namespace: "Feed"});
  const xml = createRssXml({
    channel: {
      title: t("title"),
      description: t("description"),
      link: absoluteUrl(getPathname({href: "/news", locale})),
      feedUrl: absoluteUrl(getRssFeedPath(locale, "news")),
      language: locale,
      copyright: t("copyright", {year: String(new Date().getFullYear())}),
    },
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": RSS_CONTENT_TYPE,
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
      ...(isIndexableEnvironment ? {} : {"X-Robots-Tag": "noindex"}),
    },
  });
}
