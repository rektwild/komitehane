import type {AppPathname} from "@/i18n/routing";

/**
 * Shared header sign-up and log-in buttons.
 *
 * Authentication is not launched yet, so these entry buttons are omitted from
 * the header. Button markup, `/login` and `/signup` pathnames, and the
 * `Header.auth` translations stay in place.
 *
 * Re-enable when auth launches by setting this constant to `true`.
 * No environment variable or feature-flag service is required.
 */
export const SHOW_PUBLIC_AUTH_ENTRY: boolean = false;

export const publicAuthEntryLinks = [
  {href: "/login", labelKey: "login"},
  {href: "/signup", labelKey: "signup"},
] as const satisfies readonly {
  href: AppPathname;
  labelKey: "login" | "signup";
}[];

export function visiblePublicAuthEntryLinks(
  enabled: boolean = SHOW_PUBLIC_AUTH_ENTRY,
) {
  if (!enabled) {
    return [];
  }

  return publicAuthEntryLinks;
}
