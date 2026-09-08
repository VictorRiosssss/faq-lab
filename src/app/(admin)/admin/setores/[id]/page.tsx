import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/session";
import { SectorForm } from "@/components/sectors/sector-form";

export const metadata: Metadata = { title: "Editar setor" };

export default async function EditSectorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sector = await prisma.sector.findUnique({
    where: { id },
    select: { id: true, name: true, description: true },
  });

  if (!sector) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar setor</h1>
      <SectorForm sector={sector} />
    </div>
  );
}
