"use client";

import {useEffect, useRef} from "react";

import {adsenseConfig} from "@/config/adsense";
import {cn} from "@/lib/utils";

type AdsByGoogleQueue = Array<Record<string, unknown>>;

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleQueue;
  }
}

const initializedAdElements = new WeakSet<HTMLModElement>();

export type AdSenseAdProps = {
  slot?: string;
  format?: string;
  responsive?: boolean;
  className?: string;
};

export function AdSenseAd({
  slot,
  format = "auto",
  responsive = true,
  className,
}: AdSenseAdProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const adElement = adRef.current;

    if (
      !adElement ||
      !adsenseConfig.enabled ||
      !adsenseConfig.clientId ||
      !slot ||
      initializedRef.current ||
      initializedAdElements.has(adElement)
    ) {
      return;
    }

    initializedRef.current = true;
    initializedAdElements.add(adElement);

    try {
      const adsbygoogle = (window.adsbygoogle = window.adsbygoogle || []);
      adsbygoogle.push({});
    } catch {
      // Ad blockers and blocked third-party scripts must not break the page.
    }
  }, [slot]);

  if (!adsenseConfig.enabled || !adsenseConfig.clientId || !slot) {
    return null;
  }

  return (
    <ins
      ref={adRef}
      className={cn("adsbygoogle block w-full", className)}
      style={{display: "block"}}
      data-ad-client={adsenseConfig.clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : undefined}
    />
  );
}
