"use client";

import {
  BookOpenIcon,
  BoxIcon,
  FolderIcon,
  HeadphonesIcon,
  MessagesSquareIcon,
  ShoppingBagIcon,
} from "lucide-react";
import {usePathname, Link} from "@/i18n/navigation";
import {useTranslations} from "next-intl";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {cn} from "@/lib/utils";

const navigationItems = [
  {key: "courses", href: "/courses", icon: BookOpenIcon},
  {key: "library", href: "/library", icon: FolderIcon},
  {key: "podcasts", href: "/podcasts", icon: HeadphonesIcon},
  {key: "communities", href: "/communities", icon: MessagesSquareIcon},
  {key: "playgrounds", href: "/playgrounds", icon: BoxIcon},
  {key: "store", href: "/store", icon: ShoppingBagIcon},
] as const;

export function DesktopNavigation() {
  const t = useTranslations("Header");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("navigation.label")}
      className="hidden h-6 min-w-0 items-center ps-1 xl:flex"
    >
      <NavigationMenu className="flex-none">
        <NavigationMenuList className="gap-5">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <NavigationMenuItem key={item.key}>
                <NavigationMenuLink
                  active={isActive}
                  aria-current={isActive ? "page" : undefined}
                  render={<Link href={item.href} />}
                  className={cn(
                    "whitespace-nowrap p-0 text-base font-semibold text-foreground/75 hover:bg-transparent hover:text-foreground focus:bg-transparent data-active:bg-transparent data-active:hover:bg-transparent data-active:focus:bg-transparent",
                    isActive && "font-semibold text-foreground",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={2.4}
                  />
                  {t(`navigation.${item.key}`)}
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
