import {Link} from "@/i18n/navigation";

type NewsAuthorCardProps = {
  authorName: string;
  /** Localized role label (from the `Authors.roles` messages). */
  roleLabel: string;
  /** Public profile slug; the name is rendered as plain text without one. */
  authorSlug: string | null;
  profileLinkLabel?: string;
};

function getAuthorInitial(authorName: string): string {
  return authorName.trim().charAt(0).toLocaleUpperCase() || "K";
}

export function NewsAuthorCard({
  authorName,
  roleLabel,
  authorSlug,
  profileLinkLabel,
}: NewsAuthorCardProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-medium text-foreground"
      >
        {getAuthorInitial(authorName)}
      </div>

      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-lg font-medium tracking-[-0.03em] text-foreground">
          {authorSlug ? (
            <Link
              href={{pathname: "/authors/[slug]", params: {slug: authorSlug}}}
              rel="author"
              aria-label={profileLinkLabel}
              className="underline-offset-4 hover:underline"
            >
              {authorName}
            </Link>
          ) : (
            authorName
          )}
        </p>
        <p className="truncate text-sm leading-5 text-muted-foreground">
          {roleLabel}
        </p>
      </div>
    </div>
  );
}
