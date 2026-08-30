import {getTranslations} from "next-intl/server";

import {ToolCard} from "@/components/tools/tool-card";
import {tools, type ToolCategory} from "@/lib/tools";

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export async function HomeToolsCategorySection({
  category,
  index,
}: {
  category: ToolCategory;
  index: number;
}) {
  const t = await getTranslations("Tools");
  const selectedTools = shuffle(tools.filter((tool) => tool.category === category)).slice(
    0,
    3,
  );

  if (!selectedTools.length) return null;

  const headingId = `home-tools-category-${category}-${index}`;

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0"
    >
      <div className="flex min-w-0 items-center gap-6">
        <h2
          id={headingId}
          className="min-w-0 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {t(`categories.${category}`)}
        </h2>
        <span aria-hidden="true" className="h-1 min-w-0 flex-1 bg-action" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {selectedTools.map((tool) => (
          <ToolCard
            key={tool.key}
            tool={{
              key: tool.key,
              href: tool.href,
            }}
          />
        ))}
      </div>
    </section>
  );
}
