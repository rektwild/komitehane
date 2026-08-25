import {Badge} from "@/components/ui/badge";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";
import type {NewsCategory} from "@/lib/news/types";

type BadgeSize = "default" | "compact" | "topic";

type NewsCategoryBadgeProps = {
  category: NewsCategory;
  active?: boolean;
  size?: BadgeSize;
  href?: string | {pathname: string; query?: Record<string, string>};
};

const sizeClasses: Record<BadgeSize, string> = {
  default: "rounded-full px-2.5 py-0.5 text-xs",
  compact:
    "rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest",
  topic:
    "rounded-full px-3 py-1 text-sm font-medium normal-case tracking-normal",
};

export function NewsCategoryBadge({
  category,
  active = false,
  size = "default",
  href,
}: NewsCategoryBadgeProps) {
  const variant = active ? "default" : size === "topic" ? "secondary" : "outline";
  // topic with secondary gets bg-muted override to match REUI dark pill on light bg
  const topicBg = size === "topic" && !active ? "bg-muted hover:bg-muted/80" : "";

  const resolvedHref =
    href ??
    ({pathname: "/news", query: {category: category.slug}} as const);

  return (
    <Badge
      variant={variant}
      className={cn(
        "border",
        sizeClasses[size],
        // Ensure border visible for all non-active; active keeps border-transparent from variant
        !active && "border-border/60",
        topicBg,
      )}
      render={<Link href={resolvedHref as never} />}
    >
      {category.name}
    </Badge>
  );
}

type NewsBadgeProps = {
  label: string;
  href: string | {pathname: string; query?: Record<string, string>} | "/news";
  active?: boolean;
  size?: BadgeSize;
};

export function NewsBadge({label, href, active = false, size = "default"}: NewsBadgeProps) {
  const variant = active ? "default" : size === "topic" ? "secondary" : "outline";
  const topicBg = size === "topic" && !active ? "bg-muted hover:bg-muted/80" : "";

  return (
    <Badge
      variant={variant}
      className={cn(
        "border",
        sizeClasses[size],
        !active && "border-border/60",
        topicBg,
      )}
      render={<Link href={href as never} />}
    >
      {label}
    </Badge>
  );
}

/**
 * Non-linked badge (e.g. RankedList static category label)
 */
export function NewsStaticBadge({
  label,
  size = "default",
}: {
  label: string;
  size?: BadgeSize;
}) {
  const topicBg = size === "topic" ? "bg-muted" : "";
  return (
    <Badge
      variant="secondary"
      className={cn("border border-border/60", sizeClasses[size], topicBg)}
    >
      {label}
    </Badge>
  );
}
