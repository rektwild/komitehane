import type {NewsFeedEntry} from "@/lib/news/types";
import type {RssItem} from "@/lib/rss/types";

/**
 * Maps a cached news entry to an RSS item. `articleUrl` is the absolute,
 * localized article URL (built by the caller with next-intl's getPathname),
 * which keeps this mapping pure and testable outside Next.
 */
export function toRssItem(entry: NewsFeedEntry, articleUrl: string): RssItem {
  return {
    id: `article-${entry.id}`,
    title: entry.title,
    summary: entry.excerpt,
    url: articleUrl,
    publishedAt: new Date(entry.publishedAt),
    updatedAt: new Date(entry.updatedAt),
    author: entry.authorName,
    categories: [entry.categoryName],
  };
}
