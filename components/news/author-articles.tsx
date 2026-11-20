"use client";

import {useDeferredValue, useState, useSyncExternalStore, type ReactNode} from "react";
import {LayoutGridIcon, ListIcon, SearchIcon} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/input-group";
import {cn} from "@/lib/utils";

export type AuthorArticleItem = {
  id: number;
  /** Lowercase-insensitive text the search box matches against. */
  searchText: string;
  card: ReactNode;
  row: ReactNode;
};

type View = "grid" | "list";

const VIEW_STORAGE_KEY = "komitehane-author-view";
const viewListeners = new Set<() => void>();
let memoryView: View | null = null;

function readView(): View {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function writeView(view: View) {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts only in memory.
  }
  memoryView = view;
  viewListeners.forEach((listener) => listener());
}


function subscribeView(listener: () => void) {
  viewListeners.add(listener);
  return () => viewListeners.delete(listener);
}

function getViewSnapshot(): View {
  return memoryView ?? readView();
}

export function AuthorArticles({items}: {items: AuthorArticleItem[]}) {
  const t = useTranslations("Authors");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const view = useSyncExternalStore(subscribeView, getViewSnapshot, () => "grid" as View);

  const needle = deferredQuery.trim().toLocaleLowerCase(locale);
  const visible = needle
    ? items.filter((item) => item.searchText.toLocaleLowerCase(locale).includes(needle))
    : items;

  const views: Array<{value: View; label: string; Icon: typeof ListIcon}> = [
    {value: "list", label: t("viewList"), Icon: ListIcon},
    {value: "grid", label: t("viewGrid"), Icon: LayoutGridIcon},
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <InputGroup className="h-9 w-full max-w-sm rounded-lg bg-background shadow-none">
          <InputGroupAddon className="pointer-events-none absolute inset-y-0 start-0 z-10 h-9 !ps-3">
            <SearchIcon aria-hidden="true" className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            className="h-9 !ps-10 !pe-3 text-sm"
          />
        </InputGroup>

        <div
          role="group"
          aria-label={t("viewLabel")}
          className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-background p-0.5"
        >
          {views.map(({value, label, Icon}) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              aria-pressed={view === value}
              onClick={() => writeView(value)}
              className={cn(
                "size-7 text-muted-foreground",
                view === value && "bg-muted text-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
            </Button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <Empty className="border border-dashed border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : view === "grid" ? (
        <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id} className="min-w-0">
              {item.card}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="-mx-3 flex flex-col gap-1">
          {visible.map((item) => (
            <li key={item.id} className="min-w-0">
              {item.row}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
