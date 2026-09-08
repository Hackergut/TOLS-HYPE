import type { ReactNode } from "react";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[40rem]">
      <TolsBreadcrumb
        items={[
          { label: "Lobby", to: "/" },
          { label: title },
        ]}
      />
      <div className="typeset typeset-docs mt-6 max-w-[37em] rounded-2xl bg-card/80 px-5 py-6 shadow-[var(--shadow-glow)] md:px-8 md:py-8">
        {children}
      </div>
    </main>
  );
}
