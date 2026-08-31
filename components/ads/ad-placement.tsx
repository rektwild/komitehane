import {getTranslations} from "next-intl/server";

import {AdSenseAd} from "@/components/ads/adsense-ad";
import {adsenseConfig, type AdPlacementName} from "@/config/adsense";
import {cn} from "@/lib/utils";

export async function AdPlacement({
  placement,
  className,
}: {
  placement: AdPlacementName;
  className?: string;
}) {
  const slot = adsenseConfig.slots[placement];

  if (!adsenseConfig.enabled || !slot) {
    return null;
  }

  const t = await getTranslations("Ads");

  return (
    <section
      aria-label={t("label")}
      className={cn("w-full min-w-0 py-6 sm:py-8", className)}
    >
      <div className="min-h-28 w-full min-w-0">
        <AdSenseAd slot={slot} format="auto" responsive />
      </div>
    </section>
  );
}
