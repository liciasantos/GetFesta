import type { ReactNode } from "react";
import ClientePainelSidebar from "@/components/painel/ClientePainelSidebar";

export default function ClienteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex lg:items-start lg:gap-6 lg:pl-6 lg:pt-8">
      <ClientePainelSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
