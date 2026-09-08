import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  RiBarChartBoxLine,
  RiRefreshLine,
  RiSettings3Line,
  RiStarFill,
  RiStarLine,
  RiVolumeMuteLine,
  RiVolumeUpLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AdvancedSettings } from "@/components/games/advanced-settings";
import { getGame } from "@/lib/games-catalog";
import { isFavorite, loadAnimOn, loadSoundOn, saveAnimOn, saveSoundOn, toggleFavorite } from "@/lib/game-prefs";
import { playSfx } from "@/lib/game-sound";
import { newBetId, recordBet, useBetHistory } from "@/lib/bet-history";
import { saveBetRound } from "@/lib/bet-history.server";
import { getFairState } from "@/lib/fair.server";
import { analyzeRounds, type RoundAnalysis, type RoundSnap } from "@/lib/round-stats";
import { useWallet } from "@/lib/wallet-context";
import { cn } from "cn";

export type { RoundSnap };

type TableCtx = {
  gameId: string;
  rewindNonce: number;
  last: RoundSnap | null;
  rounds: import("@/lib/bet-history").BetRound[];
  analysis: RoundAnalysis;
  reportRound: (snap: RoundSnap) => void;
  rewind: () => void;
};

const Ctx = createContext<TableCtx | null>(null);

