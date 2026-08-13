import type {Metadata} from "next";
import {getLocale, getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {getLocalizedMetadata} from "@/lib/seo/metadata";
import {getWebPageJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.home");

  return getLocalizedMetadata("/", {
    title: t("title"),
    description: t("description"),
    imageAlt: t("imageAlt"),
    absoluteTitle: true,
  });
}

export default async function Home() {
  const t = await getTranslations("Home");
  const metadata = await getTranslations("Metadata.home");
  const locale = await getLocale();
  const pageUrl = absoluteUrl(`/${locale}`);

  return (
    <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <JsonLd
        data={getWebPageJsonLd({
          locale,
          url: pageUrl,
          name: metadata("title"),
          description: metadata("description"),
        })}
      />
      <article className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">{t("description")}</p>
      </article>
    </section>
  );
}
