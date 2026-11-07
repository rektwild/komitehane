import Image from "next/image";

import {
  resolveLexicalUpload,
  type LexicalUploadResolution,
} from "@/lib/news/lexical-upload";

type ArticleUploadImageProps = {
  node: unknown;
  fallbackAlt: string;
};

const imageSizes = "(max-width: 1280px) 100vw, 720px";

function UploadCaption({caption}: {caption: string | null}) {
  if (!caption) return null;

  return (
    <figcaption>
      <p>{caption}</p>
    </figcaption>
  );
}

function UploadFigure({
  resolved,
  children,
}: {
  resolved: LexicalUploadResolution;
  children: React.ReactNode;
}) {
  return (
    <figure className="article-inline-image">
      {children}
      <UploadCaption caption={resolved.caption} />
    </figure>
  );
}

export function ArticleUploadImage({node, fallbackAlt}: ArticleUploadImageProps) {
  const resolved = resolveLexicalUpload(node, {fallbackAlt});
  if (!resolved) return null;

  switch (resolved.kind) {
    case "image":
      return (
        <UploadFigure resolved={resolved}>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {resolved.width && resolved.height ? (
              <Image
                src={resolved.url}
                alt={resolved.alt}
                width={resolved.width}
                height={resolved.height}
                sizes={imageSizes}
                style={{width: "100%", height: "auto"}}
              />
            ) : (
              <div className="relative aspect-video">
                <Image
                  src={resolved.url}
                  alt={resolved.alt}
                  fill
                  sizes={imageSizes}
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </UploadFigure>
      );
    case "file":
      return (
        <UploadFigure resolved={resolved}>
          <p>
            <a href={resolved.url} rel="noopener noreferrer">
              {resolved.label}
            </a>
          </p>
        </UploadFigure>
      );
    default: {
      const unreachable: never = resolved;
      return unreachable;
    }
  }
}
