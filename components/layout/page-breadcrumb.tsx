import {Fragment, type ComponentProps} from "react";
import type {LucideIcon} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {Link} from "@/i18n/navigation";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {cn} from "@/lib/utils";

type BreadcrumbHref = ComponentProps<typeof Link>["href"];

export type PageBreadcrumbItem = {
  label: string;
  href?: BreadcrumbHref;
  icon?: LucideIcon;
};

export type PageBreadcrumbProps = {
  items: readonly PageBreadcrumbItem[];
  className?: string;
};

function LearnHouseChevronDivider() {
  return (
    <span aria-hidden="true" className="block h-full w-2">
      <svg
        aria-hidden="true"
        className="block h-full w-2 text-gray-200"
        fill="none"
        focusable="false"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 8 28"
        width="8"
      >
        <path
          d="M1 0 L7 14 L1 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </span>
  );
}

function BreadcrumbTrailSeparator() {
  return (
    <BreadcrumbSeparator className="flex h-8 w-2 shrink-0 items-center p-0">
      <LearnHouseChevronDivider />
    </BreadcrumbSeparator>
  );
}

function BreadcrumbTrailItem({
  item,
  isCurrent,
  isFirst,
}: {
  item: PageBreadcrumbItem;
  isCurrent: boolean;
  isFirst: boolean;
}) {
  const Icon = isFirst ? item.icon : undefined;
  const content = (
    <>
      {Icon ? (
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      ) : null}
      <span
        className={cn(
          "min-w-0 truncate",
          isCurrent ? "max-w-[200px]" : "max-w-[150px]",
        )}
      >
        {item.label}
      </span>
    </>
  );

  return (
    <BreadcrumbItem
      className={cn("flex h-8 min-w-0 items-center", isFirst && "shrink-0")}
    >
      {isCurrent ? (
        <BreadcrumbPage
          className={cn(
            "flex h-full min-w-0 items-center px-2.5 font-medium text-gray-900",
            Icon && "gap-1.5",
          )}
        >
          {content}
        </BreadcrumbPage>
      ) : item.href ? (
        <BreadcrumbLink
          render={<Link href={item.href} />}
          className={cn(
            "flex h-full min-w-0 items-center px-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900",
            Icon && "gap-1.5",
          )}
        >
          {content}
        </BreadcrumbLink>
      ) : (
        <span
          className={cn(
            "flex h-full min-w-0 items-center px-2.5 font-medium text-gray-600",
            Icon && "gap-1.5",
          )}
        >
          {content}
        </span>
      )}
    </BreadcrumbItem>
  );
}

function BreadcrumbOverflowMenu({
  items,
  label,
  menuLabel,
}: {
  items: readonly PageBreadcrumbItem[];
  label: string;
  menuLabel: string;
}) {
  return (
    <BreadcrumbItem className="flex h-8 shrink-0 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={label}
          className="flex h-full items-center px-2.5 text-gray-600 outline-none transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <BreadcrumbEllipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
            {items.map((item) => (
              <DropdownMenuItem
                key={`${item.href ?? "current"}-${item.label}`}
                render={item.href ? <Link href={item.href} /> : undefined}
                className="truncate"
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
  );
}

async function BreadcrumbTrail({
  items,
  ariaLabel,
  overflowLabel,
  overflowMenuLabel,
}: {
  items: readonly PageBreadcrumbItem[];
  ariaLabel: string;
  overflowLabel: string;
  overflowMenuLabel: string;
}) {
  const hasOverflow = items.length > 3;
  const firstItem = items[0];
  const currentItem = items[items.length - 1];
  const penultimateItem = items[items.length - 2];

  return (
    <Breadcrumb aria-label={ariaLabel} className="max-w-full min-w-0">
      <BreadcrumbList className="w-fit max-w-full min-w-0 flex-nowrap gap-0 overflow-hidden bg-transparent p-0 text-[13px] font-medium text-gray-900 shadow-none outline-none">
        <BreadcrumbTrailItem
          item={firstItem}
          isCurrent={items.length === 1}
          isFirst
        />

        {items.length > 1 ? <BreadcrumbTrailSeparator /> : null}

        {hasOverflow ? (
          <>
            <BreadcrumbOverflowMenu
              items={items.slice(1, -2)}
              label={overflowLabel}
              menuLabel={overflowMenuLabel}
            />
            <BreadcrumbTrailSeparator />
          </>
        ) : null}

        {items.length > 2 ? (
          <>
            <BreadcrumbTrailItem
              item={penultimateItem}
              isCurrent={false}
              isFirst={false}
            />
            <BreadcrumbTrailSeparator />
          </>
        ) : null}

        {items.length > 1 ? (
          <BreadcrumbTrailItem
            item={currentItem}
            isCurrent
            isFirst={false}
          />
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function NewsTickerSequence({
  items,
  isDuplicate = false,
}: {
  items: readonly string[];
  isDuplicate?: boolean;
}) {
  return (
    <div
      aria-hidden={isDuplicate ? true : undefined}
      className="news-ticker-sequence"
    >
      {items.map((item, index) => (
        <Fragment
          key={`${isDuplicate ? "duplicate" : "primary"}-${index}`}
        >
          <span className="news-ticker-item">{item}</span>
          <span aria-hidden="true" className="news-ticker-separator">
            .
          </span>
        </Fragment>
      ))}
    </div>
  );
}

function NewsTicker({
  items,
  ariaLabel,
}: {
  items: readonly string[];
  ariaLabel: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="news-ticker h-full min-w-0 flex-1 overflow-hidden border-s border-neutral-200/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring/70"
      role="marquee"
      tabIndex={0}
    >
      <div className="h-full min-w-0 overflow-hidden">
        <div className="news-ticker-track">
          <NewsTickerSequence items={items} />
          <NewsTickerSequence items={items} isDuplicate />
        </div>
      </div>
    </div>
  );
}

export async function PageBreadcrumb({
  items,
  className,
}: PageBreadcrumbProps) {
  if (items.length === 0) return null;

  const [breadcrumbT, newsT] = await Promise.all([
    getTranslations("Breadcrumb"),
    getTranslations("News"),
  ]);
  const newsItems = [
    newsT("items.item1"),
    newsT("items.item2"),
    newsT("items.item3"),
  ];

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="flex h-8 w-full min-w-0 overflow-hidden rounded-lg bg-white text-gray-900 shadow-md shadow-gray-300/25 outline outline-1 outline-neutral-200/40">
        <div className="min-w-0 max-w-[58%] shrink-0 overflow-hidden">
          <BreadcrumbTrail
            items={items}
            ariaLabel={breadcrumbT("label")}
            overflowLabel={breadcrumbT("more")}
            overflowMenuLabel={breadcrumbT("menuLabel")}
          />
        </div>
        <NewsTicker items={newsItems} ariaLabel={newsT("label")} />
      </div>
    </div>
  );
}
