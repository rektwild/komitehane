const baseUrl = (process.env.SEO_AUDIT_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const expectIndexable = process.env.SEO_AUDIT_EXPECT_INDEXABLE !== "false";
const articlePath = process.env.SEO_AUDIT_ARTICLE_PATH?.trim() || "";
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

function getAlternateMap(body) {
  const alternates = [
    ...body.matchAll(
      /<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi
    ),
  ];
  return new Map(alternates.map((match) => [match[1], match[2]]));
}

function getJsonLdGraph(body, label) {
  const scripts = [
    ...body.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  const parsed = [];

  for (const script of scripts) {
    try {
      parsed.push(JSON.parse(script[1]));
    } catch {
      fail(`${label}: invalid JSON-LD`);
    }
  }

  return parsed.flatMap((entry) =>
    entry && typeof entry === "object" && Array.isArray(entry["@graph"])
      ? entry["@graph"]
      : [entry]
  );
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
  const alternateMap = getAlternateMap(body);

  if (lang !== locale) fail(`${locale}: html lang is ${lang || "missing"}`);
  if (!title.trim()) fail(`${locale}: missing title`);
  if (!description.trim()) fail(`${locale}: missing description`);
  if (!/^https?:\/\//i.test(canonical)) fail(`${locale}: canonical is not absolute`);
  if (new URL(canonical).search || new URL(canonical).hash) {
    fail(`${locale}: canonical contains query/hash`);
  }
  if (h1Count !== 1) fail(`${locale}: expected exactly one h1, found ${h1Count}`);

  if (!alternateMap.has(locale)) fail(`${locale}: missing self hreflang`);
  for (const expectedLocale of locales) {
    if (!alternateMap.has(expectedLocale)) {
      fail(`${locale}: missing ${expectedLocale} hreflang`);
    }
  }
  if (!alternateMap.has("x-default")) fail(`${locale}: missing x-default hreflang`);

  const graph = getJsonLdGraph(body, locale);
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

function assertArticlePage(pathname, body) {
  const locale = pathname.match(/^\/(tr|en)(?:\/|$)/i)?.[1]?.toLowerCase();
  const label = `article ${pathname}`;
  if (!locale) {
    fail(`${label}: path must start with /tr or /en`);
    return null;
  }

  const lang = firstMatch(/<html[^>]*\slang=["']([^"']+)["']/i, body);
  const canonical = firstMatch(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    body
  );
  const robots = firstMatch(
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i,
    body
  );
  const h1Count = (body.match(/<h1\b/gi) || []).length;
  const alternateMap = getAlternateMap(body);
  const graph = getJsonLdGraph(body, label);
  const expectedUrl = absoluteUrl(pathname);
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const breadcrumbId = `${canonical}#breadcrumb`;
  const webpage = graph.find(
    (entry) => entry?.["@type"] === "WebPage" && entry?.["@id"] === webpageId
  );
  const article = graph.find(
    (entry) =>
      entry?.["@type"] === "NewsArticle" && entry?.["@id"] === articleId
  );
  const breadcrumb = graph.find(
    (entry) =>
      entry?.["@type"] === "BreadcrumbList" &&
      entry?.["@id"] === breadcrumbId
  );

  if (lang !== locale) fail(`${label}: html lang is ${lang || "missing"}`);
  if (canonical !== expectedUrl) {
    fail(`${label}: canonical does not match the requested localized URL`);
  }
  if (h1Count !== 1) fail(`${label}: expected exactly one h1, found ${h1Count}`);
  if (!alternateMap.has(locale)) fail(`${label}: missing self hreflang`);
  if (alternateMap.get(locale) !== canonical) {
    fail(`${label}: self hreflang does not match canonical`);
  }
  if (alternateMap.has("x-default") && !alternateMap.has("tr")) {
    fail(`${label}: x-default exists without a Turkish alternate`);
  }
  if (
    alternateMap.has("tr") &&
    alternateMap.has("x-default") &&
    alternateMap.get("x-default") !== alternateMap.get("tr")
  ) {
    fail(`${label}: x-default does not match the Turkish alternate`);
  }

  for (const [alternateLocale, alternateUrl] of alternateMap) {
    if (![...locales, "x-default"].includes(alternateLocale)) {
      fail(`${label}: unsupported hreflang ${alternateLocale}`);
      continue;
    }

    try {
      const parsedUrl = new URL(alternateUrl);
      if (parsedUrl.origin !== new URL(baseUrl).origin) {
        fail(`${label}: ${alternateLocale} alternate uses another origin`);
      }
      if (parsedUrl.search || parsedUrl.hash) {
        fail(`${label}: ${alternateLocale} alternate contains query/hash`);
      }
    } catch {
      fail(`${label}: ${alternateLocale} alternate is not absolute`);
    }
  }

  if (!webpage) fail(`${label}: missing linked WebPage JSON-LD`);
  if (!article) fail(`${label}: missing linked NewsArticle JSON-LD`);
  if (!breadcrumb) fail(`${label}: missing linked BreadcrumbList JSON-LD`);

  if (webpage) {
    if (webpage.url !== canonical) fail(`${label}: WebPage URL mismatch`);
    if (webpage.inLanguage !== locale) fail(`${label}: WebPage language mismatch`);
    if (webpage.mainEntity?.["@id"] !== articleId) {
      fail(`${label}: WebPage mainEntity does not point to NewsArticle`);
    }
    if (webpage.breadcrumb?.["@id"] !== breadcrumbId) {
      fail(`${label}: WebPage breadcrumb does not point to BreadcrumbList`);
    }
  }

  if (article) {
    if (article.url !== canonical) fail(`${label}: NewsArticle URL mismatch`);
    if (article.inLanguage !== locale) {
      fail(`${label}: NewsArticle language mismatch`);
    }
    if (article.mainEntityOfPage?.["@id"] !== webpageId) {
      fail(`${label}: NewsArticle mainEntityOfPage does not point to WebPage`);
    }
    if (!article.headline || !article.datePublished || !article.author?.name) {
      fail(`${label}: NewsArticle is missing headline, date, or author`);
    }
  }

  if (breadcrumb) {
    const items = breadcrumb.itemListElement;
    if (!Array.isArray(items) || items.length < 2) {
      fail(`${label}: BreadcrumbList must contain at least two items`);
    } else {
      if (items[0]?.position !== 1 || items[1]?.position !== 2) {
        fail(`${label}: BreadcrumbList positions must start at 1 and 2`);
      }
      const lastItem = items[items.length - 1];
      if (lastItem?.item !== canonical) {
        fail(`${label}: final breadcrumb item does not match canonical`);
      }
      if (items.some((item) => !item?.name || !item?.item)) {
        fail(`${label}: BreadcrumbList contains an incomplete item`);
      }
    }
  }

  if (expectIndexable && /noindex/i.test(robots)) {
    fail(`${label}: unexpectedly noindex`);
  }
  if (!expectIndexable && !/noindex/i.test(robots)) {
    fail(`${label}: preview/development page is indexable`);
  }

  return {locale, canonical, alternateMap};
}

async function assertArticleAlternates(pathname, source) {
  for (const [alternateLocale, alternateUrl] of source.alternateMap) {
    if (alternateLocale === "x-default" || alternateUrl === source.canonical) {
      continue;
    }

    let target;
    try {
      target = new URL(alternateUrl);
    } catch {
      continue;
    }

    const targetPath = target.pathname;
    const targetPage = await fetchText(targetPath);
    if (targetPage.response.status !== 200) {
      fail(`${pathname}: ${alternateLocale} alternate returned ${targetPage.response.status}`);
      continue;
    }

    const targetResult = assertArticlePage(targetPath, targetPage.body);
    if (!targetResult) continue;

    const reciprocal = targetResult.alternateMap.get(source.locale);
    if (reciprocal !== source.canonical) {
      fail(`${pathname}: ${alternateLocale} page does not reciprocate ${source.locale}`);
    }
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
    if (articlePath && !sitemapLocs.includes(absoluteUrl(articlePath))) {
      fail(`sitemap.xml: missing audited article ${absoluteUrl(articlePath)}`);
    }
  } else if (sitemapLocs.length > 0) {
    fail("sitemap.xml: preview/development sitemap should be empty");
  }

  const llms = await fetchText("/llms.txt");
  if (llms.response.status !== 200 || !/^# Komitehane/m.test(llms.body)) {
    fail("llms.txt: expected a public text resource");
  }

  if (articlePath) {
    if (!articlePath.startsWith("/")) {
      fail("SEO_AUDIT_ARTICLE_PATH: expected an absolute path beginning with /");
    } else {
      const article = await fetchText(articlePath);
      if (article.response.status !== 200) {
        fail(`SEO_AUDIT_ARTICLE_PATH: expected 200, received ${article.response.status}`);
      } else {
        const result = assertArticlePage(articlePath, article.body);
        if (result) await assertArticleAlternates(articlePath, result);
      }
    }
  } else {
    console.log(
      "SEO audit: SEO_AUDIT_ARTICLE_PATH is not set; article detail checks skipped."
    );
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
