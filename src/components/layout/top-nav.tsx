import Link from "next/link";
import { auth, signOut } from "@/server/auth/auth";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export async function TopNav() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-5 sm:px-8">
      <Link href="/" className="shrink-0">
        <Logo />
      </Link>

      <div className="flex items-center gap-5 text-sm sm:gap-6">
        <Link
          href="/perfil"
          className="hidden text-muted-foreground transition hover:text-foreground sm:inline"
        >
          {session.user.name}
        </Link>
        {session.user.role === "ADMIN" ? (
          <Link
            href="/admin"
            className="hidden text-muted-foreground transition hover:text-foreground sm:inline"
          >
            Admin
          </Link>
        ) : null}
        <ThemeToggle />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="cursor-pointer text-muted-foreground transition hover:text-foreground"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
