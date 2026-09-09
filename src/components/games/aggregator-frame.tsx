import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { launchRemoteGame } from "@/lib/operator/rpc";
import { useWallet } from "@/lib/wallet-context";

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
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void launchRemoteGame({ data: { gameId, currency } })
      .then((res) => {
        if (!live) return;
        if (res.error) setError(res.error);
        else if (res.url) setUrl(res.url);
        else if (res.html) setHtml(res.html);
        else setError("No launch payload");
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Launch failed";
        if (live) {
          setError(msg);
          toast.error(msg);
        }
      });
    return () => {
      live = false;
    };
  }, [gameId, currency]);

  return (
    <GameShell
      controls={
        <p className="text-sm text-muted-foreground">
          Provider table. Wallet callbacks hit the SQL ledger.
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
        ) : html ? (
          <iframe
            title="Provider game"
            srcDoc={html}
            className="h-[min(70vh,40rem)] w-full rounded-xl bg-black"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Opening studio…</p>
        )
      }
    />
  );
}
