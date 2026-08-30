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
import {toolCategories, type ToolCategory} from "@/lib/tools";

const ALL_CATEGORIES = "all";

export function ToolsFilterDropdown({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory?: ToolCategory;
  onCategoryChange: (category?: ToolCategory) => void;
}) {
  const t = useTranslations("Tools");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-label={t("catalog.filter.label")}
          />
        }
      >
        <ListFilterIcon aria-hidden="true" data-icon="inline-start" />
        <span className="hidden sm:inline">{t("catalog.filter.label")}</span>
        <ChevronDownIcon aria-hidden="true" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("catalog.filter.categories")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={selectedCategory ?? ALL_CATEGORIES}
            onValueChange={(value) => {
              onCategoryChange(
                value === ALL_CATEGORIES
                  ? undefined
                  : toolCategories.find((category) => category === value),
              );
            }}
          >
            <DropdownMenuRadioItem value={ALL_CATEGORIES}>
              {t("catalog.filter.allCategories")}
            </DropdownMenuRadioItem>
            {toolCategories.map((category) => (
              <DropdownMenuRadioItem key={category} value={category}>
                {t(`categories.${category}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
