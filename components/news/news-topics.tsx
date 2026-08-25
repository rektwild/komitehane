import {NewsCategoryBadge} from "@/components/news/news-category-badge";
import type {NewsCategory} from "@/lib/news/types";

type NewsTopicsProps = {
  topics: NewsCategory[];
  label: string;
};

export function NewsTopics({topics, label}: NewsTopicsProps) {
  if (topics.length === 0) return null;

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
          {topics.map((topic) => (
            <NewsCategoryBadge key={topic.id} category={topic} size="topic" />
          ))}
        </div>
      </div>
    </section>
  );
}
