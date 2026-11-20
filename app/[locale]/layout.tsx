import type {Metadata} from "next";
import {JetBrains_Mono, Wix_Madefor_Text} from "next/font/google";
import Script from "next/script";
import {NextIntlClientProvider} from "next-intl";
import {getLocale, getTranslations} from "next-intl/server";

import {GoogleAnalytics} from "@/components/google-analytics";
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
import {adsenseConfig, adsenseScriptSrc} from "@/config/adsense";
import {routing} from "@/i18n/routing";
import {getDirection, getOgLocale} from "@/lib/seo/locales";
import {getRobotsMetadata} from "@/lib/seo/metadata";
import {getSiteJsonLd} from "@/lib/seo/structured-data";
import {absoluteUrl} from "@/lib/seo/urls";
import "../globals.css";

const wixMadeforText = Wix_Madefor_Text({
  variable: "--font-default",
  // Turkish ğ, ş and İ live in latin-ext; preload it with latin so Turkish
  // pages do not request an extra font file after first render.
  subsets: ["latin", "latin-ext"],
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
    ...(adsenseConfig.clientId
      ? {other: {"google-adsense-account": adsenseConfig.clientId}}
      : {}),
    ...(Object.keys(verification).length > 0 ? {verification} : {}),
  };
}

export default async function LocaleLayout({children}: LayoutProps<"/[locale]">) {
  const [locale, metadataT] = await Promise.all([
    getLocale(),
    getTranslations("Metadata"),
  ]);
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
        {adsenseConfig.enabled && adsenseScriptSrc ? (
          // afterInteractive (Next's default for third-party scripts) runs the
          // ad script after hydration instead of ahead of first-party code;
          // Next still emits a preload hint, so ads are not delayed. Ad slots
          // queue `adsbygoogle.push` calls until it loads. lazyOnload would
          // defer it further (no preload) at the cost of later ad rendering.
          // Site ownership is verified through the google-adsense-account
          // meta tag.
          <Script
            id="google-adsense"
            src={adsenseScriptSrc}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        ) : null}
        <GoogleAnalytics />
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex min-h-0 flex-1 flex-col pb-4 sm:pb-6 lg:pb-8">
            <SiteContainer className="flex min-h-0 flex-1 flex-col">
              {children}
            </SiteContainer>
          </main>
          <Footer />
          <JsonLd data={getSiteJsonLd(locale, metadataT("description"))} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
