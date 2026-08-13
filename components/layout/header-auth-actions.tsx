"use client";

import {useTranslations} from "next-intl";

import {Link} from "@/i18n/navigation";
import {Button} from "@/components/ui/button";

export function HeaderAuthActions() {
  const t = useTranslations("Header");

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        render={<Link href="/login" />}
        nativeButton={false}
        variant="ghost"
        size="lg"
        className="border-0 px-3 py-2 font-bold"
      >
        {t("auth.login")}
      </Button>
      <Button
        render={<Link href="/signup" />}
        nativeButton={false}
        size="lg"
        className="ml-2 rounded-lg border-0 px-4 py-2 font-bold shadow-sm"
      >
        {t("auth.signup")}
      </Button>
    </div>
  );
}
