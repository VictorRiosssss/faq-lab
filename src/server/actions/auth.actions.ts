"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/server/auth/auth";
import { prisma } from "@/server/db/prisma";
import { LoginSchema } from "@/server/validation/auth.schema";
import { isRateLimited, recordFailedAttempt, clearRateLimit } from "@/lib/rate-limit";

export type LoginFormState = {
  error?: string;
};

const LOGIN_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_RATE_LIMIT = { limit: 5, windowMs: LOGIN_RATE_LIMIT_WINDOW_MS };

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = LoginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Informe usuário e senha." };
  }

  const rateLimitKey = `login:${parsed.data.login.toLowerCase()}`;
  const { limited, retryAfterSeconds } = isRateLimited(rateLimitKey, LOGIN_RATE_LIMIT);
  if (limited) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return {
      error: `Muitas tentativas. Tente novamente em ${minutes} minuto${minutes > 1 ? "s" : ""}.`,
    };
  }

  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  try {
    const result = await signIn("credentials", {
      login: parsed.data.login,
      password: parsed.data.password,
      redirect: false,
    });
    if (!result || result.error) {
      recordFailedAttempt(rateLimitKey, LOGIN_RATE_LIMIT_WINDOW_MS);
      return { error: "Usuário ou senha inválidos." };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      recordFailedAttempt(rateLimitKey, LOGIN_RATE_LIMIT_WINDOW_MS);
      return { error: "Usuário ou senha inválidos." };
    }
    throw error;
  }

  clearRateLimit(rateLimitKey);

  // Admins land on the dashboard, collaborators on the portal home — unless
  // the user was deep-linking somewhere specific (e.g. redirected here from
  // a protected page), in which case that destination wins.
  const user = await prisma.user.findUnique({ where: { login: parsed.data.login } });
  const destination =
    callbackUrl !== "/" ? callbackUrl : user?.role === "ADMIN" ? "/admin" : "/";
  redirect(destination);
}
