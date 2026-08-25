"use client";

import {ArrowUpRightIcon, ImageIcon} from "lucide-react";
import {useTranslations} from "next-intl";

import {Link} from "@/i18n/navigation";
import type {ToolDefinition} from "@/lib/tools";

type ToolCardProps = {
  tool: ToolDefinition;
};

export function ToolCard({tool}: ToolCardProps) {
  const t = useTranslations("Tools");
  const title = t(`items.${tool.key}.title`);
  const description = t(`items.${tool.key}.description`);

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-surface outline outline-1 outline-border/60">
      <Link
        href={tool.href}
        aria-label={title}
        className="relative block aspect-video overflow-hidden bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-inset"
      >
        <div
          aria-hidden="true"
          className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-muted via-background to-muted transition-transform duration-500 group-hover:scale-105"
        >
          <div className="relative flex flex-col items-center gap-2 text-center text-muted-foreground">
            <ImageIcon aria-hidden="true" className="size-10" strokeWidth={1.4} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              {t("card.imagePlaceholder")}
            </span>
          </div>
        </div>
        <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/5" />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={tool.href}
            className="line-clamp-1 text-base font-bold leading-tight text-card-foreground outline-none transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/60"
            dir="auto"
          >
            {title}
          </Link>
        </div>

        <p className="line-clamp-2 min-h-[1.5rem] text-[11px] text-muted-foreground">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-background bg-muted text-[9px] font-black text-muted-foreground shadow-sm"
            >
              K
            </span>
            <span className="truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("card.provider")}
            </span>
          </div>

          <Link
            href={tool.href}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {t("card.open")}
            <ArrowUpRightIcon aria-hidden="true" className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
