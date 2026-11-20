import type {Metadata} from "next";
import {getLocale, getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {getPathname, Link} from "@/i18n/navigation";
import {getLocalizedMetadata} from "@/lib/seo/metadata";
import {
  getOrganizationReference,
  getWebPageJsonLd,
} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";
import {typography} from "@/lib/typography";

const offerKeys = ["tools", "minimumFinal", "news", "countdown"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.about");

  return getLocalizedMetadata("/about", {
    title: t("title"),
    description: t("description"),
    imageAlt: t("imageAlt"),
    socialImageKey: "about",
    absoluteTitle: true,
  });
}

export default async function AboutPage() {
  const [t, metadata, locale] = await Promise.all([
    getTranslations("About"),
    getTranslations("Metadata.about"),
    getLocale(),
  ]);
  const pageUrl = absoluteUrl(await getPathname({href: "/about", locale}));

  return (
    <>
      <PageBreadcrumb items={[{label: t("title")}]} className="shrink-0 py-4" />

      <article className="mx-auto w-full max-w-3xl pb-12">
        <JsonLd
          data={getWebPageJsonLd({
            locale,
            url: pageUrl,
            name: metadata("title"),
            description: metadata("description"),
            type: "AboutPage",
            about: getOrganizationReference(),
          })}
        />

        <header className="border-b border-border/60 pb-6">
          <h1 className={typography.display}>
            {t("heading")}
          </h1>
          <p className="mt-5 text-pretty text-lg leading-8 text-muted-foreground">
            {t("intro")}
          </p>
        </header>

        <div className="mt-8 space-y-8 text-base leading-8 text-foreground">
          <section className="space-y-3">
            <h2 className={typography.title}>
              {t("sections.offer.title")}
            </h2>
            <ul className="list-disc space-y-2 ps-6">
              {offerKeys.map((key) => (
                <li key={key}>{t(`sections.offer.${key}`)}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className={typography.title}>
              {t("sections.calculators.title")}
            </h2>
            <p>{t("sections.calculators.paragraphOne")}</p>
            <p>{t("sections.calculators.paragraphTwo")}</p>
          </section>

          <section className="space-y-3">
            <h2 className={typography.title}>
              {t("sections.editorial.title")}
            </h2>
            <p>{t("sections.editorial.paragraphOne")}</p>
            <p>{t("sections.editorial.paragraphTwo")}</p>
          </section>

          <section className="space-y-3">
            <h2 className={typography.title}>
              {t("sections.limitations.title")}
            </h2>
            <p>{t("sections.limitations.paragraph")}</p>
          </section>

          <nav aria-labelledby="about-links-title" className="space-y-3">
            <h2
              id="about-links-title"
              className={typography.title}
            >
              {t("sections.links.title")}
            </h2>
            <ul className="list-disc space-y-2 ps-6">
              <li>
                <Link href="/tools" className="underline underline-offset-4">
                  {t("sections.links.tools")}
                </Link>
              </li>
              <li>
                <Link href="/news" className="underline underline-offset-4">
                  {t("sections.links.news")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="underline underline-offset-4">
                  {t("sections.links.privacy")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </article>
    </>
  );
}
