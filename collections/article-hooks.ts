import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from "payload";
import {APIError} from "payload";

import {
  isAutomationUser,
  isFounderUser,
  isWriterLikeUser,
} from "@/collections/access";
import type {ArticleImageBlockFields} from "@/blocks/article-image";
import {absoluteUrl} from "@/lib/seo/urls";
import {relationshipId} from "@/collections/relationship";

type LocalizedSlugs = Partial<Record<"tr" | "en", string>>;

type IndexNowContext = {
  deletedArticlePublished?: boolean;
  deletedArticleSlugs?: LocalizedSlugs;
};

type BooleanLike = boolean | string;

type ArticleWorkflowArguments = {
  data?: {
    _status?: unknown;
  };
  draft?: BooleanLike;
  publishAllLocales?: BooleanLike;
  publishSpecificLocale?: string;
  unpublishAllLocales?: BooleanLike;
};

function isTrue(value: unknown): boolean {
  return value === true || value === "true";
}

export const enforceWriterArticleWorkflow: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (!isWriterLikeUser(req.user)) return args;
  if (operation !== "create" && operation !== "update" && operation !== "restoreVersion") {
    return args;
  }

  const workflow = args as ArticleWorkflowArguments;
  const status = workflow.data?._status;
  const isDraftRequest = isTrue(workflow.draft);
  const isPublishing =
    !isDraftRequest ||
    isTrue(workflow.publishAllLocales) ||
    Boolean(workflow.publishSpecificLocale) ||
    isTrue(workflow.unpublishAllLocales) ||
    status === "published";

  if (isPublishing) {
    throw new APIError(
      isAutomationUser(req.user)
        ? "Automation users can only save articles as drafts."
        : "Writers can only save their own articles as drafts.",
      403,
    );
  }

  return args;
};

export const setArticleAuthor: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === "create") {
    const requestedAuthor = relationshipId(data.author);
    if (isFounderUser(req.user) && requestedAuthor !== undefined) {
      return {...data, author: requestedAuthor};
    }

    return req.user ? {...data, author: req.user.id} : data;
  }

  const authorId = relationshipId(originalDoc?.author);
  const requestedAuthor = relationshipId(data.author);
  if (isFounderUser(req.user) && requestedAuthor !== undefined) {
    return {...data, author: requestedAuthor};
  }

  return authorId === undefined ? data : {...data, author: authorId};
};

export const validateArticleHeroImageAccess: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!isWriterLikeUser(req.user)) return data;

  const heroImageId = relationshipId(data.heroImage ?? originalDoc?.heroImage);
  if (heroImageId === undefined) return data;

  const media = await req.payload.findByID({
    collection: "media",
    depth: 0,
    id: heroImageId,
    overrideAccess: false,
    req,
  });

  if (!media) {
    throw new APIError("Writers can only use media they are allowed to read.", 403);
  }

  return data;
};

const MAX_INLINE_IMAGES = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectInlineImageBlocks(value: unknown): ArticleImageBlockFields[] {
  if (Array.isArray(value)) return value.flatMap(collectInlineImageBlocks);
  if (!isRecord(value)) return [];

  const fields = value.fields;
  const current =
    value.type === "block" &&
    isRecord(fields) &&
    fields.blockType === "articleImage"
      ? [fields as ArticleImageBlockFields]
      : [];

  return [...current, ...Object.values(value).flatMap(collectInlineImageBlocks)];
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isAllowedMediaUrl(value: unknown): boolean {
  if (value == null || value === "") return true;
  if (!isHttpsUrl(value)) return false;

  const allowedHostname = process.env.NEXT_PUBLIC_MEDIA_HOSTNAME?.trim().toLowerCase();
  if (!allowedHostname) return true;

  try {
    return new URL(String(value)).hostname.toLowerCase() === allowedHostname;
  } catch {
    return false;
  }
}

export const validateArticleInlineImageAccess: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  if (!isWriterLikeUser(req.user)) return data;

  const blocks = collectInlineImageBlocks(data?.content);
  if (blocks.length > MAX_INLINE_IMAGES) {
    throw new APIError(`An article can contain at most ${MAX_INLINE_IMAGES} inline images.`, 422);
  }

  for (const fields of blocks) {
    if (fields.provider === "pexels") {
      const mediaId = relationshipId(fields.media);
      if (mediaId === undefined || !isAllowedMediaUrl(fields.mediaUrl)) {
        throw new APIError("Pexels inline images require a valid Payload Media asset.", 422);
      }

      const media = await req.payload.findByID({
        collection: "media",
        depth: 0,
        id: mediaId,
        overrideAccess: false,
        req,
      });
      if (!media) {
        throw new APIError("Writers can only use media they are allowed to read.", 403);
      }
      continue;
    }

    throw new APIError("Inline images must use Pexels Payload Media assets.", 422);
  }

  return data;
};

