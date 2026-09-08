import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/legal-page";
import { PrivacyContent } from "@/components/legal/privacy-content";

export const Route = createFileRoute("/_shell/privacy")({
  component: PrivacyPage,
  head: () => ({ meta: [{ title: "Privacy Policy — TOLS" }] }),
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <PrivacyContent />
    </LegalPage>
  );
}
