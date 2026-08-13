import Image from "next/image";

import {siteConfig} from "@/config/site";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";

type SiteBrandProps = {
  className?: string;
};

export function SiteBrand({className}: SiteBrandProps) {
  return (
    <Link
      href="/"
      aria-label={siteConfig.name}
      className={cn(
        "group inline-flex min-w-0 shrink-0 items-center leading-none rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="block h-6 w-fit shrink-0 overflow-visible">
        <Image
          src="/komitehane_logo.png"
          alt=""
          width={684}
          height={148}
          className="block h-8 w-auto"
        />
      </span>
    </Link>
  );
}
