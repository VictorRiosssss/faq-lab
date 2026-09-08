import type { Metadata } from "next";
import { SectorForm } from "@/components/sectors/sector-form";

export const metadata: Metadata = { title: "Novo setor" };

export default function NewSectorPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Novo setor</h1>
      <SectorForm />
    </div>
  );
}
