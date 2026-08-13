"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";

import FlipClock from "@/components/8starlabs-ui/flip-clock";
import {TUS_TARGET_DATE} from "@/lib/tus";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const turkeyDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getCalendarDay(date: Date) {
  const parts = turkeyDateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return Date.UTC(year, month - 1, day);
}

function getTargetCalendarDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return Date.UTC(year, month - 1, day);
}

const targetCalendarDay = getTargetCalendarDay(TUS_TARGET_DATE);
const TUS_TARGET_DATETIME = new Date(
  `${TUS_TARGET_DATE}T23:59:59.999+03:00`,
);

function getDaysRemaining(now: Date) {
  return Math.max(
    0,
    Math.round((targetCalendarDay - getCalendarDay(now)) / MILLISECONDS_PER_DAY),
  );
}

export function TusCountdown() {
  const t = useTranslations("Aside");
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const updateDaysRemaining = () => {
      setDaysRemaining(getDaysRemaining(new Date()));
    };

    updateDaysRemaining();
    const intervalId = window.setInterval(updateDaysRemaining, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <output
      aria-live="polite"
      className="block min-h-10 min-w-0 overflow-hidden text-center"
    >
      {daysRemaining === null ? (
        <span aria-hidden="true" className="block h-10" />
      ) : (
        <>
          <FlipClock
            aria-hidden="true"
            countdown
            targetDate={TUS_TARGET_DATETIME}
            showDays="always"
            size="sm"
            variant="secondary"
            className="w-full min-w-0 gap-0"
          />
          <span className="sr-only">
            {t("countdown.value", {days: daysRemaining})}
          </span>
        </>
      )}
    </output>
  );
}
