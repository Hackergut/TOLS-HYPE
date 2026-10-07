import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { RiArrowDownSLine, RiChat3Line, RiFileCopyLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RoundClone } from "@/components/games/round-clone";
import { PlayerShot } from "@/components/players/player-shot";
import { copyText, pushChatDraft, saveWinTag, shareText, shortHash, type BetRound } from "@/lib/bet-history";
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
  const tag = round?.fair ? shortHash(round.fair.serverHash) : round ? round.id.slice(-8) : "";
  const handle = user?.displayName?.split("@")[0] || user?.primaryEmail?.split("@")[0] || "you";
  const when = round ? placedAt(round.at) : "";
  const dice = round?.view?.kind === "dice" ? round.view : null;
  const chance = dice ? diceChance(dice.target ?? 50, Boolean(dice.over)) : null;

  function copy(text: string, label: string) {
    const value = label === "Round" && round ? saveWinTag(round) : text;
    if (copyText(value)) {
      toast.success(`${label} copied`);
      return;
    }
    const clip = navigator.clipboard?.writeText(value);
    if (!clip) {
      pushChatDraft(value);
      dock?.setTab("chat");
      dock?.setMobileOpen(true);
      toast.message("Clipboard blocked. Tag is in the chat box.");
      return;
    }
    void clip.then(
      () => toast.success(`${label} copied`),
      () => {
        pushChatDraft(value);
        dock?.setTab("chat");
        dock?.setMobileOpen(true);
        toast.message("Clipboard blocked. Tag is in the chat box.");
      },
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
      <DialogContent className="gap-3 bg-[#17191e] p-4 sm:max-w-[26rem]">
        {round ? (
          <>
            <DialogHeader className="items-center gap-2 pr-6 text-center">
              <DialogTitle className="flex items-center justify-center gap-2 text-[15px] font-semibold">
                <GameMark kind={String(round.kind)} />
                <span>
                  {round.title}: {tag}
                </span>
                <button
                  type="button"
                  aria-label="Copy round id"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => copy(tag, "Round")}
                >
                  <RiFileCopyLine className="size-3.5" />
                </button>
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-white/70">
                Placed by:
                <span className="inline-flex items-center gap-1 rounded-md bg-[#2a2e36] py-0.5 pr-2 pl-0.5">
                  <PlayerShot handle={handle} className="size-4 text-[0.55rem]" />
                  <span className="font-medium text-white">{handle}</span>
                </span>
                on {when}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#22262e] px-3 py-1 text-[0.65rem] font-semibold tracking-wide text-white/80">
                <span className="grid size-3.5 place-items-center rounded-full bg-lime text-[8px] font-bold text-black">T</span>
                TOLS
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-xl bg-[#22262e]">
              <Metric label="Bet" currency={round.currency} value={formatAmt(round.stake)} />
              <Metric label="Multiplier" value={`${round.multiplier ? round.multiplier.toFixed(2) : "0.00"}x`} icon="mult" />
              <Metric label="Payout" currency={round.currency} value={formatAmt(round.payout)} accent={round.win} />
            </div>

            <div className="rounded-xl border border-white/10 p-3">
              <RoundClone view={round.view} win={round.win} label={round.label} size="card" />
              {dice ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Field label="Multiplier" value={(round.multiplier || 1).toFixed(4)} />
                  <Field label={dice.over ? "Roll Over" : "Roll Under"} value={(dice.target ?? 50).toFixed(2)} />
                  <Field label="Chance" value={chance!.toFixed(4)} suffix="%" />
                </div>
              ) : (
                <p className="mt-2 text-center text-xs text-muted-foreground">{round.label}</p>
              )}
            </div>

            <Button asChild className="h-12 rounded-lg bg-[#7c3aed] text-sm font-bold text-white hover:bg-[#6d28d9]">
              <Link to="/games/$id" params={{ id: round.gameId }} onClick={onClose}>
                <span aria-hidden className="mr-1">▶</span>
                Play
              </Link>
            </Button>

            <Collapsible>
              <div className="rounded-xl border border-white/10">
                <CollapsibleTrigger className="flex h-11 w-full items-center justify-between px-3 text-sm font-medium">
                  Provably Fair
                  <RiArrowDownSLine className="size-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="grid gap-1 border-t border-white/10 px-3 py-2 font-mono text-[0.65rem]">
                  {round.fair ? (
                    <>
                      <CopyLine label="Hash" display={`#${tag}`} value={round.fair.serverHash} title={round.fair.serverHash} onCopy={copy} />
                      <CopyLine label="Seed" display={round.fair.clientSeed} value={round.fair.clientSeed} onCopy={copy} />
                      <p className="text-muted-foreground">Nonce {round.fair.nonce}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Seed lands on the next SHA round.</p>
                  )}
                  <button type="button" className="mt-1 inline-flex items-center gap-1 text-left text-white" onClick={share}>
                    <RiChat3Line className="size-3.5" />
                    Share in chat
                  </button>
                </CollapsibleContent>
              </div>
            </Collapsible>
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

function placedAt(at: number) {
  const d = new Date(at);
  const day = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} (${time})`;
}

function formatAmt(n: number) {
  if (!Number.isFinite(n)) return "0";
  return n >= 1 ? n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "") : n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function diceChance(target: number, over: boolean) {
  const span = over ? 100 - target : target;
  return Math.min(99.99, Math.max(0.01, span));
}

function GameMark({ kind }: { kind: string }) {
  return (
    <span className="grid size-6 place-items-center rounded-md bg-[#2a2e36] text-[0.6rem] font-bold text-white uppercase">
      {kind.slice(0, 2)}
    </span>
  );
}

function Coin({ currency }: { currency: string }) {
  const mark = currency === "SOL" ? "◎" : currency === "BTC" ? "₿" : currency === "ETH" ? "Ξ" : "₮";
  return <span className="grid size-4 place-items-center rounded-full bg-[#7c3aed] text-[9px] font-bold text-white">{mark}</span>;
}

function Metric({
  label,
  value,
  currency,
  accent,
  icon,
}: {
  label: string;
  value: string;
  currency?: string;
  accent?: boolean;
  icon?: "mult";
}) {
  return (
    <div className="grid gap-1 px-3 py-2.5 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-white/10">
      <p className="text-[0.65rem] text-white/45">{label}</p>
      <p className={cn("flex items-center gap-1.5 text-sm font-semibold tabular-nums", accent ? "text-lime" : "text-white")}>
        {currency ? <Coin currency={currency} /> : null}
        {icon === "mult" ? (
          <span className="grid size-4 place-items-center rounded bg-white/10 text-[9px]">↗</span>
        ) : null}
        {value}
      </p>
    </div>
  );
}

function Field({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[0.65rem] text-white/55">{label}</span>
      <span className="flex h-10 items-center justify-between rounded-lg bg-[#22262e] px-2 text-sm tabular-nums">
        {value}
        {suffix ? <span className="text-white/40">{suffix}</span> : null}
      </span>
    </label>
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
