import "server-only";

import {
  indexNowEndpoint,
  indexNowKey,
  siteUrl,
} from "@/config/site";

const MAX_URLS_PER_REQUEST = 10_000;
const validKeyPattern = /^[A-Za-z0-9-]{8,128}$/;

export type IndexNowResult = {
  submitted: number;
  skipped: boolean;
  statuses: number[];
};

function getKeyLocation(): string | undefined {
  if (!indexNowKey) return undefined;
  return `${siteUrl}/indexnow/${encodeURIComponent(indexNowKey)}`;
}


function normalizeUrls(urls: readonly string[]): string[] {
  const origin = new URL(siteUrl).origin;
  const normalized = new Set<string>();

  for (const value of urls) {
    try {
      const url = new URL(value);

      if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) {
        continue;
      }

      url.hash = "";
      normalized.add(url.toString());
    } catch {
      // Ignore malformed values in a publishing batch.
    }
  }

  return [...normalized];
}

/**
 * Submit URLs after a meaningful publish/update/delete event.
 * This utility is intentionally not called from page requests.
 */
export async function submitIndexNow(
  urls: readonly string[]
): Promise<IndexNowResult> {
  if (!indexNowKey || !validKeyPattern.test(indexNowKey)) {
    return {submitted: 0, skipped: true, statuses: []};
  }

  const normalizedUrls = normalizeUrls(urls);
  if (normalizedUrls.length === 0) {
    return {submitted: 0, skipped: true, statuses: []};
  }

  const host = new URL(siteUrl).host;
  const keyLocation = getKeyLocation();
  const statuses: number[] = [];

  for (let offset = 0; offset < normalizedUrls.length; offset += MAX_URLS_PER_REQUEST) {
    const urlList = normalizedUrls.slice(offset, offset + MAX_URLS_PER_REQUEST);
    const response = await fetch(indexNowEndpoint, {
      method: "POST",
      headers: {"Content-Type": "application/json; charset=utf-8"},
      body: JSON.stringify({
        host,
        key: indexNowKey,
        ...(keyLocation ? {keyLocation} : {}),
        urlList,
      }),
    });

    statuses.push(response.status);

    if (!response.ok && response.status !== 202) {
      console.warn(`IndexNow submission returned HTTP ${response.status}.`);
    }
  }

  return {
    submitted: normalizedUrls.length,
    skipped: false,
    statuses,
  };
}
