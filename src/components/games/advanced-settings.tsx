import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getFairState,
  rotateServerSeed,
  setClientSeed,
} from "@/lib/fair-api";
import {
  loadConfirmMax,
  loadGameSpeed,
  loadHotkeysOn,
  saveConfirmMax,
  saveGameSpeed,
  saveHotkeysOn,
} from "@/lib/game-prefs";
import { cn } from "cn";

export function AdvancedSettings({ rtp }: { rtp?: number }) {
  const [instant, setInstant] = useState(() => loadGameSpeed() === "instant");
  const [hotkeys, setHotkeys] = useState(loadHotkeysOn);
  const [confirmMax, setConfirmMax] = useState(loadConfirmMax);
  const [hash, setHash] = useState("");
  const [client, setClient] = useState("");
  const [nonce, setNonce] = useState(0);
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    void getFairState()
      .then((s) => {
        setHash(s.serverHash);
        setClient(s.clientSeed);
        setNonce(s.nonce);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="grid gap-2 border-t border-border pt-2">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Advanced</p>
      {rtp != null ? (
        <p className="text-xs tabular-nums text-lime">RTP {rtp.toFixed(1)}%</p>
      ) : null}
      <Toggle
        label="Instant result"
        on={instant}
        onChange={(v) => {
          saveGameSpeed(v ? "instant" : "regular");
          setInstant(v);
        }}
      />
      <Toggle label="Hotkeys (Space)" on={hotkeys} onChange={(v) => { saveHotkeysOn(v); setHotkeys(v); }} />
      <Toggle label="Confirm max bet" on={confirmMax} onChange={(v) => { saveConfirmMax(v); setConfirmMax(v); }} />
      <p className="mt-1 text-[0.65rem] text-muted-foreground">SHA-256 HMAC · client seed + nonce</p>
      <p className="truncate font-mono text-[0.6rem] text-muted-foreground" title={hash}>
        Hash {hash.slice(0, 18)}…
      </p>
      <p className="font-mono text-[0.6rem] text-muted-foreground">Nonce {nonce}</p>
      <div className="flex gap-1">
        <Input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="h-8 font-mono text-xs"
          aria-label="Client seed"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => {
            void setClientSeed({ data: { clientSeed: client } })
              .then(() => toast.success("Client seed saved"))
              .catch((e) => toast.error(e instanceof Error ? e.message : "Seed failed"));
          }}
        >
          Set
        </Button>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          void rotateServerSeed()
            .then((r) => {
              setRevealed(r.revealedSeed);
              setHash(r.nextHash);
              setNonce(0);
              toast.message("Server seed rotated");
            })
            .catch((e) => toast.error(e instanceof Error ? e.message : "Rotate failed"));
        }}
      >
        Reveal & rotate seed
      </Button>
      {revealed ? (
        <p className="break-all font-mono text-[0.6rem] text-lime">{revealed}</p>
      ) : null}
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between text-sm">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn("h-5 w-9 rounded-full", on ? "bg-lime" : "bg-muted")}
      >
        <span className={cn("block size-4 rounded-full bg-black transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </label>
  );
}
