import { TopNav } from "@/components/layout/top-nav";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Container } from "@/components/layout/container";

// See src/app/(colaborador)/layout.tsx for why this is here.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <TopNav />
      <div className="flex flex-1 flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden py-8 sm:py-12">
          <Container>{children}</Container>
        </main>
      </div>
    </div>
  );
}
