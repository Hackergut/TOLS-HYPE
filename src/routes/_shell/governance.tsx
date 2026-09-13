import { createFileRoute } from "@tanstack/react-router";
import { GovDesk } from "@/components/governance/gov-desk";

export const Route = createFileRoute("/_shell/governance")({
  component: GovernancePage,
  head: () => ({ meta: [{ title: "Governance — TOLS" }] }),
});

function GovernancePage() {
  return <GovDesk />;
}
