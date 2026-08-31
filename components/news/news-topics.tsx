import {NewsBadge, NewsCategoryBadge} from "@/components/news/news-category-badge";
import type {NewsCategory, NewsTag} from "@/lib/news/types";

type NewsTopicsProps = {
  category: NewsCategory;
  tags: NewsTag[];
  label: string;
};

export function NewsTopics({category, tags, label}: NewsTopicsProps) {
  if (!category && tags.length === 0) return null;

  return (
    <section aria-labelledby="topics-title" className="border-y border-border/60 py-5 sm:py-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2
          id="topics-title"
          className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          {label}
        </h2>
        <div className="flex flex-wrap gap-2">
          <NewsCategoryBadge category={category} size="topic" />
          {tags.map((tag) => (
            <NewsBadge
              key={tag.id}
              label={tag.name}
              href={{pathname: "/news", query: {tag: tag.slug}}}
              size="topic"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
