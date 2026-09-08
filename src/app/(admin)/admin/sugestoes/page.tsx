import Link from "next/link";
import type { Metadata } from "next";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SuggestionStatusBadge } from "@/components/suggestions/suggestion-status-badge";
import { listSuggestions } from "@/server/actions/suggestions.actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Sugestões" };

export default async function AdminSuggestionsPage() {
  const { items } = await listSuggestions();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sugestões</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Pergunta</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((suggestion) => (
            <TableRow key={suggestion.id}>
              <TableCell>
                <Link
                  href={`/admin/sugestoes/${suggestion.id}`}
                  className="contents"
                >
                  {suggestion.submittedBy.name}
                </Link>
              </TableCell>
              <TableCell className="max-w-sm">
                <Link href={`/admin/sugestoes/${suggestion.id}`} className="hover:underline">
                  {suggestion.questionText}
                </Link>
              </TableCell>
              <TableCell>{suggestion.sector?.name ?? "—"}</TableCell>
              <TableCell>{formatDate(suggestion.createdAt)}</TableCell>
              <TableCell>
                <SuggestionStatusBadge status={suggestion.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
