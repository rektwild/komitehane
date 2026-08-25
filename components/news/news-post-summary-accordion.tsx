"use client";

import {useState} from "react";
import {ChevronDownIcon, ChevronRightIcon} from "lucide-react";
import {useTranslations} from "next-intl";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function NewsPostSummaryAccordion({content}: {content: string}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("NewsPage");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left md:px-5 md:py-3.5">
          <span className="text-sm font-medium tracking-tight text-foreground md:text-base">
            {t("summaryTitle")}
          </span>
          {open ? (
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border/70 px-4 py-4 md:px-5 md:py-5">
            <p className="text-base leading-8 text-muted-foreground sm:text-lg">{content}</p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
