import type {Locale} from "next-intl";

import type {PodcastRssItem, RssFeedType, RssItem} from "./types";

/** Implemented server-side in `lib/rss/content.ts`. */
export interface RssContentAdapter {
  getNewsItems(locale: Locale): Promise<readonly RssItem[]>;
  getPodcastItems(locale: Locale): Promise<readonly PodcastRssItem[]>;
}

export function getRssFeedPath(
  locale: Locale,
  feedType: RssFeedType,
): string {
  return `/${locale}/feeds/${feedType}.xml`;
}
