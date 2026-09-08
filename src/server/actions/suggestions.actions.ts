"use server";

import { revalidatePath } from "next/cache";
import type { SuggestionStatus } from "../../generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { requireAdmin, requireSession } from "@/server/auth/session";
import { sanitizeAnswerHtml, stripHtmlToText } from "@/lib/sanitize";
import { toSafeErrorMessage, NotFoundError, ConflictError } from "@/lib/errors";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  CreateSuggestionSchema,
  EditSuggestionSchema,
  UpdateSuggestionStatusSchema,
  ConvertSuggestionSchema,
  type CreateSuggestionInput,
  type EditSuggestionInput,
  type UpdateSuggestionStatusInput,
  type ConvertSuggestionInput,
} from "@/server/validation/suggestion.schema";
import type { ActionResult } from "@/server/actions/users.actions";

export type SuggestionFormState = { error?: string; success?: boolean };

export async function submitSuggestionAction(
  _prevState: SuggestionFormState,
  formData: FormData,
): Promise<SuggestionFormState> {
  const result = await createSuggestion({
    questionText: String(formData.get("questionText") ?? ""),
    sectorId: String(formData.get("sectorId") ?? ""),
    context: String(formData.get("context") ?? ""),
  });

  if (!result.success) {
    return { error: result.error };
  }
  return { success: true };
}

export async function createSuggestion(input: CreateSuggestionInput): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = CreateSuggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await prisma.suggestion.create({
      data: {
        questionText: parsed.data.questionText,
        sectorId: parsed.data.sectorId || null,
        context: parsed.data.context || null,
        submittedById: session.user.id,
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function listSuggestions(params?: { status?: SuggestionStatus; page?: number }) {
  await requireAdmin();
  const page = params?.page ?? 1;
  const where = params?.status ? { status: params.status } : {};

  const [items, total] = await Promise.all([
    prisma.suggestion.findMany({
      where,
      include: { sector: true, submittedBy: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.suggestion.count({ where }),
  ]);

  return { items, total, page, pageSize: DEFAULT_PAGE_SIZE };
}

export async function getSuggestionById(id: string) {
  await requireAdmin();
  return prisma.suggestion.findUnique({
    where: { id },
    include: { sector: true, submittedBy: true, reviewedBy: true, convertedQuestion: true },
  });
}

export async function updateSuggestionStatus(
  input: UpdateSuggestionStatusInput,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = UpdateSuggestionStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await prisma.suggestion.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status, reviewedById: session.user.id },
    });

    await prisma.auditLog.create({
      data: {
        entity: "Suggestion",
        entityId: parsed.data.id,
        action: "STATUS_CHANGE",
        actorId: session.user.id,
        meta: { status: parsed.data.status },
      },
    });

    revalidatePath("/admin/sugestoes");
    revalidatePath(`/admin/sugestoes/${parsed.data.id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function editSuggestion(input: EditSuggestionInput): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = EditSuggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const existing = await prisma.suggestion.findUnique({ where: { id: parsed.data.id } });
    if (!existing) throw new NotFoundError("Sugestão não encontrada.");

    await prisma.suggestion.update({
      where: { id: parsed.data.id },
      data: {
        questionText: parsed.data.questionText,
        sectorId: parsed.data.sectorId || null,
        context: parsed.data.context || null,
        reviewedById: session.user.id,
      },
    });

    revalidatePath(`/admin/sugestoes/${parsed.data.id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function convertSuggestion(input: ConvertSuggestionInput): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = ConvertSuggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const suggestion = await prisma.suggestion.findUnique({ where: { id: parsed.data.id } });
    if (!suggestion) throw new NotFoundError("Sugestão não encontrada.");
    if (suggestion.status === "CONVERTIDA") {
      throw new ConflictError("Essa sugestão já foi convertida em pergunta.");
    }

    const answerHtml = sanitizeAnswerHtml(parsed.data.finalAnswerHtml);
    const answerText = stripHtmlToText(answerHtml);

    await prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          question: parsed.data.finalQuestion,
          answerHtml,
          answerText,
          keywords: parsed.data.keywords,
          sectorId: parsed.data.sectorId,
          createdById: session.user.id,
        },
      });

      await tx.suggestion.update({
        where: { id: parsed.data.id },
        data: {
          status: "CONVERTIDA",
          reviewedById: session.user.id,
          convertedQuestionId: question.id,
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "Suggestion",
          entityId: parsed.data.id,
          action: "CONVERT",
          actorId: session.user.id,
          meta: { questionId: question.id },
        },
      });
    });

    revalidatePath("/admin/sugestoes");
    revalidatePath("/admin/perguntas");
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}
