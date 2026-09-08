"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { requireAdmin, requireSession } from "@/server/auth/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { toSafeErrorMessage, ConflictError, NotFoundError } from "@/lib/errors";
import {
  CreateUserSchema,
  UpdateUserSchema,
  ResetPasswordSchema,
  ChangeOwnPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ResetPasswordInput,
  type ChangeOwnPasswordInput,
} from "@/server/validation/user.schema";

export type ActionResult = { success: true } | { success: false; error: string };

export async function listUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      login: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = CreateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { login: parsed.data.login } });
    if (existing) throw new ConflictError("Já existe um usuário com esse login.");

    const passwordHash = await hashPassword(parsed.data.password);
    const created = await prisma.user.create({
      data: {
        name: parsed.data.name,
        login: parsed.data.login,
        role: parsed.data.role,
        passwordHash,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: "User",
        entityId: created.id,
        action: "CREATE",
        actorId: session.user.id,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function updateUser(input: UpdateUserInput): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = UpdateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: parsed.data.id } });
    if (!existing) throw new NotFoundError("Usuário não encontrado.");

    const loginTaken = await prisma.user.findFirst({
      where: { login: parsed.data.login, NOT: { id: parsed.data.id } },
    });
    if (loginTaken) throw new ConflictError("Já existe um usuário com esse login.");

    await prisma.user.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        login: parsed.data.login,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: "User",
        entityId: parsed.data.id,
        action: "UPDATE",
        actorId: session.user.id,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = ResetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        entity: "User",
        entityId: parsed.data.id,
        action: "UPDATE",
        actorId: session.user.id,
        meta: { field: "password" },
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function toggleUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    await prisma.user.update({ where: { id }, data: { isActive } });
    await prisma.auditLog.create({
      data: {
        entity: "User",
        entityId: id,
        action: "STATUS_CHANGE",
        actorId: session.user.id,
        meta: { isActive },
      },
    });
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}

export async function getOwnProfile() {
  const session = await requireSession();
  return prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, name: true, login: true, role: true, createdAt: true },
  });
}

export async function changeOwnPassword(
  input: ChangeOwnPasswordInput,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = ChangeOwnPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
    const matches = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!matches) throw new ConflictError("Senha atual incorreta.");

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return { success: true };
  } catch (error) {
    return { success: false, error: toSafeErrorMessage(error) };
  }
}
