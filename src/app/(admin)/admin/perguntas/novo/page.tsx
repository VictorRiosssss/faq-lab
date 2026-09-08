import type { Metadata } from "next";
import { QuestionForm } from "@/components/question/question-form";
import { listSectors } from "@/server/actions/sectors.actions";

export const metadata: Metadata = { title: "Nova pergunta" };

export default async function NewQuestionPage() {
  const sectors = await listSectors();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nova pergunta</h1>
      <QuestionForm sectors={sectors} />
    </div>
  );
}
