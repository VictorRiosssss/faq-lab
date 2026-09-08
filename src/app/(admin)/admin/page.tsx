import type { Metadata } from "next";
import { StatCard } from "@/components/dashboard/stat-card";
import { TopQuestionsTable } from "@/components/dashboard/top-questions-table";
import { getDashboardStats } from "@/server/actions/dashboard.actions";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Visão geral</h1>
        <p className="text-sm text-muted-foreground">Todos os períodos</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Colaboradores" value={stats.totalColaboradores} />
        <StatCard label="Perguntas" value={stats.totalPerguntas} />
        <StatCard label="Setores" value={stats.totalSetores} />
        <StatCard label="Sugestões pendentes" value={stats.sugestoesPendentes} />
        <StatCard label="Buscas sem resultado" value={stats.searchesWithNoResult} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopQuestionsTable title="Mais pesquisadas" items={stats.mostSearchedQuestions} />
        <TopQuestionsTable title="Mais acessadas" items={stats.mostViewedQuestions} />
      </div>
    </div>
  );
}
