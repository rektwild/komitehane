import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeOperationHook,
} from "payload";
import {APIError} from "payload";

import {isFounderUser, isWriterUser} from "@/collections/access";
import {absoluteUrl} from "@/lib/seo/urls";
import {relationshipId} from "@/collections/relationship";

type LocalizedSlugs = Partial<Record<"tr" | "en", string>>;

type IndexNowContext = {
  deletedArticlePublished?: boolean;
  deletedArticleSlugs?: LocalizedSlugs;
};

type ArticleWorkflowArguments = {
  data?: {
    _status?: unknown;
  };
  draft?: boolean;
  publishAllLocales?: boolean;
  publishSpecificLocale?: string;
  unpublishAllLocales?: boolean;
};

export const enforceWriterArticleWorkflow: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (!isWriterUser(req.user)) return args;
  if (operation !== "create" && operation !== "update" && operation !== "restoreVersion") {
    return args;
  }

  const workflow = args as ArticleWorkflowArguments;
  const status = workflow.data?._status;
  const isPublishing =
    workflow.draft !== true ||
    workflow.publishAllLocales === true ||
    Boolean(workflow.publishSpecificLocale) ||
    workflow.unpublishAllLocales === true ||
    status === "published";

  if (isPublishing) {
    throw new APIError(
      "Writers can only save their own articles as drafts.",
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
  if (!isWriterUser(req.user)) return data;

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

function getArticleUrls(slugs: LocalizedSlugs): string[] {
  const urls = [absoluteUrl("/tr/haberler"), absoluteUrl("/en/news")];
  if (slugs.tr) urls.push(absoluteUrl(`/tr/haberler/${slugs.tr}`));
  if (slugs.en) urls.push(absoluteUrl(`/en/news/${slugs.en}`));
  return urls;
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
  const isDraftSave = req.query?.draft === true || req.query?.draft === "true";
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

  const localized = await req.payload.findByID({
    collection: "articles",
    id: doc.id,
    depth: 0,
    locale: "all",
    overrideAccess: true,
  });

  await submitArticleUrls((localized.slug ?? {}) as LocalizedSlugs);
  await revalidateNewsCaches();
  return doc;
};

export const rememberDeletedArticle: CollectionBeforeDeleteHook = async ({
  context,
  id,
  req,
}) => {
  const localized = await req.payload.findByID({
    collection: "articles",
    id,
    depth: 0,
    locale: "all",
    overrideAccess: true,
  });
  const indexNowContext = context as IndexNowContext;
  indexNowContext.deletedArticlePublished =
    localized._status === "published" &&
    Boolean(localized.publishedAt) &&
    new Date(localized.publishedAt as string).getTime() <= Date.now();
  indexNowContext.deletedArticleSlugs = (localized.slug ?? {}) as LocalizedSlugs;
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
