import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
} from "payload";

import {absoluteUrl} from "@/lib/seo/urls";

type LocalizedSlugs = Partial<Record<"tr" | "en", string>>;

type IndexNowContext = {
  deletedArticlePublished?: boolean;
  deletedArticleSlugs?: LocalizedSlugs;
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
  return doc;
};
