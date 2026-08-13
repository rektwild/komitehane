"use client";

import {ChevronDownIcon, CheckIcon, LanguagesIcon} from "lucide-react";
import {useLocale, useTranslations, type Locale} from "next-intl";

import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Link, usePathname} from "@/i18n/navigation";
import {routing} from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="lg"
            aria-label={t("label")}
            className="border-0 px-2.5 py-2 font-bold text-foreground/75"
          />
        }
      >
        <LanguagesIcon aria-hidden="true" data-icon="inline-start" />
        <span>{locale.toUpperCase()}</span>
        <ChevronDownIcon aria-hidden="true" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
          {routing.locales.map((cur: Locale) => (
            <DropdownMenuItem
              key={cur}
              render={<Link href={pathname} locale={cur} />}
              aria-current={cur === locale ? "page" : undefined}
            >
              {t("locale", {locale: cur})}
              {cur === locale ? (
                <CheckIcon aria-hidden="true" className="ms-auto" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
