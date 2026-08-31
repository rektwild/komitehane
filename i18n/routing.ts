import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en"],
  defaultLocale: "tr",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/news": {
      tr: "/haberler",
      en: "/news",
    },
    "/news/[slug]": {
      tr: "/haberler/[slug]",
      en: "/news/[slug]",
    },
    "/privacy": {
      tr: "/gizlilik-politikasi",
      en: "/privacy",
    },
    "/library": {
      tr: "/kutuphane",
      en: "/library",
    },
    "/podcasts": {
      tr: "/podcastler",
      en: "/podcasts",
    },
    "/communities": {
      tr: "/topluluklar",
      en: "/communities",
    },
    "/tools": {
      tr: "/araclar",
      en: "/tools",
    },
    "/tools/midterm-grade-calculator": {
      tr: "/araclar/vize-not-hesaplama",
      en: "/tools/midterm-grade-calculator",
    },
    "/tools/committee-grade-calculator": {
      tr: "/araclar/komite-not-hesaplama",
      en: "/tools/committee-grade-calculator",
    },
    "/tools/committee-minimum-final-grade": {
      tr: "/araclar/komite-minimum-final-notu",
      en: "/tools/committee-minimum-final-grade",
    },
    "/tools/midterm-minimum-final-grade": {
      tr: "/araclar/vize-minimum-final-notu",
      en: "/tools/midterm-minimum-final-grade",
    },
    "/store": {
      tr: "/magaza",
      en: "/store",
    },
    "/login": {
      tr: "/giris",
      en: "/login",
    },
    "/signup": {
      tr: "/kayit",
      en: "/signup",
    },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
export type StaticAppPathname = Exclude<AppPathname, "/news/[slug]">;
