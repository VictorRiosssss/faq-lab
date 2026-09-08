"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSuggestionStatus } from "@/server/actions/suggestions.actions";
import { Button } from "@/components/ui/button";

export function SuggestionStatusActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setStatus(next: "EM_ANALISE" | "APROVADA" | "REJEITADA") {
    startTransition(async () => {
      const result = await updateSuggestionStatus({ id, status: next });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (status === "CONVERTIDA") return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setStatus("EM_ANALISE")}
        >
          Marcar em análise
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setStatus("APROVADA")}
        >
          Aprovar
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => setStatus("REJEITADA")}
        >
          Rejeitar
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
