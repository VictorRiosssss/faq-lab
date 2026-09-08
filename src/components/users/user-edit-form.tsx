"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateUser, resetPassword, toggleUserActive } from "@/server/actions/users.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserRoleSelect } from "@/components/users/user-role-select";

type FormState = { error?: string; success?: boolean };
const initialState: FormState = {};

type User = {
  id: string;
  name: string;
  login: string;
  role: "ADMIN" | "COLLABORATOR";
  isActive: boolean;
};

export function UserEditForm({ user }: { user: User }) {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await updateUser({
      id: user.id,
      name: String(formData.get("name") ?? ""),
      login: String(formData.get("login") ?? ""),
      role: (formData.get("role") as "ADMIN" | "COLLABORATOR") ?? user.role,
      isActive: user.isActive,
    });
    if (!result.success) return { error: result.error };
    router.refresh();
    return { success: true };
  }

  async function resetPasswordAction(
    _prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const password = String(formData.get("newPassword") ?? "");
    const result = await resetPassword({ id: user.id, password });
    if (!result.success) return { error: result.error };
    return { success: true };
  }

  async function toggleActive() {
    await toggleUserActive(user.id, !user.isActive);
    router.refresh();
  }

  const [state, formAction, isPending] = useActionState(action, initialState);
  const [resetState, resetFormAction, isResetPending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <div className="flex max-w-md flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" defaultValue={user.name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login">Login</Label>
          <Input id="login" name="login" defaultValue={user.login} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Perfil de acesso</Label>
          <UserRoleSelect name="role" defaultValue={user.role} />
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-success">Dados salvos.</p> : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
          <Button type="button" variant="outline" onClick={toggleActive}>
            {user.isActive ? "Desativar usuário" : "Ativar usuário"}
          </Button>
        </div>
      </form>

      <form action={resetFormAction} className="flex flex-col gap-3 border-t border-border pt-6">
        <Label htmlFor="newPassword">Redefinir senha</Label>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
        {resetState.error ? <p className="text-sm text-destructive">{resetState.error}</p> : null}
        {resetState.success ? (
          <p className="text-sm text-success">Senha redefinida.</p>
        ) : null}
        <Button type="submit" variant="secondary" disabled={isResetPending} className="self-start">
          {isResetPending ? "Salvando..." : "Redefinir senha"}
        </Button>
      </form>
    </div>
  );
}
