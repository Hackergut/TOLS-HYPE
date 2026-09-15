import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CookiePreferences } from "@/components/layout/cookie-preferences";
import { TolsWordmark } from "@/components/brand/tols-mark";

const COLS = [
  {
    title: "Support",
    links: [
      { label: "Live Support", to: "/help" as const, hash: "live" },
      { label: "Help Center", to: "/help" as const },
      { label: "Game Responsibly", to: "/responsible" as const },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Provably Fair", to: "/fairness" as const },
      { label: "Affiliate Program", to: "/affiliate" as const },
      { label: "Redeem Code", to: "/redeem" as const },
      { label: "VIP Program", to: "/vip" as const },
      { label: "Connect", to: "/connect" as const },
    ],
  },
  {
    title: "Policy",
    links: [
      { label: "Terms of Service", to: "/terms" as const },
      { label: "Privacy Policy", to: "/privacy" as const },
      { label: "Game Responsibly", to: "/responsible" as const },
      { label: "AML Policy", to: "/aml" as const },
    ],
  },
] as const;

export function SiteFooter() {
  const [cookies, setCookies] = useState(false);

  return (
    <footer className="border-t border-border px-4 py-8 text-sm text-muted-foreground md:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="font-sub text-[0.65rem] font-medium tracking-[0.14em] text-foreground uppercase">
              {col.title}
            </p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} hash={"hash" in l ? l.hash : undefined} className="hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
              {col.title === "Policy" ? (
                <li>
                  <button type="button" className="hover:text-foreground" onClick={() => setCookies(true)}>
                    Customise
                  </button>
                </li>
              ) : null}
            </ul>
          </nav>
        ))}
        <nav aria-label="Community">
          <p className="font-sub text-[0.65rem] font-medium tracking-[0.14em] text-foreground uppercase">
            Community
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <a href="https://t.me/tolsfun" rel="noreferrer" target="_blank" className="hover:text-foreground">
                Telegram
              </a>
            </li>
            <li>
              <a href="https://x.com/tolsfun" rel="noreferrer" target="_blank" className="hover:text-foreground">
                X
              </a>
            </li>
            <li>
              <a href="https://instagram.com/tolsfun" rel="noreferrer" target="_blank" className="hover:text-foreground">
                Instagram
              </a>
            </li>
            <li>
              <Link to="/help" className="hover:text-foreground">
                Forum
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <TolsWordmark className="h-4 w-auto opacity-50" />
          <p className="text-xs">18+ only · TOLS B.V. · Willemstad, Curaçao · support@tols.fun</p>
        </div>
        <a
          href="https://www.gambleaware.org/"
          target="_blank"
          rel="noreferrer"
          aria-label="GambleAware — free, confidential support with gambling"
          title="GambleAware"
          className="inline-flex shrink-0 items-center self-start rounded-md bg-white px-1.5 py-1 transition-opacity hover:opacity-80 sm:self-auto"
        >
          <img src="/brand/gambleaware.webp" alt="GambleAware" className="h-5 w-auto" loading="lazy" />
        </a>
      </div>
      <CookiePreferences open={cookies} onOpenChange={setCookies} />
    </footer>
  );
}
