"use client";

import Script from "next/script";
import {gaConfig} from "@/config/analytics";

export function GoogleAnalytics() {
  if (!gaConfig.enabled || !gaConfig.measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaConfig.measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${gaConfig.measurementId}');
        `}
      </Script>
    </>
  );
}
