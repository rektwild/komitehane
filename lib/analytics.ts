import {gaConfig} from "@/config/analytics";
import type {ToolKey} from "@/lib/tools";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Every custom GA4 event the site sends. Keep names snake_case and ≤40
 * characters, and never put user-entered values (grades, weights, results)
 * or identifiers in params. Register new params as custom dimensions in GA
 * Admin, otherwise they never show up in reports.
 */
export type AnalyticsEvent = {
  name: "tool_calculate";
  params: {
    tool_key: ToolKey;
    result_status: "calculated" | "already_passing" | "impossible" | "invalid_input";
    grading_mode: "official" | "manual";
    assessment_count: number;
  };
};

/**
 * gtag.js only processes `Arguments` objects from the data layer (an array
 * push is ignored), so mirror the official snippet. Events pushed before
 * gtag.js loads are queued and replayed by it.
 */
const gtag = function () {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
} as (...args: unknown[]) => void;

export function trackEvent({name, params}: AnalyticsEvent): void {
  if (!gaConfig.enabled || typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  gtag("event", name, params);
}
