import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SectorDeleteButton } from "@/components/sectors/sector-delete-button";
import { listSectors } from "@/server/actions/sectors.actions";

export const metadata: Metadata = { title: "Setores" };

export default async function AdminSectorsPage() {
  const sectors = await listSectors();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Setores</h1>
        <Button asChild>
          <Link href="/admin/setores/novo">Novo setor</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Perguntas</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sectors.map((sector) => (
            <TableRow key={sector.id}>
              <TableCell className="font-medium text-foreground">{sector.name}</TableCell>
              <TableCell className="text-muted-foreground">{sector.description}</TableCell>
              <TableCell>{sector._count.questions}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/admin/setores/${sector.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Editar
                  </Link>
                  <SectorDeleteButton id={sector.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
