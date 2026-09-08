import type { Metadata } from "next";
import { SectorCard } from "@/components/home/sector-card";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { getFeaturedSectors } from "@/server/actions/search.actions";

export const metadata: Metadata = { title: "Setores" };

export default async function SetoresPage() {
  const sectors = await getFeaturedSectors();

  return (
    <Container className="flex flex-col gap-8 py-12 sm:py-16">
      <SectionHeading
        title="Setores"
        description="Navegue pelos processos organizados por área da Labplan."
      />
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
    </Container>
  );
}
