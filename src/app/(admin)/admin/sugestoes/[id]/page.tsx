import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SuggestionStatusBadge } from "@/components/suggestions/suggestion-status-badge";
import { SuggestionStatusActions } from "@/components/suggestions/suggestion-status-actions";
import { ConvertSuggestionForm } from "@/components/suggestions/convert-suggestion-form";
import { getSuggestionById } from "@/server/actions/suggestions.actions";
import { listSectors } from "@/server/actions/sectors.actions";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Detalhe da sugestão" };

export default async function SuggestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [suggestion, sectors] = await Promise.all([getSuggestionById(id), listSectors()]);

  if (!suggestion) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Detalhe da sugestão</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{suggestion.questionText}</CardTitle>
            <SuggestionStatusBadge status={suggestion.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Funcionário:</span>{" "}
            {suggestion.submittedBy.name}
          </p>
          <p>
            <span className="text-muted-foreground">Setor:</span>{" "}
            {suggestion.sector?.name ?? "Não informado"}
          </p>
          <p>
            <span className="text-muted-foreground">Data:</span>{" "}
            {formatDateTime(suggestion.createdAt)}
          </p>
          {suggestion.context ? (
            <p>
              <span className="text-muted-foreground">Contexto:</span> {suggestion.context}
            </p>
          ) : null}
          {suggestion.convertedQuestion ? (
            <p>
              <span className="text-muted-foreground">Pergunta gerada:</span>{" "}
              <Link
                href={`/admin/perguntas/${suggestion.convertedQuestion.id}`}
                className="text-foreground underline"
              >
                {suggestion.convertedQuestion.question}
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <SuggestionStatusActions id={suggestion.id} status={suggestion.status} />

      {suggestion.status !== "CONVERTIDA" ? (
        <ConvertSuggestionForm
          suggestionId={suggestion.id}
          defaultQuestion={suggestion.questionText}
          defaultSectorId={suggestion.sectorId ?? undefined}
          sectors={sectors}
        />
      ) : null}
    </div>
  );
}
