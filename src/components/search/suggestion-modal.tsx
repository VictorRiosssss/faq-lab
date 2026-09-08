"use client";

import { useActionState, useState } from "react";
import {
  submitSuggestionAction,
  type SuggestionFormState,
} from "@/server/actions/suggestions.actions";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Sector = { id: string; name: string };

const initialState: SuggestionFormState = {};

export function SuggestionModal({
  sectors,
  defaultQuestionText,
  trigger,
}: {
  sectors: Sector[];
  defaultQuestionText?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [sectorId, setSectorId] = useState<string>("");
  const [state, formAction, isPending] = useActionState(submitSuggestionAction, initialState);

  // Close the dialog the moment a submission succeeds — adjusted during
  // render (React-documented pattern) instead of an Effect, since this is a
  // direct consequence of the action's result, not external synchronization.
  const [handledSuccess, setHandledSuccess] = useState(state.success);
  if (state.success !== handledSuccess) {
    setHandledSuccess(state.success);
    if (state.success && open) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar sugestão</DialogTitle>
          <DialogDescription>
            Ajude a melhorar o Navegador de Processos Internos enviando sua dúvida.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="sectorId" value={sectorId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="questionText">Sua dúvida</Label>
            <Textarea
              id="questionText"
              name="questionText"
              required
              minLength={5}
              defaultValue={defaultQuestionText}
              placeholder="Ex.: como funciona o processo de aprovação de férias?"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Setor relacionado (opcional)</Label>
            <Select value={sectorId} onValueChange={setSectorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="context">Contexto (opcional)</Label>
            <Input id="context" name="context" placeholder="Detalhes adicionais" />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando..." : "Enviar sugestão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
