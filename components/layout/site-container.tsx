import type {HTMLAttributes} from "react";

import {cn} from "@/lib/utils";

export function SiteContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "site-container mx-auto w-full max-w-[var(--site-max-width)] px-4 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    />
  );
}
