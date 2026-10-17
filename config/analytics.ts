const gaMeasurementIdPattern = /^G-[A-Z0-9]+$/i;

function readGaMeasurementId(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized && gaMeasurementIdPattern.test(normalized)
    ? normalized
    : undefined;
}

const measurementId = readGaMeasurementId(
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
);

const isProduction = process.env.NODE_ENV === "production";

export const gaConfig = {
  measurementId,
  enabled: Boolean(measurementId && isProduction),
} as const;
