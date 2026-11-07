import assert from "node:assert/strict";
import test from "node:test";

import {resolveLexicalUpload} from "./lexical-upload.ts";

const fallbackAlt = "Makale görseli";

const learningFlowUrl =
  "https://media.komitehane.com/news/komite-ders-kurulu-ogrenme-akisi.jpg";
const checklistUrl =
  "https://media.komitehane.com/news/komite-not-hesaplama-kontrol-listesi.jpg";
const learningFlowAlt =
  "Bir konunun farklı derslerle ele alınmasından kurul değerlendirmesine uzanan kavramsal öğrenme akışı";
const checklistAlt =
  "Komite not hesabından önce girdiler, ek koşullar ve resmî sonuç kontrolünü gösteren liste";

test("renders a populated standard upload when mimeType was not selected", () => {
  const resolved = resolveLexicalUpload(
    {
      type: "upload",
      relationTo: "media",
      version: 3,
      format: "",
      fields: null,
      value: {
        id: 61,
        alt: learningFlowAlt,
        filename: "komite-ders-kurulu-ogrenme-akisi.jpg",
        height: 900,
        prefix: "news",
        url: learningFlowUrl,
        width: 1600,
        sizes: {
          hero: {
            height: 810,
            url: "https://media.komitehane.com/news/komite-ders-kurulu-ogrenme-akisi-hero.jpg",
            width: 1440,
          },
        },
      },
    },
    {fallbackAlt},
  );

  assert.deepEqual(resolved, {
    kind: "image",
    url: learningFlowUrl,
    alt: learningFlowAlt,
    width: 1600,
    height: 900,
    caption: null,
  });
});

test("keeps the original image when a populated upload includes mimeType and sizes", () => {
  const resolved = resolveLexicalUpload(
    {
      type: "upload",
      relationTo: "media",
      value: {
        id: 62,
        alt: checklistAlt,
        mimeType: "image/jpeg",
        filename: "komite-not-hesaplama-kontrol-listesi.jpg",
        url: checklistUrl,
        width: 1600,
        height: 900,
        sizes: {
          card: {
            url: "https://media.komitehane.com/news/komite-not-hesaplama-kontrol-listesi-card.jpg",
            width: 720,
            height: 540,
            mimeType: "image/jpeg",
            filesize: 12000,
            filename: "card.jpg",
          },
        },
      },
    },
    {fallbackAlt},
  );

  assert.equal(resolved?.kind, "image");
  if (resolved?.kind !== "image") return;
  assert.equal(resolved.url, checklistUrl);
  assert.equal(resolved.alt, checklistAlt);
  assert.equal(resolved.width, 1600);
  assert.equal(resolved.height, 900);
});

test("returns null for unpopulated and missing media without throwing", () => {
  const nodes = [
    {type: "upload", relationTo: "media", value: 61, fields: null},
    {type: "upload", relationTo: "media", value: "62", fields: null},
    {type: "upload", relationTo: "media", value: null, fields: null},
    {type: "upload", relationTo: "media", fields: null},
    {type: "upload", value: {id: 61, alt: learningFlowAlt}},
    null,
    {type: "block", fields: {blockType: "articleImage", provider: "pexels"}},
  ];

  for (const node of nodes) {
    assert.equal(resolveLexicalUpload(node, {fallbackAlt}), null);
  }
});

test("uses a size or thumbnail url when the original url is absent", () => {
  const resolved = resolveLexicalUpload(
    {
      type: "upload",
      relationTo: "media",
      value: {
        id: 61,
        alt: learningFlowAlt,
        thumbnailURL: "javascript:alert(1)",
        sizes: {
          hero: {url: learningFlowUrl, width: 1440, height: 810},
        },
      },
    },
    {fallbackAlt},
  );

  assert.equal(resolved?.kind, "image");
  if (resolved?.kind !== "image") return;
  assert.equal(resolved.url, learningFlowUrl);

  const thumbnail = resolveLexicalUpload(
    {
      type: "upload",
      value: {
        alt: checklistAlt,
        thumbnailURL: checklistUrl,
      },
    },
    {fallbackAlt},
  );
  assert.equal(thumbnail?.kind, "image");
  if (thumbnail?.kind !== "image") return;
  assert.equal(thumbnail.url, checklistUrl);
});

test("rejects unsafe urls and non-image files", () => {
  assert.equal(
    resolveLexicalUpload(
      {
        type: "upload",
        value: {url: "javascript:alert(1)", mimeType: "image/jpeg", alt: "x"},
      },
      {fallbackAlt},
    ),
    null,
  );
  assert.equal(
    resolveLexicalUpload(
      {type: "upload", value: {url: "//media.komitehane.com/news/a.jpg", alt: "x"}},
      {fallbackAlt},
    ),
    null,
  );

  const file = resolveLexicalUpload(
    {
      type: "upload",
      value: {
        url: "https://media.komitehane.com/news/notes.pdf",
        mimeType: "application/pdf",
        filename: "notes.pdf",
      },
    },
    {fallbackAlt},
  );
  assert.deepEqual(file, {
    kind: "file",
    url: "https://media.komitehane.com/news/notes.pdf",
    label: "notes.pdf",
    caption: null,
  });
});

test("preserves upload captions and prefers field alt over the media alt", () => {
  const resolved = resolveLexicalUpload(
    {
      type: "upload",
      relationTo: "media",
      fields: {
        alt: "Editör altyazısı",
        caption: {
          root: {
            children: [
              {
                type: "paragraph",
                children: [{type: "text", text: "Şema: kurul akışı"}],
              },
            ],
          },
        },
      },
      value: {
        url: learningFlowUrl,
        alt: learningFlowAlt,
        width: "1600",
        height: "900",
      },
    },
    {fallbackAlt},
  );

  assert.deepEqual(resolved, {
    kind: "image",
    url: learningFlowUrl,
    alt: "Editör altyazısı",
    width: 1600,
    height: 900,
    caption: "Şema: kurul akışı",
  });
});

test("uses the translated fallback when no alt is stored", () => {
  const resolved = resolveLexicalUpload(
    {
      type: "upload",
      value: {url: checklistUrl, mimeType: null, width: 0, height: -1},
    },
    {fallbackAlt},
  );

  assert.deepEqual(resolved, {
    kind: "image",
    url: checklistUrl,
    alt: fallbackAlt,
    width: null,
    height: null,
    caption: null,
  });
});
