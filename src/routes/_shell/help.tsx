import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";

export const Route = createFileRoute("/_shell/help")({
  component: HelpPage,
  head: () => ({ meta: [{ title: "Help Center — TOLS" }] }),
});

const FAQS = [
  {
    q: "Is this real-money gambling?",
    a: "This preview uses play-money balances. Tols.fun Terms of Service describe the live service.",
  },
  {
    q: "How do I deposit?",
    a: "Sign in, open Wallet, and credit play-money USDT, BTC, or ETH. Live deposits use a wallet you control.",
  },
  {
    q: "How do I set limits?",
    a: "Profile → Responsible play. Self-exclusion and deposit, wager, loss, and session limits are there.",
  },
  {
    q: "Are games fair?",
    a: "Originals settle on the server at bet time. Read Provably Fair for house edge and what is demo-only.",
  },
  {
    q: "I need to talk to someone.",
    a: "Email support@tols.fun. For gambling harm, use BeGambleAware or Gamblers Anonymous.",
  },
];

function HelpPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Help Center" }]} />
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live Support · answers in one place</p>
      </header>
      <section id="live" className="rounded-2xl bg-card p-5 shadow-[var(--shadow-glow)]">
        <h2 className="font-heading text-lg font-semibold">Live Support</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We reply around the clock. Include your account email.
        </p>
        <Button asChild className="mt-4 h-10">
          <a href="mailto:support@tols.fun">Email support@tols.fun</a>
        </Button>
      </section>
      <ul className="grid gap-3">
        {FAQS.map((f) => (
          <li key={f.q} className="rounded-2xl bg-card p-5">
            <h2 className="font-heading text-base font-semibold">{f.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Play within limits.{" "}
        <Link to="/responsible" className="text-foreground hover:underline">
          Game Responsibly
        </Link>
      </p>
    </main>
  );
}
