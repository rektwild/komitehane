"use client";

import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Link} from "@/i18n/navigation";
import {
  publicAuthEntryLinks,
  visiblePublicAuthEntryLinks,
} from "@/lib/auth-entry";

export function HeaderAuthActions() {
  if (visiblePublicAuthEntryLinks().length === 0) {
    return null;
  }

  return <HeaderAuthActionButtons />;
}

function HeaderAuthActionButtons() {
  const t = useTranslations("Header");
  const [login, signup] = publicAuthEntryLinks;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        render={<Link href={login.href} />}
        nativeButton={false}
        variant="ghost"
        size="lg"
        className="border-0 px-3 py-2 font-bold"
      >
        {t("auth.login")}
      </Button>
      <Button
        render={<Link href={signup.href} />}
        nativeButton={false}
        size="lg"
        className="ml-2 rounded-lg border-0 px-4 py-2 font-bold shadow-sm"
      >
        {t("auth.signup")}
      </Button>
    </div>
  );
}
