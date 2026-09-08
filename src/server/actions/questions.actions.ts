"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/server/db/prisma";
import { requireAdmin, requireSession } from "@/server/auth/session";
import { sanitizeAnswerHtml, stripHtmlToText } from "@/lib/sanitize";
import { toSafeErrorMessage, NotFoundError, ConflictError } from "@/lib/errors";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  ATTACHMENTS_DIR,
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENTS_PER_QUESTION,
  isAllowedAttachmentExtension,
  generateStoredName,
} from "@/lib/attachments";
import {
  CreateQuestionSchema,
  UpdateQuestionSchema,
  type CreateQuestionInput,
  type UpdateQuestionInput,
} from "@/server/validation/question.schema";
import type { ActionResult } from "@/server/actions/users.actions";

export type QuestionActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function listQuestionsAdmin(params?: {
  page?: number;
  sectorId?: string;
  search?: string;
}) {
  await requireAdmin();
  const page = params?.page ?? 1;

  const where = {
    ...(params?.sectorId ? { sectorId: params.sectorId } : {}),
    ...(params?.search
      ? { question: { contains: params.search, mode: "insensitive" as const } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: { sector: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.question.count({ where }),
  ]);

  return { items, total, page, pageSize: DEFAULT_PAGE_SIZE };
}

export async function listQuestionsBySector(sectorSlug: string) {
  return prisma.question.findMany({
    where: { isActive: true, sector: { slug: sectorSlug } },
    include: { sector: true },
    orderBy: { question: "asc" },
  });
}

export async function getQuestionById(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: {
      sector: true,
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createQuestion(
  input: CreateQuestionInput,
): Promise<QuestionActionResult> {
  const session = await requireAdmin();
  const parsed = CreateQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const answerHtml = sanitizeAnswerHtml(parsed.data.answerHtml);
    const answerText = stripHtmlToText(answerHtml);

    const created = await prisma.question.create({
      data: {
        question: parsed.data.question,
        answerHtml,
        answerText,
        keywords: parsed.data.keywords,
        sectorId: parsed.data.sectorId,
        isActive: parsed.data.isActive,
        createdById: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: "Question",
        entityId: created.id,
        action: "CREATE",
        actorId: session.user.id,
      },
    });

    revalidatePath("/admin/perguntas");
    return { success: true, id: created.id };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function updateQuestion(input: UpdateQuestionInput): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = UpdateQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const existing = await prisma.question.findUnique({ where: { id: parsed.data.id } });
    if (!existing) throw new NotFoundError("Pergunta não encontrada.");

    const answerHtml = sanitizeAnswerHtml(parsed.data.answerHtml);
    const answerText = stripHtmlToText(answerHtml);

    await prisma.question.update({
      where: { id: parsed.data.id },
      data: {
        question: parsed.data.question,
        answerHtml,
        answerText,
        keywords: parsed.data.keywords,
        sectorId: parsed.data.sectorId,
        isActive: parsed.data.isActive,
        updatedById: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: "Question",
        entityId: parsed.data.id,
        action: "UPDATE",
        actorId: session.user.id,
      },
    });

    revalidatePath("/admin/perguntas");
    revalidatePath(`/perguntas/${parsed.data.id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function toggleQuestionActive(id: string, isActive: boolean): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    await prisma.question.update({ where: { id }, data: { isActive } });
    await prisma.auditLog.create({
      data: {
        entity: "Question",
        entityId: id,
        action: "STATUS_CHANGE",
        actorId: session.user.id,
        meta: { isActive },
      },
    });
    revalidatePath("/admin/perguntas");
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    await prisma.question.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        entity: "Question",
        entityId: id,
        action: "DELETE",
        actorId: session.user.id,
      },
    });
    revalidatePath("/admin/perguntas");
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function logQuestionView(questionId: string) {
  const session = await requireSession().catch(() => null);
  await prisma.questionView.create({
    data: { questionId, userId: session?.user.id },
  });
}

export async function uploadAttachments(
  questionId: string,
  files: File[],
): Promise<ActionResult> {
  const session = await requireAdmin();

  const realFiles = files.filter((file) => file.size > 0);
  if (realFiles.length === 0) return { success: true };

  try {
    const existingCount = await prisma.attachment.count({ where: { questionId } });
    if (existingCount + realFiles.length > MAX_ATTACHMENTS_PER_QUESTION) {
      throw new ConflictError(
        `No máximo ${MAX_ATTACHMENTS_PER_QUESTION} anexos por pergunta.`,
      );
    }

    for (const file of realFiles) {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        throw new ConflictError(`"${file.name}" excede o tamanho máximo de 10MB.`);
      }
      if (!isAllowedAttachmentExtension(file.name)) {
        throw new ConflictError(
          `"${file.name}" tem um tipo de arquivo não permitido. Tipos aceitos: ${Object.keys(ALLOWED_ATTACHMENT_TYPES).join(", ")}.`,
        );
      }
    }

    await mkdir(ATTACHMENTS_DIR, { recursive: true });

    for (const file of realFiles) {
      const storedName = generateStoredName(file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(ATTACHMENTS_DIR, storedName), buffer);

      await prisma.attachment.create({
        data: {
          filename: file.name,
          storedName,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          questionId,
          uploadedById: session.user.id,
        },
      });
    }

    revalidatePath(`/admin/perguntas/${questionId}`);
    revalidatePath(`/perguntas/${questionId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function deleteAttachment(attachmentId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const attachment = await prisma.attachment.delete({ where: { id: attachmentId } });
    await unlink(path.join(ATTACHMENTS_DIR, attachment.storedName)).catch(() => {
      // File already missing on disk — the DB record removal is what matters.
    });
    revalidatePath(`/admin/perguntas/${attachment.questionId}`);
    revalidatePath(`/perguntas/${attachment.questionId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}
