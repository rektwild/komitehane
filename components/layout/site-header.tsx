import {LocaleSwitcher} from "@/components/locale-switcher";

import {DesktopNavigation} from "./desktop-navigation";
import {HeaderAuthActions} from "./header-auth-actions";
import {HeaderSearch} from "./header-search";
import {MobileNavigation} from "./mobile-navigation";
import {SiteBrand} from "./site-brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 shadow-xs backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-[60px] w-full max-w-(--breakpoint-2xl) items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center justify-start gap-5 xl:flex-none">
          <SiteBrand />
          <DesktopNavigation />
        </div>

        <div className="flex min-w-0 flex-1 justify-center px-2 sm:px-4 xl:max-w-lg">
          <HeaderSearch className="w-full" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1 xl:flex">
            <LocaleSwitcher />
            <HeaderAuthActions />
          </div>
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
