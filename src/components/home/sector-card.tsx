import Link from "next/link";

export function SectorCard({
  name,
  slug,
  description,
  questionCount,
}: {
  name: string;
  slug: string;
  description: string | null;
  questionCount: number;
}) {
  return (
    <Link
      href={`/setores/${slug}`}
      className="group flex h-full flex-col justify-between gap-6 rounded-card border border-border bg-card p-6 shadow-[var(--shadow-subtle)] transition-colors duration-150 hover:border-border-hover"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[0.95rem] font-medium text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {description ?? "Perguntas e respostas do setor."}
        </p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {questionCount} {questionCount === 1 ? "artigo" : "artigos"}
        </span>
        <span
          aria-hidden="true"
          className="text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
        >
          →
        </span>
      </div>
    </Link>
  );
}
