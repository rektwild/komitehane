import {ImageResponse} from "next/og";

import {siteConfig} from "@/config/site";

export const socialImageSize = {
  width: 1200,
  height: 630,
} as const;

export function createSocialImage(locale: string) {
  const languageLabel = siteConfig.localeNames[locale as keyof typeof siteConfig.localeNames];

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{display: "flex", fontSize: 32, fontWeight: 600}}>
          {siteConfig.name}
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 18}}>
          <div style={{color: "#a3a3a3", fontSize: 30}}>
            {languageLabel || siteConfig.defaultLocale.toUpperCase()}
          </div>
          <div style={{fontSize: 76, fontWeight: 700, letterSpacing: -2}}>
            {siteConfig.name}
          </div>
        </div>
      </div>
    ),
    socialImageSize
  );
}

