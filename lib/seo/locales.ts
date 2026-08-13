import type {Locale} from "next-intl";

import {localeNames, localeToOpenGraphLocale} from "@/config/site";

const rtlLocales = ["ar"] as const;

export function getOgLocale(locale: Locale): string {
  return localeToOpenGraphLocale[locale];
}

export function getLocaleName(locale: Locale): string {
  return localeNames[locale];
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return (rtlLocales as readonly string[]).includes(locale) ? "rtl" : "ltr";
}
