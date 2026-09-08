import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { RiChat3Line, RiFileCopyLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { shareBetToChat, shareText, type BetRound, type RoundView } from "@/lib/bet-history";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useRightDock } from "@/components/layout/right-dock";
import { cn } from "cn";

type Ctx = {
  open: (round: BetRound) => void;
};

const C = createContext<Ctx | null>(null);

export function useRoundViewer() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useRoundViewer must be used within RoundViewerProvider");
  return ctx;
}

export function useRoundViewerOptional() {
  return useContext(C);
}

export function RoundViewerProvider({ children }: { children: ReactNode }) {
  const [round, setRound] = useState<BetRound | null>(null);
  const open = useCallback((next: BetRound) => setRound(next), []);
  return (
    <C.Provider value={{ open }}>
      {children}
      <RoundDialog round={round} onClose={() => setRound(null)} />
    </C.Provider>
  );
}

function RoundDialog({ round, onClose }: { round: BetRound | null; onClose: () => void }) {
  const user = useCurrentUser();
  const dock = useRightDockSafe();

  function copy(text: string, label: string) {
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  }

  function share() {
    if (!round) return;
    shareBetToChat(user?.displayName ?? "you", round);
    dock?.toggle("chat");
    toast.success("Shared in chat");
  }

  return (
    <Dialog open={Boolean(round)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {round ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-lg">
                {round.title} · {round.win ? "Win" : "Lose"}
              </DialogTitle>
              <DialogDescription>{round.label}</DialogDescription>
            </DialogHeader>
            <RoundScreen view={round.view} win={round.win} label={round.label} />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <Row k="Stake" v={`${round.stake} ${round.currency}`} />
              <Row k="Payout" v={`${round.payout} ${round.currency}`} />
              <Row k="Multiplier" v={round.multiplier ? `${round.multiplier.toFixed(2)}×` : "0×"} />
              <Row k="Result" v={round.win ? "WIN" : "LOSE"} accent={round.win} />
            </dl>
            {round.fair ? (
              <div className="grid gap-1.5 rounded-xl bg-muted/50 p-3 font-mono text-[0.65rem]">
                <CopyLine label="Hash" value={round.fair.serverHash} onCopy={copy} />
                <CopyLine label="Seed" value={round.fair.clientSeed} onCopy={copy} />
                <p className="text-muted-foreground">Nonce {round.fair.nonce}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Seed lands on the next SHA round.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => copy(shareText(round), "Round")}>
                <RiFileCopyLine className="size-3.5" />
                Copy round
              </Button>
              <Button size="sm" onClick={share}>
                <RiChat3Line className="size-3.5" />
                Share in chat
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function useRightDockSafe() {
  try {
    return useRightDock();
  } catch {
    return null;
  }
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn("tabular-nums", accent && "text-lime")}>{v}</dd>
    </div>
  );
}

function CopyLine({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <button type="button" className="flex w-full items-center gap-2 text-left" onClick={() => onCopy(value, label)}>
      <span className="w-10 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate">{value}</span>
      <RiFileCopyLine className="size-3 shrink-0" />
    </button>
  );
}

export function RoundScreen({ view, win, label }: { view: RoundView | null; win: boolean; label: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4 ring-1",
        win ? "bg-lime/10 ring-lime/40" : "bg-muted/40 ring-border",
      )}
    >
      <p className={cn("mb-2 text-[0.65rem] font-bold tracking-wider uppercase", win ? "text-lime" : "text-muted-foreground")}>
        {win ? "Won" : "Lost"}
      </p>
      {view?.kind === "dice" ? (
        <DiceScreen roll={view.roll} />
      ) : view?.kind === "roulette" ? (
        <p className="font-heading text-3xl font-bold">
          <span className={view.color === "green" ? "text-lime" : "text-muted-foreground"}>
            {view.number}
          </span>
          <span className="ml-2 text-sm font-medium text-muted-foreground">{view.color}</span>
        </p>
      ) : view?.kind === "slots" ? (
        <p className="font-heading text-2xl tracking-[0.3em]">{view.reels.join(" ")}</p>
      ) : view?.kind === "pool" ? (
        <p className="font-heading text-2xl font-bold">
          {view.scratch ? "Scratch" : `${view.balls} pocketed`}
        </p>
      ) : view?.kind === "crash" ? (
        <p className="font-heading text-3xl font-bold text-lime">
          {(view.cashAt ?? view.crashAt ?? 0).toFixed(2)}×
        </p>
      ) : view?.kind === "keno" ? (
        <p className="font-heading text-2xl font-bold">{view.hits} hits</p>
      ) : view?.kind === "mines" ? (
        <p className="font-heading text-2xl font-bold">{view.boom ? "Mine" : `${view.multiplier ?? 0}×`}</p>
      ) : (
        <p className="font-heading text-xl font-semibold">{label}</p>
      )}
    </div>
  );
}

function DiceScreen({ roll }: { roll: number }) {
  return (
    <div>
      <div className="relative h-2 rounded-full bg-muted">
        <span
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime ring-2 ring-black"
          style={{ left: `${Math.min(98, Math.max(2, roll))}%` }}
        />
      </div>
      <p className="mt-2 font-heading text-2xl font-bold tabular-nums">{roll.toFixed(2)}</p>
    </div>
  );
}
