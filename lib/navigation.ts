import type {AppPathname} from "@/i18n/routing";

const inactiveRouteList = [
  "/library",
  "/podcasts",
  "/communities",
  "/store",
] as const satisfies readonly AppPathname[];

export const inactiveRoutes: ReadonlySet<string> = new Set(
  inactiveRouteList,
);
