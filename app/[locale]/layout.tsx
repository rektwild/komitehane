import type {Metadata} from "next";
import {JetBrains_Mono, Wix_Madefor_Text} from "next/font/google";
import {NextIntlClientProvider} from "next-intl";
import {getLocale, getTranslations} from "next-intl/server";

import {JsonLd} from "@/components/json-ld";
import Footer from "@/components/footer-2";
import {SiteHeader} from "@/components/layout/site-header";
import {SiteContainer} from "@/components/layout/site-container";
import {ThemeInitializerScript} from "@/components/layout/theme-initializer";
import {
  bingSiteVerification,
  googleSiteVerification,
  siteConfig,
  siteUrl,
} from "@/config/site";
import {routing} from "@/i18n/routing";
import {getDirection, getOgLocale} from "@/lib/seo/locales";
import {getRobotsMetadata} from "@/lib/seo/metadata";
import {getSiteJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";
import "../globals.css";

const wixMadeforText = Wix_Madefor_Text({
  variable: "--font-default",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const locale = await getLocale();
  const verification = {
    ...(googleSiteVerification ? {google: googleSiteVerification} : {}),
    ...(bingSiteVerification
      ? {other: {"msvalidate.01": bingSiteVerification}}
      : {}),
  };

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title.default"),
      template: t("title.template"),
    },
    description: t("description"),
    applicationName: siteConfig.name,
    creator: siteConfig.organizationName,
    publisher: siteConfig.organizationName,
    robots: getRobotsMetadata(),
    openGraph: {
      type: "website",
      title: t("title.default"),
      description: t("description"),
      url: absoluteUrl(`/${locale}`),
      siteName: siteConfig.name,
      locale: getOgLocale(locale),
      alternateLocale: routing.locales
        .filter((cur) => cur !== locale)
        .map(getOgLocale),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title.default"),
      description: t("description"),
    },
    ...(Object.keys(verification).length > 0 ? {verification} : {}),
  };
}

export default async function LocaleLayout({children}: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const direction = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${wixMadeforText.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitializerScript locale={locale} />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex min-h-0 flex-1 flex-col pb-4 sm:pb-6 lg:pb-8">
            <SiteContainer className="flex min-h-0 flex-1 flex-col">
              {children}
            </SiteContainer>
          </main>
          <Footer />
          <JsonLd data={getSiteJsonLd(locale)} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
