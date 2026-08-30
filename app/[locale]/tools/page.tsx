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
import {toolCategories, type ToolCategory} from "@/lib/tools";

type ToolsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getToolCategory(value: string | undefined): ToolCategory | undefined {
  return toolCategories.find((category) => category === value);
}

function getSearchQuery(value: string | undefined): string | undefined {
  const query = value?.trim();
  return query || undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.tools");

  return getLocalizedMetadata("/tools", {
    title: t("title"),
    description: t("description"),
    imageAlt: t("imageAlt"),
    absoluteTitle: true,
  });
}

export default async function ToolsPage({searchParams}: ToolsPageProps) {
  const [values, t, metadata, locale] = await Promise.all([
    searchParams,
    getTranslations("Tools"),
    getTranslations("Metadata.tools"),
    getLocale(),
  ]);
  const category = getToolCategory(firstValue(values.category));
  const query = getSearchQuery(firstValue(values.q));
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

          <ToolsCatalog
            key={`${category ?? "all"}:${query ?? ""}`}
            initialCategory={category}
            initialQuery={query}
          />
        </section>
      </PageWithAside>
    </>
  );
}
