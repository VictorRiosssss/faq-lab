import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/server/db/prisma";
import { verifyPassword } from "@/lib/password";
import { LoginSchema } from "@/server/validation/auth.schema";

export const authConfig = {
  // Self-hosted (not Vercel): NextAuth only auto-trusts the request host in
  // dev mode. Under `next start` it rejects every request as "untrusted
  // host" unless this is set — this app always runs behind a single known
  // NEXTAUTH_URL, so trusting the configured host is safe here.
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        login: { label: "Usuário" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = LoginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { login, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { login } });
        if (!user || !user.isActive) return null;

        const passwordMatches = await verifyPassword(password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          login: user.login,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      } else if (token.id) {
        // Re-check on every token refresh so a deactivated user loses access
        // without waiting for the full session maxAge to expire.
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (!dbUser || !dbUser.isActive) {
          return null;
        }
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "COLLABORATOR";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
