"use client";

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  RiShareForwardLine,
  RiGroupLine,
  RiMegaphoneLine,
  RiMoneyDollarCircleLine,
  RiInformationLine,
  RiBriefcase4Line,
  RiFileCopyLine,
  RiCheckLine,
  RiAddLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReferralIconRow } from "@/components/brand/referral-icon-row";
import { PromoCardGrid } from "@/components/home/promo-card-grid";
import { AFFILIATE_SECTIONS, type AffiliateTab } from "@/lib/nav";
import { isRealPlayer, useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "cn";

type AffReferral = {
  id: string;
  playerAlias: string;
  status: string;
  signupDate: string;
  totalWagered: number;
  commissionEarned: number;
};
type AffLog = {
  id: string;
  depositAmount: number;
  commission: number;
  plan: string;
  rate: number;
  currency: string;
  createdAt: string;
};
type AffData = {
  referralCode: string;
  commissionRate: number;
  totalClicks: number;
  totalReferrals: number;
  totalWagered: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  referrals?: AffReferral[];
  commissionLogs?: AffLog[];
};
type AffCampaign = { id: string; name: string; slug: string };

const AFF_CAMPAIGN_KEY = "tols-aff-campaigns";

const TAB_ICONS = {
  overview: RiShareForwardLine,
  users: RiGroupLine,
  campaigns: RiMegaphoneLine,
  earnings: RiMoneyDollarCircleLine,
  info: RiInformationLine,
  pro: RiBriefcase4Line,
};

function readCampaigns(): AffCampaign[] {
  try {
    const raw = JSON.parse(localStorage.getItem(AFF_CAMPAIGN_KEY) || "[]") as AffCampaign[];
    return Array.isArray(raw) ? raw.filter((c) => c && typeof c.slug === "string") : [];
  } catch {
    return [];
  }
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
      <p className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold text-lime">{value}</p>
    </div>
  );
}

