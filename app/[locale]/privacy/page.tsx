import type {Metadata} from "next";
import {getLocale, getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {getPathname} from "@/i18n/navigation";
import {getLocalizedMetadata} from "@/lib/seo/metadata";
import {getWebPageJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.privacy");

  return getLocalizedMetadata("/privacy", {
    title: t("title"),
    description: t("description"),
    imageAlt: t("imageAlt"),
    absoluteTitle: true,
  });
}

export default async function PrivacyPage() {
  const [t, metadata, locale] = await Promise.all([
    getTranslations("Privacy"),
    getTranslations("Metadata.privacy"),
    getLocale(),
  ]);
  const pageUrl = absoluteUrl(await getPathname({href: "/privacy", locale}));

  return (
    <>
      <PageBreadcrumb
        items={[{label: t("title")}]}
        className="shrink-0 py-4"
      />

      <article className="mx-auto w-full max-w-3xl pb-12">
        <JsonLd
          data={getWebPageJsonLd({
            locale,
            url: pageUrl,
            name: metadata("title"),
            description: metadata("description"),
          })}
        />

        <header className="border-b border-border/60 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("lastUpdated")}
          </p>
          <p className="mt-5 text-pretty text-lg leading-8 text-muted-foreground">
            {t("intro")}
          </p>
        </header>

        <div className="mt-8 space-y-8 text-base leading-8 text-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold leading-tight tracking-tight">
              {t("sections.adsense.title")}
            </h2>
            <p>{t("sections.adsense.paragraphOne")}</p>
            <p>{t("sections.adsense.paragraphTwo")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold leading-tight tracking-tight">
              {t("sections.technologies.title")}
            </h2>
            <p>{t("sections.technologies.paragraphOne")}</p>
            <p>{t("sections.technologies.paragraphTwo")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold leading-tight tracking-tight">
              {t("sections.choices.title")}
            </h2>
            <p>{t("sections.choices.paragraph")}</p>
            <ul className="list-disc space-y-2 ps-6">
              <li>
                <a
                  href="https://adssettings.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("links.googleAdsSettings")}
                </a>
              </li>
              <li>{t("sections.choices.browser")}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold leading-tight tracking-tight">
              {t("sections.consent.title")}
            </h2>
            <p>{t("sections.consent.paragraphOne")}</p>
            <p>{t("sections.consent.paragraphTwo")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold leading-tight tracking-tight">
              {t("sections.analytics.title")}
            </h2>
            <p>{t("sections.analytics.paragraph")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold leading-tight tracking-tight">
              {t("sections.localStorage.title")}
            </h2>
            <p>{t("sections.localStorage.paragraph")}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold leading-tight tracking-tight">
              {t("sections.updates.title")}
            </h2>
            <p>{t("sections.updates.paragraph")}</p>
          </section>
        </div>
      </article>
    </>
  );
}
