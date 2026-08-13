import {siteConfig} from "@/config/site";
import {createSocialImage, socialImageSize} from "@/lib/seo/social-image";

export const alt = siteConfig.name;
export const size = socialImageSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  return createSocialImage(locale);
}

