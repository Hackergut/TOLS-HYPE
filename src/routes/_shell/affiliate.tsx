import { createFileRoute } from "@tanstack/react-router";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { AffiliateDesk } from "@/components/affiliate/affiliate-desk";
import { AFFILIATE_SECTIONS, type AffiliateTab } from "@/lib/nav";

function parseTab(value: unknown): AffiliateTab | undefined {
  if (typeof value !== "string") return undefined;
  return AFFILIATE_SECTIONS.some((s) => s.tab === value) ? (value as AffiliateTab) : undefined;
}

export const Route = createFileRoute("/_shell/affiliate")({
  component: AffiliatePage,
  head: () => ({ meta: [{ title: "Affiliates — TOLS" }] }),
  validateSearch: (search: Record<string, unknown>): { tab?: AffiliateTab } =>
    parseTab(search.tab) ? { tab: parseTab(search.tab) } : {},
});

function AffiliatePage() {
  const { tab } = Route.useSearch();
  const active: AffiliateTab = tab ?? "overview";
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Affiliates" }]} />
      <AffiliateDesk tab={active} />
    </main>
  );
}