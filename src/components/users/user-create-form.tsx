"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/server/actions/users.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserRoleSelect } from "@/components/users/user-role-select";

type FormState = { error?: string; success?: boolean };
const initialState: FormState = {};

export function UserCreateForm() {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await createUser({
      name: String(formData.get("name") ?? ""),
      login: String(formData.get("login") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: (formData.get("role") as "ADMIN" | "COLLABORATOR") ?? "COLLABORATOR",
    });
    if (!result.success) return { error: result.error };
    router.push("/admin/usuarios");
    return { success: true };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login">Login</Label>
        <Input id="login" name="login" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Perfil de acesso</Label>
        <UserRoleSelect name="role" defaultValue="COLLABORATOR" />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Salvando..." : "Criar usuário"}
      </Button>
    </form>
  );
}
