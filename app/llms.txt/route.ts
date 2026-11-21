import {getTranslations} from "next-intl/server";
import {tools} from "@/lib/tools";
import {getPathname} from "@/i18n/navigation";
import {siteConfig} from "@/config/site";
import {getRssFeedPath} from "@/lib/rss";
import {absoluteUrl} from "@/lib/seo/urls";

export async function GET() {
  const localizedToolLinks = await Promise.all(
    siteConfig.locales.map(async (locale) => {
      const pathname = await getPathname({href: "/tools", locale});

      const t = await getTranslations({locale, namespace: "Tools"});
      return [
        `- [${siteConfig.localeNames[locale]}](${absoluteUrl(pathname)})`,
        ...tools.map((tool) => {
          const url = absoluteUrl(getPathname({href: tool.href, locale}));
          return `  - [${t(`items.${tool.key}.title`)}](${url})`;
        }),
      ].join("\n");
    }),
  );
  const localizedNewsLinks = await Promise.all(
    siteConfig.locales.map(async (locale) => {
      const pathname = await getPathname({href: "/news", locale});

      return `- [${siteConfig.localeNames[locale]}](${absoluteUrl(pathname)})`;
    }),
  );

  const localizedAboutLinks = await Promise.all(
    siteConfig.locales.map(async (locale) => {
      const pathname = await getPathname({href: "/about", locale});

      return `- [${siteConfig.localeNames[locale]}](${absoluteUrl(pathname)})`;
    }),
  );

  const content = [
    `# ${siteConfig.name}`,
    "",
    "> Komitehane is a Turkish and English website for medical students in Turkey: free committee (komite) and midterm (vize) grade calculators, minimum final grade calculators, a TUS exam countdown, and TUS and medical education news.",
    "",
    "## Localized homepages",
    ...siteConfig.locales.map(
      (locale) => `- [${siteConfig.localeNames[locale]}](${absoluteUrl(`/${locale}`)})`
    ),
    "",
    "## Public tools",
    ...localizedToolLinks,
    "",
    "## News",
    ...localizedNewsLinks,
    "",
    "## News RSS feeds",
    ...siteConfig.locales.map(
      (locale) => `- [${siteConfig.localeNames[locale]}](${absoluteUrl(getRssFeedPath(locale, "news"))})`
    ),
    "",
    "## About Komitehane and editorial process",
    ...localizedAboutLinks,
    "",
    "## Notes",
    "",
    "This is a concise, experimental machine-readable index of public resources.",
    "The canonical URLs, robots.txt, and sitemap.xml remain authoritative.",
    "",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
