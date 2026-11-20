import {hasLocale} from "next-intl";
import {getTranslations} from "next-intl/server";

import {routing} from "@/i18n/routing";
import {createSocialImage} from "@/lib/seo/social-image";
import {isSocialImageKey, socialImageKeys, type SocialImageKey} from "@/lib/seo/social-image-keys";
import type {Locale} from "next-intl";

// Every image is rendered once at build time; unknown keys return 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    socialImageKeys.map((key) => ({locale, key})),
  );
}

async function getCopy(locale: Locale, key: SocialImageKey) {
  switch (key) {
    case "home": {
      const t = await getTranslations({locale, namespace: "Home"});
      return {title: t("heading")};
    }
    case "tools": {
      const t = await getTranslations({locale, namespace: "Tools"});
      return {title: t("heading")};
    }
    case "news": {
      const t = await getTranslations({locale, namespace: "NewsPage"});
      return {title: t("title"), subtitle: t("description")};
    }
    case "about": {
      const t = await getTranslations({locale, namespace: "About"});
      return {title: t("heading")};
    }
    case "privacy": {
      const t = await getTranslations({locale, namespace: "Privacy"});
      return {title: t("title")};
    }
    default: {
      const t = await getTranslations({locale, namespace: "Tools"});
      return {
        title: t(`items.${key}.title`),
        subtitle: t(`items.${key}.description`),
      };
    }
  }
}

export async function GET(_request: Request, {params}: RouteContext<"/og/[locale]/[key]">) {
  const {locale, key} = await params;
  if (!hasLocale(routing.locales, locale) || !isSocialImageKey(key)) {
    return new Response("Not found", {status: 404});
  }

  return createSocialImage(locale, await getCopy(locale, key));
}
