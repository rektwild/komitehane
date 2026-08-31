import type {Article} from "@/payload-types";

export type NewsLocale = "tr" | "en";

export type NewsImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type NewsCategory = {
  id: number;
  name: string;
  slug: string;
};

export type NewsTag = {
  id: number;
  name: string;
  slug: string;
};

export type AuthorRole = "founder" | "editor" | "writer";

export type NewsSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: NewsImage;
  category: NewsCategory;
  tags: NewsTag[];
  authorName: string;
  authorRole: AuthorRole;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  readingMinutes: number;
};

export type HomeNewsSection = {
  category: NewsCategory;
  articles: NewsSummary[];
};

export type HomeNewsResult = {
  latest: NewsSummary[];
  sections: HomeNewsSection[];
};

export type NewsTranslation = {
  locale: NewsLocale;
  slug: string;
};

export type NewsDetail = NewsSummary & {
  content: Article["content"];
  translations: NewsTranslation[];
};

export type NewsListingResult = {
  latest: NewsSummary[];
  articles: NewsSummary[];
  categories: NewsCategory[];
  tags: NewsTag[];
  page: number;
  totalPages: number;
  totalDocs: number;
};

export type NewsListingParams = {
  locale: NewsLocale;
  query?: string;
  category?: string;
  tag?: string;
  page?: number;
};

export type RelatedNewsParams = {
  locale: NewsLocale;
  slug: string;
  categorySlug?: string;
  limit?: number;
};

export type NextNewsParams = {
  locale: NewsLocale;
  slug: string;
  publishedAt: string;
};

export type NewsSitemapEntry = {
  id: number;
  updatedAt: string;
  translations: NewsTranslation[];
};

export type NewsTickerItem = {
  title: string;
  slug: string;
};
