import { createFileRoute } from "@tanstack/react-router";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { AffiliateDesk } from "@/components/affiliate/affiliate-desk";
import { AFFILIATE_SECTIONS, type AffiliateTab } from "@/lib/nav";

const PAGE_BANNERS = [
  "/brand/affiliate/hero-brand.jpg",
  "/brand/affiliate/banner-income.jpg",
  "/brand/affiliate/banner-promote.jpg",
  "/brand/affiliate/banner-info.jpg",
  "/brand/affiliate/banner-referrals.jpg",
  "/brand/affiliate/banner-rank-win.jpg",
  "/brand/affiliate/banner-pro.jpg",
] as const;

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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Affiliates" }]} />
      <header className="overflow-hidden rounded-2xl border border-white/6 shadow-[var(--shadow-glow)]">
        <div className="relative aspect-[3/1] min-h-28 w-full bg-[#101014]">
          <img
            src={`${PAGE_BANNERS[0]}?v=official`}
            alt="TOLS official welcome banner"
            width={1200}
            height={400}
            className="absolute inset-0 size-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
            <p className="text-xs font-medium tracking-[0.18em] text-lime uppercase">Partners</p>
            <BluescreenTitle as="h1" className="mt-1 text-3xl font-bold tracking-tight text-white">
              Affiliates
            </BluescreenTitle>
            <p className="mt-1 text-sm text-white/80">25–30% lifetime revenue share. Campaigns, postbacks, and professional deals.</p>
          </div>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto bg-[#101014] p-2">
          {PAGE_BANNERS.map((src) => (
            <img
              key={src}
              src={`${src}?v=official`}
              alt=""
              width={240}
              height={80}
              className="h-14 w-40 shrink-0 rounded-md object-cover"
            />
          ))}
        </div>
      </header>
      <AffiliateDesk tab={active} />
    </main>
  );
}
