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
import { LiveRaceStats } from "@/components/promos/live-race-stats";
import { SpeedPills } from "@/components/games/speed-pills";
import { getGame } from "@/lib/games-catalog";
import { isFavorite, loadAnimOn, loadSoundOn, saveAnimOn, saveSoundOn, toggleFavorite } from "@/lib/game-prefs";
import { playSfx } from "@/lib/game-sound";
import { newBetId, recordBet, useBetHistory } from "@/lib/bet-history";
import { saveBetRound } from "@/lib/bet-history-api";
import { getFairState } from "@/lib/fair-api";
import { analyzeRounds, type RoundAnalysis, type RoundSnap } from "@/lib/round-stats";
import { useWallet } from "@/lib/wallet-context";
import { cn } from "cn";

export type { RoundSnap };

type TableCtx = {
  gameId: string;
  rewindNonce: number;
  last: RoundSnap | null;
  playNonce: number;
  rounds: import("@/lib/bet-history").BetRound[];
  analysis: RoundAnalysis;
  reportRound: (snap: RoundSnap) => void;
  notePlay: () => void;
  rewind: () => void;
};

const Ctx = createContext<TableCtx | null>(null);

export function GameTableProvider({ gameId, children }: { gameId: string; children: ReactNode }) {
  const [rewindNonce, setRewindNonce] = useState(0);
  const [last, setLast] = useState<RoundSnap | null>(null);
  const [playNonce, setPlayNonce] = useState(0);
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

  const notePlay = useCallback(() => setPlayNonce((n) => n + 1), []);

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
    () => ({ gameId, rewindNonce, last, playNonce, rounds, analysis, reportRound, notePlay, rewind }),
    [gameId, rewindNonce, last, playNonce, rounds, analysis, reportRound, notePlay, rewind],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const EMPTY_ANALYSIS: RoundAnalysis = {
  plays: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  last10Rate: 0,
  streakKind: "-",
  streak: 0,
  bestWinStreak: 0,
  volume: 0,
  returned: 0,
  net: 0,
  bestMult: 0,
  biggestWin: 0,
  lastLabel: null,
  heat: "even",
  recent: [],
};

const NO_TABLE: TableCtx = {
  gameId: "",
  rewindNonce: 0,
  last: null,
  playNonce: 0,
  rounds: [],
  analysis: EMPTY_ANALYSIS,
  reportRound: () => undefined,
  notePlay: () => undefined,
  rewind: () => undefined,
};

export function useGameTable() {
  return useContext(Ctx) ?? NO_TABLE;
}

export function useGameTableOptional() {
  return useContext(Ctx);
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

  const [stats, setStats] = useState(false);

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
          <div className="flex items-center justify-between text-sm">
            Speed
            <SpeedPills />
          </div>
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
      <button
        type="button"
        className={cn(
          "grid size-8 place-items-center rounded-md hover:bg-muted",
          stats ? "bg-lime text-black" : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Statistics"
        aria-pressed={stats}
        onClick={() => setStats((v) => !v)}
      >
        <RiBarChartBoxLine className="size-4" />
      </button>
      <LiveRaceStats open={stats} onClose={() => setStats(false)} />
      <SpeedPills />
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
