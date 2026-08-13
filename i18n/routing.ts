import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en"],
  defaultLocale: "tr",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/courses": "/courses",
    "/library": "/library",
    "/podcasts": "/podcasts",
    "/communities": "/communities",
    "/playgrounds": "/playgrounds",
    "/store": "/store",
    "/login": "/login",
    "/signup": "/signup",
  },
});

export type AppPathname = keyof typeof routing.pathnames;
