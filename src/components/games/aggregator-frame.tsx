import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { useWallet } from "@/lib/wallet-context";

/** Live Next ledger. Player cookies for tols_session live on this origin. */
const CASINO_ORIGIN = (
  (import.meta.env.VITE_CASINO_ORIGIN as string | undefined) ?? "https://www.tols.fun"
).replace(/\/$/, "");

type CasinoPayload = {
  success?: boolean;
  data?: { url?: string; launchUrl?: string; mode?: string };
  url?: string;
  launchUrl?: string;
  error?: string;
};

function pickUrl(json: CasinoPayload | null): string | null {
  if (!json) return null;
  return json.data?.url ?? json.data?.launchUrl ?? json.url ?? json.launchUrl ?? null;
}

async function postCasino(path: string, body: Record<string, unknown>, creds: RequestCredentials) {
  const res = await fetch(`${CASINO_ORIGIN}${path}`, {
    method: "POST",
    credentials: creds,
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as CasinoPayload | null;
  return { ok: res.ok, status: res.status, url: pickUrl(json), error: json?.error ?? null };
}

export function AggregatorFrame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <Launch gameId={gameId} />
    </PlayGate>
  );
}

function Launch({ gameId }: { gameId: string }) {
  const { currency } = useWallet();
  const [url, setUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"demo" | "real" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  useEffect(() => {
    let live = true;
    const slug = gameId.replace(/^flexrix-/, "");

    void (async () => {
      let demoUrl: string | null = null;
      try {
        const demo = await postCasino(
          "/api/flexrix/launch-demo",
          { slug, gameId: slug, currency, language: "en" },
          "omit",
        );
        if (!live) return;
        if (demo.url) {
          demoUrl = demo.url;
          setUrl(demo.url);
          setMode("demo");
          setError(null);
        }
      } catch {
        /* real attempt still runs */
      }

      try {
        const real = await postCasino(
          "/api/flexrix/launch",
          { slug, gameId: slug, currency, language: "en" },
          "include",
        );
        if (!live) return;
        if (real.url) {
          setUrl(real.url);
          setMode("real");
          setNeedsSignIn(false);
          setError(null);
          return;
        }
        if (real.status === 401) {
          setNeedsSignIn(true);
          if (!demoUrl) setError(null);
          return;
        }
        if (!demoUrl) setError(real.error ?? `Launch ${real.status}`);
      } catch (err) {
        if (!live) return;
        if (!demoUrl) {
          const msg = err instanceof Error ? err.message : "Launch failed";
          setError(msg);
          toast.error(msg);
        }
      }
    })();

    return () => {
      live = false;
    };
  }, [gameId, currency]);

  return (
    <GameShell
      controls={
        <p className="text-sm text-muted-foreground">
          {mode === "real"
            ? "Real table. Debit/credit stay on the TOLS ledger."
            : mode === "demo"
              ? "Demo table. Sign in to play on the live wallet."
              : "Provider table. Wallet callbacks hit the TOLS ledger."}
          {needsSignIn ? (
            <>
              {" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in for real play
              </Link>
            </>
          ) : null}
        </p>
      }
      play={
        error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : url ? (
          <iframe
            title="Provider game"
            src={url}
            className="h-[min(70vh,40rem)] w-full rounded-xl bg-black"
            allow="autoplay; fullscreen"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Opening studio…</p>
        )
      }
    />
  );
}
