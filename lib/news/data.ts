import "server-only";

import {cache} from "react";
import {unstable_cache} from "next/cache";
import {convertLexicalToPlaintext} from "@payloadcms/richtext-lexical/plaintext";
import {getPayload, type PopulateType, type Where} from "payload";

import configPromise from "@payload-config";
import type {Article} from "@/payload-types";
import type {
  AuthorRole,
  HomeNewsResult,
  NewsCategory,
  NewsDetail,
  NewsImage,
  NewsListingParams,
  NewsListingResult,
  NewsLocale,
  NewsSitemapEntry,
  NewsSummary,
  NewsTag,
  NewsTickerItem,
  NextNewsParams,
  RelatedNewsParams,
  NewsTranslation,
} from "@/lib/news/types";

const WORDS_PER_MINUTE = 200;
const PAGE_SIZE = 10;
const LATEST_PAGE_SIZE = 15;
const HOME_CATEGORY_LIMIT = 3;
const TICKER_LIMIT = 8;
const ASIDE_LINKS_LIMIT = 5;

const newsPopulate = {
  users: {name: true, role: true},
  media: {
    alt: true,
    filename: true,
    height: true,
    photographerName: true,
    photographerUrl: true,
    sizes: {hero: {height: true, url: true, width: true}},
    sourcePageUrl: true,
    sourcePhotoId: true,
    sourceProvider: true,
    url: true,
    width: true,
  },
  categories: {name: true, slug: true},
  tags: {name: true, slug: true},
} satisfies PopulateType;

type LocalizedString = Partial<Record<NewsLocale, string | null>>;
type LocalizedArticle = Omit<Article, "title" | "slug" | "excerpt"> & {
  title?: LocalizedString;
  slug?: LocalizedString;
  excerpt?: LocalizedString;
};
type ArticleTag = NonNullable<Article["tags"]>[number];

function publicWhere(): Where {
  return {
    and: [
      {_status: {equals: "published"}},
      {publishedAt: {less_than_equal: new Date().toISOString()}},
    ],
  };
}

function getReadingMinutes(content: Article["content"]): number {
  const text = convertLexicalToPlaintext({data: content});
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function normalizeCategory(value: Article["category"]): NewsCategory | null {
  if (!value || typeof value === "number") return null;
  if (!value.name || !value.slug) return null;

  return {id: value.id, name: value.name, slug: value.slug};
}

function normalizeTag(value: ArticleTag): NewsTag | null {
  if (!value || typeof value === "number" || !value.name || !value.slug) return null;

  return {id: value.id, name: value.name, slug: value.slug};
}

function normalizeTags(value: Article["tags"]): NewsTag[] {
  if (!Array.isArray(value)) return [];

  const tags = new Map<number, NewsTag>();
  for (const item of value) {
    const tag = normalizeTag(item);
    if (tag) tags.set(tag.id, tag);
  }

  return [...tags.values()];
}

function normalizeImage(value: Article["heroImage"]): NewsImage | null {
  if (!value || typeof value === "number" || !value.url) return null;

  const hero = value.sizes?.hero;
  return {
    url: hero?.url || value.url,
    alt: value.alt,
    width: hero?.width || value.width || 1440,
    height: hero?.height || value.height || 810,
  };
}

function normalizeAuthorRole(value: unknown): AuthorRole {
  if (value === "founder" || value === "editor" || value === "writer") return value;
  if (value === "automation") return "writer";
  return "writer";
}

function normalizeAuthor(
  value: Article["author"],
): {name: string; role: AuthorRole} | null {
  if (!value || typeof value === "number" || !value.name) return null;

  return {
    name: value.name,
    role: normalizeAuthorRole(value.role),
  };
}

function normalizeSummary(article: Article): NewsSummary | null {
  const category = normalizeCategory(article.category);
  const tags = normalizeTags(article.tags);
  const image = normalizeImage(article.heroImage);
  const author = normalizeAuthor(article.author);

  if (
    !article.title ||
    !article.slug ||
    !article.excerpt ||
    !author ||
    !article.publishedAt ||
    !category ||
    !image
  ) {
    return null;
  }

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    image,
    category,
    tags,
    authorName: author.name,
    authorRole: author.role,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    readingMinutes: getReadingMinutes(article.content),
  };
}

