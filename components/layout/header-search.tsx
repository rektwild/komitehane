"use client";

import {SearchIcon} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {getPathname, usePathname} from "@/i18n/navigation";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {cn} from "@/lib/utils";

type HeaderSearchProps = {
  className?: string;
};

export function HeaderSearch({className}: HeaderSearchProps) {
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname();
  const localizedPathname = getPathname({href: pathname, locale});

  return (
    <form
      role="search"
      action={localizedPathname}
      method="get"
      className={cn("min-w-0", className)}
    >
      <InputGroup className="h-9 rounded-xl border border-input bg-background shadow-none">
        <InputGroupAddon className="pointer-events-none absolute inset-y-0 start-0 z-10 h-9 !ps-3.5">
          <SearchIcon aria-hidden="true" className="size-[18px]" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="q"
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          className="h-9 !ps-11 !pe-4 text-sm"
        />
      </InputGroup>
    </form>
  );
}
