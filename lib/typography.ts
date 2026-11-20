/**
 * Shared type scale. Use these for headings and supporting text instead of
 * hand-writing size/weight/tracking combinations so every page reads the same.
 * Compose with `cn()` and add only layout classes (margins, clamping) on top.
 */
export const typography = {
  /** Page title (exactly one `h1` per page). */
  display:
    "text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl",
  /** Section heading (`h2`). */
  title: "text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl",
  /** Card / sub-section heading (`h3`, card titles). */
  heading: "text-lg font-semibold leading-snug tracking-tight",
  /** Small heading for asides, footers and compact panels. */
  label: "text-sm font-medium text-foreground",
  /** Intro paragraph under a page title. */
  lead: "text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8",
  /** Supporting copy such as card excerpts. */
  body: "text-sm leading-relaxed text-muted-foreground",
  /** Dates, reading time and other metadata. */
  meta: "text-xs text-muted-foreground",
  /** Monospace uppercase eyebrow / compact badge text. */
  eyebrow: "font-mono text-[10px] font-medium uppercase tracking-widest",
} as const;
