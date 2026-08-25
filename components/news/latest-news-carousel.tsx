"use client";

import * as React from "react";
import {useTranslations} from "next-intl";

import {ArticleCard} from "@/components/news/article-card";
import {Button} from "@/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type {NewsLocale, NewsSummary} from "@/lib/news/types";
import {cn} from "@/lib/utils";

export function LatestNewsCarousel({
  articles,
  locale,
}: {
  articles: NewsSummary[];
  locale: NewsLocale;
}) {
  const t = useTranslations("NewsPage");
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    const update = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  if (!articles.length) return null;

  return (
    <section aria-label={t("carouselLabel")}>
      <Carousel
        setApi={setApi}
        opts={{loop: articles.length > 1}}
        aria-label={t("carouselLabel")}
      >
        <CarouselContent>
          {articles.map((article) => (
            <CarouselItem key={article.id}>
              <ArticleCard
                article={article}
                locale={locale}
                variant="featured"
                readingTimeLabel={t("readingTime", {
                  minutes: String(article.readingMinutes),
                })}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {articles.length > 1 ? (
          <>
            <CarouselPrevious aria-label={t("previousSlide")} />
            <CarouselNext aria-label={t("nextSlide")} />
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {Array.from({length: count}, (_, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("goToSlide", {number: String(index + 1)})}
                  aria-current={current === index ? "true" : undefined}
                  onClick={() => api?.scrollTo(index)}
                  className="rounded-full"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full bg-muted-foreground/40 transition-all",
                      current === index && "w-4 bg-foreground",
                    )}
                  />
                </Button>
              ))}
            </div>
          </>
        ) : null}
      </Carousel>
    </section>
  );
}
