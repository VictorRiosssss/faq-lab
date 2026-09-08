import Link from "next/link";
import { cn } from "@/lib/utils";

export function QuestionRow({
  href,
  title,
  eyebrow,
  snippet,
  className,
}: {
  href: string;
  title: string;
  eyebrow?: string;
  snippet?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-6 border-b border-border py-4 transition-colors first:pt-0 last:border-0 hover:bg-background-subtle",
        "-mx-3 px-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        <span className="truncate text-[0.95rem] font-medium text-foreground">{title}</span>
        {snippet ? (
          <span className="line-clamp-1 text-sm text-muted-foreground">{snippet}</span>
        ) : null}
      </div>
      <span
        aria-hidden="true"
        className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
      >
        →
      </span>
    </Link>
  );
}
