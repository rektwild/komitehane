import type {FieldHook} from "payload";

const turkishCharacters: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

export function slugify(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (character) => turkishCharacters[character] ?? character)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export const normalizeSlug: FieldHook = ({originalDoc, siblingData, value}) => {
  if (originalDoc?._status === "published" && originalDoc.slug) {
    return originalDoc.slug;
  }

  const source = typeof value === "string" && value.trim()
    ? value
    : typeof siblingData?.title === "string"
      ? siblingData.title
      : typeof siblingData?.name === "string"
        ? siblingData.name
        : "";

  return slugify(source);
};

const MAX_USER_SLUG_ATTEMPTS = 50;

/**
 * Public author-profile slug. Kept stable once set (renaming a user does not
 * change their profile URL); generated from the name when missing and made
 * unique with a numeric suffix.
 */
export const ensureUserSlug: FieldHook = async ({
  originalDoc,
  req,
  siblingData,
  value,
}) => {
  const requested = typeof value === "string" ? slugify(value) : "";
  const existing = typeof originalDoc?.slug === "string" ? originalDoc.slug : "";
  if (!requested && existing) return existing;

  const name =
    typeof siblingData?.name === "string"
      ? siblingData.name
      : typeof originalDoc?.name === "string"
        ? originalDoc.name
        : "";
  const base = requested || slugify(name);
  if (!base) return undefined;

  for (let attempt = 1; attempt <= MAX_USER_SLUG_ATTEMPTS; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base.slice(0, 90)}-${attempt}`;
    if (candidate === existing) return candidate;

    const {totalDocs} = await req.payload.count({
      collection: "users",
      overrideAccess: true,
      req,
      where: {
        and: [
          {slug: {equals: candidate}},
          ...(originalDoc?.id !== undefined ? [{id: {not_equals: originalDoc.id}}] : []),
        ],
      },
    });

    if (totalDocs === 0) return candidate;
  }

  return `${base.slice(0, 80)}-${Date.now()}`;
};
