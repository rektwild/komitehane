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
      {source: "/courses", destination: "/tr/haberler", permanent: true},
      {source: "/kurslar", destination: "/tr/haberler", permanent: true},
      {source: "/tr/kurslar", destination: "/tr/haberler", permanent: true},
      {source: "/en/courses", destination: "/en/news", permanent: true},
    ];
  },
};

export default withPayload(withNextIntl(nextConfig));
