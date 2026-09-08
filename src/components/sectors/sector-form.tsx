"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createSector, updateSector } from "@/server/actions/sectors.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type FormState = { error?: string; success?: boolean };
const initialState: FormState = {};

export function SectorForm({
  sector,
}: {
  sector?: { id: string; name: string; description: string | null };
}) {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const payload = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    };

    const result = sector
      ? await updateSector({ id: sector.id, ...payload })
      : await createSector(payload);

    if (!result.success) return { error: result.error };
    router.push("/admin/setores");
    return { success: true };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={sector?.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" defaultValue={sector?.description ?? ""} />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Salvando..." : sector ? "Salvar alterações" : "Criar setor"}
      </Button>
    </form>
  );
}