function getArticleUrls(slugs: LocalizedSlugs): string[] {
  const urls = [absoluteUrl("/tr/haberler"), absoluteUrl("/en/news")];
  if (slugs.tr) urls.push(absoluteUrl(`/tr/haberler/${slugs.tr}`));
  if (slugs.en) urls.push(absoluteUrl(`/en/news/${slugs.en}`));
  return urls;
}

type LocalizedArticleState = {
  _status?: string | null;
  publishedAt?: string | null;
  slug: LocalizedSlugs;
};

/**
 * Read every locale's slug for IndexNow inside the current write transaction.
 * The database adapter is used instead of the Local API on purpose: `findByID`
 * without `req` runs outside the transaction (a create-and-publish cannot see
 * its own row and aborts with NotFound; updates read stale slugs), while
 * `findByID` with `req` and `locale: "all"` mutates the shared request
 * (`req.locale`, and replaces `req.context`, dropping hook state).
 */
async function findLocalizedSlugs(
  req: PayloadRequest,
  id: number | string,
): Promise<LocalizedArticleState> {
  const row = await req.payload.db.findOne<{
    id: number | string;
    _status?: string | null;
    publishedAt?: string | null;
    slug?: unknown;
  }>({
    collection: "articles",
    locale: "all",
    req,
    where: {id: {equals: id}},
  });

  const slug: LocalizedSlugs = {};
  if (row?.slug && typeof row.slug === "object") {
    for (const locale of ["tr", "en"] as const) {
      const value = (row.slug as Record<string, unknown>)[locale];
      if (typeof value === "string" && value) slug[locale] = value;
    }
  }

  return {_status: row?._status, publishedAt: row?.publishedAt, slug};
}

async function submitArticleUrls(slugs: LocalizedSlugs) {
  try {
    const {submitIndexNow} = await import("@/lib/seo/indexnow");
    await submitIndexNow(getArticleUrls(slugs));
  } catch (error) {
    console.warn(
      `IndexNow submission failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

async function revalidateNewsCaches() {
  try {
    const {revalidateTag} = await import("next/cache");
    revalidateTag("news-ticker", "max");
    revalidateTag("news-latest-links", "max");
  } catch (error) {
    console.warn(
      `News cache revalidation failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

export const setPublishedAt: CollectionBeforeChangeHook = ({data, originalDoc}) => {
  if (
    data?._status === "published" &&
    !data.publishedAt &&
    !originalDoc?.publishedAt
  ) {
    return {...data, publishedAt: new Date().toISOString()};
  }

  return data;
};

export const submitPublishedArticle: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const isDraftSave = isTrue(req.query?.draft);
  if (isDraftSave) {
    return doc;
  }

  const isPublic = (value: typeof doc) => {
    const publishedAt = value?.publishedAt
      ? new Date(value.publishedAt).getTime()
      : Number.POSITIVE_INFINITY;
    return value?._status === "published" && publishedAt <= Date.now();
  };

  if (!isPublic(doc) && !isPublic(previousDoc)) return doc;

  const localized = await findLocalizedSlugs(req, doc.id);

  await submitArticleUrls(localized.slug);
  await revalidateNewsCaches();
  return doc;
};

export const rememberDeletedArticle: CollectionBeforeDeleteHook = async ({
  context,
  id,
  req,
}) => {
  const localized = await findLocalizedSlugs(req, id);
  const indexNowContext = context as IndexNowContext;
  indexNowContext.deletedArticlePublished =
    localized._status === "published" &&
    Boolean(localized.publishedAt) &&
    new Date(localized.publishedAt as string).getTime() <= Date.now();
  indexNowContext.deletedArticleSlugs = localized.slug;
};

export const submitDeletedArticle: CollectionAfterDeleteHook = async ({
  context,
  doc,
}) => {
  const indexNowContext = context as IndexNowContext;
  if (indexNowContext.deletedArticlePublished && indexNowContext.deletedArticleSlugs) {
    await submitArticleUrls(indexNowContext.deletedArticleSlugs);
  }
  await revalidateNewsCaches();
  return doc;
};
