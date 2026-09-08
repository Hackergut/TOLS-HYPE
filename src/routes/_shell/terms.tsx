import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/legal-page";
import { TermsContent } from "@/components/legal/terms-content";

export const Route = createFileRoute("/_shell/terms")({
  component: TermsPage,
  head: () => ({ meta: [{ title: "Terms of Service — TOLS" }] }),
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <TermsContent />
    </LegalPage>
  );
}