function normalizeSummaries(articles: Article[]): NewsSummary[] {
  return articles.flatMap((article) => {
    const normalized = normalizeSummary(article);
    return normalized ? [normalized] : [];
  });
}

export async function getHomepageNews(
  locale: NewsLocale,
): Promise<HomeNewsResult> {
  const payload = await getPayload({config: configPromise});
  const result = await payload.find({
    collection: "articles",
    locale,
    depth: 1,
    pagination: false,
    populate: newsPopulate,
    overrideAccess: false,
    sort: "-publishedAt",
    where: publicWhere(),
  });
  const summaries = normalizeSummaries(result.docs);
  const sections = new Map<number, HomeNewsResult["sections"][number]>();

  for (const article of summaries) {
    const existing = sections.get(article.category.id);
    if (existing) {
      if (existing.articles.length < HOME_CATEGORY_LIMIT) {
        existing.articles.push(article);
      }
      continue;
    }

    sections.set(article.category.id, {
      category: article.category,
      articles: [article],
    });
  }

  return {
    latest: summaries.slice(0, LATEST_PAGE_SIZE),
    sections: [...sections.values()],
  };
}

function normalizeTranslations(article: LocalizedArticle): NewsTranslation[] {
  if (
    !article.title ||
    typeof article.title === "string" ||
    !article.slug ||
    typeof article.slug === "string" ||
    !article.excerpt ||
    typeof article.excerpt === "string"
  ) {
    return [];
  }

  return (["tr", "en"] as const).flatMap((locale) => {
    const title = article.title?.[locale];
    const slug = article.slug?.[locale];
    const excerpt = article.excerpt?.[locale];

    return typeof title === "string" &&
      title.trim() &&
      typeof slug === "string" &&
      slug.trim() &&
      typeof excerpt === "string" &&
      excerpt.trim()
      ? [{locale, slug: slug.trim()}]
      : [];
  });
}

export async function getNewsListing({
  locale,
  query = "",
  category,
  tag,
  page = 1,
}: NewsListingParams): Promise<NewsListingResult> {
  const payload = await getPayload({config: configPromise});
  const normalizedQuery = query.trim().slice(0, 120);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const base = publicWhere();
  const filters: Where[] = [base];

  if (category) {
    const categoryResult = await payload.find({
      collection: "categories",
      locale,
      limit: 1,
      overrideAccess: false,
      where: {slug: {equals: category}},
    });
    const selectedCategory = categoryResult.docs[0];
    filters.push({category: {equals: selectedCategory?.id ?? -1}});
  }

  if (tag) {
    const tagResult = await payload.find({
      collection: "tags",
      locale,
      limit: 1,
      overrideAccess: false,
      where: {slug: {equals: tag}},
    });
    filters.push({tags: {in: tagResult.docs.length ? [tagResult.docs[0].id] : [-1]}});
  }

  if (normalizedQuery) {
    const [matchingCategories, matchingTags] = await Promise.all([
      payload.find({
        collection: "categories",
        locale,
        pagination: false,
        overrideAccess: false,
        where: {name: {contains: normalizedQuery}},
      }),
      payload.find({
        collection: "tags",
        locale,
        pagination: false,
        overrideAccess: false,
        where: {name: {contains: normalizedQuery}},
      }),
    ]);

    filters.push({
      or: [
        {title: {contains: normalizedQuery}},
        {excerpt: {contains: normalizedQuery}},
        ...(matchingCategories.docs.length
          ? [{category: {in: matchingCategories.docs.map((item) => item.id)}}]
          : []),
        ...(matchingTags.docs.length
          ? [{tags: {in: matchingTags.docs.map((item) => item.id)}}]
          : []),
      ],
    });
  }

  const [listing, latest, categoryArticles] =
    await Promise.all([
      payload.find({
        collection: "articles",
        locale,
        depth: 1,
        limit: PAGE_SIZE,
        page: safePage,
        populate: newsPopulate,
        overrideAccess: false,
        sort: "-publishedAt",
        where: {and: filters},
      }),
      payload.find({
        collection: "articles",
        locale,
        depth: 1,
        limit: LATEST_PAGE_SIZE,
        populate: newsPopulate,
        overrideAccess: false,
        sort: "-publishedAt",
        where: base,
      }),
      payload.find({
        collection: "articles",
        locale,
        depth: 1,
        pagination: false,
        populate: newsPopulate,
        overrideAccess: false,
        sort: "-publishedAt",
        where: base,
      }),
    ]);

  const categories = new Map<number, NewsCategory>();
  const tags = new Map<number, NewsTag>();
  for (const article of categoryArticles.docs) {
    const normalized = normalizeCategory(article.category);
    if (normalized) categories.set(normalized.id, normalized);
    for (const tag of normalizeTags(article.tags)) tags.set(tag.id, tag);
  }

  return {
    latest: normalizeSummaries(latest.docs),
    articles: normalizeSummaries(listing.docs),
    categories: [...categories.values()].sort((a, b) =>
      a.name.localeCompare(b.name, locale),
    ),
    tags: [...tags.values()].sort((a, b) => a.name.localeCompare(b.name, locale)),
    page: listing.page ?? safePage,
    totalPages: listing.totalPages,
    totalDocs: listing.totalDocs,
  };
}

