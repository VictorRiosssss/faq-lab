import { prisma } from "@/server/db/prisma";
import {
  SEARCH_RESULT_LIMIT,
  SEARCH_TRIGRAM_MIN_SIMILARITY,
} from "@/lib/search/constants";

export type SearchHit = {
  id: string;
  question: string;
  answerText: string;
  sectorId: string;
  sectorName: string;
  sectorSlug: string;
  score: number;
};

export async function searchQuestionsRaw(params: {
  query: string;
  sectorId?: string;
}): Promise<SearchHit[]> {
  const { query, sectorId } = params;

  const rows = await prisma.$queryRaw<SearchHit[]>`
    SELECT
      q.id,
      q.question,
      q."answerText" AS "answerText",
      q."sectorId" AS "sectorId",
      s.name AS "sectorName",
      s.slug AS "sectorSlug",
      (
        ts_rank(q."searchVector", websearch_to_tsquery('portuguese', unaccent(${query}))) * 0.7
        + GREATEST(
            similarity(q.question, ${query}),
            similarity(q."answerText", ${query})
          ) * 0.3
      ) AS score
    FROM "Question" q
    JOIN "Sector" s ON s.id = q."sectorId"
    WHERE q."isActive" = true
      AND (${sectorId ?? null}::text IS NULL OR q."sectorId" = ${sectorId ?? null})
      AND (
        q."searchVector" @@ websearch_to_tsquery('portuguese', unaccent(${query}))
        OR similarity(q.question, ${query}) > ${SEARCH_TRIGRAM_MIN_SIMILARITY}
        OR similarity(q."answerText", ${query}) > ${SEARCH_TRIGRAM_MIN_SIMILARITY}
      )
    ORDER BY score DESC
    LIMIT ${SEARCH_RESULT_LIMIT};
  `;

  return rows;
}
