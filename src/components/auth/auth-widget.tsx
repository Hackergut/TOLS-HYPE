import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { RiCloseLine, RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { authClient, releaseSession, rememberSessionToken } from "@/lib/auth/client";
import { TolsT3D } from "@/components/brand/tols-t-3d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WELCOME_DESKTOP, WELCOME_MOBILE } from "@/lib/welcome-amounts";
import { claimWelcomeBonus } from "@/lib/welcome-bonus";
import { cn } from "cn";

export type AuthTab = "register" | "login";

export function AuthWidgetPanel({
  onDone,
  homeClose = false,
}: {
  tab?: AuthTab;
  onTab?: (t: AuthTab) => void;
  onDone?: () => void;
  homeClose?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function markAdult() {
    try {
      window.localStorage.setItem("tols-18", "yes");
    } catch {
      /* private mode */
    }
  }

  async function onEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email.includes("@")) {
      setError("Enter the email you were given.");
      return;
    }
    setPending(true);
    try {
      markAdult();
      await releaseSession();
      const { data, error: err } = await authClient.signIn.email({ email, password });
      if (err) throw new Error(err.message);
      const token = data && "token" in data ? (data.token as string | null) : null;
      if (token) rememberSessionToken(token);
      await Promise.race([
        claimWelcomeBonus().catch(() => undefined),
        new Promise((resolve) => window.setTimeout(resolve, 2000)),
      ]);
      onDone?.();
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="tols-auth-split">
      <aside className="tols-auth-art">
        <TolsT3D className="tols-auth-art-3d" />
        <div className="tols-auth-art-foot">
          <p className="tols-auth-bonus-line">
            ${WELCOME_DESKTOP} welcome bonus · ${WELCOME_MOBILE} if you also sign in on mobile
          </p>
          <p>
            By accessing the site you confirm you are at least 18 years old and have read the{" "}
            <Link to="/terms" className="underline underline-offset-2">
              Terms and Conditions
            </Link>
            .
          </p>
        </div>
      </aside>
      <section className="tols-auth-form">
        {homeClose ? (
          <Link to="/" className="tols-auth-close" aria-label="Close">
            <RiCloseLine className="size-5" />
          </Link>
        ) : null}
        <div className="tols-auth-form-mark">
          <TolsT3D className="tols-auth-form-3d" />
        </div>
        <div className="tols-auth-tabs">
          <button type="button" className="tols-auth-tab is-active">
            Login
          </button>
        </div>
        <form className="tols-auth-fields" onSubmit={(e) => void onEmail(e)}>
          <div className="grid gap-1.5">
            <Label htmlFor="auth-email">Email*</Label>
            <Input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter email"
              className="tols-auth-input"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-password">Password*</Label>
            </div>
            <div className="relative">
              <Input
                id="auth-password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                className="tols-auth-input tols-auth-input-pw"
                required
                minLength={8}
              />
              <button
                type="button"
                className="tols-auth-eye"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <RiEyeOffLine className="size-4" /> : <RiEyeLine className="size-4" />}
              </button>
            </div>
          </div>
          {error ? <p className="tols-auth-error">{error}</p> : null}
          <Button type="submit" className={cn("tols-auth-submit", pending && "is-pending")} disabled={pending}>
            {pending ? "Please wait…" : "Login"}
          </Button>
        </form>
        <p className="px-1 text-center text-xs text-muted-foreground">Invite only. Use the login you were given.</p>
      </section>
    </div>
  );
}
