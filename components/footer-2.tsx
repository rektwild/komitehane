import {getTranslations} from "next-intl/server";

import {SiteBrand} from "@/components/layout/site-brand";
import {FooterThemeSwitcher} from "@/components/layout/theme-switcher";
import {ClaudeAI} from "@/components/ui/svgs/claude-ai";
import {Gemini} from "@/components/ui/svgs/gemini";
import {Openai} from "@/components/ui/svgs/openai";
import {Perplexity} from "@/components/ui/svgs/perplexity";
import {Button} from "@/components/ui/button";
import {Link} from "@/i18n/navigation";

const footerGroups = [
  {
    key: "explore",
    links: [
      {href: "/courses", key: "courses"},
      {href: "/library", key: "library"},
      {href: "/podcasts", key: "podcasts"},
      {href: "/communities", key: "communities"},
    ],
  },
  {
    key: "tools",
    links: [
      {href: "/tools", key: "tools"},
      {href: "/store", key: "store"},
    ],
  },
  {
    key: "account",
    links: [
      {href: "/login", key: "login"},
      {href: "/signup", key: "signup"},
    ],
  },
] as const;

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
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-full lg:col-span-3">
            <SiteBrand className="w-fit" />
          </div>

          {footerGroups.map((group) => (
            <nav
              key={group.key}
              aria-label={t(`groups.${group.key}`)}
            >
              <h2 className="text-foreground text-sm font-medium">
                {t(`groups.${group.key}`)}
              </h2>
              <ul className="mt-4 flex flex-col gap-4">
                {group.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground duration-150 hover:text-primary"
                    >
                      {t(`links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="grid gap-x-3 gap-y-6 border-t pt-6 sm:grid-cols-2">
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