export function GameTableProvider({ gameId, children }: { gameId: string; children: ReactNode }) {
  const [rewindNonce, setRewindNonce] = useState(0);
  const [last, setLast] = useState<RoundSnap | null>(null);
  const rounds = useBetHistory(gameId);
  const { currency } = useWallet();

  useEffect(() => {
    setLast(null);
  }, [gameId]);

  const reportRound = useCallback(
    (snap: RoundSnap) => {
      setLast(snap);
      playSfx(snap.win ? "win" : "lose");
      const game = getGame(gameId);
      const persist = (fair: typeof snap.fair) => {
        const round = {
          id: newBetId(),
          gameId,
          title: game?.title ?? gameId,
          kind: game?.kind ?? "dice",
          win: snap.win,
          label: snap.label,
          stake: snap.stake ?? 0,
          payout: snap.payout ?? 0,
          multiplier: snap.multiplier ?? 0,
          currency: currency,
          fair: fair ?? null,
          view: snap.view ?? null,
          at: Date.now(),
        };
        recordBet(round);
        void saveBetRound({
          data: {
            ...round,
            fair: round.fair,
            view: round.view,
          },
        }).catch(() => undefined);
      };
      if (snap.fair) persist(snap.fair);
      else {
        void getFairState()
          .then((s) => persist({ serverHash: s.serverHash, clientSeed: s.clientSeed, nonce: Math.max(0, s.nonce - 1) }))
          .catch(() => persist(null));
      }
    },
    [gameId, currency],
  );

  const rewind = useCallback(() => {
    setLast((cur) => {
      if (!cur) {
        toast.message("Place a bet first");
        return cur;
      }
      cur.replay?.();
      playSfx(cur.win ? "win" : "lose");
      toast.message(`Replay · ${cur.label}`);
      return cur;
    });
    setRewindNonce((n) => n + 1);
  }, []);

  const analysis = useMemo(() => analyzeRounds(rounds), [rounds]);

  const value = useMemo(
    () => ({ gameId, rewindNonce, last, rounds, analysis, reportRound, rewind }),
    [gameId, rewindNonce, last, rounds, analysis, reportRound, rewind],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGameTable() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGameTable must be used within GameTableProvider");
  return ctx;
}

export function useGameTableOptional() {
  return useContext(Ctx);
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function GameToolbar() {
  const table = useGameTableOptional();
  const gameId = table?.gameId ?? "";
  const [fav, setFav] = useState(false);
  const [sound, setSound] = useState(loadSoundOn);
  const [anim, setAnim] = useState(loadAnimOn);

  useEffect(() => {
    setFav(gameId ? isFavorite(gameId) : false);
  }, [gameId]);

  function onFav() {
    if (!gameId) return;
    const next = toggleFavorite(gameId);
    setFav(next);
    playSfx("star");
    toast.success(next ? "Added to favorites" : "Removed from favorites");
  }

  function onSound() {
    const next = !sound;
    saveSoundOn(next);
    setSound(next);
    if (next) playSfx("click");
    toast.message(next ? "Sound on" : "Sound off");
  }

  const a = table?.analysis;

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Settings">
            <RiSettings3Line className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="max-h-[min(72vh,36rem)] w-72 gap-3 overflow-y-auto p-3">
          <p className="font-heading text-sm font-semibold">Table settings</p>
          <label className="flex items-center justify-between text-sm">
            Animations
            <input
              type="checkbox"
              checked={anim}
              onChange={(e) => {
                saveAnimOn(e.target.checked);
                setAnim(e.target.checked);
              }}
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            Sound
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => {
                const on = e.target.checked;
                saveSoundOn(on);
                setSound(on);
                if (on) playSfx("click");
              }}
            />
          </label>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => table?.rewind() ?? toast.message("Place a bet first")}
          >
            <RiRefreshLine className="size-4" />
            Refresh last round
          </Button>
          <Link to="/fairness" className="text-sm text-primary hover:underline">
            Provably Fair
          </Link>
          <AdvancedSettings rtp={getGame(gameId)?.rtp} />
        </PopoverContent>
      </Popover>
      <button
        type="button"
        className={cn("grid size-8 place-items-center rounded-md hover:bg-muted", fav ? "text-lime" : "text-muted-foreground hover:text-foreground")}
        aria-label={fav ? "Unfavorite" : "Favorite"}
        aria-pressed={fav}
        onClick={onFav}
      >
        {fav ? <RiStarFill className="size-4" /> : <RiStarLine className="size-4" />}
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Statistics"
          >
            <RiBarChartBoxLine className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 gap-3 p-3">
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm font-semibold">Round analysis</p>
            {a && a.plays > 0 ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase",
                  a.heat === "hot" && "bg-lime/15 text-lime",
                  a.heat === "cold" && "bg-destructive/15 text-destructive",
                  a.heat === "even" && "bg-muted text-muted-foreground",
                )}
              >
                {a.heat}
              </span>
            ) : null}
          </div>
          {!a || a.plays === 0 ? (
            <p className="text-sm text-muted-foreground">Place a bet to start the sample.</p>
          ) : (
            <>
              <div className="flex gap-0.5">
                {a.recent.slice(0, 20).reverse().map((r, i) => (
                  <span
                    key={`${r.at}-${i}`}
                    title={r.label}
                    className={cn("h-4 flex-1 rounded-sm", r.win ? "bg-lime" : "bg-muted-foreground/30")}
                  />
                ))}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <Stat k="Rounds" v={String(a.plays)} />
                <Stat k="Wins" v={`${a.wins} / ${a.losses}L`} />
                <Stat k="Win rate" v={`${a.winRate}%`} />
                <Stat k="Last 10" v={`${a.last10Rate}%`} />
                <Stat k="Streak" v={a.streakKind === "-" ? "—" : `${a.streakKind}${a.streak}`} />
                <Stat k="Best run" v={`${a.bestWinStreak}W`} />
                <Stat k="Wagered" v={fmt(a.volume)} />
                <Stat k="Returned" v={fmt(a.returned)} />
                <Stat k="Net" v={`${a.net >= 0 ? "+" : ""}${fmt(a.net)}`} accent={a.net >= 0} />
                <Stat k="Best ×" v={a.bestMult ? `${a.bestMult.toFixed(2)}×` : "—"} />
              </dl>
              <p className="truncate text-xs text-muted-foreground">Last · {a.lastLabel}</p>
            </>
          )}
        </PopoverContent>
      </Popover>
      <button
        type="button"
        className={cn("grid size-8 place-items-center rounded-md hover:bg-muted", sound ? "text-foreground" : "text-muted-foreground")}
        aria-label={sound ? "Mute" : "Unmute"}
        aria-pressed={sound}
        onClick={onSound}
      >
        {sound ? <RiVolumeUpLine className="size-4" /> : <RiVolumeMuteLine className="size-4" />}
      </button>
    </div>
  );
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn("tabular-nums", accent && "text-lime")}>{v}</dd>
    </div>
  );
}
