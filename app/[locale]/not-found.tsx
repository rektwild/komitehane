import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {Link} from "@/i18n/navigation";
import {PageWithAside} from "@/components/layout/page-with-aside";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NotFound");

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <PageWithAside>
      <section className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
        <p className="font-mono text-6xl font-semibold text-muted-foreground/25">
          404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="max-w-md text-muted-foreground">{t("description")}</p>
        <Link
          href="/"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          {t("backToHome")}
        </Link>
      </section>
    </PageWithAside>
  );
}
