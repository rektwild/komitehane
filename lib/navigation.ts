import type {AppPathname} from "@/i18n/routing";
import {
  SHOW_PUBLIC_AUTH_ENTRY,
  publicAuthEntryLinks,
  visiblePublicAuthEntryLinks,
} from "@/lib/auth-entry";

const inactiveRouteList = [
  "/library",
  "/podcasts",
  "/communities",
  "/store",
] as const satisfies readonly AppPathname[];

export const inactiveRoutes: ReadonlySet<string> = new Set(
  inactiveRouteList,
);

const authEntryRoutes: ReadonlySet<string> = new Set(
  publicAuthEntryLinks.map((link) => link.href),
);

/**
 * Whether a navigation link may be rendered. Inactive sections and the
 * not-yet-launched auth pages return 404, so linking them sitewide would
 * create broken internal links for users and crawlers.
 */
export function isLinkableRoute(
  href: string,
  authEntryEnabled: boolean = SHOW_PUBLIC_AUTH_ENTRY,
): boolean {
  if (inactiveRoutes.has(href)) return false;
  if (authEntryRoutes.has(href)) {
    return visiblePublicAuthEntryLinks(authEntryEnabled).some(
      (link) => link.href === href,
    );
  }
  return true;
}