export const getNewsArticle = cache(async function getNewsArticle(
  locale: NewsLocale,
  slug: string,
): Promise<NewsDetail | null> {
  const payload = await getPayload({config: configPromise});
  const result = await payload.find({
    collection: "articles",
    locale,
    depth: 1,
    limit: 1,
    populate: newsPopulate,
    overrideAccess: false,
    where: {and: [publicWhere(), {slug: {equals: slug}}]},
  });
  const article = result.docs[0];
  if (!article) return null;

  const summary = normalizeSummary(article);
  if (!summary) return null;

  const localized = (await payload.findByID({
    collection: "articles",
    id: article.id,
    locale: "all",
    depth: 0,
    overrideAccess: false,
  })) as unknown as LocalizedArticle;

  return {
    ...summary,
    content: article.content,
    translations: normalizeTranslations(localized),
  };
});

export async function getRelatedNewsArticles({
  locale,
  slug,
  categorySlug,
  limit = 3,
}: RelatedNewsParams): Promise<NewsSummary[]> {
  const payload = await getPayload({config: configPromise});
  const base = publicWhere();
  const excludeCurrent = {slug: {not_in: [slug]}};

  let categoryId: number | null = null;
  if (categorySlug) {
    const categoryResult = await payload.find({
      collection: "categories",
      locale,
      limit: 1,
      overrideAccess: false,
      where: {slug: {equals: categorySlug}},
    });
    categoryId = categoryResult.docs[0]?.id ?? null;
  }

  const related = new Map<number, NewsSummary>();

  if (categoryId !== null) {
    const sameCategory = await payload.find({
      collection: "articles",
      locale,
      depth: 1,
      limit,
      populate: newsPopulate,
      overrideAccess: false,
      sort: "-publishedAt",
      where: {
        and: [base, excludeCurrent, {category: {equals: categoryId}}],
      },
    });

    for (const summary of normalizeSummaries(sameCategory.docs)) {
      if (related.size >= limit) break;
      related.set(summary.id, summary);
    }
  }

  if (related.size < limit) {
    const excludeIds = [...related.keys()];
    const latest = await payload.find({
      collection: "articles",
      locale,
      depth: 1,
      limit,
      populate: newsPopulate,
      overrideAccess: false,
      sort: "-publishedAt",
      where: {
        and: [
          base,
          excludeCurrent,
          ...(excludeIds.length ? [{id: {not_in: excludeIds}}] : []),
        ],
      },
    });

    for (const summary of normalizeSummaries(latest.docs)) {
      if (related.size >= limit) break;
      related.set(summary.id, summary);
    }
  }

  return [...related.values()].slice(0, limit);
}

export async function getNewsCategories(locale: NewsLocale): Promise<NewsCategory[]> {
  const payload = await getPayload({config: configPromise});
  const base = publicWhere();
  const result = await payload.find({
    collection: "articles",
    locale,
    depth: 1,
    pagination: false,
    populate: newsPopulate,
    overrideAccess: false,
    sort: "-publishedAt",
    where: base,
  });

  const categories = new Map<number, NewsCategory>();
  for (const article of result.docs) {
    const normalized = normalizeCategory(article.category);
    if (normalized) categories.set(normalized.id, normalized);
  }

  return [...categories.values()].sort((a, b) =>
    a.name.localeCompare(b.name, locale),
  );
}

