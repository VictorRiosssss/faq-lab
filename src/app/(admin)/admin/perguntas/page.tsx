import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { QuestionDeleteButton } from "@/components/question/question-delete-button";
import { listQuestionsAdmin } from "@/server/actions/questions.actions";

export const metadata: Metadata = { title: "Perguntas" };

export default async function AdminQuestionsPage() {
  const { items } = await listQuestionsAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Perguntas</h1>
        <Button asChild>
          <Link href="/admin/perguntas/novo">Nova pergunta</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pergunta</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((question) => (
            <TableRow key={question.id}>
              <TableCell className="max-w-sm font-medium text-foreground">
                {question.question}
              </TableCell>
              <TableCell>{question.sector.name}</TableCell>
              <TableCell>
                <Badge variant={question.isActive ? "success" : "outline"}>
                  {question.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/admin/perguntas/${question.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Editar
                  </Link>
                  <QuestionDeleteButton id={question.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
