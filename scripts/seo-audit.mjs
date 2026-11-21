const baseUrl = (process.env.SEO_AUDIT_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const expectIndexable = process.env.SEO_AUDIT_EXPECT_INDEXABLE !== "false";
const articlePath = process.env.SEO_AUDIT_ARTICLE_PATH?.trim() || "";
const locales = ["tr", "en"];
const academicPath = process.env.SEO_AUDIT_ACADEMIC_PATH?.trim() || "";
const missingAcademicPath = process.env.SEO_AUDIT_ACADEMIC_MISSING_PATH?.trim() || "";
const authorPath = process.env.SEO_AUDIT_AUTHOR_PATH?.trim() || "";
const newsArchivePath = process.env.SEO_AUDIT_NEWS_ARCHIVE_PATH?.trim() || "";
const expectTrainingAllowed = process.env.SEO_AUDIT_EXPECT_TRAINING_ALLOWED === "true";
const aboutPaths = {tr: "/tr/hakkimizda", en: "/en/about"};
const searchAgents = ["Googlebot", "bingbot", "Google-Extended", "OAI-SearchBot", "PerplexityBot", "Claude-SearchBot", "Applebot", "Amzn-SearchBot"];
const trainingAgents = ["GPTBot", "ClaudeBot", "CCBot", "Applebot-Extended", "meta-externalagent", "Bytespider", "Amazonbot"];
const webPageTypes = ["WebPage", "AboutPage", "CollectionPage", "ProfilePage"];
const toolPaths = {
  tr: ["/tr/araclar/komite-not-hesaplama", "/tr/araclar/komite-minimum-final-notu", "/tr/araclar/vize-not-hesaplama", "/tr/araclar/vize-minimum-final-notu"],
  en: ["/en/tools/committee-grade-calculator", "/en/tools/committee-minimum-final-grade", "/en/tools/midterm-grade-calculator", "/en/tools/midterm-minimum-final-grade"],
};

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

function assertSecurityHeaders(label, response) {
  const expected = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-frame-options": "SAMEORIGIN",
  };
  for (const [name, value] of Object.entries(expected)) {
    if (response.headers.get(name) !== value) fail(`${label}: ${name} header is not ${value}`);
  }
  if (response.headers.has("x-powered-by")) fail(`${label}: x-powered-by header is exposed`);
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
  try {
    const canonicalUrl=new URL(canonical);
    if (!/^https?:$/.test(canonicalUrl.protocol)) fail(`${locale}: canonical is not HTTP(S)`);
    if (canonicalUrl.search || canonicalUrl.hash) fail(`${locale}: canonical contains query/hash`);
  } catch {fail(`${locale}: canonical is not absolute`);}
  if (h1Count !== 1) fail(`${locale}: expected exactly one h1, found ${h1Count}`);

  if (!alternateMap.has(locale)) fail(`${locale}: missing self hreflang`);
  for (const expectedLocale of locales) {
    if (!alternateMap.has(expectedLocale)) {
      fail(`${locale}: missing ${expectedLocale} hreflang`);
    }
  }
  if (!alternateMap.has("x-default")) fail(`${locale}: missing x-default hreflang`);

  const graph = getJsonLdGraph(body, locale);
  for (const type of ["Organization", "WebSite"]) {
    if (!graph.some((entry) => entry["@type"] === type)) {
      fail(`${locale}: missing ${type} JSON-LD`);
    }
  }
  if (!graph.some((entry) => webPageTypes.includes(entry["@type"]))) {
    fail(`${locale}: missing WebPage JSON-LD`);
  }
  const organization = graph.find((entry) => entry["@type"] === "Organization");
  if (organization && (!organization.description || !organization.logo?.url)) {
    fail(`${locale}: Organization JSON-LD is missing description or logo`);
  }
  if (/<h1[^>]*class=["'][^"']*\bsr-only\b/i.test(body)) {
    fail(`${locale}: h1 is visually hidden`);
  }
  const ogImage = firstMatch(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, body);
  if (!ogImage) fail(`${locale}: missing og:image`);

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

function internalLinks(body) {
  return [...body.matchAll(/<a\b[^>]*\shref=["'](\/[^"'#]*)["']/gi)]
    .map((match) => match[1].replace(/&amp;/g, "&"))
    .filter((href) => !href.startsWith("/_next/") && !href.startsWith("//"));
}

async function assertInternalLinks(pages) {
  const checked = new Map();
  for (const [label, body] of pages) {
    for (const href of new Set(internalLinks(body))) {
      if (!checked.has(href)) {
        const {response} = await fetchText(href);
        checked.set(href, response.status);
      }
      const status = checked.get(href);
      if (status >= 400) fail(`${label}: internal link ${href} returned ${status}`);
    }
  }
  return checked.size;
}

function assertAuthorPage(pathname, body) {
  const label = `author ${pathname}`;
  const canonical = firstMatch(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, body);
  const graph = getJsonLdGraph(body, label);
  const profile = graph.find((entry) => entry?.["@type"] === "ProfilePage");
  const person = graph.find((entry) => entry?.["@type"] === "Person");
  const breadcrumb = graph.find((entry) => entry?.["@type"] === "BreadcrumbList");
  if (canonical !== absoluteUrl(pathname)) fail(`${label}: canonical mismatch`);
  if ((body.match(/<h1\b/gi) || []).length !== 1) fail(`${label}: expected exactly one h1`);
  if (!profile || profile.mainEntity?.["@id"] !== person?.["@id"]) fail(`${label}: ProfilePage must point to Person`);
  if (!person?.name || person.url !== canonical) fail(`${label}: Person is missing name or url`);
  if (!breadcrumb || profile?.breadcrumb?.["@id"] !== breadcrumb["@id"]) fail(`${label}: missing linked BreadcrumbList`);
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
    assertSecurityHeaders(`/${locale}`, page.response);
    assertPage(locale, page.body);
  }

  for (const locale of locales) for (const pathname of toolPaths[locale]) {
    const page=await fetchText(pathname);
    if(page.response.status!==200) fail(`${pathname}: expected 200, received ${page.response.status}`);
    else assertPage(locale,page.body);
  }
  const linkSources = [];
  for (const locale of locales) {
    const home = await fetchText(`/${locale}`);
    if (home.response.status === 200) linkSources.push([`/${locale}`, home.body]);
    const about = await fetchText(aboutPaths[locale]);
    if (about.response.status !== 200) {
      fail(`${aboutPaths[locale]}: expected 200, received ${about.response.status}`);
    } else {
      assertPage(locale, about.body);
      if (!getJsonLdGraph(about.body, aboutPaths[locale]).some((entry) => entry?.["@type"] === "AboutPage")) {
        fail(`${aboutPaths[locale]}: missing AboutPage JSON-LD`);
      }
      linkSources.push([aboutPaths[locale], about.body]);
    }
  }
  const toolPage = await fetchText(toolPaths.tr[0]);
  if (toolPage.response.status === 200) {
    linkSources.push([toolPaths.tr[0], toolPage.body]);
    if (!getJsonLdGraph(toolPage.body, toolPaths.tr[0]).some((entry) => entry?.["@type"] === "BreadcrumbList")) {
      fail(`${toolPaths.tr[0]}: missing BreadcrumbList JSON-LD`);
    }
    const ogImage = firstMatch(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, toolPage.body);
    if (ogImage) {
      const image = await fetch(absoluteUrl(new URL(ogImage).pathname));
      if (image.status !== 200 || !/^image\//.test(image.headers.get("content-type") || "")) {
        fail(`${toolPaths.tr[0]}: og:image ${ogImage} is not a served image`);
      }
    }
  }
  const linkCount = await assertInternalLinks(linkSources);
  console.log(`SEO audit: checked ${linkCount} internal link targets.`);

  const outOfRange = await fetchText("/tr/haberler?page=100000");
  if (outOfRange.response.status !== 404) {
    fail(`/tr/haberler?page=100000: expected 404, received ${outOfRange.response.status}`);
  }
  if (newsArchivePath) {
    const archive = await fetchText(newsArchivePath);
    const canonical = firstMatch(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, archive.body);
    const robotsMeta = firstMatch(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i, archive.body);
    if (archive.response.status !== 200) fail(`${newsArchivePath}: expected 200`);
    if (canonical !== absoluteUrl(newsArchivePath)) fail(`${newsArchivePath}: archive page must be self-canonical`);
    if (expectIndexable && /noindex/i.test(robotsMeta)) fail(`${newsArchivePath}: archive page is noindex`);
  }
  const filtered = await fetchText("/tr/haberler?q=tus");
  const filteredRobots = firstMatch(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i, filtered.body);
  if (!/noindex/i.test(filteredRobots)) fail("/tr/haberler?q=tus: search results must be noindex");

  if (authorPath) {
    const author = await fetchText(authorPath);
    if (author.response.status !== 200) fail(`${authorPath}: expected 200, received ${author.response.status}`);
    else assertAuthorPage(authorPath, author.body);
  }

  if (academicPath) {
    const page=await fetchText(academicPath);
    const locale=academicPath.match(/^\/(tr|en)\//)?.[1];
    if (!locale || page.response.status!==200) fail(`${academicPath}: expected a localized 200 academic page`);
    else {
      assertPage(locale,page.body);
      const canonical=firstMatch(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,page.body);
      if(canonical!==absoluteUrl(academicPath.split("?")[0]))fail(`${academicPath}: unexpected canonical`);
      if(!getJsonLdGraph(page.body,academicPath).some(x=>x?.["@type"]==="BreadcrumbList"))fail(`${academicPath}: missing breadcrumb JSON-LD`);
    }
  }
  if (missingAcademicPath) {
    const page=await fetchText(missingAcademicPath);
    if(page.response.status!==404) fail(`${missingAcademicPath}: expected 404, received ${page.response.status}`);
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
  if (expectIndexable) {
    const groups = robots.body.split(/\r?\n\s*\r?\n/);
    for (const agent of trainingAgents) {
      const group = groups.find((entry) =>
        entry.split(/\r?\n/).some((line) =>
          line.trim().toLowerCase() === `user-agent: ${agent.toLowerCase()}`
        )
      );
      const blocked = Boolean(group && /^Disallow:\s*\/\s*$/im.test(group) && !/^Allow:/im.test(group));
      if (!expectTrainingAllowed && !blocked) fail(`robots.txt: training crawler ${agent} is not blocked`);
      if (expectTrainingAllowed && blocked) fail(`robots.txt: training crawler ${agent} is blocked`);
    }
    for (const agent of searchAgents) {
      const group = groups.find((entry) =>
        entry.split(/\r?\n/).some((line) =>
          line.trim().toLowerCase() === `user-agent: ${agent.toLowerCase()}`
        )
      );
      if (!group || !/^Allow:\s*\/\s*$/im.test(group) || /^Disallow:\s*\/\s*$/im.test(group)) {
        fail(`robots.txt: public search access missing for ${agent}`);
      }
    }
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
    for(const pathname of Object.values(toolPaths).flat()) if(!sitemapLocs.includes(absoluteUrl(pathname))) fail(`sitemap.xml: missing ${pathname}`);
    if(academicPath && !sitemapLocs.includes(absoluteUrl(academicPath.split("?")[0])))fail(`sitemap.xml: missing academic page ${academicPath}`);
    for (const pathname of Object.values(aboutPaths)) if (!sitemapLocs.includes(absoluteUrl(pathname))) fail(`sitemap.xml: missing ${pathname}`);
    if (authorPath && !sitemapLocs.includes(absoluteUrl(authorPath))) fail(`sitemap.xml: missing author ${authorPath}`);
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

  for (const pathname of [...Object.values(toolPaths).flat(), ...Object.values(aboutPaths)]) {
    if (!llms.body.includes(`](${absoluteUrl(pathname)})`)) {
      fail(`llms.txt: missing localized tool ${pathname}`);
    }
  }

  for (const locale of locales) {
    const feedPath = `/${locale}/feeds/news.xml`;
    if (!llms.body.includes(`](${absoluteUrl(feedPath)})`)) {
      fail(`llms.txt: missing news feed ${feedPath}`);
    }

    const feed = await fetchText(feedPath);
    if (feed.response.status !== 200) {
      fail(`${feedPath}: expected 200, received ${feed.response.status}`);
    } else {
      if (!/^application\/rss\+xml\b/i.test(feed.response.headers.get("content-type") ?? "")) {
        fail(`${feedPath}: expected an application/rss+xml content type`);
      }
      if (!feed.body.includes(`<atom:link href="${absoluteUrl(feedPath)}" rel="self"`)) {
        fail(`${feedPath}: missing self-referencing atom:link`);
      }
      if (!feed.body.includes(`<language>${locale}</language>`)) {
        fail(`${feedPath}: expected <language>${locale}</language>`);
      }
    }

    const homePage = await fetchText(`/${locale}`);
    const feedLinks = [...homePage.body.matchAll(/<link\b[^>]*>/gi)]
      .map((match) => match[0])
      .filter((tag) => /type=["']application\/rss\+xml["']/i.test(tag));
    if (!feedLinks.some((tag) => tag.includes(`href="${absoluteUrl(feedPath)}"`))) {
      fail(`/${locale}: missing RSS discovery link to ${feedPath}`);
    }
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
