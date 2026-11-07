export type LexicalUploadImage = {
  kind: "image";
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  caption: string | null;
};

export type LexicalUploadFile = {
  kind: "file";
  url: string;
  label: string;
  caption: string | null;
};

export type LexicalUploadResolution = LexicalUploadImage | LexicalUploadFile;

type ResolveLexicalUploadOptions = {
  fallbackAlt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown): number | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric);
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("//")) return null;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

function collectCaptionText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(collectCaptionText).join(" ");
  if (!isRecord(value)) return "";

  const own = typeof value.text === "string" ? value.text : "";
  const children = value.children === undefined ? "" : collectCaptionText(value.children);
  const root = value.root === undefined ? "" : collectCaptionText(value.root);
  return [own, children, root].filter(Boolean).join(" ");
}

function captionFromFields(fields: unknown): string | null {
  if (!isRecord(fields) || !("caption" in fields)) return null;

  const caption = collectCaptionText(fields.caption).replace(/\s+/gu, " ").trim();
  return caption || null;
}

function altText(
  fields: unknown,
  media: Record<string, unknown>,
  fallbackAlt: string,
): string {
  const fieldAlt = isRecord(fields) && typeof fields.alt === "string" ? fields.alt.trim() : "";
  const mediaAlt = typeof media.alt === "string" ? media.alt.trim() : "";
  return fieldAlt || mediaAlt || fallbackAlt.trim();
}

function sizedUrl(sizes: unknown): string | null {
  if (!isRecord(sizes)) return null;

  for (const size of Object.values(sizes)) {
    if (!isRecord(size)) continue;
    const url = safeUrl(size.url);
    if (url) return url;
  }

  return null;
}

function mediaUrl(media: Record<string, unknown>): string | null {
  return safeUrl(media.url) ?? sizedUrl(media.sizes) ?? safeUrl(media.thumbnailURL);
}

/**
 * Standard Lexical upload nodes store a media id until population replaces
 * `value` with the document. The stock JSX converter throws when that
 * document has no `mimeType` — article queries select media without always
 * including it — and the public renderer then drops the node. Resolve the
 * image from the populated url instead, and return null for ids or missing files.
 */
export function resolveLexicalUpload(
  node: unknown,
  {fallbackAlt}: ResolveLexicalUploadOptions,
): LexicalUploadResolution | null {
  if (!isRecord(node) || node.type !== "upload" || !isRecord(node.value)) return null;

  const media = node.value;
  const url = mediaUrl(media);
  if (!url) return null;

  const caption = captionFromFields(node.fields);
  const mimeType = typeof media.mimeType === "string" ? media.mimeType.trim().toLowerCase() : "";

  if (mimeType && !mimeType.startsWith("image/")) {
    const filename = typeof media.filename === "string" ? media.filename.trim() : "";
    return {
      kind: "file",
      url,
      label: filename || altText(node.fields, media, "") || url,
      caption,
    };
  }

  return {
    kind: "image",
    url,
    alt: altText(node.fields, media, fallbackAlt),
    width: positiveInteger(media.width),
    height: positiveInteger(media.height),
    caption,
  };
}
