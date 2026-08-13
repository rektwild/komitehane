import type {LucideIcon} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {Link} from "@/i18n/navigation";
import type {AppPathname} from "@/i18n/routing";
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

export type PageBreadcrumbItem = {
  label: string;
  href?: AppPathname;
  icon?: LucideIcon;
};

export type PageBreadcrumbProps = {
  items: readonly PageBreadcrumbItem[];
  variant?: "auto" | "section" | "trail";
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
      {isCurrent || !item.href ? (
        <BreadcrumbPage
          className={cn(
            "flex h-full min-w-0 items-center px-2.5 font-medium text-gray-900",
            Icon && "gap-1.5",
          )}
        >
          {content}
        </BreadcrumbPage>
      ) : (
        <BreadcrumbLink
          render={<Link href={item.href} />}
          className={cn(
            "flex h-full min-w-0 items-center px-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900",
            Icon && "gap-1.5",
          )}
        >
          {content}
        </BreadcrumbLink>
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

function BreadcrumbSection({item}: {item: PageBreadcrumbItem}) {
  const Icon = item.icon;

  return (
    <header className="flex min-w-0 items-center gap-5">
      <span
        aria-hidden="true"
        className="grid size-16 shrink-0 place-items-center rounded-2xl border border-border/70 bg-background shadow-md shadow-gray-300/25 outline outline-1 outline-neutral-200/40"
      >
        {Icon ? <Icon className="size-7" strokeWidth={2} /> : null}
      </span>
      <h1 className="min-w-0 truncate text-4xl font-bold tracking-tight text-foreground">
        {item.label}
      </h1>
    </header>
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
    <Breadcrumb aria-label={ariaLabel} className="w-fit max-w-full min-w-0">
      <BreadcrumbList className="w-fit max-w-full min-w-0 flex-nowrap gap-0 overflow-hidden rounded-lg bg-white p-0 text-[13px] font-medium text-gray-900 shadow-md shadow-gray-300/25 outline outline-1 outline-neutral-200/40">
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

export async function PageBreadcrumb({
  items,
  variant = "auto",
  className,
}: PageBreadcrumbProps) {
  if (items.length === 0) return null;

  const t = await getTranslations("Breadcrumb");
  const resolvedVariant =
    variant === "auto" ? (items.length === 1 ? "section" : "trail") : variant;

  const wrapperClass =
    resolvedVariant === "section" ? "w-full" : "w-fit max-w-full min-w-0";

  return (
    <div className={cn(wrapperClass, className)}>
      {resolvedVariant === "section" ? (
        <BreadcrumbSection item={items[items.length - 1]} />
      ) : (
        <BreadcrumbTrail
          items={items}
          ariaLabel={t("label")}
          overflowLabel={t("more")}
          overflowMenuLabel={t("menuLabel")}
        />
      )}
    </div>
  );
}
