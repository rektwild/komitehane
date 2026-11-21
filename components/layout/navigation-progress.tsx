"use client";

import {Suspense, useCallback, useEffect, useRef} from "react";
// Raw next/navigation hooks on purpose: next-intl's usePathname strips the
// locale prefix, so a locale switch (/tr/haberler -> /en/news) would not
// register as a route change. This component renders no links.
import {usePathname, useSearchParams} from "next/navigation";

import {
  NAVIGATION_START_EVENT,
  getNavigationKey,
  type NavigationStartDetail,
} from "@/lib/navigation-progress";

const INITIAL_PROGRESS = 0.3;
const START_PROGRESS = 0.1;
const MAX_TRICKLE_PROGRESS = 0.9;
const TRICKLE_INTERVAL_MS = 300;
const HIDE_DELAY_MS = 550;
const SAFETY_TIMEOUT_MS = 15_000;

type ProgressState = "idle" | "loading" | "done";

type ProgressController = {
  start: (from: number) => void;
  done: () => void;
  dispose: () => void;
};

function createProgressController(bar: HTMLElement): ProgressController {
  let value = 0;
  let trickleTimer: number | undefined;
  let hideTimer: number | undefined;
  let safetyTimer: number | undefined;

  const render = () => {
    bar.style.transform = `scaleX(${value})`;
  };

  const setState = (state: ProgressState) => {
    bar.dataset.state = state;
  };

  const clearTimers = () => {
    window.clearInterval(trickleTimer);
    window.clearTimeout(hideTimer);
    window.clearTimeout(safetyTimer);
  };

  // Moves the bar without animating, e.g. when restarting after a fade-out.
  const jumpTo = (next: number) => {
    bar.style.transition = "none";
    value = next;
    render();
    // Force a reflow so the next change animates from this position.
    void bar.offsetWidth;
    bar.style.transition = "";
  };

  const done = () => {
    if (bar.dataset.state !== "loading") return;
    clearTimers();
    value = 1;
    render();
    setState("done");
    hideTimer = window.setTimeout(() => {
      setState("idle");
      jumpTo(0);
    }, HIDE_DELAY_MS);
  };

  const start = (from: number) => {
    clearTimers();
    if (bar.dataset.state !== "loading" || value >= MAX_TRICKLE_PROGRESS) {
      jumpTo(from);
    } else {
      // Already loading (e.g. the server-rendered initial state): never move
      // the bar backwards.
      value = Math.max(value, from);
      render();
    }
    setState("loading");
    trickleTimer = window.setInterval(() => {
      // Ease towards the cap so long loads keep moving but never finish early.
      value += (MAX_TRICKLE_PROGRESS - value) * 0.12;
      render();
    }, TRICKLE_INTERVAL_MS);
    safetyTimer = window.setTimeout(done, SAFETY_TIMEOUT_MS);
  };

  return {start, done, dispose: clearTimers};
}

function getCurrentNavigationKey() {
  return getNavigationKey(window.location);
}

function RouteChangeListener({onRouteChange}: {onRouteChange: () => void}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const previousRouteKey = useRef(routeKey);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) return;
    previousRouteKey.current = routeKey;
    onRouteChange();
  }, [routeKey, onRouteChange]);

  return null;
}

/**
 * Blue top loading bar for the initial page load and client-side navigations.
 * The server-rendered markup starts in the loading state so the bar is
 * visible before hydration; it completes on `window` load.
 */
export function NavigationProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ProgressController | null>(null);
  const committedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const controller = createProgressController(bar);
    controllerRef.current = controller;
    committedKeyRef.current = getCurrentNavigationKey();

    // Initial load: continue from the server-rendered position.
    controller.start(INITIAL_PROGRESS);
    const finishInitialLoad = () => controller.done();
    if (document.readyState === "complete") {
      finishInitialLoad();
    } else {
      window.addEventListener("load", finishInitialLoad, {once: true});
    }

    const handleNavigationStart = (event: Event) => {
      const {url} = (event as CustomEvent<NavigationStartDetail>).detail;
      const target = new URL(url);
      // Same page (or hash-only change): no route change will follow, so
      // starting the bar would leave it waiting for the safety timeout.
      if (
        target.origin !== window.location.origin ||
        getNavigationKey(target) === committedKeyRef.current
      ) {
        return;
      }
      controller.start(START_PROGRESS);
    };

    window.addEventListener(NAVIGATION_START_EVENT, handleNavigationStart);

    return () => {
      window.removeEventListener("load", finishInitialLoad);
      window.removeEventListener(NAVIGATION_START_EVENT, handleNavigationStart);
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const handleRouteChange = useCallback(() => {
    committedKeyRef.current = getCurrentNavigationKey();
    controllerRef.current?.done();
  }, []);

  return (
    <>
      <div
        ref={barRef}
        aria-hidden="true"
        className="navigation-progress"
        data-state="loading"
        style={{transform: `scaleX(${INITIAL_PROGRESS})`}}
      />
      <noscript>
        <style>{".navigation-progress{display:none}"}</style>
      </noscript>
      <Suspense fallback={null}>
        <RouteChangeListener onRouteChange={handleRouteChange} />
      </Suspense>
    </>
  );
}
