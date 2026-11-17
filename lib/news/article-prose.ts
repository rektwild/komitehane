import {getNewsHeadingText} from "@/lib/news/toc";

/**
 * Bibliography headings used by published TR/EN articles.
 * Match the heading, not every mention of "kaynak" or "source".
 */
const bibliographyHeadingPattern =
  /^(?:kaynakça|kaynakca|kaynaklar|references|reference list|bibliography|works cited)(?:$|[\s:;,.–—-])|^sources$/u;

export type ArticleProseRole = "references-title" | "reference" | "reference-entry";

const referenceNodeTypes = new Set(["paragraph", "list", "quote"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Lowercase a heading without Turkish dotted-I folding.
 * `toLocaleLowerCase("tr")` turns ASCII "I" into "ı", so "Bibliography"
 * would miss the reference pattern.
 */
export function normalizeArticleHeadingLabel(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replaceAll("İ", "i")
    .replaceAll("I", "i")
    .replaceAll("ı", "i")
    .toLowerCase();
}

export function isBibliographyHeading(value: string): boolean {
  const label = normalizeArticleHeadingLabel(value);
  if (!label) return false;
  return bibliographyHeadingPattern.test(label);
}

function isCitationEntry(node: object): boolean {
  const type = "type" in node && typeof node.type === "string" ? node.type : "";
  if (type === "list") return true;
  return /^\[\d+\]/u.test(getNewsHeadingText(node));
}

export function articleProseClassName(role: ArticleProseRole): string {
  switch (role) {
    case "references-title":
      return "article-references-title";
    case "reference":
      return "article-reference";
    case "reference-entry":
      return "article-reference article-reference-entry";
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

export function classifyArticleProseNodes(content: unknown): WeakMap<object, ArticleProseRole> {
  const roles = new WeakMap<object, ArticleProseRole>();
  if (!isRecord(content) || !isRecord(content.root) || !Array.isArray(content.root.children)) {
    return roles;
  }

  let inBibliography = false;

  for (const child of content.root.children) {
    if (!isRecord(child)) continue;

    if (child.type === "heading") {
      inBibliography = isBibliographyHeading(getNewsHeadingText(child));
      if (inBibliography) roles.set(child, "references-title");
      continue;
    }

    if (!inBibliography) continue;

    const type = typeof child.type === "string" ? child.type : "";
    if (!referenceNodeTypes.has(type)) continue;

    roles.set(child, isCitationEntry(child) ? "reference-entry" : "reference");
  }

  return roles;
}

export function listArticleProseRoles(content: unknown): Array<ArticleProseRole | null> {
  const roles = classifyArticleProseNodes(content);
  if (!isRecord(content) || !isRecord(content.root) || !Array.isArray(content.root.children)) {
    return [];
  }

  return content.root.children.map((child) => {
    if (!isRecord(child)) return null;
    return roles.get(child) ?? null;
  });
}
