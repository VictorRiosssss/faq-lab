"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { convertSuggestion } from "@/server/actions/suggestions.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/question/tiptap-editor";
import { SectorSelect } from "@/components/question/sector-select";
import { KeywordsInput } from "@/components/question/keywords-input";

type FormState = { error?: string; success?: boolean };
const initialState: FormState = {};

type Sector = { id: string; name: string };

export function ConvertSuggestionForm({
  suggestionId,
  defaultQuestion,
  defaultSectorId,
  sectors,
}: {
  suggestionId: string;
  defaultQuestion: string;
  defaultSectorId?: string;
  sectors: Sector[];
}) {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await convertSuggestion({
      id: suggestionId,
      finalQuestion: String(formData.get("finalQuestion") ?? ""),
      finalAnswerHtml: String(formData.get("finalAnswerHtml") ?? ""),
      sectorId: String(formData.get("sectorId") ?? ""),
      keywords: formData.getAll("keywords").map(String),
    });
    if (!result.success) return { error: result.error };
    router.push("/admin/sugestoes");
    return { success: true };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground">Converter em pergunta oficial</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="finalQuestion">Pergunta definitiva</Label>
        <Input id="finalQuestion" name="finalQuestion" defaultValue={defaultQuestion} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Setor</Label>
        <SectorSelect name="sectorId" sectors={sectors} defaultValue={defaultSectorId} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Resposta oficial</Label>
        <TiptapEditor name="finalAnswerHtml" />
      </div>

      <KeywordsInput name="keywords" />

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Convertendo..." : "Converter em pergunta oficial"}
      </Button>
    </form>
  );
}
