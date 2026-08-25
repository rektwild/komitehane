import type {AuthorRole} from "@/lib/news/types";

type NewsAuthorCardProps = {
  authorName: string;
  authorRole: AuthorRole;
  locale: string;
};

function getAuthorInitial(authorName: string): string {
  return authorName.trim().charAt(0).toUpperCase() || "K";
}

function getRoleLabel(role: AuthorRole, locale: string): string {
  if (role === "founder") return "Founder";
  if (role === "editor") return locale === "tr" ? "Editör" : "Editor";
  return locale === "tr" ? "Yazar" : "Writer";
}

export function NewsAuthorCard({authorName, authorRole, locale}: NewsAuthorCardProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-medium text-foreground">
        {getAuthorInitial(authorName)}
      </div>

      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-lg font-medium tracking-[-0.03em] text-foreground">
          {authorName}
        </p>
        <p className="truncate text-sm leading-5 text-muted-foreground">
          {getRoleLabel(authorRole, locale)}
        </p>
      </div>
    </div>
  );
}
