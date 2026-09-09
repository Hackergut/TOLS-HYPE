import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { operator } from "@/lib/operator/config";
import { operatorStatus } from "@/lib/operator/rpc";
import { PLATFORM_SKILLS } from "@/lib/operator/skills";
import { AGGREGATOR_KINDS } from "@/lib/operator/adapter";

export const Route = createFileRoute("/_shell/connect")({ component: ConnectPage });

function ConnectPage() {
  const [status, setStatus] = useState<{
    adapter?: string;
    adapterLabel?: string;
    aggregator?: boolean;
    kind?: string;
    governanceOk?: boolean;
    casinoOrigin?: string;
    payments?: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    void operatorStatus()
      .then((s) => setStatus(s))
      .catch(() => setStatus({}));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Connect" }]} />
      <header>
        <p className="text-xs font-medium tracking-[0.18em] text-lime uppercase">Transfer</p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight">
          {operator.name} → tols-casino-next
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This UI keeps originals and the new look. Live Flexrix, EuroVirtuals, governance, and
          payments stay on{" "}
          <a className="text-lime underline-offset-2 hover:underline" href="https://github.com/Hackergut/tols-casino-next">
            Hackergut/tols-casino-next
          </a>
          .
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Active adapter</CardTitle>
          <CardDescription>
            {status?.adapterLabel ?? operator.aggregatorKind} · casino {status?.casinoOrigin ?? "https://www.tols.fun"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Governance: {status?.governanceOk ? "up" : "standby"} · set{" "}
          <code className="text-foreground">AGGREGATOR_KIND=tols-next</code>
        </CardContent>
      </Card>

      <section>
        <h2 className="font-heading mb-3 text-lg font-bold">Env map</h2>
        <Card>
          <CardContent className="overflow-x-auto pt-4 font-mono text-xs leading-relaxed">
            {`AGGREGATOR_KIND=tols-next
CASINO_ORIGIN=https://www.tols.fun
GOVERNANCE_TOWER_URL=https://gov.tols.fun
GOVERNANCE_BRIDGE_SECRET=<same as both Vercel projects>
PLATFORM_JWT_PUBLIC_KEY=<BLOCK 2 from .env.bridge-keys>
VENDOR_CALLBACK_SECRET=<VENDOR_CALLBACK_SECRET on casino>
FLEXRIX_API_BASE=https://api.upaflex.online
EV_API_BASE=https://api.staging.betkraft.co.uk
DATABASE_URL=<Supabase pooler from casino>`}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="font-heading mb-3 text-lg font-bold">What stays on Next</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Flexrix HMAC-SHA1 launch + callback</li>
          <li>EuroVirtuals / Betkraft</li>
          <li>On-chain deposits, Moonpay, withdrawals</li>
          <li>Governance JWT (deposits, RTP, user block)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading mb-3 text-lg font-bold">What this UI owns</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Lobby, silicone cards, hero, chat, live feed</li>
          <li>Originals math (dice, mines, keno, crash, pool…)</li>
          <li>Skin tokens (lime / purple / logo)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading mb-3 text-lg font-bold">Adapters</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {AGGREGATOR_KINDS.map((id) => (
            <Card key={id} className={status?.kind === id ? "ring-1 ring-lime" : ""}>
              <CardHeader>
                <CardTitle className="text-sm uppercase">{id}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading mb-3 text-lg font-bold">Skills</h2>
        <div className="grid gap-2">
          {PLATFORM_SKILLS.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-sm">{s.label}</CardTitle>
                <CardDescription>
                  {s.env}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
