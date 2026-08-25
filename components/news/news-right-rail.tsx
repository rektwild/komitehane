"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { NewsCategoryBadge } from "@/components/news/news-category-badge";
import { ClaudeAI } from "@/components/ui/svgs/claude-ai";
import { Gemini } from "@/components/ui/svgs/gemini";
import { Openai } from "@/components/ui/svgs/openai";
import { Linkedin } from "@/components/ui/svgs/linkedin";
import { XBrand } from "@/components/ui/svgs/x";
import { cn } from "@/lib/utils";
import type { NewsCategory, NewsLocale } from "@/lib/news/types";
import type { NewsTocItem } from "@/lib/news/toc";

type NewsRightRailProps = {
  tocItems: NewsTocItem[];
  tocTitle: string;
  categories: NewsCategory[];
  selectedCategorySlug?: string;
  locale: NewsLocale;
  articleUrl: string;
  articleTitle: string;
  plainText: string;
};

export function NewsRightRail({
  tocItems,
  tocTitle,
  categories,
  selectedCategorySlug,
  locale,
  articleUrl,
  articleTitle,
  plainText,
}: NewsRightRailProps) {
  const t = useTranslations("NewsPage");
  const [activeId, setActiveId] = useState(tocItems[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!tocItems.length) return;
    const updateActiveId = () => {
      let next = tocItems[0]?.id ?? "";
      for (const item of tocItems) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 180) next = item.id;
      }
      setActiveId(next);
    };
    updateActiveId();
    window.addEventListener("scroll", updateActiveId, { passive: true });
    window.addEventListener("resize", updateActiveId);
    return () => {
      window.removeEventListener("scroll", updateActiveId);
      window.removeEventListener("resize", updateActiveId);
    };
  }, [tocItems]);

  const handleCopyMarkdown = async () => {
    const markdown = `# ${articleTitle}\n\n${plainText}\n\nSource: ${articleUrl}`;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const chatGptUrl = `https://chat.openai.com/?prompt=${encodeURIComponent(
    `Summarize this article: "${articleTitle}"\n${articleUrl}`
  )}`;
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(
    `Summarize this article: "${articleTitle}"\n${articleUrl}`
  )}`;
  const geminiUrl = `https://gemini.google.com/app?q=${encodeURIComponent(
    `Summarize this article: "${articleTitle}"\n${articleUrl}`
  )}`;
  const xShareUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(
    articleUrl
  )}&text=${encodeURIComponent(articleTitle)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    articleUrl
  )}`;

  const pillCategories = categories.slice(0, 4);

  return (
    <>
      {/* Category pills — not sticky */}
      {pillCategories.length ? (
        <div className="flex flex-wrap gap-1.5">
          {pillCategories.map((cat) => (
            <NewsCategoryBadge
              key={cat.id}
              category={cat}
              active={selectedCategorySlug === cat.slug}
              size="compact"
            />
          ))}
        </div>
      ) : null}

      {/* Sticky part — ON THIS PAGE ve altı */}
      <div className="space-y-3 xl:sticky xl:top-28">
        {/* ON THIS PAGE — Supabase style: mono heading + left border */}
        {tocItems.length ? (
          <section aria-labelledby="toc-title">
            <h2
              id="toc-title"
              className="mb-3 font-sans text-xs font-medium uppercase tracking-widest text-foreground"
            >
              {tocTitle}
            </h2>
            <nav aria-label={tocTitle} className="border-l border-border/60">
              <ul className="space-y-0">
                {tocItems.map((item) => {
                  const active = activeId === item.id;
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "border-l-2 -ml-px pl-4",
                        active ? "border-foreground" : "border-transparent"
                      )}
                    >
                      <a
                        href={`#${item.id}`}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "block py-1 text-xs leading-5 transition-colors",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                          item.level === 3 && "pl-3 text-[11px]"
                        )}
                      >
                        {item.text}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </section>
        ) : null}

        {/* Actions — no top border like image, just spaced */}
        <div className="space-y-2 pt-1">
        <button
          onClick={handleCopyMarkdown}
          className="flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          type="button"
        >
          {copied ? (
            <CheckIcon className="size-4 text-foreground" />
          ) : (
            <CopyIcon className="size-4" />
          )}
          <span>{copied ? t("copiedMarkdown") : t("copyAsMarkdown")}</span>
        </button>

        <a
          href={chatGptUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Openai className="size-4" />
          <span>{t("askChatGPT")}</span>
        </a>

        <a
          href={claudeUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ClaudeAI className="size-4" />
          <span>{t("askClaude")}</span>
        </a>

        <a
          href={geminiUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Gemini className="size-4" />
          <span>{t("askGemini")}</span>
        </a>
      </div>

      {/* Social icons at bottom like image: X, LinkedIn, Y */}
      <div className="flex items-center gap-3 pt-1">
        <a
          href={xShareUrl}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={t("shareX")}
          className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <XBrand className="size-4" />
        </a>
        <a
          href={linkedinShareUrl}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={t("shareLinkedIn")}
          className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <Linkedin className="size-4" />
        </a>
        <a
          href={articleUrl}
          aria-label={t("copyLink")}
          onClick={async (e) => {
            e.preventDefault();
            try {
              await navigator.clipboard.writeText(articleUrl);
            } catch {}
          }}
          className="flex size-8 items-center justify-center bg-muted text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        >
          Y
        </a>
      </div>
      </div>
    </>
  );
}
