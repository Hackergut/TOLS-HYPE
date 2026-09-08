import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";

export const Route = createFileRoute("/_shell/redeem")({
  component: RedeemPage,
  head: () => ({ meta: [{ title: "Redeem Code — TOLS" }] }),
});

function RedeemPage() {
  const { user } = useCurrentUserState();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    window.setTimeout(() => {
      const ok = code.trim().toUpperCase().startsWith("TOLS");
      if (ok) toast.success("Code applied to play-money balance");
      else toast.error("That code is not valid");
      setBusy(false);
    }, 400);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Redeem Code" }]} />
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Redeem Code</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bonus, reload, and campaign codes.</p>
      </header>
      {!user ? (
        <Button asChild className="h-11">
          <Link to="/login">Sign in to redeem</Link>
        </Button>
      ) : (
        <form className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]" onSubmit={onSubmit}>
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            className="mt-1.5 h-11 uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TOLS100"
            required
          />
          <Button type="submit" className="mt-4 h-11 w-full" disabled={busy}>
            Redeem
          </Button>
        </form>
      )}
    </main>
  );
}
