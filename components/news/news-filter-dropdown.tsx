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
import type {NewsCategory} from "@/lib/news/types";

const ALL_CATEGORIES = "all";

export function NewsFilterDropdown({
  categories,
  selectedCategory,
  query,
}: {
  categories: NewsCategory[];
  selectedCategory?: string;
  query?: string;
}) {
  const t = useTranslations("NewsPage");
  const router = useRouter();

  if (!categories.length) return null;

  const handleValueChange = (value: string) => {
    const nextQuery: Record<string, string> = {};
    if (value !== ALL_CATEGORIES) nextQuery.category = value;
    if (query) nextQuery.q = query;

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
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("categories")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={selectedCategory ?? ALL_CATEGORIES}
            onValueChange={handleValueChange}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
