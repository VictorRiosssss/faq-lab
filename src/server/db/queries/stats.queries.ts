import { prisma } from "@/server/db/prisma";
import { DASHBOARD_DEFAULT_WINDOW_DAYS } from "@/lib/constants";

function windowStart(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Top viewed active questions with sector info, for the home page's
 * "Perguntas frequentes" section. Unlike getDashboardStats, this has no
 * admin gate — it's just a public read of already-logged view counts.
 */
export async function getPopularQuestions(limit = 6) {
  const since = windowStart(DASHBOARD_DEFAULT_WINDOW_DAYS);

  const topViewed = await prisma.questionView.groupBy({
    by: ["questionId"],
    where: { createdAt: { gte: since } },
    _count: { questionId: true },
    orderBy: { _count: { questionId: "desc" } },
    take: limit,
  });

  const ids = topViewed.map((row) => row.questionId);
  if (ids.length === 0) return [];

  const questions = await prisma.question.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, question: true, sector: { select: { name: true } } },
  });

  const byId = new Map(questions.map((q) => [q.id, q]));

  return topViewed
    .map((row) => byId.get(row.questionId))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));
}

export async function getDashboardStats() {
  const [
    totalColaboradores,
    totalPerguntas,
    totalSetores,
    sugestoesPendentes,
    topSearched,
    topViewed,
    searchesWithNoResult,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "COLLABORATOR", isActive: true } }),
    prisma.question.count({ where: { isActive: true } }),
    prisma.sector.count(),
    prisma.suggestion.count({ where: { status: "PENDENTE" } }),
    prisma.searchLog.groupBy({
      by: ["topQuestionId"],
      where: { topQuestionId: { not: null } },
      _count: { topQuestionId: true },
      orderBy: { _count: { topQuestionId: "desc" } },
      take: 10,
    }),
    prisma.questionView.groupBy({
      by: ["questionId"],
      _count: { questionId: true },
      orderBy: { _count: { questionId: "desc" } },
      take: 10,
    }),
    prisma.searchLog.count({ where: { resultCount: 0 } }),
  ]);

  const topSearchedIds = topSearched
    .map((row) => row.topQuestionId)
    .filter((id): id is string => Boolean(id));
  const topViewedIds = topViewed.map((row) => row.questionId);

  const [searchedQuestions, viewedQuestions] = await Promise.all([
    prisma.question.findMany({
      where: { id: { in: topSearchedIds } },
      select: { id: true, question: true },
    }),
    prisma.question.findMany({
      where: { id: { in: topViewedIds } },
      select: { id: true, question: true },
    }),
  ]);

  const searchedById = new Map(searchedQuestions.map((q) => [q.id, q.question]));
  const viewedById = new Map(viewedQuestions.map((q) => [q.id, q.question]));

  return {
    totalColaboradores,
    totalPerguntas,
    totalSetores,
    sugestoesPendentes,
    searchesWithNoResult,
    mostSearchedQuestions: topSearched
      .filter((row) => row.topQuestionId)
      .map((row) => ({
        questionId: row.topQuestionId as string,
        question: searchedById.get(row.topQuestionId as string) ?? "(pergunta removida)",
        count: row._count.topQuestionId,
      })),
    mostViewedQuestions: topViewed.map((row) => ({
      questionId: row.questionId,
      question: viewedById.get(row.questionId) ?? "(pergunta removida)",
      count: row._count.questionId,
    })),
  };
}
