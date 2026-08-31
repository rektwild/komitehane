const adsenseClientIdPattern = /^ca-pub-\d{16}$/;
const adsenseSlotPattern = /^\d+$/;

export type AdPlacementName =
  | "ARTICLE_TOP"
  | "ARTICLE_MIDDLE"
  | "ARTICLE_BOTTOM"
  | "LISTING_INLINE";

function readBoolean(value: string | undefined): boolean | undefined {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return undefined;
}

function readClientId(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized && adsenseClientIdPattern.test(normalized)
    ? normalized
    : undefined;
}

function readSlot(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized && adsenseSlotPattern.test(normalized)
    ? normalized
    : undefined;
}

const clientId = readClientId(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);
const publisherId = clientId?.replace(/^ca-/, "");
const enabledOverride = readBoolean(process.env.NEXT_PUBLIC_ADSENSE_ENABLED);
const nonProductionOptIn = readBoolean(
  process.env.NEXT_PUBLIC_ADSENSE_ENABLE_NON_PRODUCTION,
);

const isAutomatedTestEnvironment =
  process.env.NODE_ENV === "test" ||
  process.env.VITEST === "true" ||
  Boolean(process.env.JEST_WORKER_ID) ||
  process.env.PLAYWRIGHT_TEST === "true" ||
  process.env.CYPRESS === "true";

const environmentAllowsAds =
  process.env.NODE_ENV === "production"
    ? enabledOverride !== false
    : enabledOverride === true && nonProductionOptIn === true;

const slots = {
  ARTICLE_TOP: readSlot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_TOP),
  ARTICLE_MIDDLE: readSlot(
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_MIDDLE,
  ),
  ARTICLE_BOTTOM: readSlot(
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM,
  ),
  LISTING_INLINE: readSlot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_LISTING),
} as const;

export const adsenseConfig = {
  enabled: Boolean(clientId && environmentAllowsAds && !isAutomatedTestEnvironment),
  clientId,
  publisherId,
  slots,
  adsTxtLine: publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`
    : undefined,
} as const;

export const adsenseScriptSrc = clientId
  ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`
  : undefined;
