import { auth } from "@/server/auth/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError("É necessário estar autenticado.");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    throw new UnauthorizedError("Apenas administradores podem executar esta ação.");
  }
  return session;
}
