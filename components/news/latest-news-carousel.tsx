"use client";

import * as React from "react";
import {useTranslations} from "next-intl";

import {ArticleCard} from "@/components/news/article-card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type {NewsLocale, NewsSummary} from "@/lib/news/types";

type PageItem =
  | {type: "page"; index: number}
  | {type: "ellipsis"; key: string};

function getPageItems(count: number, current: number): PageItem[] {
  if (count <= 7) {
    return Array.from({length: count}, (_, index) => ({
      type: "page" as const,
      index,
    }));
  }

  const pageIndexes = new Set([0, count - 1, current - 1, current, current + 1]);
  const sortedIndexes = [...pageIndexes]
    .filter((index) => index >= 0 && index < count)
    .sort((a, b) => a - b);
  const items: PageItem[] = [];

  sortedIndexes.forEach((index, position) => {
    const previousIndex = sortedIndexes[position - 1];
    if (position > 0 && index - previousIndex > 1) {
      items.push({
        type: "ellipsis",
        key: `ellipsis-${previousIndex}-${index}`,
      });
    }

    items.push({type: "page", index});
  });

  return items;
}

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
  const [count, setCount] = React.useState(articles.length);

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

  const totalSlides = count || articles.length;
  const pageItems = getPageItems(totalSlides, current);

  return (
    <section
      aria-label={t("carouselLabel")}
      className="flex min-w-0 flex-col gap-4"
    >

      <Carousel
        aria-label={t("carouselLabel")}
        className="min-w-0"
        opts={{loop: articles.length > 1}}
        setApi={setApi}
      >
        <CarouselContent>
          {articles.map((article, index) => (
            <CarouselItem key={article.id}>
              <ArticleCard
                article={article}
                locale={locale}
                preload={index === 0}
                readingTimeLabel={t("readingTime", {
                  minutes: String(article.readingMinutes),
                })}
                variant="carousel"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {totalSlides > 1 ? (
        <Pagination aria-label={t("carouselLabel")} className="w-full">
          <PaginationContent className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <PaginationItem className="min-w-0 justify-self-start">
              <PaginationPrevious
                href="#previous-slide"
                aria-label={t("previousSlide")}
                text={t("previousSlide")}
                onClick={(event) => {
                  event.preventDefault();
                  api?.scrollPrev();
                }}
              />
            </PaginationItem>

            <PaginationItem className="flex min-w-0 items-center gap-0.5 overflow-hidden">
              {pageItems.map((item) =>
                item.type === "ellipsis" ? (
                  <PaginationEllipsis key={item.key} label={t("paginationEllipsis")} />
                ) : (
                  <PaginationLink
                    key={item.index}
                    href={`#news-slide-${item.index + 1}`}
                    isActive={current === item.index}
                    aria-label={t("goToSlide", {
                      number: String(item.index + 1),
                    })}
                    onClick={(event) => {
                      event.preventDefault();
                      api?.scrollTo(item.index);
                    }}
                  >
                    {item.index + 1}
                  </PaginationLink>
                ),
              )}
            </PaginationItem>

            <PaginationItem className="min-w-0 justify-self-end">
              <PaginationNext
                href="#next-slide"
                aria-label={t("nextSlide")}
                text={t("nextSlide")}
                onClick={(event) => {
                  event.preventDefault();
                  api?.scrollNext();
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </section>
  );
}
