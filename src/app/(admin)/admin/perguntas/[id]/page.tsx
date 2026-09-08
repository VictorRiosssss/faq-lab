import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { QuestionForm } from "@/components/question/question-form";
import { getQuestionById } from "@/server/actions/questions.actions";
import { listSectors } from "@/server/actions/sectors.actions";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Editar pergunta" };

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [question, sectors] = await Promise.all([getQuestionById(id), listSectors()]);

  if (!question) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar pergunta</h1>
      <QuestionForm sectors={sectors} question={question} />
    </div>
  );
}
