import {adsenseConfig} from "@/config/adsense";

export const dynamic = "force-dynamic";

export function GET() {
  const content = adsenseConfig.adsTxtLine
    ? `${adsenseConfig.adsTxtLine}\n`
    : "";

  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
