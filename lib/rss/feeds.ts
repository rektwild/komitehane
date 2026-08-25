import type {Locale} from "next-intl";

import type {PodcastRssItem, RssFeedType, RssItem} from "./types";

export interface RssContentAdapter {
  getBlogItems(locale: Locale): Promise<readonly RssItem[]>;
  getPodcastItems(locale: Locale): Promise<readonly PodcastRssItem[]>;
}

export const emptyRssContentAdapter: RssContentAdapter = {
  async getBlogItems() {
    return [];
  },
  async getPodcastItems() {
    return [];
  },
};

export const rssContentAdapter: RssContentAdapter = emptyRssContentAdapter;

export function getRssFeedPath(
  locale: Locale,
  feedType: RssFeedType,
): string {
  return `/${locale}/feeds/${feedType}.xml`;
}