export function AffiliateDesk({ tab }: { tab: AffiliateTab }) {
  const { user } = useCurrentUserState();
  const authed = isRealPlayer(user);
  const [data, setData] = useState<AffData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<AffCampaign[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setCampaigns(readCampaigns());
    let cancelled = false;
    fetch("/api/affiliate", { credentials: "include" })
      .then((r) => r.json())
      .then((body: AffData) => {
        if (!cancelled) setData(body);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.tols.fun";
  const code = data?.referralCode || (authed && user ? `TOLS-${user.id.slice(0, 8).toUpperCase()}` : "");
  const baseLink = code ? `${origin}/?ref=${code}` : "";
  const campaignLink = (slug?: string) => (slug ? `${baseLink}&c=${encodeURIComponent(slug)}` : baseLink);

  function copy(value: string, id = "main") {
    if (!value) return;
    void navigator.clipboard.writeText(value);
    setCopied(id);
    toast.success("Copied");
    window.setTimeout(() => setCopied(null), 1500);
  }

  function addCampaign() {
    const name = newName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "campaign";
    if (campaigns.some((c) => c.slug === slug)) return;
    const next = [...campaigns, { id: `${Date.now()}`, name, slug }];
    setCampaigns(next);
    localStorage.setItem(AFF_CAMPAIGN_KEY, JSON.stringify(next));
    setNewName("");
  }

  const referrals = data?.referrals ?? [];
  const logs = data?.commissionLogs ?? [];
  const ratePct = Math.round((data?.commissionRate ?? 0.25) * 100);

  return (
    <div className="flex flex-col gap-6">
      <PromoCardGrid />
      <div
        role="tablist"
        aria-label="Affiliate sections"
        className="flex gap-1 overflow-x-auto rounded-xl border border-white/6 bg-white/3 p-1"
      >
        {AFFILIATE_SECTIONS.map((item) => {
          const Icon = TAB_ICONS[item.tab];
          const on = tab === item.tab;
          return (
            <Link
              key={item.tab}
              role="tab"
              aria-selected={on}
              to="/affiliate"
              search={{ tab: item.tab }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold tracking-wider uppercase transition-colors",
                on ? "bg-lime text-background" : "text-white/55 hover:text-white",
              )}
            >
              <Icon className="size-3.5" />
              {item.title}
            </Link>
          );
        })}
      </div>

      {tab === "overview" ? (
        <>
          <ReferralIconRow />
          <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-glow)]">
            <p className="text-xs tracking-[0.16em] text-lime uppercase">Your referral link</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input readOnly value={baseLink || "Sign in to generate a live code"} className="font-mono text-xs" />
              <Button className="h-10 shrink-0" onClick={() => copy(baseLink)} disabled={!baseLink}>
                {copied === "main" ? <RiCheckLine className="size-4" /> : <RiFileCopyLine className="size-4" />}
                {copied === "main" ? "Copied" : "Copy"}
              </Button>
            </div>
            {!authed ? <p className="mt-2 text-xs text-muted-foreground">Sign in to generate a live code.</p> : null}
          </section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Clicks" value={data?.totalClicks ?? 0} />
            <Stat label="Referrals" value={data?.totalReferrals ?? 0} />
            <Stat label="Commission" value={`$${(data?.totalCommission ?? 0).toFixed(2)}`} />
            <Stat label="Pending" value={`$${(data?.pendingCommission ?? 0).toFixed(2)}`} />
          </div>
        </>
      ) : null}

      {tab === "users" ? (
        <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <p className="mb-3 text-[10px] tracking-wider text-muted-foreground uppercase">
            Referred Users ({referrals.length})
          </p>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referred users yet. Share your link to start earning.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] tracking-wider text-muted-foreground uppercase">
                    <th className="pb-2 font-semibold">Player</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 text-right font-semibold">Wagered</th>
                    <th className="pb-2 text-right font-semibold">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="py-2.5">
                        <div className="font-medium">{r.playerAlias}</div>
                        <div className="text-[10px] text-muted-foreground">{r.signupDate.slice(0, 10)}</div>
                      </td>
                      <td className="py-2.5">
                        <span className="rounded bg-lime/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-lime uppercase">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs">${r.totalWagered.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono text-xs font-bold text-lime">
                        ${r.commissionEarned.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "campaigns" ? (
        <div className="space-y-3">
          <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <p className="mb-2 text-[10px] tracking-wider text-muted-foreground uppercase">Campaigns</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Named tracking links on the same referral code. Add a slug to see which source converts.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCampaign();
                }}
                placeholder="Campaign name — e.g. Discord"
              />
              <Button className="h-10 shrink-0" onClick={addCampaign} disabled={!newName.trim()}>
                <RiAddLine className="size-4" /> Create
              </Button>
            </div>
          </section>
          {[{ id: "default", name: "Default", slug: "" }, ...campaigns].map((c) => {
            const href = campaignLink(c.slug || undefined);
            return (
              <section key={c.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{href || "—"}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copy(href, c.id)} disabled={!href}>
                    {copied === c.id ? <RiCheckLine className="size-4" /> : <RiFileCopyLine className="size-4" />}
                    {copied === c.id ? "Copied" : "Copy"}
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      {tab === "earnings" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Pending" value={`$${(data?.pendingCommission ?? 0).toFixed(2)}`} />
            <Stat label="Paid out" value={`$${(data?.paidCommission ?? 0).toFixed(2)}`} />
            <Stat label="Lifetime" value={`$${(data?.totalCommission ?? 0).toFixed(2)}`} />
          </div>
          <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <p className="mb-3 text-[10px] tracking-wider text-muted-foreground uppercase">Earnings</p>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No earnings yet. Commissions land here when referred players deposit.
              </p>
            ) : (
              <div className="space-y-1.5">
                {logs.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs">
                        {c.plan} · {c.rate}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.createdAt.slice(0, 10)} · on ${c.depositAmount.toFixed(2)} {c.currency}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold text-lime">+${c.commission.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === "info" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              title: "How it works",
              body: `Share your link. Friends sign up, deposit, and play. You earn ${ratePct}% of net gaming revenue for the lifetime of their account.`,
            },
            {
              title: "Cookie window",
              body: "Last-click, 30 days. If they register inside that window, they stay in your book even if they later sign in from another device.",
            },
            {
              title: "What counts",
              body: "Originals, slots, live, and sportsbook real-money wagers. Practice (stake 0) does not generate commission.",
            },
            {
              title: "Payouts",
              body: "Crypto only (SOL, USDT, BTC, ETH). Minimum $50. Pending commissions settle after wagering requirements on the referred deposit.",
            },
            {
              title: "Self-referrals",
              body: "Same household, same wallet, or same device as the affiliate account is void. Fraudulent traffic is clawed back.",
            },
            {
              title: "Support",
              body: "Questions on deals or creatives: open Live support from the header. Professional media buyers use the Professional tab.",
            },
          ].map((card) => (
            <article key={card.title} className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
              <h3 className="text-sm font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "pro" ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { name: "RevShare", detail: "25–30% NGR", note: "Lifetime. No negative carryover." },
              { name: "Hybrid", detail: "CPA + 10% RS", note: "For qualified FTD traffic." },
              { name: "CPA", detail: "Fixed per FTD", note: "Custom after 50 FTDs / month." },
            ].map((plan) => (
              <article key={plan.name} className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
                <p className="text-[10px] tracking-[0.16em] text-lime uppercase">{plan.name}</p>
                <p className="mt-2 text-2xl font-bold">{plan.detail}</p>
                <p className="mt-1 text-sm text-muted-foreground">{plan.note}</p>
              </article>
            ))}
          </div>
          <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <h3 className="text-sm font-semibold">Sub-affiliates</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              5% override on partners you recruit. Their players stay in their book; you earn on their commission, not
              on the player NGR twice.
            </p>
          </section>
          <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <h3 className="text-sm font-semibold">Postbacks (S2S)</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Fire on registration, first deposit, and subsequent deposits. Macros: {"{click_id}"}, {"{player_id}"},{" "}
              {"{amount}"}, {"{currency}"}, {"{event}"}.
            </p>
            <Input
              readOnly
              className="mt-3 font-mono text-xs"
              value="https://www.tols.fun/api/affiliate/postback?click_id={click_id}&event={event}"
            />
          </section>
          <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <h3 className="text-sm font-semibold">Media kit</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              1200×628, 1080×1080, and 9:16 cuts with TOLS mint on #0d0d10. No fake RTP, no “guaranteed wins”. English
              only on paid traffic.
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
