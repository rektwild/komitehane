import Image from "next/image";

import type {ArticleImageBlockFields} from "@/blocks/article-image";

type ArticleImageBlockProps = {
  fields: ArticleImageBlockFields;
  fallbackAlt: string;
  creditPrefix: string;
  creditOn: string;
  sourceLabel: string;
};

function isMedia(value: ArticleImageBlockFields["media"]): value is NonNullable<Extract<ArticleImageBlockFields["media"], object>> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function ArticleImageBlock({
  fields,
  fallbackAlt,
  creditPrefix,
  creditOn,
  sourceLabel,
}: ArticleImageBlockProps) {
  const media = isMedia(fields.media) ? fields.media : null;
  const imageUrl = fields.mediaUrl || media?.url;

  if (!imageUrl) return null;

  const alt = fields.alt?.trim() || fallbackAlt;
  const sourceHref = fields.sourcePageUrl || "https://www.pexels.com";

  return (
    <figure className="article-inline-image">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-card">
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 1280px) 100vw, 720px"
          className="object-cover"
        />
      </div>

      <figcaption className="mt-3 space-y-1.5 text-sm leading-6 text-muted-foreground">
        {fields.caption?.trim() ? <p>{fields.caption.trim()}</p> : null}
        <p>
          {creditPrefix}
          {fields.photographerUrl && fields.photographerName ? (
            <a
              href={fields.photographerUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {fields.photographerName}
            </a>
          ) : (
            fields.photographerName || sourceLabel
          )}
          {creditOn}
          <a href={sourceHref} target="_blank" rel="noreferrer noopener">
            {sourceLabel}
          </a>
        </p>
      </figcaption>
    </figure>
  );
}
