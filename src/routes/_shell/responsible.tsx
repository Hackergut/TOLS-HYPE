import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/legal-page";
import { ResponsibleContent } from "@/components/legal/responsible-content";

export const Route = createFileRoute("/_shell/responsible")({
  component: ResponsiblePage,
  head: () => ({ meta: [{ title: "Responsible Gambling — TOLS" }] }),
});

function ResponsiblePage() {
  return (
    <LegalPage title="Responsible Gambling">
      <ResponsibleContent />
    </LegalPage>
  );
}
