import type {NextConfig} from "next";
import {withPayload} from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

function getMediaHostname(): string | undefined {
  const value = process.env.NEXT_PUBLIC_MEDIA_HOSTNAME?.trim();
  if (!value) return undefined;

  if (!/^[a-z0-9.-]+$/i.test(value) || value.startsWith(".") || value.endsWith(".")) {
    throw new Error("NEXT_PUBLIC_MEDIA_HOSTNAME must be a hostname without a protocol or path.");
  }

  return value;
}

const mediaHostname = getMediaHostname();

/**
 * Permanently redirect the www/apex twin of NEXT_PUBLIC_SITE_URL to the
 * canonical origin. Without it both hosts serve 200s and Search Console files
 * the twin under "Alternate page with proper canonical tag".
 */
function getCanonicalHostRedirects() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return [];

  const {hostname, origin} = new URL(value);
  if (hostname === "localhost" || !hostname.includes(".") || /^[\d.]+$/.test(hostname)) {
    return [];
  }

  const twinHost = hostname.startsWith("www.") ? hostname.slice(4) : `www.${hostname}`;

  return [
    {
      source: "/:path*",
      has: [{type: "host" as const, value: twinHost}],
      destination: `${origin}/:path*`,
      permanent: true,
    },
  ];
}

const nextConfig: NextConfig = {
  images: mediaHostname
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: mediaHostname,
            pathname: "/**",
          },
        ],
      }
    : undefined,
  async redirects() {
    return [
      ...getCanonicalHostRedirects(),
      {source: "/courses", destination: "/tr/haberler", permanent: true},
      {source: "/kurslar", destination: "/tr/haberler", permanent: true},
      {source: "/tr/kurslar", destination: "/tr/haberler", permanent: true},
      {source: "/en/courses", destination: "/en/news", permanent: true},
    ];
  },
};

export default withPayload(withNextIntl(nextConfig));
