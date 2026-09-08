"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div
        className={[
          "flex h-14 items-center gap-3 rounded-input border bg-card px-4 transition-[border-color,box-shadow] duration-150",
          focused
            ? "border-ring shadow-[0_0_0_3px_rgba(17,17,17,0.06)]"
            : "border-border hover:border-border-hover",
        ].join(" ")}
      >
        <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" strokeWidth={2} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Pesquise um processo, dúvida ou procedimento…"
          className="h-full flex-1 bg-transparent text-[0.95rem] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </form>
  );
}
