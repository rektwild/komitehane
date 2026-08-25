import type {Metadata} from "next";
import {BoxIcon} from "lucide-react";
import {notFound} from "next/navigation";
import {getLocale, getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import {PageBreadcrumb} from "@/components/layout/page-breadcrumb";
import {PageWithAside} from "@/components/layout/page-with-aside";
import {GradeCalculator} from "@/components/tools/grade-calculator";
import {getPathname} from "@/i18n/navigation";
import {getToolBySlug, tools} from "@/lib/tools";
import {getLocalizedMetadata} from "@/lib/seo/metadata";
import {getWebPageJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";

type ToolDetailPageProps = {
  params: Promise<{slug: string}>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({slug: tool.slug}));
}

export async function generateMetadata({
  params,
}: ToolDetailPageProps): Promise<Metadata> {
  const {slug} = await params;
  const tool = getToolBySlug(slug);

  if (!tool) notFound();

  const t = await getTranslations("Tools");
  const title = t(`items.${tool.key}.title`);
  const description = t(`items.${tool.key}.description`);

  return {
    ...(await getLocalizedMetadata(tool.href, {
      title,
      description,
      imageAlt: title,
    })),
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
  };
}

export default async function ToolDetailPage({
  params,
}: ToolDetailPageProps) {
  const {slug} = await params;
  const tool = getToolBySlug(slug);

  if (!tool) notFound();

  const [t, locale] = await Promise.all([
    getTranslations("Tools"),
    getLocale(),
  ]);
  const title = t(`items.${tool.key}.title`);
  const description = t(`items.${tool.key}.description`);
  const pageUrl = absoluteUrl(await getPathname({href: tool.href, locale}));

  return (
    <>
      <PageBreadcrumb
        items={[
          {label: t("title"), href: "/tools", icon: BoxIcon},
          {label: title},
        ]}
        className="shrink-0 py-4"
      />

      <PageWithAside>
        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <JsonLd
            data={getWebPageJsonLd({
              locale,
              url: pageUrl,
              name: title,
              description,
            })}
          />

          <header>
            <h1 className="min-w-0 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
          </header>

          <GradeCalculator toolKey={tool.key} />
        </section>
      </PageWithAside>
    </>
  );
}
