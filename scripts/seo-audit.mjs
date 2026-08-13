const baseUrl = (process.env.SEO_AUDIT_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const expectIndexable = process.env.SEO_AUDIT_EXPECT_INDEXABLE !== "false";
const locales = ["tr", "en"];

const failures = [];

function fail(message) {
  failures.push(message);
}

function absoluteUrl(pathname) {
  return new URL(pathname, `${baseUrl}/`).toString();
}

async function fetchText(pathname, options = {}) {
  const response = await fetch(absoluteUrl(pathname), {
    redirect: "manual",
    ...options,
  });
  return {
    response,
    body: await response.text(),
  };
}

function firstMatch(pattern, value) {
  return value.match(pattern)?.[1] || "";
}

function assertPage(locale, body) {
  const lang = firstMatch(/<html[^>]*\slang=["']([^"']+)["']/i, body);
  const title = firstMatch(/<title[^>]*>([^<]+)<\/title>/i, body);
  const description = firstMatch(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    body
  );
  const canonical = firstMatch(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    body
  );
  const robots = firstMatch(
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i,
    body
  );
  const h1Count = (body.match(/<h1\b/gi) || []).length;
  const alternates = [...body.matchAll(
    /<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi
  )];
  const jsonLdScripts = [...body.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];

  if (lang !== locale) fail(`${locale}: html lang is ${lang || "missing"}`);
  if (!title.trim()) fail(`${locale}: missing title`);
  if (!description.trim()) fail(`${locale}: missing description`);
  if (!/^https?:\/\//i.test(canonical)) fail(`${locale}: canonical is not absolute`);
  if (new URL(canonical).search || new URL(canonical).hash) {
    fail(`${locale}: canonical contains query/hash`);
  }
  if (h1Count !== 1) fail(`${locale}: expected exactly one h1, found ${h1Count}`);

  const alternateMap = new Map(alternates.map((match) => [match[1], match[2]]));
  if (!alternateMap.has(locale)) fail(`${locale}: missing self hreflang`);
  for (const expectedLocale of locales) {
    if (!alternateMap.has(expectedLocale)) {
      fail(`${locale}: missing ${expectedLocale} hreflang`);
    }
  }
  if (!alternateMap.has("x-default")) fail(`${locale}: missing x-default hreflang`);

  for (const script of jsonLdScripts) {
    try {
      JSON.parse(script[1]);
    } catch {
      fail(`${locale}: invalid JSON-LD`);
    }
  }

  const graph = jsonLdScripts.flatMap((script) => {
    try {
      const parsed = JSON.parse(script[1]);
      return parsed["@graph"] || [parsed];
    } catch {
      return [];
    }
  });
  for (const type of ["Organization", "WebSite", "WebPage"]) {
    if (!graph.some((entry) => entry["@type"] === type)) {
      fail(`${locale}: missing ${type} JSON-LD`);
    }
  }

  if (expectIndexable && /noindex/i.test(robots)) {
    fail(`${locale}: unexpectedly noindex`);
  }
  if (!expectIndexable && !/noindex/i.test(robots)) {
    fail(`${locale}: preview/development page is indexable`);
  }
}

async function run() {
  const root = await fetchText("/");
  if (![301, 302, 307, 308].includes(root.response.status)) {
    fail(`/: expected redirect, received ${root.response.status}`);
  }
  if (!root.response.headers.get("location")?.endsWith("/tr")) {
    fail(`/: redirect does not target /tr`);
  }

  for (const locale of locales) {
    const page = await fetchText(`/${locale}`);
    if (page.response.status !== 200) {
      fail(`/${locale}: expected 200, received ${page.response.status}`);
      continue;
    }
    assertPage(locale, page.body);
  }

  const missing = await fetchText("/tr/does-not-exist");
  if (missing.response.status !== 404) {
    fail(`/tr/does-not-exist: expected 404, received ${missing.response.status}`);
  }

  const robots = await fetchText("/robots.txt");
  if (robots.response.status !== 200) fail("robots.txt: expected 200");
  if (expectIndexable && !/Sitemap:/i.test(robots.body)) {
    fail("robots.txt: missing sitemap declaration");
  }
  if (!expectIndexable && !/Disallow:\s*\//i.test(robots.body)) {
    fail("robots.txt: preview/development must disallow / ");
  }

  const sitemap = await fetchText("/sitemap.xml");
  if (sitemap.response.status !== 200) fail("sitemap.xml: expected 200");
  const sitemapLocs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(
    (match) => match[1]
  );
  if (expectIndexable) {
    for (const locale of locales) {
      const expected = absoluteUrl(`/${locale}`);
      if (!sitemapLocs.includes(expected)) {
        fail(`sitemap.xml: missing ${expected}`);
      }
    }
    if (sitemapLocs.some((url) => /[?&](?:sort|filter|q|page)=/i.test(url))) {
      fail("sitemap.xml: contains a query-string URL");
    }
  } else if (sitemapLocs.length > 0) {
    fail("sitemap.xml: preview/development sitemap should be empty");
  }

  const llms = await fetchText("/llms.txt");
  if (llms.response.status !== 200 || !/^# Komitehane/m.test(llms.body)) {
    fail("llms.txt: expected a public text resource");
  }

  if (failures.length > 0) {
    console.error(failures.map((failure) => `FAIL ${failure}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(
    `SEO audit passed for ${baseUrl} (${expectIndexable ? "indexable" : "noindex"} mode).`
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

