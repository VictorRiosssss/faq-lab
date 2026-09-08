import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/users/change-password-form";
import { getOwnProfile } from "@/server/actions/users.actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const profile = await getOwnProfile();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Meu perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Nome:</span> {profile.name}
          </p>
          <p>
            <span className="text-muted-foreground">Login:</span> {profile.login}
          </p>
          <p>
            <span className="text-muted-foreground">Perfil:</span>{" "}
            {profile.role === "ADMIN" ? "Administrador" : "Colaborador"}
          </p>
          <p>
            <span className="text-muted-foreground">Cadastrado em:</span>{" "}
            {formatDate(profile.createdAt)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
