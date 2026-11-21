/**
 * Shared contract between `instrumentation-client.ts` (which observes App
 * Router navigation starts) and `components/layout/navigation-progress.tsx`
 * (which renders the top loading bar). A DOM event is used instead of a shared
 * module store because the instrumentation file is bundled as its own entry.
 */
export const NAVIGATION_START_EVENT = "komitehane:navigation-start";

export type NavigationStartDetail = {
  /** Absolute URL of the navigation target. */
  url: string;
};

/** Path + query used to decide whether a navigation changes the page. */
export function getNavigationKey(url: Pick<URL, "pathname" | "search">): string {
  return `${url.pathname}${url.search}`;
}
