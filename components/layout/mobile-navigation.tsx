"use client";

import {
  BookOpenIcon,
  BoxIcon,
  FolderIcon,
  HeadphonesIcon,
  MenuIcon,
  MessagesSquareIcon,
  ShoppingBagIcon,
  XIcon,
} from "lucide-react";
import {useTranslations} from "next-intl";

import {Link} from "@/i18n/navigation";
import {Button} from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {cn} from "@/lib/utils";

import {LocaleSwitcher} from "@/components/locale-switcher";
import {HeaderAuthActions} from "./header-auth-actions";
import {HeaderSearch} from "./header-search";
import {SiteBrand} from "./site-brand";

const navigationItems = [
  {key: "courses", href: "/courses", icon: BookOpenIcon},
  {key: "library", href: "/library", icon: FolderIcon},
  {key: "podcasts", href: "/podcasts", icon: HeadphonesIcon},
  {key: "communities", href: "/communities", icon: MessagesSquareIcon},
  {key: "tools", href: "/tools", icon: BoxIcon},
  {key: "store", href: "/store", icon: ShoppingBagIcon},
] as const;

export function MobileNavigation() {
  const t = useTranslations("Header");

  return (
    <div className="xl:hidden">
      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("mobile.openMenu")}
            />
          }
        >
          <MenuIcon aria-hidden="true" />
        </SheetTrigger>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[88vw] sm:max-w-sm"
        >
          <SheetHeader className="border-b border-border/60 px-4 py-3">
            <SiteBrand />
            <SheetTitle className="sr-only">{t("mobile.title")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("mobile.description")}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pt-1">
            <HeaderSearch className="w-full" />
          </div>

          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("mobile.closeMenu")}
                className="absolute top-3 end-3"
              />
            }
          >
            <XIcon aria-hidden="true" />
          </SheetClose>

          <nav
            aria-label={t("navigation.label")}
            className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
          >
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <SheetClose
                  key={item.key}
                  nativeButton={false}
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                      )}
                    />
                  }
                >
                  <Icon aria-hidden="true" />
                  {t(`navigation.${item.key}`)}
                </SheetClose>
              );
            })}
          </nav>

          <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3">
            <HeaderAuthActions />
            <LocaleSwitcher />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
