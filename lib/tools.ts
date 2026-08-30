import type {LucideIcon} from "lucide-react";
import {
  CalculatorIcon,
  ClipboardCheckIcon,
  PercentIcon,
  TargetIcon,
} from "lucide-react";

import type {AppPathname} from "@/i18n/routing";

type ToolDefinitionShape = {
  key:
    | "midtermGrade"
    | "committeeGrade"
    | "committeeMinimumFinal"
    | "midtermMinimumFinal";
  href: AppPathname;
  slug: string;
  category: ToolCategory;
  icon: LucideIcon;
  thumbnailClassName: string;
};

export type ToolCategory = "midterm" | "committee";

export const toolCategories = ["midterm", "committee"] as const satisfies readonly ToolCategory[];

export const tools = [
  {
    key: "midtermGrade",
    href: "/tools/midterm-grade-calculator",
    slug: "midterm-grade-calculator",
    category: "midterm",
    icon: CalculatorIcon,
    thumbnailClassName:
      "from-sky-500 via-cyan-400 to-blue-600 text-white",
  },
  {
    key: "committeeGrade",
    href: "/tools/committee-grade-calculator",
    slug: "committee-grade-calculator",
    category: "committee",
    icon: ClipboardCheckIcon,
    thumbnailClassName:
      "from-violet-600 via-fuchsia-500 to-purple-600 text-white",
  },
  {
    key: "committeeMinimumFinal",
    href: "/tools/committee-minimum-final-grade",
    slug: "committee-minimum-final-grade",
    category: "committee",
    icon: TargetIcon,
    thumbnailClassName:
      "from-amber-400 via-orange-500 to-red-500 text-white",
  },
  {
    key: "midtermMinimumFinal",
    href: "/tools/midterm-minimum-final-grade",
    slug: "midterm-minimum-final-grade",
    category: "midterm",
    icon: PercentIcon,
    thumbnailClassName:
      "from-emerald-500 via-teal-400 to-cyan-600 text-white",
  },
] as const satisfies readonly ToolDefinitionShape[];

export type ToolDefinition = (typeof tools)[number];
export type ToolKey = ToolDefinition["key"];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}
