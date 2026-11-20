import "server-only";

import {cache} from "react";
import {unstable_cache} from "next/cache";
import {convertLexicalToPlaintext} from "@payloadcms/richtext-lexical/plaintext";
import {getPayload, type PopulateType, type Where} from "payload";

import configPromise from "@payload-config";
import type {Article} from "@/payload-types";
import type {
  AuthorProfile,
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
} from "@/lib/news/types";

const WORDS_PER_MINUTE = 200;
const PAGE_SIZE = 10;
const LATEST_PAGE_SIZE = 15;
const HOME_CATEGORY_LIMIT = 3;
const TICKER_LIMIT = 8;
const ASIDE_LINKS_LIMIT = 5;

const newsPopulate = {
  users: {name: true, role: true, slug: true},
  media: {
    alt: true,
    filename: true,
    height: true,
    mimeType: true,
    prefix: true,
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

type ArticleTag = NonNullable<Article["tags"]>[number];

function publicWhere(): Where {
  return {
    and: [
      {_status: {equals: "published"}},
      {publishedAt: {less_than_equal: new Date().toISOString()}},
    ],
  };
}

/**
 * Public articles that have a translation in the queried locale. `_status`
 * and `publishedAt` are not localized, so without the localized checks an
 * untranslated article still counts toward totals and pagination (e.g. the
 * English list reported pages that rendered empty).
 */
function publicLocalizedWhere(): Where {
  return {
    and: [
      publicWhere(),
      {slug: {exists: true}},
      {title: {exists: true}},
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
): {name: string; role: AuthorRole; slug: string | null} | null {
  if (!value || typeof value === "number" || !value.name) return null;

  return {
    name: value.name,
    role: normalizeAuthorRole(value.role),
    // Automation accounts never get a public profile page.
    slug: value.role !== "automation" && value.slug ? value.slug : null,
  };
}

function getSummaryFields(article: Article) {
  const category = normalizeCategory(article.category);
  const tags = normalizeTags(article.tags);
  const image = normalizeImage(article.heroImage);
  const author = normalizeAuthor(article.author);

  if (
    !article.title ||
    !article.slug ||
    !article.excerpt ||
    !article.content?.root ||
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
    authorSlug: author.slug,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

function normalizeSummary(article: Article): NewsSummary | null {
  const fields = getSummaryFields(article);
  return fields ? {...fields, readingMinutes: getReadingMinutes(article.content)} : null;
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
    where: publicLocalizedWhere(),
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

/** Request-deduplicated listing lookup shared by metadata and the page. */
export const getCachedNewsListing = cache(
  (
    locale: NewsLocale,
    query: string | undefined,
    category: string | undefined,
    tag: string | undefined,
    page: number,
  ) => getNewsListing({locale, query, category, tag, page}),
);

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
  const base = publicLocalizedWhere();
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
    where: {and: [publicLocalizedWhere(), {slug: {equals: slug}}]},
  });
  const article = result.docs[0];
  if (!article) return null;

  const summary = normalizeSummary(article);
  if (!summary) return null;

  const otherLocale: NewsLocale = locale === "tr" ? "en" : "tr";
  const other = await payload.find({
    collection: "articles",
    locale: otherLocale,
    fallbackLocale: false,
    depth: 1,
    populate: newsPopulate,
    limit: 1,
    overrideAccess: false,
    where: {and: [publicLocalizedWhere(), {id: {equals: article.id}}]},
  });
  const translation = other.docs[0] && getSummaryFields(other.docs[0]);

  return {
    ...summary,
    content: article.content,
    translations: [
      {locale, slug: summary.slug},
      ...(translation ? [{locale: otherLocale, slug: translation.slug}] : []),
    ],
  };
});

export async function getRelatedNewsArticles({
  locale,
  slug,
  categorySlug,
  limit = 3,
}: RelatedNewsParams): Promise<NewsSummary[]> {
  const payload = await getPayload({config: configPromise});
  const base = publicLocalizedWhere();
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
  const base = publicLocalizedWhere();
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
  const base = publicLocalizedWhere();

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
  const entries = new Map<number, NewsSitemapEntry>();
  for (const locale of ["tr", "en"] as const) {
    const result = await payload.find({
      collection: "articles",
      locale,
      fallbackLocale: false,
      depth: 1,
      populate: newsPopulate,
      pagination: false,
      overrideAccess: false,
      sort: "-updatedAt",
      where: publicLocalizedWhere(),
    });
    for (const article of result.docs) {
      if (!getSummaryFields(article)) continue;
      const entry = entries.get(article.id) ?? {
        id: article.id, updatedAt: article.updatedAt, translations: [],
      };
      entry.translations.push({
        locale,
        slug: article.slug,
        authorSlug: normalizeAuthor(article.author)?.slug ?? null,
      });
      entries.set(article.id, entry);
    }
  }
  return [...entries.values()];
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
      where: publicLocalizedWhere(),
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
      where: publicLocalizedWhere(),
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

const AUTHOR_ARTICLES_LIMIT = 48;
const newsLocales = ["tr", "en"] as const satisfies readonly NewsLocale[];

function authorArticlesWhere(authorId: number): Where {
  return {and: [publicLocalizedWhere(), {author: {equals: authorId}}]};
}

/**
 * Public author profile for one locale. Returns null for unknown slugs,
 * automation accounts, and authors without a public article in that locale,
 * so profile pages never render empty or advertise missing translations.
 */
export const getAuthorProfile = cache(async (
  locale: NewsLocale,
  slug: string,
): Promise<AuthorProfile | null> => {
  const payload = await getPayload({config: configPromise});
  const users = await payload.find({
    collection: "users",
    locale,
    fallbackLocale: false,
    depth: 0,
    limit: 1,
    overrideAccess: false,
    select: {name: true, role: true, slug: true, bio: true},
    where: {
      and: [{slug: {equals: slug}}, {role: {not_equals: "automation"}}],
    },
  });
  const user = users.docs[0];
  if (!user?.name || !user.slug) return null;

  const result = await payload.find({
    collection: "articles",
    locale,
    fallbackLocale: false,
    depth: 1,
    limit: AUTHOR_ARTICLES_LIMIT,
    populate: newsPopulate,
    overrideAccess: false,
    sort: "-publishedAt",
    where: authorArticlesWhere(user.id),
  });
  const articles = normalizeSummaries(result.docs);
  if (articles.length === 0) return null;

  const locales: NewsLocale[] = [];
  for (const candidate of newsLocales) {
    if (candidate === locale) {
      locales.push(candidate);
      continue;
    }

    const other = await payload.find({
      collection: "articles",
      locale: candidate,
      fallbackLocale: false,
      depth: 1,
      limit: AUTHOR_ARTICLES_LIMIT,
      populate: newsPopulate,
      overrideAccess: false,
      where: authorArticlesWhere(user.id),
    });
    if (other.docs.some((article) => getSummaryFields(article))) {
      locales.push(candidate);
    }
  }

  const bio = typeof user.bio === "string" && user.bio.trim() ? user.bio.trim() : null;

  return {
    id: user.id,
    name: user.name,
    slug: user.slug,
    role: normalizeAuthorRole(user.role),
    bio,
    articles,
    locales,
  };
});

