"use client";

import {useRef, useState} from "react";
import {CheckIcon, Link2Icon, MailIcon} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Linkedin} from "@/components/ui/svgs/linkedin";
import {XBrand} from "@/components/ui/svgs/x";

type CopyState = "idle" | "copied" | "failed";

const shareButtonClassName =
  "size-12 rounded-none bg-muted/45 text-foreground hover:bg-muted/70 dark:bg-muted/40 dark:hover:bg-muted/60";

export function NewsShareActions({title, url}: {title: string; url: string}) {
  const t = useTranslations("NewsPage");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const copyTimeout = useRef<number>(null);

  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const xShareUrl = `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;

  const handleCopyLink = async () => {
    if (copyTimeout.current !== null) {
      window.clearTimeout(copyTimeout.current);
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    copyTimeout.current = window.setTimeout(() => setCopyState("idle"), 2000);
  };

  return (
    <section className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">{t("shareTitle")}</p>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <a href={linkedInShareUrl} target="_blank" rel="noreferrer noopener" aria-label={t("shareLinkedIn")} />
          }
          className={shareButtonClassName}
        >
          <Linkedin className="size-5" />
        </Button>

        <Button
          variant="ghost"
          nativeButton={false}
          render={<a href={xShareUrl} target="_blank" rel="noreferrer noopener" aria-label={t("shareX")} />}
          className={shareButtonClassName}
        >
          <XBrand className="size-5" />
        </Button>

        <Button
          variant="ghost"
          nativeButton={false}
          render={<a href={emailShareUrl} aria-label={t("shareEmail")} />}
          className={shareButtonClassName}
        >
          <MailIcon className="size-5" />
        </Button>

        <Button
          variant="ghost"
          onClick={handleCopyLink}
          aria-label={t("copyLink")}
          className={`${shareButtonClassName} ${copyState === "copied" ? "text-primary" : ""}`}
        >
          {copyState === "copied" ? <CheckIcon className="size-5" /> : <Link2Icon className="size-5" />}
          <span aria-live="polite" className="sr-only">
            {copyState === "copied" ? t("linkCopied") : copyState === "failed" ? t("copyFailed") : ""}
          </span>
        </Button>
      </div>
    </section>
  );
}
