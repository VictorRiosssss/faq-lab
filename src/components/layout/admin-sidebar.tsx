"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/setores", label: "Setores" },
  { href: "/admin/perguntas", label: "Perguntas" },
  { href: "/admin/sugestoes", label: "Sugestões" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-background px-5 py-2
        md:w-52 md:flex-col md:gap-0.5 md:overflow-visible md:border-b-0 md:border-r md:px-4 md:py-8"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
