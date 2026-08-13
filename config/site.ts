import type {Locale} from "next-intl";

import {routing} from "@/i18n/routing";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const fallbackSiteUrl = "http://localhost:3000";

function normalizeOrigin(value: string): string {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }

  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

export const siteUrl = normalizeOrigin(configuredSiteUrl || fallbackSiteUrl);

const deploymentEnvironment =
  process.env.VERCEL_ENV || process.env.DEPLOYMENT_ENV || process.env.NODE_ENV;

export const isPreviewEnvironment = ["preview", "staging"].includes(
  deploymentEnvironment || ""
);

export const isIndexableEnvironment = Boolean(configuredSiteUrl) &&
  process.env.NODE_ENV === "production" &&
  !isPreviewEnvironment;

export const localeNames = {
  tr: "Türkçe",
  en: "English",
} as const satisfies Record<Locale, string>;

export const localeToOpenGraphLocale = {
  tr: "tr_TR",
  en: "en_US",
} as const satisfies Record<Locale, string>;

export const siteConfig = {
  name: "Komitehane",
  organizationName: "Komitehane",
  description: "A modern, multilingual web application.",
  url: siteUrl,
  defaultLocale: routing.defaultLocale,
  locales: routing.locales,
  localeNames,
  localeToOpenGraphLocale,
  socialProfiles: [] as string[],
  authors: [] as Array<{name: string; url?: string}>,
  logo: undefined as string | undefined,
} as const;

export const allowModelTrainingCrawlers =
  process.env.ALLOW_MODEL_TRAINING_CRAWLERS === "true";

export const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const bingSiteVerification =
  process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();

export const indexNowKey = process.env.INDEXNOW_KEY?.trim();

export const indexNowEndpoint =
  process.env.INDEXNOW_ENDPOINT?.trim() || "https://api.indexnow.org/indexnow";

