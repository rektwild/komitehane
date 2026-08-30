"use client";

import {useMemo, useState} from "react";
import {
  ArrowDownUpIcon,
  ChevronDownIcon,
  SearchIcon,
} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {ToolCard} from "@/components/tools/tool-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {tools, type ToolCategory} from "@/lib/tools";
import {useRouter} from "@/i18n/navigation";
import {ToolsFilterDropdown} from "@/components/tools/tools-filter-dropdown";

const sortOrders = ["default", "az", "za"] as const;
type SortOrder = (typeof sortOrders)[number];

function isSortOrder(value: string): value is SortOrder {
  return sortOrders.includes(value as SortOrder);
}

export function ToolsCatalog({
  initialCategory,
  initialQuery,
}: {
  initialCategory?: ToolCategory;
  initialQuery?: string;
}) {
  const t = useTranslations("Tools");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [category, setCategory] = useState<ToolCategory | undefined>(initialCategory);

  const updateCategory = (nextCategory: ToolCategory | undefined) => {
    setCategory(nextCategory);

    const nextQuery: Record<string, string> = {};
    const normalizedQuery = query.trim();
    if (nextCategory) nextQuery.category = nextCategory;
    if (normalizedQuery) nextQuery.q = normalizedQuery;

    router.push(
      Object.keys(nextQuery).length
        ? {pathname: "/tools", query: nextQuery}
        : {pathname: "/tools"},
    );
  };

  const clearFilters = () => {
    setQuery("");
    setCategory(undefined);
    router.push({pathname: "/tools"});
  };

  const visibleTools = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    const matchingTools = tools.filter((tool) => {
      if (category && tool.category !== category) return false;
      if (!normalizedQuery) return true;

      const searchableText = [
        t(`items.${tool.key}.title`),
        t(`items.${tool.key}.description`),
      ]
        .join(" ")
        .toLocaleLowerCase(locale);

      return searchableText.includes(normalizedQuery);
    });

    if (sortOrder === "default") return matchingTools;

    return [...matchingTools].sort((firstTool, secondTool) => {
      const firstTitle = t(`items.${firstTool.key}.title`);
      const secondTitle = t(`items.${secondTool.key}.title`);
      const comparison = firstTitle.localeCompare(secondTitle, locale, {
        sensitivity: "base",
      });

      return sortOrder === "az" ? comparison : -comparison;
    });
  }, [category, locale, query, sortOrder, t]);

  return (
    <div className="flex flex-col gap-6">
      <div role="search" className="flex w-full items-center gap-2">
        <InputGroup className="h-9 min-w-0 flex-1 rounded-xl bg-background shadow-none">
          <InputGroupAddon className="pointer-events-none absolute inset-y-0 start-0 z-10 h-9 !ps-3">
            <SearchIcon aria-hidden="true" className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id="tools-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("catalog.search.placeholder")}
            aria-label={t("catalog.search.label")}
            className="h-9 !ps-10 !pe-3 text-sm"
          />
        </InputGroup>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="lg"
                aria-label={t("catalog.sort.label")}
              />
            }
          >
            <ArrowDownUpIcon aria-hidden="true" data-icon="inline-start" />
            <span className="hidden sm:inline">{t("catalog.sort.label")}</span>
            <ChevronDownIcon aria-hidden="true" data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("catalog.sort.label")}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sortOrder}
                onValueChange={(value) => {
                  if (isSortOrder(value)) setSortOrder(value);
                }}
              >
                <DropdownMenuRadioItem value="default">
                  {t("catalog.sort.default")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="az">
                  {t("catalog.sort.az")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="za">
                  {t("catalog.sort.za")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolsFilterDropdown
          selectedCategory={category}
          onCategoryChange={updateCategory}
        />
      </div>

      {query.trim() || category ? (
        <div className="flex justify-end">
          <Button type="button" variant="link" onClick={clearFilters}>
            {t("catalog.clearFilters")}
          </Button>
        </div>
      ) : null}

      {visibleTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTools.map((tool) => (
            <ToolCard key={tool.key} tool={tool} />
          ))}
        </div>
      ) : (
        <Empty className="min-h-52 border border-dashed border-border/60 bg-card text-card-foreground">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t("catalog.empty.title")}</EmptyTitle>
            <EmptyDescription>{t("catalog.empty.description")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
