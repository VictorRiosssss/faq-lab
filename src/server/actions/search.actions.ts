"use server";

import { prisma } from "@/server/db/prisma";
import { requireSession } from "@/server/auth/session";
import { searchQuestionsRaw, type SearchHit } from "@/server/db/queries/search.queries";
import { getPopularQuestions as getPopularQuestionsQuery } from "@/server/db/queries/stats.queries";
import { SearchSchema } from "@/server/validation/search.schema";
import { SEARCH_RELEVANCE_THRESHOLD } from "@/lib/search/constants";

export type SearchResult = {
  hits: SearchHit[];
  hasRelevantResults: boolean;
};

export async function searchQuestions(params: {
  query: string;
  sectorSlug?: string;
}): Promise<SearchResult> {
  const parsed = SearchSchema.safeParse(params);
  if (!parsed.success) {
    return { hits: [], hasRelevantResults: false };
  }

  const session = await requireSession().catch(() => null);

  let sectorId: string | undefined;
  if (parsed.data.sectorSlug) {
    const sector = await prisma.sector.findUnique({ where: { slug: parsed.data.sectorSlug } });
    sectorId = sector?.id;
  }

  const hits = await searchQuestionsRaw({ query: parsed.data.query, sectorId });
  const topScore = hits[0]?.score ?? 0;
  const hasRelevantResults = hits.length > 0 && topScore >= SEARCH_RELEVANCE_THRESHOLD;

  await prisma.searchLog.create({
    data: {
      query: parsed.data.query,
      sectorFilter: parsed.data.sectorSlug ?? null,
      resultCount: hits.length,
      topQuestionId: hasRelevantResults ? hits[0]?.id : null,
      userId: session?.user.id,
    },
  });

  return { hits, hasRelevantResults };
}

export async function getFeaturedSectors() {
  return prisma.sector.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { questions: true } } },
  });
}

export async function getPopularQuestions(limit?: number) {
  return getPopularQuestionsQuery(limit);
}
