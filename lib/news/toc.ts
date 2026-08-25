import type {Article} from "@/payload-types";

export type NewsTocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

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

export function extractNewsToc(content: Article["content"]): NewsTocItem[] {
  const root = (content as {root?: {children?: unknown[]}})?.root;
  if (!root || !Array.isArray(root.children)) return [];

  const counts = new Map<string, number>();
  const items: NewsTocItem[] = [];

  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const n = node as Record<string, unknown>;

      if (n.type === "heading" && (n.tag === "h2" || n.tag === "h3")) {
        const text = getNodeText(n).trim().replace(/\s+/g, " ");
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
          level: n.tag === "h3" ? 3 : 2,
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
