import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="w-full max-w-[380px] rounded-card border border-border bg-card p-8 shadow-[var(--shadow-subtle)]">
      <div className="mb-8 flex flex-col items-center gap-1.5 text-center">
        <Logo />
        <p className="text-sm text-muted-foreground">Navegador de Processos Internos</p>
      </div>
      <LoginForm callbackUrl={callbackUrl ?? "/"} />
    </div>
  );
}
