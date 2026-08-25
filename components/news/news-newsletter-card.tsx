"use client";

import {useState} from "react";
import {ArrowUpRightIcon, AtSignIcon} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Link} from "@/i18n/navigation";

export function NewsNewsletterCard() {
  const t = useTranslations("NewsPage");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 254) {
      setError(t("newsletterInvalid"));
      setSubmitted(false);
      return;
    }

    setError(null);
    setSubmitted(true);
    setEmail("");
    window.setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section aria-labelledby="newsletter-card-title" className="space-y-4">
      <h2
        id="newsletter-card-title"
        className="flex items-center gap-3 text-base font-bold leading-none tracking-tight text-foreground"
      >
        <span>{t("newsletterTitle")}</span>
        <span aria-hidden="true" className="h-[2px] flex-1 self-center bg-action" />
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="flex h-12 items-center overflow-hidden rounded-full border border-border bg-background">
          <div className="flex shrink-0 items-center pl-3">
            <AtSignIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <Input
            className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 pr-2 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("newsletterPlaceholder")}
            required
            type="email"
            value={email}
          />
          <button
            aria-label={t("newsletterSubmitLabel")}
            className="flex h-full w-12 shrink-0 items-center justify-center border-s border-border text-foreground transition-colors hover:bg-muted/50"
            type="submit"
          >
            <ArrowUpRightIcon className="size-4" />
          </button>
        </div>
        {error ? (
          <p className="px-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {submitted ? (
          <p className="px-1 text-xs text-muted-foreground" role="status" aria-live="polite">
            {t("newsletterSuccess")}
          </p>
        ) : null}
      </form>

      <Button
        className="h-11 w-full rounded-full"
        nativeButton={false}
        render={<Link href="/tools" />}
        size="lg"
      >
        {t("getStarted")}
      </Button>
    </section>
  );
}
