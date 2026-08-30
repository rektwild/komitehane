import type {Locale} from "next-intl";

import {siteConfig} from "@/config/site";
import {absoluteUrl, siteUrl} from "@/lib/seo/urls";

type EntityReference = {
  "@id": string;
};

type OrganizationJsonLd = {
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  logo?: string;
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

type WebPageNode = {
  "@type": "WebPage";
  "@id": string;
  url: string;
  name: string;
  description: string;
  inLanguage: Locale;
  isPartOf: EntityReference;
  publisher: EntityReference;
  mainEntity?: EntityReference;
  breadcrumb?: EntityReference;
};

type WebPageJsonLd = {
  "@context": "https://schema.org";
} & WebPageNode;

type BreadcrumbItem = {
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
    "@type": "Person";
    name: string;
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

export function getOrganizationJsonLd(): OrganizationJsonLd {
  return {
    "@type": "Organization",
    "@id": organizationId,
    name: siteConfig.organizationName,
    url: absoluteUrl("/"),
    ...(siteConfig.logo ? {logo: absoluteUrl(siteConfig.logo)} : {}),
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

export function getSiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@graph": [getOrganizationJsonLd(), getWebSiteJsonLd(locale)],
  };
}

export function getWebPageJsonLd({
  locale,
  url,
  name,
  description,
}: {
  locale: Locale;
  url: string;
  name: string;
  description: string;
}): WebPageJsonLd {
  return {
    "@context": "https://schema.org",
    ...getWebPageNode({locale, url, name, description}),
  };
}

function getWebPageNode({
  locale,
  url,
  name,
  description,
}: {
  locale: Locale;
  url: string;
  name: string;
  description: string;
}): WebPageNode {
  return {
    "@type": "WebPage",
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
        author: {"@type": "Person", name: authorName},
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
