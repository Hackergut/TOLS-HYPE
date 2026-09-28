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
import { RoundClone } from "@/components/games/round-clone";
import { shareText, shortHash, type BetRound } from "@/lib/bet-history";
import { postChat } from "@/lib/chat-api";
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
  const tag = round?.fair ? shortHash(round.fair.serverHash) : "";
  const board = round?.view?.kind === "keno" || round?.view?.kind === "mines" || round?.view?.kind === "roulette";

  function copy(text: string, label: string) {
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  }

  function share() {
    if (!round || !user) {
      toast.error("Sign in to share a win");
      return;
    }
    void postChat({ data: { room: "en", text: shareText(round), round: { ...round } } })
      .then(() => {
        dock?.toggle("chat");
        toast.success("Shared in chat");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Share blocked"));
  }

  return (
    <Dialog open={Boolean(round)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn("gap-2.5 p-3", board ? "sm:max-w-[22rem]" : "sm:max-w-[19.25rem]")}>
        {round ? (
          <>
            <DialogHeader className="gap-0.5 pr-6">
              <DialogTitle className="font-heading text-base">
                {round.title} · {round.win ? "Win" : "Lose"}
              </DialogTitle>
              <DialogDescription className="text-[0.7rem]">{round.label}</DialogDescription>
            </DialogHeader>
            <RoundClone view={round.view} win={round.win} label={round.label} size="card" />
            <div className="grid grid-cols-4 gap-1">
              <Stat k="Stake" v={`${round.stake} ${round.currency}`} />
              <Stat k="Payout" v={`${round.payout} ${round.currency}`} />
              <Stat k="Mult" v={round.multiplier ? `${round.multiplier.toFixed(2)}×` : "0×"} />
              <Stat k="Result" v={round.win ? "WIN" : "LOSE"} accent={round.win} />
            </div>
            {round.fair ? (
              <div className="grid gap-1 rounded-lg bg-muted/50 px-2 py-1.5 font-mono text-[0.65rem]">
                <CopyLine
                  label="Hash"
                  display={`#${tag}`}
                  value={`#${tag}`}
                  title={round.fair.serverHash}
                  onCopy={copy}
                />
                <CopyLine label="Seed" display={round.fair.clientSeed} value={round.fair.clientSeed} onCopy={copy} />
                <p className="text-muted-foreground">Nonce {round.fair.nonce}</p>
              </div>
            ) : (
              <p className="text-[0.65rem] text-muted-foreground">Seed lands on the next SHA round.</p>
            )}
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" onClick={() => copy(shareText(round), "Round")}>
                <RiFileCopyLine className="size-3.5" />
                Copy
              </Button>
              <Button size="sm" className="h-8 flex-1 text-xs" onClick={share}>
                <RiChat3Line className="size-3.5" />
                Chat {tag ? `#${tag}` : ""}
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

function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="rounded-md bg-muted/50 px-1.5 py-1">
      <p className="text-[0.55rem] tracking-wide text-muted-foreground uppercase">{k}</p>
      <p className={cn("truncate text-[0.7rem] font-semibold tabular-nums", accent && "text-lime")}>{v}</p>
    </div>
  );
}

function CopyLine({
  label,
  display,
  value,
  title,
  onCopy,
}: {
  label: string;
  display: string;
  value: string;
  title?: string;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 text-left"
      title={title ?? value}
      onClick={() => onCopy(value, label)}
    >
      <span className="w-9 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate">{display}</span>
      <RiFileCopyLine className="size-3 shrink-0" />
    </button>
  );
}
