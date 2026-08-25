import "server-only";

import {convertLexicalToPlaintext} from "@payloadcms/richtext-lexical/plaintext";
import {getPayload, type Where} from "payload";

import configPromise from "@payload-config";
import type {Article} from "@/payload-types";
import type {
  AuthorRole,
  NewsCategory,
  NewsDetail,
  NewsImage,
  NewsListingParams,
  NewsListingResult,
  NewsLocale,
  NewsSitemapEntry,
  NewsSummary,
  NextNewsParams,
  RelatedNewsParams,
  NewsTranslation,
} from "@/lib/news/types";

const WORDS_PER_MINUTE = 200;
const PAGE_SIZE = 10;

type LocalizedString = Partial<Record<NewsLocale, string | null>>;
type LocalizedArticle = Omit<Article, "slug"> & {slug?: LocalizedString};

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

function normalizeAuthorRole(value: Article["authorRole"]): AuthorRole {
  if (value === "founder" || value === "editor" || value === "writer") return value;
  return "writer";
}

function normalizeSummary(article: Article): NewsSummary | null {
  const category = normalizeCategory(article.category);
  const image = normalizeImage(article.heroImage);

  if (
    !article.title ||
    !article.slug ||
    !article.excerpt ||
    !article.authorName ||
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
    authorName: article.authorName,
    authorRole: normalizeAuthorRole(article.authorRole),
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

function normalizeTranslations(article: LocalizedArticle): NewsTranslation[] {
  if (!article.slug || typeof article.slug === "string") return [];

  return (["tr", "en"] as const).flatMap((locale) => {
    const slug = article.slug?.[locale];
    return typeof slug === "string" && slug ? [{locale, slug}] : [];
  });
}

export async function getNewsListing({
  locale,
  query = "",
  category,
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

  if (normalizedQuery) {
    const matchingCategories = await payload.find({
      collection: "categories",
      locale,
      pagination: false,
      overrideAccess: false,
      where: {name: {contains: normalizedQuery}},
    });

    filters.push({
      or: [
        {title: {contains: normalizedQuery}},
        {excerpt: {contains: normalizedQuery}},
        ...(matchingCategories.docs.length
          ? [{category: {in: matchingCategories.docs.map((item) => item.id)}}]
          : []),
      ],
    });
  }

  const [listing, latest, trending, popular, categoryArticles] =
    await Promise.all([
      payload.find({
        collection: "articles",
        locale,
        depth: 1,
        limit: PAGE_SIZE,
        page: safePage,
        overrideAccess: false,
        sort: "-publishedAt",
        where: {and: filters},
      }),
      payload.find({
        collection: "articles",
        locale,
        depth: 1,
        limit: 10,
        overrideAccess: false,
        sort: "-publishedAt",
        where: base,
      }),
      payload.find({
        collection: "articles",
        locale,
        depth: 1,
        limit: 3,
        overrideAccess: false,
        sort: ["trendingOrder", "-publishedAt"],
        where: {and: [base, {isTrending: {equals: true}}]},
      }),
      payload.find({
        collection: "articles",
        locale,
        depth: 1,
        limit: 3,
        overrideAccess: false,
        sort: ["popularOrder", "-publishedAt"],
        where: {and: [base, {isPopular: {equals: true}}]},
      }),
      payload.find({
        collection: "articles",
        locale,
        depth: 1,
        pagination: false,
        overrideAccess: false,
        sort: "-publishedAt",
        where: base,
      }),
    ]);

  const categories = new Map<number, NewsCategory>();
  for (const article of categoryArticles.docs) {
    const normalized = normalizeCategory(article.category);
    if (normalized) categories.set(normalized.id, normalized);
  }

  return {
    latest: normalizeSummaries(latest.docs),
    articles: normalizeSummaries(listing.docs),
    trending: normalizeSummaries(trending.docs),
    popular: normalizeSummaries(popular.docs),
    categories: [...categories.values()].sort((a, b) =>
      a.name.localeCompare(b.name, locale),
    ),
    page: listing.page ?? safePage,
    totalPages: listing.totalPages,
    totalDocs: listing.totalDocs,
  };
}

export async function getNewsArticle(
  locale: NewsLocale,
  slug: string,
): Promise<NewsDetail | null> {
  const payload = await getPayload({config: configPromise});
  const result = await payload.find({
    collection: "articles",
    locale,
    depth: 1,
    limit: 1,
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
}

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
