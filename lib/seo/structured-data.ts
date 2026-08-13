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

type WebPageJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebPage";
  "@id": string;
  url: string;
  name: string;
  description: string;
  inLanguage: Locale;
  isPartOf: EntityReference;
  publisher: EntityReference;
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
