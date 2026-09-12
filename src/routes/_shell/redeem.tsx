import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";

const CODE_LEN = 8;

export const Route = createFileRoute("/_shell/redeem")({
  component: RedeemPage,
  head: () => ({ meta: [{ title: "Redeem Code — TOLS" }] }),
});

function RedeemPage() {
  const { user } = useCurrentUserState();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  function redeem(value: string) {
    if (!user) return;
    setBusy(true);
    window.setTimeout(() => {
      const ok = value.trim().toUpperCase().startsWith("TOLS");
      if (ok) toast.success("Code applied to play-money balance");
      else toast.error("That code is not valid");
      setBusy(false);
    }, 400);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length < 4) {
      toast.error("Enter a complete code");
      return;
    }
    redeem(code);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Redeem Code" }]} />
      <header>
        <BluescreenTitle as="h1" className="text-3xl font-bold tracking-tight">
          Redeem Code
        </BluescreenTitle>
        <p className="mt-1 text-sm text-muted-foreground">Bonus, reload, and campaign codes.</p>
      </header>
      {!user ? (
        <Button asChild className="h-11">
          <Link to="/login">Sign in to redeem</Link>
        </Button>
      ) : (
        <form className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]" onSubmit={onSubmit}>
          <Label htmlFor="code">Code</Label>
          <div className="mt-2">
            <InputOTP
              id="code"
              maxLength={CODE_LEN}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              value={code}
              onChange={(v) => setCode(v.toUpperCase())}
              onComplete={redeem}
              disabled={busy}
              containerClassName="justify-between"
            >
              <InputOTPGroup className="w-full justify-between gap-1">
                {Array.from({ length: CODE_LEN }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="size-9 text-sm uppercase first:rounded-md last:rounded-md" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">8 characters. Codes start with TOLS.</p>
          <Button type="submit" className="mt-4 h-11 w-full" disabled={busy || code.length < 4}>
            Redeem
          </Button>
        </form>
      )}
    </main>
  );
}
