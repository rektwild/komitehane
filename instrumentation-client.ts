import {
  NAVIGATION_START_EVENT,
  type NavigationStartDetail,
} from "@/lib/navigation-progress";

// Fires for every App Router navigation (Link clicks, router.push/replace and
// browser back/forward). The top loading bar listens for this event.
export function onRouterTransitionStart(url: string) {
  const detail: NavigationStartDetail = {
    url: new URL(url, window.location.href).href,
  };

  window.dispatchEvent(
    new CustomEvent<NavigationStartDetail>(NAVIGATION_START_EVENT, {detail}),
  );
}
