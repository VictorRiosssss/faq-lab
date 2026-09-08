"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { QuestionRow } from "@/components/question/question-row";
import { EmptyState } from "@/components/ui/empty-state";

type Question = { id: string; question: string };

export function SectorQuestionList({ questions }: { questions: Question[] }) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return questions;
    return questions.filter((q) => q.question.toLowerCase().includes(term));
  }, [filter, questions]);

  return (
    <div className="flex flex-col gap-6">
      {questions.length > 5 ? (
        <div className="flex h-10 items-center gap-2.5 rounded-input border border-border bg-card px-3.5 focus-within:border-ring">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrar perguntas deste setor…"
            className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma pergunta encontrada"
          description="Tente outro termo ou volte para a lista completa do setor."
        />
      ) : (
        <div className="flex flex-col">
          {filtered.map((question) => (
            <QuestionRow
              key={question.id}
              href={`/perguntas/${question.id}`}
              title={question.question}
            />
          ))}
        </div>
      )}
    </div>
  );
}
