import assert from "node:assert/strict";
import test from "node:test";

import {
  articleProseClassName,
  isBibliographyHeading,
  listArticleProseRoles,
} from "./article-prose.ts";

test("recognizes bibliography headings in Turkish and English", () => {
  for (const heading of [
    "Kaynakça",
    "Kaynakca",
    "Kaynaklar",
    "Kaynaklar ve editoryal not",
    "References",
    "Reference list",
    "Bibliography",
    "BIBLIOGRAPHY",
    "Works cited",
    "Sources",
  ]) {
    assert.equal(isBibliographyHeading(heading), true, heading);
  }
});

test("does not treat resource mentions as a bibliography", () => {
  for (const heading of [
    "Kaynak Yönetimi: Zaman, Para ve Enerji",
    "Başarı İçin Kaynak ve Materyal Önerileri",
    "1. Identifying Your Sources of Motivation",
    "Resource Management: Time, Money, and Energy",
  ]) {
    assert.equal(isBibliographyHeading(heading), false, heading);
  }
});

test("marks only the bibliography region", () => {
  const referencesHeading = {type: "heading", tag: "h2", children: [{type: "text", text: "Kaynaklar ve editoryal not"}]};
  const citation = {type: "paragraph", children: [{type: "text", text: "[1] Yönetmelik metni."}]};
  const note = {type: "paragraph", children: [{type: "text", text: "Kaynaklar 7 Kasım 2026 tarihinde kontrol edildi."}]};
  const list = {type: "list", children: []};
  const quote = {type: "quote", children: [{type: "text", text: "Kısa alıntı."}]};
  const image = {type: "block", fields: {blockType: "articleImage"}};
  const nextHeading = {type: "heading", tag: "h2", children: [{type: "text", text: "Sonuç"}]};
  const after = {type: "paragraph", children: [{type: "text", text: "Kapanış."}]};
  const earlier = {type: "paragraph", children: [{type: "text", text: "[1] Bu bir gövde cümlesi değil, ama kaynakça dışında."}]};

  const roles = listArticleProseRoles({
    root: {
      children: [earlier, referencesHeading, citation, note, list, quote, image, nextHeading, after],
    },
  });

  assert.deepEqual(roles, [
    null,
    "references-title",
    "reference-entry",
    "reference",
    "reference-entry",
    "reference",
    null,
    null,
    null,
  ]);
});

test("maps bibliography roles to one class set", () => {
  assert.equal(articleProseClassName("references-title"), "article-references-title");
  assert.equal(articleProseClassName("reference"), "article-reference");
  assert.equal(
    articleProseClassName("reference-entry"),
    "article-reference article-reference-entry",
  );
});
