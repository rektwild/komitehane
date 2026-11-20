import type {Locale} from "next-intl";

import {siteConfig} from "@/config/site";
import {absoluteUrl, siteUrl} from "@/lib/seo/urls";

type EntityReference = {
  "@id": string;
};

type ImageObjectJsonLd = {
  "@type": "ImageObject";
  url: string;
  width: number;
  height: number;
};

type OrganizationJsonLd = {
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  description?: string;
  logo?: ImageObjectJsonLd;
  sameAs?: string[];
};

type WebSiteJsonLd = {
  "@type": "WebSite";
  "@id": string;
  name: string;
  url: string;
  inLanguage: Locale;
  publisher: EntityReference;
};

export type WebPageType = "WebPage" | "AboutPage" | "CollectionPage" | "ProfilePage";

type WebPageNode = {
  "@type": WebPageType;
  "@id": string;
  url: string;
  name: string;
  description: string;
  inLanguage: Locale;
  isPartOf: EntityReference;
  publisher: EntityReference;
  about?: EntityReference;
  mainEntity?: EntityReference;
  breadcrumb?: EntityReference;
};

type WebPageJsonLd = {
  "@context": "https://schema.org";
  "@graph": Array<WebPageNode | BreadcrumbListNode>;
};

export type BreadcrumbItem = {
  name: string;
  url: string;
};

type NewsArticleJsonLd = {
  "@context": "https://schema.org";
  "@graph": Array<WebPageNode | NewsArticleNode | BreadcrumbListNode>;
};

type NewsArticleNode = {
  "@type": "NewsArticle";
  "@id": string;
  url: string;
  headline: string;
  description: string;
  image: string[];
  datePublished: string;
  dateModified: string;
  inLanguage: Locale;
  mainEntityOfPage: EntityReference;
  author: {
    "@id"?: string;
    "@type": "Person" | "Organization";
    name: string;
    url?: string;
  };
  publisher: EntityReference;
};

type BreadcrumbListNode = {
  "@type": "BreadcrumbList";
  "@id": string;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
};

const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;

export function getOrganizationJsonLd(description?: string): OrganizationJsonLd {
  const logo = siteConfig.logo;

  return {
    "@type": "Organization",
    "@id": organizationId,
    name: siteConfig.organizationName,
    url: absoluteUrl("/"),
    ...(description ? {description} : {}),
    ...(logo
      ? {
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl(logo.url),
            width: logo.width,
            height: logo.height,
          },
        }
      : {}),
    ...(siteConfig.socialProfiles.length > 0
      ? {sameAs: siteConfig.socialProfiles}
      : {}),
  };
}

export function getWebSiteJsonLd(locale: Locale): WebSiteJsonLd {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    name: siteConfig.name,
    url: absoluteUrl("/"),
    inLanguage: locale,
    publisher: {"@id": organizationId},
  };
}

export function getSiteJsonLd(locale: Locale, description?: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [getOrganizationJsonLd(description), getWebSiteJsonLd(locale)],
  };
}

export function getBreadcrumbListNode(
  url: string,
  items: readonly BreadcrumbItem[],
): BreadcrumbListNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

/**
 * WebPage (or a WebPage subtype) node, optionally linked to a BreadcrumbList
 * that mirrors the visible breadcrumb. The final breadcrumb item must be the
 * page itself.
 */
export function getWebPageJsonLd({
  locale,
  url,
  name,
  description,
  type = "WebPage",
  breadcrumbItems,
  about,
  mainEntity,
}: {
  locale: Locale;
  url: string;
  name: string;
  description: string;
  type?: WebPageType;
  breadcrumbItems?: readonly BreadcrumbItem[];
  about?: EntityReference;
  mainEntity?: EntityReference;
}): WebPageJsonLd {
  const breadcrumb =
    breadcrumbItems && breadcrumbItems.length >= 2
      ? getBreadcrumbListNode(url, breadcrumbItems)
      : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...getWebPageNode({locale, url, name, description, type}),
        ...(about ? {about} : {}),
        ...(mainEntity ? {mainEntity} : {}),
        ...(breadcrumb ? {breadcrumb: {"@id": breadcrumb["@id"]}} : {}),
      },
      ...(breadcrumb ? [breadcrumb] : []),
    ],
  };
}

export function getOrganizationReference(): EntityReference {
  return {"@id": organizationId};
}

function getWebPageNode({
  locale,
  url,
  name,
  description,
  type = "WebPage",
}: {
  locale: Locale;
  url: string;
  name: string;
  description: string;
  type?: WebPageType;
}): WebPageNode {
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: locale,
    isPartOf: {"@id": websiteId},
    publisher: {"@id": organizationId},
  };
}

export function getNewsCollectionJsonLd({
  locale,
  url,
  name,
  description,
  articles,
}: {
  locale: Locale;
  url: string;
  name: string;
  description: string;
  articles: Array<{url: string; name: string}>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name,
    description,
    inLanguage: locale,
    isPartOf: {"@id": websiteId},
    publisher: {"@id": organizationId},
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: article.url,
        name: article.name,
      })),
    },
  };
}

export function getNewsArticleJsonLd({
  locale,
  url,
  title,
  description,
  image,
  authorName,
  publishedAt,
  updatedAt,
  breadcrumbItems,
}: {
  locale: Locale;
  url: string;
  title: string;
  description: string;
  image: string;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  breadcrumbItems: readonly [BreadcrumbItem, BreadcrumbItem, ...BreadcrumbItem[]];
}): NewsArticleJsonLd {
  const webpageId = `${url}#webpage`;
  const articleId = `${url}#article`;
  const breadcrumbId = `${url}#breadcrumb`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": webpageId,
        url,
        name: title,
        description,
        inLanguage: locale,
        isPartOf: {"@id": websiteId},
        publisher: {"@id": organizationId},
        mainEntity: {"@id": articleId},
        breadcrumb: {"@id": breadcrumbId},
      },
      {
        "@type": "NewsArticle",
        "@id": articleId,
        url,
        headline: title,
        description,
        image: [absoluteUrl(image)],
        datePublished: publishedAt,
        dateModified: updatedAt,
        inLanguage: locale,
        mainEntityOfPage: {"@id": webpageId},
        author: authorName.trim() === siteConfig.organizationName
          ? {"@id": organizationId, "@type": "Organization", name: authorName}
          : {"@type": "Person", name: authorName},
        publisher: {"@id": organizationId},
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: breadcrumbItems.map((item, index) => ({
          "@type": "ListItem" as const,
          position: index + 1,
          name: item.name,
          item: absoluteUrl(item.url),
        })),
      },
    ],
  };
}
