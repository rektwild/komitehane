import type {Locale} from "next-intl";

import {tools, type ToolKey} from "@/lib/tools";

export const pageSocialImageKeys = ["home", "tools", "news", "about", "privacy"] as const;

export type SocialImageKey = (typeof pageSocialImageKeys)[number] | ToolKey;

export const socialImageKeys: readonly SocialImageKey[] = [
  ...pageSocialImageKeys,
  ...tools.map((tool) => tool.key),
];

export function isSocialImageKey(value: string): value is SocialImageKey {
  return (socialImageKeys as readonly string[]).includes(value);
}

/** Path of the prerendered 1200x630 social image for a page. */
export function socialImagePath(locale: Locale, key: SocialImageKey): string {
  return `/og/${locale}/${key}`;
}
