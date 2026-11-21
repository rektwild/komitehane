import {RssIcon} from "lucide-react";
import {getLocale, getTranslations} from "next-intl/server";

import {SiteBrand} from "@/components/layout/site-brand";
import {FooterThemeSwitcher} from "@/components/layout/theme-switcher";
import {ClaudeAI} from "@/components/ui/svgs/claude-ai";
import {Gemini} from "@/components/ui/svgs/gemini";
import {Openai} from "@/components/ui/svgs/openai";
import {Perplexity} from "@/components/ui/svgs/perplexity";
import {Button} from "@/components/ui/button";
import {Link} from "@/i18n/navigation";
import {isLinkableRoute} from "@/lib/navigation";
import {getRssFeedPath, RSS_MEDIA_TYPE} from "@/lib/rss";
import {tools} from "@/lib/tools";
import {typography} from "@/lib/typography";

const aiProviders = [
  {key: "claude", href: "https://claude.ai/", icon: ClaudeAI},
  {key: "openai", href: "https://chatgpt.com/", icon: Openai},
  {
    key: "perplexity",
    href: "https://www.perplexity.ai/",
    icon: Perplexity,
  },
  {key: "gemini", href: "https://gemini.google.com/", icon: Gemini},
] as const;

export default async function Footer() {
  const [t, toolsT, locale] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Tools"),
    getLocale(),
  ]);
  const year = new Date().getFullYear();
  const footerGroups = [
    {
      key: "explore",
      links: [
        {href: "/news", label: t("links.news")},
        {href: "/library", label: t("links.library")},
        {href: "/podcasts", label: t("links.podcasts")},
        {href: "/communities", label: t("links.communities")},
        {href: "/tools", label: t("links.tools")},
        {href: "/store", label: t("links.store")},
      ],
    },
    {
      key: "tools",
      links: tools.map((tool) => ({
        href: tool.href,
        label: toolsT(`items.${tool.key}.title`),
      })),
    },
    {
      key: "site",
      links: [
        {href: "/about", label: t("links.about")},
        {href: "/privacy", label: t("links.privacy")},
      ],
    },
    {
      key: "account",
      links: [
        {href: "/login", label: t("links.login")},
        {href: "/signup", label: t("links.signup")},
      ],
    },
  ] as const;
  const visibleFooterGroups = footerGroups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => isLinkableRoute(link.href)),
    }))
    .filter((group) => group.links.length > 0);

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-full flex flex-col items-start gap-3 lg:col-span-3">
            <SiteBrand className="w-fit" />
            {/* Plain <a>: the feed is a route handler, not a page to prefetch. */}
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              className="-ml-2.5"
              render={
                <a
                  href={getRssFeedPath(locale, "news")}
                  type={RSS_MEDIA_TYPE}
                  aria-label={t("rss.label")}
                  title={t("rss.label")}
                />
              }
            >
              <RssIcon aria-hidden="true" />
            </Button>
          </div>

          {visibleFooterGroups.map((group) => (
            <nav
              key={group.key}
              aria-label={t(`groups.${group.key}`)}
            >
              <h2 className={typography.label}>
                {t(`groups.${group.key}`)}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground duration-150 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="grid gap-x-6 gap-y-6 border-t pt-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">
              {t("aiLinksLabel")}
            </p>
            <div className="-ml-2.5 mt-2 flex items-center">
              {aiProviders.map((provider) => {
                const Icon = provider.icon;

                return (
                  <Button
                    key={provider.key}
                    variant="ghost"
                    size="icon"
                    nativeButton={false}
                    render={
                      <a
                        href={provider.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t(`providers.${provider.key}`)}
                      />
                    }
                  >
                    <Icon aria-hidden="true" />
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-end sm:justify-self-end">
            <span className="block text-sm text-muted-foreground">
              {t("copyright", {year: String(year)})}
            </span>
            <FooterThemeSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
