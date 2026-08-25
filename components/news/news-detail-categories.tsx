import {getTranslations} from "next-intl/server";

import {NewsBadge, NewsCategoryBadge} from "@/components/news/news-category-badge";
import {getNewsCategories} from "@/lib/news/data";
import type {NewsLocale} from "@/lib/news/types";

type NewsDetailCategoriesProps = {
  locale: NewsLocale;
  selectedCategory?: string;
};

export async function NewsDetailCategories({
  locale,
  selectedCategory,
}: NewsDetailCategoriesProps) {
  const [t, categories] = await Promise.all([
    getTranslations("NewsPage"),
    getNewsCategories(locale),
  ]);

  if (!categories.length) return null;

  return (
    <section aria-labelledby="detail-categories-title" className="space-y-4">
      <h2
        id="detail-categories-title"
        className="flex items-center gap-3 text-base font-bold leading-none tracking-tight text-foreground"
      >
        <span>{t("categories")}</span>
        <span aria-hidden="true" className="h-[2px] flex-1 self-center bg-action" />
      </h2>

      <div className="flex flex-wrap gap-2">
        <NewsBadge
          label={t("allCategories")}
          href="/news"
          active={!selectedCategory}
          size="default"
        />
        {categories.map((category) => (
          <NewsCategoryBadge
            key={category.id}
            category={category}
            active={selectedCategory === category.slug}
            size="default"
          />
        ))}
      </div>
    </section>
  );
}
