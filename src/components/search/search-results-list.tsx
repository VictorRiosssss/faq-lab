import Link from "next/link";
import { HighlightText } from "@/components/search/highlight-text";
import type { SearchHit } from "@/server/db/queries/search.queries";

export function SearchResultsList({ hits, query }: { hits: SearchHit[]; query: string }) {
  return (
    <div className="flex flex-col">
      {hits.map((hit) => (
        <Link
          key={hit.id}
          href={`/perguntas/${hit.id}`}
          className="group flex flex-col gap-1.5 border-b border-border py-5 transition-colors first:pt-0 last:border-0 hover:bg-background-subtle -mx-3 px-3"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {hit.sectorName}
          </span>
          <span className="text-[0.95rem] font-medium text-foreground">
            <HighlightText text={hit.question} query={query} />
          </span>
          <span className="line-clamp-2 text-sm text-muted-foreground">
            <HighlightText text={hit.answerText} query={query} />
          </span>
        </Link>
      ))}
    </div>
  );
}
