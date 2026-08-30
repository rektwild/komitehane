"use client";

import {ImageIcon} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Link} from "@/i18n/navigation";
import type {ToolDefinition} from "@/lib/tools";

type ToolCardProps = {
  tool: Pick<ToolDefinition, "key" | "href">;
};

export function ToolCard({tool}: ToolCardProps) {
  const t = useTranslations("Tools");
  const title = t(`items.${tool.key}.title`);
  const description = t(`items.${tool.key}.description`);

  return (
    <Link
      href={tool.href}
      className="group flex h-full min-w-0 flex-col gap-2 rounded-lg p-3 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 active:bg-muted"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted shadow-md outline outline-offset-3 outline-border/50">
        <div
          aria-hidden="true"
          className="flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br from-muted via-background to-muted text-muted-foreground transition-transform duration-500 group-hover:scale-105"
        >
          <ImageIcon aria-hidden="true" className="size-10" strokeWidth={1.4} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            {t("card.imagePlaceholder")}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 px-2 pb-2">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight">
          {title}
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground group-active:text-foreground">
          {description}
        </p>

        <div className="mt-auto flex items-center gap-1.5 border-t border-border/50 pt-2.5 sm:gap-2">
          <Avatar size="sm" className="size-6">
            <AvatarFallback className="text-[10px] font-medium">K</AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-xs font-medium tracking-tight text-foreground">
            {t("card.provider")}
          </span>
        </div>
      </div>
    </Link>
  );
}
