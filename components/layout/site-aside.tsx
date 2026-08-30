import {getLocale, getTranslations} from "next-intl/server";
import {ArrowRightIcon} from "lucide-react";

import {Link} from "@/i18n/navigation";
import {toolCategories, tools} from "@/lib/tools";
import {getLatestNewsLinks, getNewsCategories} from "@/lib/news/data";
import type {NewsLocale} from "@/lib/news/types";
import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {TusCountdown} from "@/components/layout/tus-countdown";

export async function SiteAside() {
  const [t, toolsT, locale] = await Promise.all([
    getTranslations("Aside"),
    getTranslations("Tools"),
    getLocale(),
  ]);
  const newsLocale = locale as NewsLocale;
  const [latestNews, categories] = await Promise.all([
    getLatestNewsLinks(newsLocale),
    getNewsCategories(newsLocale).catch(() => []),
  ]);

  return (
    <aside aria-label={t("label")} className="w-full lg:w-72 lg:shrink-0">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="tus-countdown-title" className="flex flex-col gap-3">
          <h2 id="tus-countdown-title" className="text-sm font-medium">
            {t("countdown.title")}
          </h2>
          <Card size="sm">
            <CardContent className="min-w-0 overflow-hidden">
              <TusCountdown />
            </CardContent>
          </Card>
        </section>

        <section
          aria-labelledby="related-tools-categories-title"
          className="flex flex-col gap-3"
        >
          <h2 id="related-tools-categories-title" className="text-sm font-medium">
            {t("relatedToolsCategories.title")}
          </h2>
          <Card size="sm">
            <CardContent>
              <ul className="flex flex-col gap-1">
                {toolCategories.map((category) => (
                  <li key={category}>
                    <Button
                      className="h-auto min-h-7 w-full items-start justify-start py-1 text-start whitespace-normal"
                      nativeButton={false}
                      size="sm"
                      variant="ghost"
                      render={
                        <Link
                          href={{
                            pathname: "/tools",
                            query: {category},
                          }}
                        />
                      }
                    >
                      <ArrowRightIcon
                        aria-hidden="true"
                        className="mt-0.5 shrink-0"
                        data-icon="inline-start"
                      />
                      <span className="min-w-0">{toolsT(`categories.${category}`)}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <section aria-labelledby="related-tools-title" className="flex flex-col gap-3">
            <h3 id="related-tools-title" className="text-sm font-medium">
              {t("relatedTools.title")}
            </h3>
            <Card size="sm">
              <CardContent>
                <ul className="flex flex-col gap-1">
                  {tools.map((tool) => (
                    <li key={tool.key}>
                      <Button
                        className="w-full justify-start"
                        nativeButton={false}
                        size="sm"
                        variant="ghost"
                        render={<Link href={tool.href} />}
                      >
                        <ArrowRightIcon aria-hidden="true" data-icon="inline-start" />
                        {toolsT(`items.${tool.key}.title`)}
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        </section>

        <section aria-labelledby="related-categories-title" className="flex flex-col gap-3">
          <h2 id="related-categories-title" className="text-sm font-medium">
            {t("relatedCategories.title")}
          </h2>
          <Card size="sm">
            <CardContent>
              {categories.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Button
                        className="h-auto min-h-7 w-full items-start justify-start py-1 text-start whitespace-normal"
                        nativeButton={false}
                        size="sm"
                        variant="ghost"
                        render={
                          <Link
                            href={{
                              pathname: "/news",
                              query: {category: category.slug},
                            }}
                          />
                        }
                      >
                        <ArrowRightIcon
                          aria-hidden="true"
                          className="mt-0.5 shrink-0"
                          data-icon="inline-start"
                        />
                        <span className="min-w-0">{category.name}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-1 text-sm text-muted-foreground">
                  {t("relatedCategories.empty")}
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="related-blogs-title" className="flex flex-col gap-3">
          <h2 id="related-blogs-title" className="text-sm font-medium">
            {t("relatedBlogs.title")}
          </h2>
          <Card size="sm">
            <CardContent>
              {latestNews.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {latestNews.map((item) => (
                    <li key={item.slug}>
                      <Button
                        className="h-auto min-h-7 w-full items-start justify-start py-1 text-start whitespace-normal"
                        nativeButton={false}
                        size="sm"
                        variant="ghost"
                        render={
                          <Link
                            href={{
                              pathname: "/news/[slug]",
                              params: {slug: item.slug},
                            }}
                          />
                        }
                      >
                        <ArrowRightIcon
                          aria-hidden="true"
                          className="mt-0.5 shrink-0"
                          data-icon="inline-start"
                        />
                        <span className="min-w-0">{item.title}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-1 text-sm text-muted-foreground">
                  {t("relatedBlogs.empty")}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </aside>
  );
}
