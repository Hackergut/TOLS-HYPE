import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/legal-page";
import { AmlContent } from "@/components/legal/aml-content";

export const Route = createFileRoute("/_shell/aml")({
  component: AmlPage,
  head: () => ({ meta: [{ title: "AML Policy — TOLS" }] }),
});

function AmlPage() {
  return (
    <LegalPage title="AML Policy">
      <AmlContent />
    </LegalPage>
  );
}
