import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TolsMark } from "@/components/brand/tols-mark";
import { operator } from "@/lib/operator/config";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSocial(providerId: string, idp: string) {
    setError(null);
    if (idp === "google") {
      const next = "/profile";
      window.location.assign(`${operator.casinoOrigin}/api/auth/google?next=${encodeURIComponent(next)}`);
      return;
    }
    try {
      await signIn(providerId, { callbackURL: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  async function onEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "Player");
    setPending(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({ email, password, name });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-card/90 p-6 shadow-[var(--shadow-glow)] backdrop-blur-xl">
        <TolsMark large />
        <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight">
          {mode === "in" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Official TOLS. Google, X, or email.
        </p>
        {authEnabled ? (
          <div className="mt-6 space-y-3">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={() => void onSocial(p.providerId, p.idp)}
              >
                Continue with {p.label}
              </Button>
            ))}
            <div className="relative py-2 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2">or email</span>
            </div>
            <form className="grid gap-3" onSubmit={(e) => void onEmail(e)}>
              {mode === "up" ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" className="h-11" required />
                </div>
              ) : null}
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" className="h-11" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" className="h-11" required minLength={8} />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="h-11" disabled={pending}>
                {mode === "in" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <button
              type="button"
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "Need an account?" : "Already registered?"}
            </button>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Sign-in is disabled.</p>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to the{" "}
          <Link to="/terms" className="text-foreground underline-offset-2 hover:underline">
            Terms of Service
          </Link>
          .
        </p>
        <Link to="/" className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground">
          Back to lobby
        </Link>
      </div>
    </main>
  );
}
