import type {
  PodcastRssItem,
  RssChannel,
  RssFeedOptions,
  RssItem,
} from "./types";

export const RSS_MAX_ITEMS = 20;
export const RSS_MEDIA_TYPE = "application/rss+xml";
export const RSS_CONTENT_TYPE = `${RSS_MEDIA_TYPE}; charset=utf-8`;

const ATOM_NAMESPACE = "http://www.w3.org/2005/Atom";
const DUBLIN_CORE_NAMESPACE = "http://purl.org/dc/elements/1.1/";
const ITUNES_NAMESPACE = "http://www.itunes.com/dtds/podcast-1.0.dtd";

export class RssValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RssValidationError";
  }
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function createRssXml(options: RssFeedOptions<RssItem>): string {
  return createFeedXml(options, false);
}

export function createPodcastRssXml(
  options: RssFeedOptions<PodcastRssItem>,
): string {
  return createFeedXml(options, true);
}

function createFeedXml<T extends RssItem>(
  options: RssFeedOptions<T>,
  isPodcast: boolean,
): string {
  const channel = validateChannel(options.channel);
  const items = normalizeItems(options.items, options.maxItems, isPodcast);
  const hasAuthors = items.some((item) => Boolean(item.author));
  const namespaceAttributes = [
    `xmlns:atom="${ATOM_NAMESPACE}"`,
    hasAuthors ? `xmlns:dc="${DUBLIN_CORE_NAMESPACE}"` : undefined,
    isPodcast ? `xmlns:itunes="${ITUNES_NAMESPACE}"` : undefined,
  ]
    .filter((attribute): attribute is string => Boolean(attribute))
    .join(" ");

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<rss version="2.0" ${namespaceAttributes}>`,
    "  <channel>",
    `    <title>${escapeXml(channel.title)}</title>`,
    `    <link>${escapeXml(channel.link)}</link>`,
    `    <description>${escapeXml(channel.description)}</description>`,
    `    <language>${escapeXml(channel.language)}</language>`,
    `    <atom:link href="${escapeXml(channel.feedUrl)}" rel="self" type="${RSS_MEDIA_TYPE}" />`,
  ];

  if (channel.copyright) {
    lines.push(`    <copyright>${escapeXml(channel.copyright)}</copyright>`);
  }

  const lastBuildDate = getLastBuildDate(items);

  if (lastBuildDate) {
    lines.push(`    <lastBuildDate>${lastBuildDate}</lastBuildDate>`);
  }

  for (const item of items) {
    lines.push(...renderItem(item, isPodcast));
  }

  lines.push("  </channel>", "</rss>");

  return lines.join("\n");
}

function validateChannel(channel: RssChannel): RssChannel {
  assertNonEmptyString(channel.title, "channel.title");
  assertNonEmptyString(channel.description, "channel.description");
  assertNonEmptyString(channel.language, "channel.language");
  validateHttpUrl(channel.link, "channel.link");
  validateHttpUrl(channel.feedUrl, "channel.feedUrl");

  if (channel.copyright !== undefined) {
    assertNonEmptyString(channel.copyright, "channel.copyright");
  }

  return channel;
}

function normalizeItems<T extends RssItem>(
  items: readonly T[],
  maxItems: number | undefined,
  isPodcast: boolean,
): T[] {
  const itemLimit = maxItems ?? RSS_MAX_ITEMS;

  if (!Number.isInteger(itemLimit) || itemLimit <= 0) {
    throw new RssValidationError("maxItems must be a positive integer.");
  }

  const validatedItems = items.map((item, index) => {
    validateItem(item, index, isPodcast);
    return item;
  });

  return [...validatedItems]
    .sort((left, right) => {
      return right.publishedAt.getTime() - left.publishedAt.getTime();
    })
    .slice(0, itemLimit);
}

function validateItem(
  item: RssItem,
  index: number,
  isPodcast: boolean,
): void {
  const path = `items[${index}]`;

  assertNonEmptyString(item.id, `${path}.id`);
  assertNonEmptyString(item.title, `${path}.title`);
  assertNonEmptyString(item.summary, `${path}.summary`);
  validateHttpUrl(item.url, `${path}.url`);
  validateDate(item.publishedAt, `${path}.publishedAt`);

  if (item.updatedAt !== undefined) {
    validateDate(item.updatedAt, `${path}.updatedAt`);
  }

  if (item.author !== undefined) {
    assertNonEmptyString(item.author, `${path}.author`);
  }

  item.categories?.forEach((category, categoryIndex) => {
    assertNonEmptyString(category, `${path}.categories[${categoryIndex}]`);
  });

  if (!isPodcast) {
    return;
  }

  const podcastItem = item as PodcastRssItem;

  validateHttpUrl(podcastItem.audioUrl, `${path}.audioUrl`);
  assertNonEmptyString(podcastItem.mimeType, `${path}.mimeType`);

  if (!Number.isInteger(podcastItem.fileSize) || podcastItem.fileSize < 0) {
    throw new RssValidationError(
      `${path}.fileSize must be a non-negative integer.`,
    );
  }

  if (!Number.isInteger(podcastItem.duration) || podcastItem.duration < 0) {
    throw new RssValidationError(
      `${path}.duration must be a non-negative integer in seconds.`,
    );
  }
}

function validateHttpUrl(value: string, path: string): void {
  assertNonEmptyString(value, path);

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
  } catch {
    throw new RssValidationError(
      `${path} must be an absolute http(s) URL.`,
    );
  }
}

function validateDate(value: Date, path: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new RssValidationError(`${path} must be a valid Date.`);
  }
}

function assertNonEmptyString(
  value: unknown,
  path: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RssValidationError(`${path} must be a non-empty string.`);
  }
}

function getLastBuildDate(items: readonly RssItem[]): string | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const timestamp = Math.max(
    ...items.map((item) => (item.updatedAt ?? item.publishedAt).getTime()),
  );

  return new Date(timestamp).toUTCString();
}

function renderItem(item: RssItem, isPodcast: boolean): string[] {
  const lines = [
    "    <item>",
    `      <title>${escapeXml(item.title)}</title>`,
    `      <description>${escapeXml(item.summary)}</description>`,
    `      <link>${escapeXml(item.url)}</link>`,
    `      <guid isPermaLink="false">${escapeXml(item.id)}</guid>`,
    `      <pubDate>${item.publishedAt.toUTCString()}</pubDate>`,
  ];

  if (item.author) {
    lines.push(`      <dc:creator>${escapeXml(item.author)}</dc:creator>`);
  }

  for (const category of item.categories ?? []) {
    lines.push(`      <category>${escapeXml(category)}</category>`);
  }

  if (isPodcast) {
    const podcastItem = item as PodcastRssItem;

    lines.push(
      `      <enclosure url="${escapeXml(podcastItem.audioUrl)}" length="${podcastItem.fileSize}" type="${escapeXml(podcastItem.mimeType)}" />`,
      `      <itunes:duration>${formatDuration(podcastItem.duration)}</itunes:duration>`,
    );
  }

  lines.push("    </item>");

  return lines;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
