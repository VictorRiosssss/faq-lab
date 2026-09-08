"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  createQuestion,
  updateQuestion,
  uploadAttachments,
} from "@/server/actions/questions.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/question/tiptap-editor";
import { SectorSelect } from "@/components/question/sector-select";
import { KeywordsInput } from "@/components/question/keywords-input";
import { AttachmentInput } from "@/components/question/attachment-input";
import { AttachmentList, type AttachmentItem } from "@/components/question/attachment-list";
import { AttachmentDeleteButton } from "@/components/question/attachment-delete-button";

type FormState = { error?: string; success?: boolean };
const initialState: FormState = {};

type Sector = { id: string; name: string };
type Question = {
  id: string;
  question: string;
  answerHtml: string;
  sectorId: string;
  keywords: string[];
  isActive: boolean;
  attachments?: AttachmentItem[];
};

export function QuestionForm({
  sectors,
  question,
}: {
  sectors: Sector[];
  question?: Question;
}) {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const payload = {
      question: String(formData.get("question") ?? ""),
      answerHtml: String(formData.get("answerHtml") ?? ""),
      sectorId: String(formData.get("sectorId") ?? ""),
      keywords: formData.getAll("keywords").map(String),
      isActive: formData.get("isActive") === "on",
    };

    let questionId: string;
    if (question) {
      const result = await updateQuestion({ id: question.id, ...payload });
      if (!result.success) return { error: result.error };
      questionId = question.id;
    } else {
      const result = await createQuestion(payload);
      if (!result.success) return { error: result.error };
      questionId = result.id;
    }

    const files = formData.getAll("attachments").filter(
      (entry): entry is File => entry instanceof File && entry.size > 0,
    );
    if (files.length > 0) {
      const uploadResult = await uploadAttachments(questionId, files);
      if (!uploadResult.success) return { error: uploadResult.error };
    }

    router.push("/admin/perguntas");
    return { success: true };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="question">Pergunta</Label>
        <Input id="question" name="question" defaultValue={question?.question} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Setor</Label>
        <SectorSelect name="sectorId" sectors={sectors} defaultValue={question?.sectorId} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Resposta</Label>
        <TiptapEditor name="answerHtml" defaultValue={question?.answerHtml} />
      </div>

      <KeywordsInput name="keywords" defaultValue={question?.keywords} />

      <label className="flex items-center gap-2 text-sm text-foreground/80">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={question?.isActive ?? true}
          className="h-4 w-4 rounded border-input"
        />
        Pergunta ativa (visível na busca)
      </label>

      <div className="flex flex-col gap-1.5">
        <Label>Anexos</Label>
        {question?.attachments && question.attachments.length > 0 ? (
          <AttachmentList
            attachments={question.attachments}
            action={(attachment) => <AttachmentDeleteButton attachmentId={attachment.id} />}
          />
        ) : null}
        <AttachmentInput name="attachments" />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Salvando..." : question ? "Salvar alterações" : "Criar pergunta"}
      </Button>
    </form>
  );
}
