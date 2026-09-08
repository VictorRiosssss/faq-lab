import type { Metadata } from "next";
import { UserCreateForm } from "@/components/users/user-create-form";

export const metadata: Metadata = { title: "Novo usuário" };

export default function NewUserPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Novo usuário</h1>
      <UserCreateForm />
    </div>
  );
}
