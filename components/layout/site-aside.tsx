import {getTranslations} from "next-intl/server";
import {ArrowRightIcon} from "lucide-react";

import {Link} from "@/i18n/navigation";
import {tools} from "@/lib/tools";
import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {TusCountdown} from "@/components/layout/tus-countdown";

export async function SiteAside() {
  const [t, toolsT] = await Promise.all([
    getTranslations("Aside"),
    getTranslations("Tools"),
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

        <section aria-labelledby="related-tools-title" className="flex flex-col gap-3">
          <h2 id="related-tools-title" className="text-sm font-medium">
            {t("relatedTools.title")}
          </h2>
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

        <section aria-labelledby="related-blogs-title" className="flex flex-col gap-3">
          <h2 id="related-blogs-title" className="text-sm font-medium">
            {t("relatedBlogs.title")}
          </h2>
          <Card size="sm">
            <CardContent>
              <ul className="flex flex-col gap-1">
                <li>
                  <Button
                    className="w-full justify-start text-muted-foreground disabled:opacity-100"
                    disabled
                    size="sm"
                    variant="ghost"
                  >
                    <ArrowRightIcon aria-hidden="true" data-icon="inline-start" />
                    {t("relatedBlogs.items.studyPlan")}
                  </Button>
                </li>
                <li>
                  <Button
                    className="w-full justify-start text-muted-foreground disabled:opacity-100"
                    disabled
                    size="sm"
                    variant="ghost"
                  >
                    <ArrowRightIcon aria-hidden="true" data-icon="inline-start" />
                    {t("relatedBlogs.items.resourceSelection")}
                  </Button>
                </li>
                <li>
                  <Button
                    className="w-full justify-start text-muted-foreground disabled:opacity-100"
                    disabled
                    size="sm"
                    variant="ghost"
                  >
                    <ArrowRightIcon aria-hidden="true" data-icon="inline-start" />
                    {t("relatedBlogs.items.examDayPreparation")}
                  </Button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </aside>
  );
}
