import { cn } from "@/lib/utils";

export function Logo({
  subtitle,
  className,
}: {
  subtitle?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-display text-xl tracking-tight text-foreground">LABPLAN</span>
      {subtitle ? (
        <span className="text-sm text-muted-foreground">/ {subtitle}</span>
      ) : null}
    </span>
  );
}
