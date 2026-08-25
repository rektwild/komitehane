"use client";

import {useEffect, useState} from "react";

import {cn} from "@/lib/utils";
import type {NewsTocItem} from "@/lib/news/toc";

type NewsTableOfContentsProps = {
  items: NewsTocItem[];
  title: string;
};

export function NewsTableOfContents({items, title}: NewsTableOfContentsProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;

    const updateActiveId = () => {
      let nextActiveId = items[0]?.id ?? "";
      for (const item of items) {
        const element = document.getElementById(item.id);
        if (element && element.getBoundingClientRect().top <= 180) {
          nextActiveId = item.id;
        }
      }
      setActiveId(nextActiveId);
    };

    updateActiveId();
    window.addEventListener("scroll", updateActiveId, {passive: true});
    window.addEventListener("resize", updateActiveId);
    return () => {
      window.removeEventListener("scroll", updateActiveId);
      window.removeEventListener("resize", updateActiveId);
    };
  }, [items]);

  if (!items.length) return null;

  return (
    <section aria-labelledby="toc-title">
      <p id="toc-title" className="mb-3 text-sm font-medium text-foreground">
        {title}
      </p>
      <nav aria-label={title}>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <li key={item.id} className={cn(item.level === 3 && "ps-4")}>
                <a
                  href={`#${item.id}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-sm leading-6 transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
