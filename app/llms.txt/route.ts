import {getPathname} from "@/i18n/navigation";
import {siteConfig} from "@/config/site";
import {absoluteUrl} from "@/lib/seo/urls";

export async function GET() {
  const localizedToolLinks = await Promise.all(
    siteConfig.locales.map(async (locale) => {
      const pathname = await getPathname({href: "/tools", locale});

      return `- [${siteConfig.localeNames[locale]}](${absoluteUrl(pathname)})`;
    }),
  );
  const localizedNewsLinks = await Promise.all(
    siteConfig.locales.map(async (locale) => {
      const pathname = await getPathname({href: "/news", locale});

      return `- [${siteConfig.localeNames[locale]}](${absoluteUrl(pathname)})`;
    }),
  );

  const content = [
    `# ${siteConfig.name}`,
    "",
    siteConfig.description,
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
