import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/session";
import { UserEditForm } from "@/components/users/user-edit-form";

export const metadata: Metadata = { title: "Editar usuário" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, login: true, role: true, isActive: true },
  });

  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar usuário</h1>
      <UserEditForm user={user} />
    </div>
  );
}
