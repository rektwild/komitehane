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
      <span className="block h-6 w-[148px] shrink-0 overflow-visible">
        <Image
          src="/logo_for_light_mode.png"
          alt=""
          width={684}
          height={148}
          className="block h-8 w-full object-contain dark:hidden"
        />
        <Image
          src="/logo_for_dark_mode.png"
          alt=""
          width={2752}
          height={1536}
          className="hidden h-8 w-full object-cover object-center dark:block"
        />
      </span>
    </Link>
  );
}
