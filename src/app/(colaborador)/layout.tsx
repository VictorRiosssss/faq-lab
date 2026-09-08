import { TopNav } from "@/components/layout/top-nav";

// Every page under here reads live DB data behind auth — never
// prerenderable. Set once at the layout so no child page needs its own
// `export const dynamic` (and `next build` doesn't attempt — and fail — a
// static-generation probe against a placeholder build-time DATABASE_URL).
export const dynamic = "force-dynamic";

export default function ColaboradorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <TopNav />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
