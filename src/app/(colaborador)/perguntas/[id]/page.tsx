import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AnswerViewer } from "@/components/question/answer-viewer";
import { AttachmentList } from "@/components/question/attachment-list";
import { Container } from "@/components/layout/container";
import { getQuestionById, logQuestionView } from "@/server/actions/questions.actions";
import { formatDate } from "@/lib/format";

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await getQuestionById(id);

  if (!question || !question.isActive) {
    notFound();
  }

  await logQuestionView(id);

  return (
    <Container narrow className="flex flex-col gap-8 py-12 sm:py-16">
      <div className="flex flex-col gap-4">
        <Breadcrumb
          items={[
            { label: "Processos", href: "/setores" },
            { label: question.sector.name, href: `/setores/${question.sector.slug}` },
          ]}
        />
        <div className="flex flex-col gap-3">
          <Badge>{question.sector.name}</Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {question.question}
          </h1>
          <p className="text-sm text-muted-foreground">
            Atualizado em {formatDate(question.updatedAt)}
          </p>
        </div>
      </div>

      <div className="border-t border-border" />

      <AnswerViewer html={question.answerHtml} />

      {question.attachments.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Anexos</p>
          <AttachmentList attachments={question.attachments} />
        </div>
      ) : null}
    </Container>
  );
}
