import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { RiCloseLine, RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { TolsMark } from "@/components/brand/tols-mark";
import { TolsT3D } from "@/components/brand/tols-t-3d";
import { TolsAuthGlow } from "@/components/brand/tols-auth-glow";
import { TolsDiamondPlus3D } from "@/components/brand/icon3d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WELCOME_DESKTOP, WELCOME_MOBILE } from "@/lib/welcome-amounts";
import { claimWelcomeBonus } from "@/lib/welcome-bonus";
import { cn } from "cn";

export type AuthTab = "register" | "login";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z" />
      <path fill="#34A853" d="M6.6 14.3 5.5 15.1l-3.1 2.4C4.3 20.8 7.9 23 12 23c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 .9-3.6.9-2.8 0-5.1-1.9-5.9-4.4z" />
      <path fill="#4A90D9" d="M2.4 6.5C1.5 8.3 1 10.1 1 12s.5 3.7 1.4 5.5l4.2-3.2C6.3 13.5 6.2 12.8 6.2 12s.1-1.5.4-2.3z" />
      <path fill="#FBBC05" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2 7.9 2 4.3 4.2 2.4 7.5l4.2 3.2C6.9 8.2 9.2 5.9 12 5.9z" />
    </svg>
  );
}

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#2AABEE" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
      <path fill="#fff" d="M6.9 11.7c3.1-1.35 5.17-2.24 6.2-2.67 2.95-1.23 3.57-1.44 3.97-1.45.3 0 .57.14.64.42.07.24.04.5.02.86-.25 2.6-1.33 8.92-1.88 11.83-.23 1.22-.69 1.38-1.13 1.15-.9-.43-1.75-.94-2.6-1.43l-.4-.24c-1.12-.7-2.24-1.4-3.36-2.1-.28-.18-.3-.57-.05-.79l.07-.06c.5-.44 1.5-1.32 2.1-1.85.17-.15.08-.42-.14-.42h-.05c-.82.05-2.4.2-3.2.27a.4.4 0 0 1-.43-.48l.03-.1c.2-.7.38-1.44.5-2.18a.5.5 0 0 1 .35-.4Z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
      <path d="M18.9 2H22l-6.8 7.8L23 22h-6.5l-5.1-6.7L5.7 22H2.6l7.3-8.3L1 2h6.6l4.6 6.1L18.9 2Zm-1.1 18.1h1.8L6.3 3.8H4.4l13.4 16.3Z" />
    </svg>
  );
}

export function AuthWidgetPanel({
  tab,
  onTab,
  onDone,
  homeClose = false,
}: {
  tab: AuthTab;
  onTab: (t: AuthTab) => void;
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

  function onGoogle() {
    setError(null);
    markAdult();
    window.location.assign(`/api/auth/google?next=${tab === "register" ? "/?welcome" : "/"}`);
  }

  function onTelegram() {
    setError(null);
    markAdult();
    window.location.assign(`/api/auth/telegram?next=${tab === "register" ? "/?welcome" : "/"}`);
  }

  async function onSocial(providerId: string, idp: string) {
    setError(null);
    if (idp === "google") {
      onGoogle();
      return;
    }
    try {
      markAdult();
      await signIn(providerId, { callbackURL: "/" });
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  async function onEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "Player").trim() || "Player";
    if (tab === "login" && !email.includes("@")) {
      setError("Enter the email you registered with.");
      return;
    }
    setPending(true);
    try {
      markAdult();
      if (tab === "register") {
        const { error: err } = await authClient.signUp.email({ email, password, name });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message);
      }
      try {
        await claimWelcomeBonus();
      } catch {
        /* wallet refresh retries on the lobby */
      }
      onDone?.();
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="tols-auth-split">
      <aside className="tols-auth-art">
        <TolsAuthGlow />
        <TolsT3D mode="hero" className="tols-auth-art-3d" />
        <div className="tols-auth-art-wash" />
        <div className="tols-auth-art-top">
          <TolsMark large />
        </div>
        <div className="tols-auth-art-foot">
          <TolsDiamondPlus3D className="tols-auth-art-gem" />
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
        <div className="tols-auth-tabs">
          <button
            type="button"
            className={cn("tols-auth-tab", tab === "register" && "is-active")}
            onClick={() => onTab("register")}
          >
            Register
          </button>
          <button
            type="button"
            className={cn("tols-auth-tab", tab === "login" && "is-active")}
            onClick={() => onTab("login")}
          >
            Login
          </button>
        </div>
        <form className="tols-auth-fields" key={tab} onSubmit={(e) => void onEmail(e)}>
          {tab === "register" ? (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="auth-name">Username*</Label>
                <Input
                  id="auth-name"
                  name="name"
                  autoComplete="username"
                  placeholder="Enter username"
                  className="tols-auth-input"
                  required
                  minLength={3}
                  maxLength={24}
                />
              </div>
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
            </>
          ) : null}
          {tab === "login" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="auth-email">Email or Username*</Label>
              <Input
                id="auth-email"
                name="email"
                type="text"
                autoComplete="email"
                placeholder="Enter email or username"
                className="tols-auth-input"
                required
              />
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-password">Password*</Label>
              {tab === "login" ? (
                <Link to="/help" className="tols-auth-forgot">
                  Forgot Password?
                </Link>
              ) : null}
            </div>
            <div className="relative">
              <Input
                id="auth-password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
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
            {pending ? "Please wait…" : tab === "login" ? "Login" : "Sign up & claim $200"}
          </Button>
        </form>
        <p className="tols-auth-or">Or continue with</p>
        <div className="tols-auth-socials">
          <Button type="button" variant="outline" className="tols-auth-social" onClick={onGoogle}>
            <GoogleMark />
            <span className="sr-only">Google</span>
          </Button>
          <Button type="button" variant="outline" className="tols-auth-social" onClick={onTelegram}>
            <TelegramMark />
            <span className="sr-only">Telegram</span>
          </Button>
          {GROK_PROVIDERS.filter((p) => p.idp !== "google").map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="outline"
              className="tols-auth-social"
              onClick={() => void onSocial(p.providerId, p.idp)}
            >
              <XMark />
              <span className="sr-only">{p.label}</span>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
