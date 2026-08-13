import type {ReactNode} from "react";

import {SiteAside} from "@/components/layout/site-aside";

export function PageWithAside({children}: {children: ReactNode}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start">
      {children}
      <SiteAside />
    </div>
  );
}
