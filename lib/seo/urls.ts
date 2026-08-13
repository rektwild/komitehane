import {siteUrl} from "@/config/site";

export {siteUrl};

export function absoluteUrl(pathname: string): string {
  if (/^https?:\/\//i.test(pathname)) {
    return new URL(pathname).toString();
  }

  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(path, `${siteUrl}/`).toString();
}
