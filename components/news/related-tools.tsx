"use client";

import {useTranslations} from "next-intl";

import {ToolCard} from "@/components/tools/tool-card";
import {tools} from "@/lib/tools";
import {typography} from "@/lib/typography";

export function RelatedTools() {
  const t = useTranslations("NewsPage");

  return (
    <section
      aria-labelledby="related-tools-title"
      className="mt-12 md:mt-16"
    >
      <h2
        id="related-tools-title"
        className={typography.title}
      >
        {t("relatedToolsTitle")}
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <ToolCard key={tool.key} tool={tool} />
        ))}
      </div>
    </section>
  );
}
