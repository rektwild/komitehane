import type {Locale} from "next-intl";

export type RssFeedType = "blog" | "podcast";

export interface RssChannel {
  title: string;
  description: string;
  link: string;
  feedUrl: string;
  language: string;
  copyright?: string;
}

export interface RssItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
  updatedAt?: Date;
  author?: string;
  categories?: readonly string[];
}

export interface PodcastRssItem extends RssItem {
  audioUrl: string;
  fileSize: number;
  mimeType: string;
  duration: number;
}

export interface RssFeedOptions<T extends RssItem> {
  channel: RssChannel;
  items: readonly T[];
  maxItems?: number;
}

export type RssLocale = Locale;
