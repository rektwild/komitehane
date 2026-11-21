import assert from "node:assert/strict";
import test from "node:test";

import {toRssItem} from "./feed.ts";
import {createRssXml} from "../rss/xml.ts";

const entry = {
  id: 42,
  slug: "tus-2027-basvuru",
  title: "TUS 2027 & başvuru <takvimi>",
  excerpt: "Başvuru tarihleri açıklandı.",
  authorName: "Editör",
  categoryName: "TUS",
  publishedAt: "2026-11-20T09:00:00.000Z",
  updatedAt: "2026-11-21T10:30:00.000Z",
};

test("maps a cached news entry to an RSS item", () => {
  const item = toRssItem(entry, "https://example.com/tr/haberler/tus-2027-basvuru");

  assert.equal(item.id, "article-42");
  assert.equal(item.url, "https://example.com/tr/haberler/tus-2027-basvuru");
  assert.equal(item.summary, entry.excerpt);
  assert.equal(item.author, "Editör");
  assert.deepEqual(item.categories, ["TUS"]);
  assert.equal(item.publishedAt.toISOString(), entry.publishedAt);
  assert.equal(item.updatedAt?.toISOString(), entry.updatedAt);
});

test("renders a valid, escaped news feed", () => {
  const xml = createRssXml({
    channel: {
      title: "Komitehane Haberler",
      description: "TUS ve tıp eğitimiyle ilgili Komitehane haberleri.",
      link: "https://example.com/tr/haberler",
      feedUrl: "https://example.com/tr/feeds/news.xml",
      language: "tr",
    },
    items: [toRssItem(entry, "https://example.com/tr/haberler/tus-2027-basvuru")],
  });

  assert.match(xml, /<title>TUS 2027 &amp; başvuru &lt;takvimi&gt;<\/title>/u);
  assert.match(xml, /<atom:link href="https:\/\/example\.com\/tr\/feeds\/news\.xml" rel="self" type="application\/rss\+xml" \/>/);
  assert.match(xml, /<dc:creator>Editör<\/dc:creator>/u);
  assert.match(xml, /<category>TUS<\/category>/);
  assert.match(xml, /<link>https:\/\/example\.com\/tr\/haberler\/tus-2027-basvuru<\/link>/);
  assert.match(xml, /<lastBuildDate>Sat, 21 Nov 2026 10:30:00 GMT<\/lastBuildDate>/);
});
