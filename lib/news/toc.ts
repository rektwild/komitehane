import type {Article} from "@/payload-types";

export type NewsTocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type NewsRenderedHeadingTag = "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * Keep the document outline stable on article pages: the article title owns
 * the page's only h1, so an h1 selected inside Lexical content is rendered as
 * an h2.
 */
export function normalizeNewsHeadingTag(tag: unknown): NewsRenderedHeadingTag {
  if (tag === "h1") return "h2";
  if (tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
    return tag;
  }
  return "h2";
}

export function getNewsTocHeadingLevel(tag: unknown): NewsTocItem["level"] | null {
  if (tag === "h1" || tag === "h2") return 2;
  if (tag === "h3") return 3;
  return null;
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getNodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.children)) {
    return (n.children as unknown[]).map((child) => getNodeText(child)).join("");
  }
  return "";
}

export function getNewsHeadingText(node: unknown): string {
  return getNodeText(node).trim().replace(/\s+/g, " ");
}

export function extractNewsToc(content: Article["content"]): NewsTocItem[] {
  const root = (content as {root?: {children?: unknown[]}})?.root;
  if (!root || !Array.isArray(root.children)) return [];

  const counts = new Map<string, number>();
  const items: NewsTocItem[] = [];

  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const n = node as Record<string, unknown>;

      const level = n.type === "heading" ? getNewsTocHeadingLevel(n.tag) : null;
      if (level !== null) {
        const text = getNewsHeadingText(n);
        if (!text) {
          if (Array.isArray(n.children)) walk(n.children as unknown[]);
          continue;
        }
        const base = slugifyHeading(text) || `section-${items.length + 1}`;
        const nextCount = (counts.get(base) || 0) + 1;
        counts.set(base, nextCount);
        items.push({
          id: nextCount === 1 ? base : `${base}-${nextCount}`,
          text,
          level,
        });
      }

      if (Array.isArray(n.children)) {
        walk(n.children as unknown[]);
      }
    }
  };

  walk(root.children as unknown[]);
  return items;
}
