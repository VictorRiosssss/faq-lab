"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteQuestion } from "@/server/actions/questions.actions";
import { Button } from "@/components/ui/button";

export function QuestionDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Excluir esta pergunta? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const result = await deleteQuestion(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
        Excluir
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
