import {siteConfig} from "@/config/site";
import {absoluteUrl} from "@/lib/seo/urls";

export function GET() {
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

