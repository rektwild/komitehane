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
