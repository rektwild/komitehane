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
      className={cn(
        // Reserve spacing only once AdSense reports a filled ad; unfilled,
        // blocked or not-yet-loaded slots must not leave an empty gap.
        "w-full min-w-0 has-[ins[data-ad-status=filled]]:py-6 sm:has-[ins[data-ad-status=filled]]:py-8",
        className,
      )}
    >
      <div className="w-full min-w-0">
        <AdSenseAd slot={slot} format="auto" responsive />
      </div>
    </section>
  );
}
