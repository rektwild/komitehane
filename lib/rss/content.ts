import "server-only";

import {getPathname} from "@/i18n/navigation";
import {getNewsFeedEntries} from "@/lib/news/data";
import {toRssItem} from "@/lib/news/feed";
import type {RssContentAdapter} from "@/lib/rss/feeds";
import {absoluteUrl} from "@/lib/seo/urls";

export const rssContentAdapter: RssContentAdapter = {
  async getNewsItems(locale) {
    const entries = await getNewsFeedEntries(locale);

    return entries.map((entry) =>
      toRssItem(
        entry,
        absoluteUrl(
          getPathname({
            href: {pathname: "/news/[slug]", params: {slug: entry.slug}},
            locale,
          }),
        ),
      ),
    );
  },
  async getPodcastItems() {
    return [];
  },
};
