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
import {landingCandidates} from "@/lib/academic/repositories/catalog";
import {academicPath} from "@/lib/academic/seo/paths";

type ToolDetailPageProps = {
  params: Promise<{slug: string}>;
};

export const dynamicParams = false;
export const revalidate = 300;

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
  const description = t(`items.${tool.key}.metaDescription`);

  return getLocalizedMetadata(tool.href, {
    title,
    description,
    imageAlt: title,
    socialImageKey: tool.key,
  });
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
  const description = t(`items.${tool.key}.metaDescription`);
  const pageUrl = absoluteUrl(await getPathname({href: tool.href, locale}));
  const toolsUrl = absoluteUrl(await getPathname({href: "/tools", locale}));
  const academicT = await getTranslations("Academic");
  const available = (await landingCandidates().catch(() => [])).filter(
    (entry) => (entry.system === "MIDTERM") === (tool.category === "midterm"),
  );
  // Every eligible academic page is linked (grouped by university) so none
  // of them is reachable only through the sitemap.
  const availableByUniversity = new Map<string, typeof available>();
  for (const entry of available) {
    const group = availableByUniversity.get(entry.universityName) ?? [];
    group.push(entry);
    availableByUniversity.set(entry.universityName, group);
  }

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
              breadcrumbItems: [
                {name: t("title"), url: toolsUrl},
                {name: title, url: pageUrl},
              ],
            })}
          />

          <header>
            <h1 className="min-w-0 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
          </header>

          <GradeCalculator toolKey={tool.key} />
          {available.length ? (
            <section aria-labelledby={`academic-pages-${tool.key}`} className="flex flex-col gap-3">
              <h2 id={`academic-pages-${tool.key}`} className="text-xl font-semibold tracking-tight">
                {academicT("availableUniversities")}
              </h2>
              {[...availableByUniversity].map(([universityName, entries]) => (
                <details key={universityName} className="rounded-md border px-4 py-2">
                  <summary className="cursor-pointer font-medium">{universityName}</summary>
                  <ul className="mt-2 list-disc ps-5">
                    {entries.map((entry) => (
                      <li key={`${entry.programId}-${entry.classYear}`}>
                        <a
                          className="underline underline-offset-4"
                          href={academicPath(locale, tool.key, entry.universitySlug, entry.facultySlug, entry.programSlug, entry.classYear)}
                        >
                          {entry.facultyName} · {entry.programName} · {academicT("classYearLabel", {year: String(entry.classYear)})}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </section>
          ) : null}
        </section>
      </PageWithAside>
    </>
  );
}
