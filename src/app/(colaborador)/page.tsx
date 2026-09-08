import { HeroSearch } from "@/components/home/hero-search";
import { SectorCard } from "@/components/home/sector-card";
import { QuestionRow } from "@/components/question/question-row";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { getFeaturedSectors, getPopularQuestions } from "@/server/actions/search.actions";

export default async function HomePage() {
  const [sectors, popularQuestions] = await Promise.all([
    getFeaturedSectors(),
    getPopularQuestions(),
  ]);

  return (
    <Container className="flex flex-col gap-24 py-16 sm:py-24">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground">
            BASE DE CONHECIMENTO
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Qual a sua dúvida?
          </h1>
          <p className="text-[0.95rem] text-muted-foreground">
            Encontre processos, procedimentos e respostas da Labplan.
          </p>
        </div>

        <HeroSearch />
      </div>

      {sectors.length > 0 ? (
        <div className="flex flex-col gap-6">
          <SectionHeading title="Explore por setor" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {sectors.map((sector) => (
              <SectorCard
                key={sector.id}
                name={sector.name}
                slug={sector.slug}
                description={sector.description}
                questionCount={sector._count.questions}
              />
            ))}
          </div>
        </div>
      ) : null}

      {popularQuestions.length > 0 ? (
        <div className="flex flex-col gap-6">
          <SectionHeading title="Perguntas frequentes" />
          <div className="flex flex-col">
            {popularQuestions.map((question) => (
              <QuestionRow
                key={question.id}
                href={`/perguntas/${question.id}`}
                title={question.question}
                eyebrow={question.sector.name}
              />
            ))}
          </div>
        </div>
      ) : null}
    </Container>
  );
}
