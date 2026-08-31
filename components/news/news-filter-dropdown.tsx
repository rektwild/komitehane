"use client";

import {ChevronDownIcon, ListFilterIcon} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {useRouter} from "@/i18n/navigation";
import type {NewsCategory, NewsTag} from "@/lib/news/types";

const ALL_CATEGORIES = "__all_categories__";
const ALL_TAGS = "__all_tags__";

export function NewsFilterDropdown({
  categories,
  tags,
  selectedCategory,
  selectedTag,
  query,
}: {
  categories: NewsCategory[];
  tags: NewsTag[];
  selectedCategory?: string;
  selectedTag?: string;
  query?: string;
}) {
  const t = useTranslations("NewsPage");
  const router = useRouter();

  if (!categories.length && !tags.length) return null;

  const getNextQuery = (nextCategory?: string, nextTag?: string) => {
    const nextQuery: Record<string, string> = {};
    if (nextCategory) nextQuery.category = nextCategory;
    if (nextTag) nextQuery.tag = nextTag;
    if (query) nextQuery.q = query;

    return nextQuery;
  };

  const handleCategoryChange = (value: string) => {
    const nextQuery = getNextQuery(
      value === ALL_CATEGORIES ? undefined : value,
      selectedTag,
    );

    router.push(
      Object.keys(nextQuery).length
        ? {pathname: "/news", query: nextQuery}
        : {pathname: "/news"},
    );
  };

  const handleTagChange = (value: string) => {
    const nextQuery = getNextQuery(
      selectedCategory,
      value === ALL_TAGS ? undefined : value,
    );

    router.push(
      Object.keys(nextQuery).length
        ? {pathname: "/news", query: nextQuery}
        : {pathname: "/news"},
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-label={t("filterLabel")}
          />
        }
      >
        <ListFilterIcon aria-hidden="true" data-icon="inline-start" />
        <span className="hidden sm:inline">{t("filterLabel")}</span>
        <ChevronDownIcon aria-hidden="true" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {categories.length ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("categories")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedCategory ?? ALL_CATEGORIES}
              onValueChange={handleCategoryChange}
            >
              <DropdownMenuRadioItem value={ALL_CATEGORIES}>
                {t("allCategories")}
              </DropdownMenuRadioItem>
              {categories.map((category) => (
                <DropdownMenuRadioItem key={category.id} value={category.slug}>
                  {category.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        ) : null}
        {tags.length ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("tags")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedTag ?? ALL_TAGS}
              onValueChange={handleTagChange}
            >
              <DropdownMenuRadioItem value={ALL_TAGS}>
                {t("allTags")}
              </DropdownMenuRadioItem>
              {tags.map((tag) => (
                <DropdownMenuRadioItem key={tag.id} value={tag.slug}>
                  {tag.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
