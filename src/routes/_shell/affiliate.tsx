import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/_shell/affiliate")({
  component: AffiliatePage,
  head: () => ({ meta: [{ title: "Affiliate Program — TOLS" }] }),
});

function AffiliatePage() {
  const { user } = useCurrentUserState();
  const code = user ? `TOLS-${user.id.slice(0, 8).toUpperCase()}` : "TOLS-SIGNIN";
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(`https://tols.fun/?r=${code}`);
    setCopied(true);
    toast.success("Referral link copied");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Affiliate" }]} />
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Affiliate Program</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn 25–30% revenue share on referred wagers, for the lifetime of the account.
        </p>
      </header>
      <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-glow)]">
        <p className="text-xs text-muted-foreground">Your code</p>
        <p className="mt-1 font-mono text-lg">{code}</p>
        <Button className="mt-4 h-10" onClick={copy} disabled={!user}>
          {copied ? "Copied" : "Copy invite link"}
        </Button>
        {!user ? <p className="mt-2 text-xs text-muted-foreground">Sign in to generate a live code.</p> : null}
      </section>
      <ul className="grid gap-2 text-sm text-muted-foreground">
        <li>· No referral limit</li>
        <li>· Lifetime commission</li>
        <li>· Revshare or CPA plan</li>
      </ul>
    </main>
  );
}
