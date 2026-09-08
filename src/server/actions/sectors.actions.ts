"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/session";
import { slugify } from "@/lib/slug";
import { toSafeErrorMessage, ConflictError, NotFoundError } from "@/lib/errors";
import {
  CreateSectorSchema,
  UpdateSectorSchema,
  type CreateSectorInput,
  type UpdateSectorInput,
} from "@/server/validation/sector.schema";
import type { ActionResult } from "@/server/actions/users.actions";

export async function listSectors() {
  return prisma.sector.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { questions: true } } },
  });
}

export async function createSector(input: CreateSectorInput): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = CreateSectorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const slug = slugify(parsed.data.name);
    const existing = await prisma.sector.findFirst({
      where: { OR: [{ name: parsed.data.name }, { slug }] },
    });
    if (existing) throw new ConflictError("Já existe um setor com esse nome.");

    const created = await prisma.sector.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: "Sector",
        entityId: created.id,
        action: "CREATE",
        actorId: session.user.id,
      },
    });

    revalidatePath("/admin/setores");
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function updateSector(input: UpdateSectorInput): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = UpdateSectorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const existing = await prisma.sector.findUnique({ where: { id: parsed.data.id } });
    if (!existing) throw new NotFoundError("Setor não encontrado.");

    const slug = slugify(parsed.data.name);
    const nameTaken = await prisma.sector.findFirst({
      where: { OR: [{ name: parsed.data.name }, { slug }], NOT: { id: parsed.data.id } },
    });
    if (nameTaken) throw new ConflictError("Já existe um setor com esse nome.");

    await prisma.sector.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name, slug, description: parsed.data.description || null },
    });

    await prisma.auditLog.create({
      data: {
        entity: "Sector",
        entityId: parsed.data.id,
        action: "UPDATE",
        actorId: session.user.id,
      },
    });

    revalidatePath("/admin/setores");
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function deleteSector(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    const dependentQuestions = await prisma.question.count({ where: { sectorId: id } });
    if (dependentQuestions > 0) {
      throw new ConflictError(
        "Não é possível excluir um setor com perguntas cadastradas. Mova ou remova as perguntas primeiro.",
      );
    }

    await prisma.sector.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        entity: "Sector",
        entityId: id,
        action: "DELETE",
        actorId: session.user.id,
      },
    });

    revalidatePath("/admin/setores");
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}
