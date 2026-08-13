import type {Metadata} from "next";
import {BoxIcon} from "lucide-react";
import {getLocale, getTranslations} from "next-intl/server";

import {ToolsCatalog} from "@/components/tools/tools-catalog";
import {JsonLd} from "@/components/json-ld";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {PageWithAside} from "@/components/layout/page-with-aside";
import {getPathname} from "@/i18n/navigation";
import {getLocalizedMetadata} from "@/lib/seo/metadata";
import {getWebPageJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.tools");

  return getLocalizedMetadata("/tools", {
    title: t("title"),
    description: t("description"),
    imageAlt: t("imageAlt"),
    absoluteTitle: true,
  });
}

export default async function ToolsPage() {
  const [t, metadata, locale] = await Promise.all([
    getTranslations("Tools"),
    getTranslations("Metadata.tools"),
    getLocale(),
  ]);
  const pageUrl = absoluteUrl(await getPathname({href: "/tools", locale}));

  return (
    <>
      <PageBreadcrumb
        items={[{label: t("title"), icon: BoxIcon}]}
        className="shrink-0 py-4"
      />

      <PageWithAside>
        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <JsonLd
            data={getWebPageJsonLd({
              locale,
              url: pageUrl,
              name: metadata("title"),
              description: metadata("description"),
            })}
          />

          <header>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("title")}
            </h1>
          </header>

          <ToolsCatalog />
        </section>
      </PageWithAside>
    </>
  );
}
