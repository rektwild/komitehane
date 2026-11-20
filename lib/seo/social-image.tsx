import {ImageResponse} from "next/og";

import {siteConfig} from "@/config/site";

export const socialImageSize = {
  width: 1200,
  height: 630,
} as const;

type SocialImageCopy = {
  /** Page-specific headline. Defaults to the site name. */
  title?: string;
  /** Optional supporting line under the headline. */
  subtitle?: string;
};

export function createSocialImage(locale: string, {title, subtitle}: SocialImageCopy = {}) {
  const languageLabel = siteConfig.localeNames[locale as keyof typeof siteConfig.localeNames];
  const headline = title || siteConfig.name;
  const host = new URL(siteConfig.url).host;

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          <div style={{display: "flex"}}>{siteConfig.name}</div>
          <div style={{display: "flex", color: "#a3a3a3", fontSize: 26}}>
            {languageLabel || siteConfig.defaultLocale.toUpperCase()}
          </div>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 24}}>
          <div
            style={{
              display: "flex",
              fontSize: headline.length > 48 ? 60 : 76,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.08,
            }}
          >
            {headline}
          </div>
          {subtitle ? (
            <div style={{display: "flex", color: "#a3a3a3", fontSize: 30, lineHeight: 1.3}}>
              {subtitle}
            </div>
          ) : null}
        </div>
        <div style={{display: "flex", color: "#737373", fontSize: 24}}>{host}</div>
      </div>
    ),
    socialImageSize
  );
}
