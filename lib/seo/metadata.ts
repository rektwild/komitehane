import type {Metadata} from "next";
import type {Locale} from "next-intl";
import {getLocale} from "next-intl/server";

import {getPathname} from "@/i18n/navigation";
import {routing, type StaticAppPathname} from "@/i18n/routing";
import {isIndexableEnvironment, siteConfig} from "@/config/site";
import {getOgLocale} from "@/lib/seo/locales";
import {absoluteUrl} from "@/lib/seo/urls";

type LocalizedMetadataInput = {
  title: string;
  description: string;
  imageAlt?: string;
  absoluteTitle?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: Array<{name: string; url?: string}>;
};

type DynamicLocalizedMetadataInput = LocalizedMetadataInput & {
  locale: Locale;
  canonicalPath: string;
  localizedPaths: Partial<Record<Locale, string>>;
  image?: {url: string; alt: string; width?: number; height?: number};
};

export function getRobotsMetadata(): Metadata["robots"] {
  if (!isIndexableEnvironment) {
    return {
      index: false,
      follow: false,
    };
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export async function getAlternateLanguages(
  href: StaticAppPathname,
  availableLocales: readonly Locale[] = routing.locales
): Promise<Record<string, string>> {
  const languages: Record<string, string> = {};

  for (const locale of availableLocales) {
    languages[locale] = absoluteUrl(await getPathname({href, locale}));
  }

  const defaultLocale = routing.defaultLocale;
  if (availableLocales.includes(defaultLocale)) {
    languages["x-default"] = languages[defaultLocale];
  }

  return languages;
}

export async function getLocalizedMetadata(
  href: StaticAppPathname,
  {
    title,
    description,
    imageAlt,
    absoluteTitle = false,
    type = "website",
    publishedTime,
    modifiedTime,
    authors,
  }: LocalizedMetadataInput,
  availableLocales: readonly Locale[] = routing.locales
): Promise<Metadata> {
  const locale = await getLocale();
  const canonical = absoluteUrl(await getPathname({href, locale}));
  const alternateLanguages = await getAlternateLanguages(href, availableLocales);
  const alternateLocale = availableLocales
    .filter((cur) => cur !== locale)
    .map(getOgLocale);

  return {
    title: absoluteTitle ? {absolute: title} : title,
    description,
    alternates: {
      canonical,
      languages: alternateLanguages,
    },
    robots: getRobotsMetadata(),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: getOgLocale(locale),
      alternateLocale,
      type,
      ...(publishedTime ? {publishedTime} : {}),
      ...(modifiedTime ? {modifiedTime} : {}),
      ...(authors ? {authors: authors.map((author) => author.url || author.name)} : {}),
      ...(imageAlt
        ? {
            images: [
              {
                url: absoluteUrl(`/${locale}/opengraph-image`),
                width: 1200,
                height: 630,
                alt: imageAlt,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageAlt
        ? {
            images: [
              {
                url: absoluteUrl(`/${locale}/twitter-image`),
                alt: imageAlt,
              },
            ],
          }
        : {}),
    },
    ...(authors && authors.length > 0
      ? {authors, creator: authors[0].name}
      : siteConfig.authors.length > 0
        ? {authors: siteConfig.authors, creator: siteConfig.authors[0].name}
        : {}),
  };
}

export function getDynamicLocalizedMetadata({
  locale,
  canonicalPath,
  localizedPaths,
  image,
  title,
  description,
  absoluteTitle = false,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
}: DynamicLocalizedMetadataInput): Metadata {
  const canonical = absoluteUrl(canonicalPath);
  const languages = Object.fromEntries(
    Object.entries(localizedPaths).map(([key, value]) => [key, absoluteUrl(value)]),
  );
  const defaultPath = localizedPaths[routing.defaultLocale];
  if (defaultPath) {
    languages["x-default"] = absoluteUrl(defaultPath);
  }
  const availableLocales = Object.keys(localizedPaths) as Locale[];
  const socialImage = image
    ? {
        url: absoluteUrl(image.url),
        width: image.width ?? 1200,
        height: image.height ?? 630,
        alt: image.alt,
      }
    : undefined;

  return {
    title: absoluteTitle ? {absolute: title} : title,
    description,
    alternates: {canonical, languages},
    robots: getRobotsMetadata(),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: getOgLocale(locale),
      alternateLocale: availableLocales
        .filter((current) => current !== locale)
        .map(getOgLocale),
      type,
      ...(publishedTime ? {publishedTime} : {}),
      ...(modifiedTime ? {modifiedTime} : {}),
      ...(authors ? {authors: authors.map((author) => author.url || author.name)} : {}),
      ...(socialImage ? {images: [socialImage]} : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(socialImage ? {images: [{url: socialImage.url, alt: socialImage.alt}]} : {}),
    },
    ...(authors?.length
      ? {authors, creator: authors[0].name}
      : siteConfig.authors.length
        ? {authors: siteConfig.authors, creator: siteConfig.authors[0].name}
        : {}),
  };
}