export async function getNextNewsArticle({
  locale,
  slug,
  publishedAt,
}: NextNewsParams): Promise<NewsSummary | null> {
  const payload = await getPayload({config: configPromise});
  const base = publicWhere();

  // Find the chronologically next (older) published article.
  // Supabase-style "Next post" points to the next item in reverse-chronological order.
  const nextOlder = await payload.find({
    collection: "articles",
    locale,
    depth: 1,
    limit: 1,
    populate: newsPopulate,
    overrideAccess: false,
    sort: "-publishedAt",
    where: {
      and: [base, {slug: {not_in: [slug]}}, {publishedAt: {less_than: publishedAt}}],
    },
  });

  const olderSummary = nextOlder.docs[0] ? normalizeSummary(nextOlder.docs[0]) : null;
  if (olderSummary) return olderSummary;

  // Fallback: if no older post (oldest article), show the newest other article
  // so the card never appears empty unnecessarily.
  const fallback = await payload.find({
    collection: "articles",
    locale,
    depth: 1,
    limit: 1,
    populate: newsPopulate,
    overrideAccess: false,
    sort: "-publishedAt",
    where: {
      and: [base, {slug: {not_in: [slug]}}],
    },
  });

  return fallback.docs[0] ? normalizeSummary(fallback.docs[0]) : null;
}

export async function getNewsSitemapEntries(): Promise<NewsSitemapEntry[]> {
  const payload = await getPayload({config: configPromise});
  const result = await payload.find({
    collection: "articles",
    locale: "all",
    depth: 0,
    pagination: false,
    overrideAccess: false,
    sort: "-updatedAt",
    where: publicWhere(),
  });

  return (result.docs as unknown as LocalizedArticle[]).flatMap((article) => {
    const translations = normalizeTranslations(article);
    return translations.length
      ? [{id: article.id, updatedAt: article.updatedAt, translations}]
      : [];
  });
}

async function fetchNewsTickerItems(
  locale: NewsLocale,
): Promise<NewsTickerItem[]> {
  try {
    const payload = await getPayload({config: configPromise});
    const result = await payload.find({
      collection: "articles",
      locale,
      depth: 0,
      pagination: false,
      limit: TICKER_LIMIT,
      sort: "-publishedAt",
      overrideAccess: false,
      where: publicWhere(),
    });

    const items: NewsTickerItem[] = [];
    for (const article of result.docs) {
      if (
        typeof article.title === "string" &&
        article.title.trim() &&
        typeof article.slug === "string" &&
        article.slug.trim()
      ) {
        items.push({title: article.title.trim(), slug: article.slug.trim()});
      }
      if (items.length >= TICKER_LIMIT) break;
    }
    return items;
  } catch {
    return [];
  }
}

const getCachedTickerItems = unstable_cache(
  async (locale: NewsLocale): Promise<NewsTickerItem[]> =>
    fetchNewsTickerItems(locale),
  ["news-ticker"],
  {revalidate: 60, tags: ["news-ticker"]},
);

export async function getNewsTickerItems(
  locale: NewsLocale,
): Promise<NewsTickerItem[]> {
  return getCachedTickerItems(locale);
}

async function fetchLatestNewsLinks(
  locale: NewsLocale,
): Promise<NewsTickerItem[]> {
  try {
    const payload = await getPayload({config: configPromise});
    const result = await payload.find({
      collection: "articles",
      locale,
      depth: 0,
      limit: ASIDE_LINKS_LIMIT,
      sort: "-publishedAt",
      overrideAccess: false,
      where: publicWhere(),
    });

    const items: NewsTickerItem[] = [];
    for (const article of result.docs) {
      if (
        typeof article.title === "string" &&
        article.title.trim() &&
        typeof article.slug === "string" &&
        article.slug.trim()
      ) {
        items.push({title: article.title.trim(), slug: article.slug.trim()});
      }
      if (items.length >= ASIDE_LINKS_LIMIT) break;
    }
    return items;
  } catch {
    return [];
  }
}

const getCachedLatestNewsLinks = unstable_cache(
  async (locale: NewsLocale): Promise<NewsTickerItem[]> =>
    fetchLatestNewsLinks(locale),
  ["news-latest-links"],
  {revalidate: 60, tags: ["news-latest-links"]},
);

export async function getLatestNewsLinks(
  locale: NewsLocale,
): Promise<NewsTickerItem[]> {
  return getCachedLatestNewsLinks(locale);
}
