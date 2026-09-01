"use client";

import {BlockCollapsible} from "@payloadcms/richtext-lexical/client";
import type {LexicalBlockClientProps} from "@payloadcms/richtext-lexical";
import {useFormFields} from "@payloadcms/ui";
import type {FC} from "react";

import type {ArticleImageBlockFields} from "@/blocks/article-image";

type ArticleImageBlockAdminProps = LexicalBlockClientProps;

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMediaUrl(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  return nonEmptyString((value as {url?: unknown}).url);
}

export const ArticleImageBlockAdmin: FC<ArticleImageBlockAdminProps> = () => {
  const fields = useFormFields(([formState]) => ({
    media: formState.media?.value as ArticleImageBlockFields["media"] | undefined,
    mediaUrl: formState.mediaUrl?.value as ArticleImageBlockFields["mediaUrl"] | undefined,
    alt: formState.alt?.value as ArticleImageBlockFields["alt"] | undefined,
    caption: formState.caption?.value as ArticleImageBlockFields["caption"] | undefined,
    sourcePageUrl: formState.sourcePageUrl?.value as ArticleImageBlockFields["sourcePageUrl"] | undefined,
    photographerName: formState.photographerName?.value as ArticleImageBlockFields["photographerName"] | undefined,
    photographerUrl: formState.photographerUrl?.value as ArticleImageBlockFields["photographerUrl"] | undefined,
  }));
  const mediaUrl = nonEmptyString(fields.mediaUrl) || getMediaUrl(fields.media);
  const alt = nonEmptyString(fields.alt) || "Görsel alt metni henüz eklenmedi";
  const caption = nonEmptyString(fields.caption);
  const photographer = nonEmptyString(fields.photographerName);
  const photographerUrl = nonEmptyString(fields.photographerUrl);
  const sourceUrl = nonEmptyString(fields.sourcePageUrl);

  return (
    <BlockCollapsible className="komitehane-article-image-block">
      <div className="komitehane-article-image-block__preview">
        {mediaUrl ? (
          <div className="komitehane-article-image-block__media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl} alt={alt} loading="lazy" />
          </div>
        ) : (
          <div
            className="komitehane-article-image-block__placeholder"
            role="img"
            aria-label="Görsel önizlemesi kullanılamıyor"
          >
            <span>Görsel önizlemesi kullanılamıyor</span>
            <small>Media URL veya ilişkilendirilmiş Media kaydı bulunamadı.</small>
          </div>
        )}

        <dl className="komitehane-article-image-block__details">
          <div>
            <dt>Alt metin</dt>
            <dd>{alt}</dd>
          </div>
          {caption ? (
            <div>
              <dt>Açıklama</dt>
              <dd>{caption}</dd>
            </div>
          ) : null}
          {photographer || sourceUrl ? (
            <div>
              <dt>Kaynak</dt>
              <dd>
                {photographer ? (
                  photographerUrl ? (
                    <a href={photographerUrl} target="_blank" rel="noreferrer noopener">
                      {photographer}
                    </a>
                  ) : (
                    photographer
                  )
                ) : null}
                {photographer && sourceUrl ? " · " : null}
                {sourceUrl ? (
                  <a href={sourceUrl} target="_blank" rel="noreferrer noopener">
                    Pexels kaynağı
                  </a>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </BlockCollapsible>
  );
};

export default ArticleImageBlockAdmin;
