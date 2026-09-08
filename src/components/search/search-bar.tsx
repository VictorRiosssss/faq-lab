"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Sector = { id: string; slug: string; name: string };

const ALL_SECTORS_VALUE = "todos";

export function SearchBar({
  sectors,
  defaultQuery,
  defaultSectorSlug,
}: {
  sectors: Sector[];
  defaultQuery: string;
  defaultSectorSlug?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultQuery);
  const [sectorSlug, setSectorSlug] = useState(defaultSectorSlug || ALL_SECTORS_VALUE);

  function pushSearch(nextQuery: string, nextSector: string) {
    const params = new URLSearchParams(searchParams);
    params.set("q", nextQuery.trim());
    if (nextSector && nextSector !== ALL_SECTORS_VALUE) {
      params.set("sector", nextSector);
    } else {
      params.delete("sector");
    }
    router.push(`/buscar?${params.toString()}`);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    pushSearch(query, sectorSlug);
  }

  function handleSectorChange(nextSector: string) {
    setSectorSlug(nextSector);
    pushSearch(query, nextSector);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row">
      <div className="flex h-11 flex-1 items-center gap-2.5 rounded-input border border-border bg-card px-3.5 transition-colors focus-within:border-ring hover:border-border-hover">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquise um processo, dúvida ou procedimento…"
          className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Select value={sectorSlug} onValueChange={handleSectorChange}>
        <SelectTrigger className="h-11 sm:w-44">
          <SelectValue placeholder="Todos os setores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SECTORS_VALUE}>Todos os setores</SelectItem>
          {sectors.map((sector) => (
            <SelectItem key={sector.id} value={sector.slug}>
              {sector.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
