import {indexNowKey} from "@/config/site";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  {params}: {params: Promise<{key: string}>}
) {
  const {key} = await params;

  if (!indexNowKey || key !== indexNowKey) {
    return new Response("Not found", {status: 404});
  }

  return new Response(`${indexNowKey}\n`, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

