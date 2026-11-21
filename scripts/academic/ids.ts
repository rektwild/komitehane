import {createHash} from "node:crypto";

/**
 * Deterministic, UUID-shaped (version 5 bits, RFC 4122 variant) identifier for
 * a namespaced key, so repeated imports address the same rows.
 */
export function stableUuid(key: string): string {
  const bytes = createHash("sha256").update(key).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = bytes.subarray(0, 16).toString("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

export function universityId(slug: string): string {
  return stableUuid(`komitehane:university:${slug}`);
}

export function slugify(s: string): string {
  return s.toLocaleLowerCase("tr").replace(/[ı]/g,"i").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
