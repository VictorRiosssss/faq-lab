import type { Metadata } from "next";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResultsList } from "@/components/search/search-results-list";
import { NoResultsCta } from "@/components/search/no-results-cta";
import { Container } from "@/components/layout/container";
import { searchQuestions, getFeaturedSectors } from "@/server/actions/search.actions";

export const metadata: Metadata = { title: "Pesquisar" };

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sector?: string }>;
}) {
  const { q, sector } = await searchParams;
  const query = q?.trim() ?? "";
  const sectors = await getFeaturedSectors();

  const result = query.length >= 2
    ? await searchQuestions({ query, sectorSlug: sector })
    : { hits: [], hasRelevantResults: false };

  return (
    <Container narrow className="flex flex-col gap-8 py-12 sm:py-16">
      <SearchBar sectors={sectors} defaultQuery={query} defaultSectorSlug={sector} />

      {query.length < 2 ? (
        <p className="text-sm text-muted-foreground">Digite pelo menos 2 caracteres para pesquisar.</p>
      ) : result.hasRelevantResults ? (
        <SearchResultsList hits={result.hits} query={query} />
      ) : (
        <NoResultsCta sectors={sectors} query={query} />
      )}
    </Container>
  );
}
