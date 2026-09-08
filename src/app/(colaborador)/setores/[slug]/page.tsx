import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { listQuestionsBySector } from "@/server/actions/questions.actions";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectorQuestionList } from "@/components/sectors/sector-question-list";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SectorQuestionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await prisma.sector.findUnique({ where: { slug } });
  if (!sector) notFound();

  const questions = await listQuestionsBySector(slug);

  return (
    <Container narrow className="flex flex-col gap-8 py-12 sm:py-16">
      <div className="flex flex-col gap-4">
        <Breadcrumb items={[{ label: "Processos", href: "/setores" }, { label: sector.name }]} />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {sector.name}
          </h1>
          {sector.description ? (
            <p className="text-[0.95rem] text-muted-foreground">{sector.description}</p>
          ) : null}
        </div>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          title="Nenhuma pergunta cadastrada"
          description="Este setor ainda não possui perguntas na base de conhecimento."
        />
      ) : (
        <SectorQuestionList questions={questions} />
      )}
    </Container>
  );
}
