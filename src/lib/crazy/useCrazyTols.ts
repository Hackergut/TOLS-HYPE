import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  BET_SECONDS,
  SPOTS,
  SPOT_ORDER,
  WHEEL,
  type SpotId,
} from "@/lib/crazy/constants";
import type { CrazyBonusData } from "@/lib/crazy/server-round";
import { loadMute, loadName, loadScores, saveScore, storeName } from "@/lib/crazy/storage";
import { usePausableTimers } from "@/lib/crazy/usePausableTimers";
import { sfx } from "@/lib/crazy/audio";
import { elCenter, fx } from "@/lib/crazy/juice";
import * as api from "@/lib/crazy/api";

export type Phase = "bet" | "topslot" | "spin" | "landed" | "bonus" | "result";
export type Speed = 1 | 2 | "instant";
export type Bets = Record<SpotId, number>;
export type RoundRecord = {
  id: string;
  round: number;
  player: string;
  spot: SpotId;
  bet: number;
  payout: number;
  multiplier: number;
  time: number;
};
export type AutoPlayState = {
  active: boolean;
  remaining: number;
  total: number;
  startBalance: number;
  stopLoss: number;
  takeProfit: number;
};

export type Chip = { value: number; color: string; ring: string; label: string };
export type Denom = {
  code: string;
  chips: Chip[];
  minBet: number;
  fmt: (n: number) => string;
};

/** What the platform server returns for one spin. */
export type SpinOutcome = {
  topSlot: { spot: SpotId; multi: number };
  wheelIndex: number;
  landed: SpotId;
  payouts: Record<SpotId, number>;
  multipliers: Record<SpotId, number>;
  totalPayout: number;
  bonus: CrazyBonusData | null;
  cashhuntToken: string | null;
  balance: number;
};

export const emptyBets = (): Bets =>
  Object.fromEntries(SPOT_ORDER.map((spot) => [spot, 0])) as Bets;
export const sumBets = (bets: Bets) => SPOT_ORDER.reduce((sum, spot) => sum + bets[spot], 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function useCrazyTols({
  blocked,
  autoSpin,
  speed,
  effects,
  wheelRef,
  notice,
  denom,
  walletBalance,
  onSpin,
  onCashHunt,
}: {
  blocked: boolean;
  autoSpin: boolean;
  speed: Speed;
  effects: boolean;
  wheelRef: RefObject<HTMLDivElement | null>;
  notice: (message: string) => void;
  denom: Denom;
  walletBalance: number;
  onSpin: (bets: Bets) => Promise<SpinOutcome>;
  onCashHunt: (token: string, cell: number) => Promise<{ payout: number; multiplier: number; balance: number }>;
}) {
  const [screen, setScreenState] = useState<"start" | "play" | "over">("start");
  const screenRef = useRef(screen);
  const [phase, setPhaseState] = useState<Phase>("bet");
  const phaseRef = useRef(phase);
  const setPhase = useCallback((value: Phase) => {
    phaseRef.current = value;
    setPhaseState(value);
  }, []);
  const setScreen = useCallback((value: typeof screen) => {
    screenRef.current = value;
    setScreenState(value);
  }, []);
  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [muted, setMuted] = useState(loadMute);
  const [name, setNameState] = useState(() => loadName() || "Player");
  const nameRef = useRef(name);
  nameRef.current = name;
  const [scores, setScores] = useState(loadScores);
  const [final, setFinal] = useState<{ balance: number; cashedOut: boolean; stamp: number } | null>(null);
  const [bets, setBetsState] = useState<Bets>(emptyBets);
  const betsRef = useRef(bets);
  const setBets = useCallback((value: Bets) => {
    betsRef.current = value;
    setBetsState(value);
  }, []);
  const lastBets = useRef<Bets>(emptyBets());
  const [chip, setChip] = useState<number>(denom.chips[0]?.value ?? denom.minBet);
  const [selected, setSelected] = useState<SpotId>("cashhunt");
  const [round, setRound] = useState(1);
  const roundRef = useRef(1);
  const [completed, setCompleted] = useState(0);
  const completedRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(BET_SECONDS);
  const [bestMulti, setBestMulti] = useState(0);
  const bestRef = useRef(0);
  const [history, setHistory] = useState<SpotId[]>([]);
  const [records, setRecords] = useState<RoundRecord[]>([]);
  const [topSlot, setTopSlot] = useState<{ spot: SpotId; multi: number } | null>(null);
  const [topRevealed, setTopRevealed] = useState(false);
  const [target, setTarget] = useState(0);
  const [spinToken, setSpinToken] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const winnerRef = useRef<SpotId | null>(null);
  const [lastWin, setLastWin] = useState<{ amount: number; spot: SpotId; multi: number } | null>(null);
  const [autoPlay, setAutoPlayState] = useState<AutoPlayState>({
    active: false,
    remaining: 0,
    total: 0,
    startBalance: 0,
    stopLoss: 0,
    takeProfit: 0,
  });
  const autoPlayRef = useRef(autoPlay);
  const setAutoPlay = useCallback((value: AutoPlayState) => {
    autoPlayRef.current = value;
    setAutoPlayState(value);
  }, []);
  const sessionStarted = useRef(false);
  const settledRound = useRef(-1);
  const spinning = useRef(false);

  // Available table balance: the wallet mirror minus locally reserved stakes.
  const [balance, setBalanceState] = useState(walletBalance);
  const balanceRef = useRef(balance);
  const funds = useCallback((next: number) => {
    const value = round2(next);
    balanceRef.current = value;
    setBalanceState(value);
  }, []);
  const walletRef = useRef(walletBalance);
  walletRef.current = walletBalance;
  // Re-sync the mirror from the platform wallet while nothing is in flight.
  useEffect(() => {
    if (screenRef.current === "over") return;
    if (phaseRef.current === "bet" && sumBets(betsRef.current) === 0 && !spinning.current) {
      funds(walletBalance);
    }
  }, [walletBalance, funds]);

  // Server round currently being animated (top slot, wheel target, payloads).
  const roundServer = useRef<SpinOutcome | null>(null);
  const cashhuntRef = useRef<{ token: string; stake: number } | null>(null);
  const pendingBonus = useRef<{ payout: number; multiplier: number } | null>(null);
  const huntPick = useRef<number | null>(null);

  const totalBet = sumBets(bets);
  const paused = userPaused || blocked || hidden;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const { schedule, cancel, clear } = usePausableTimers(paused);

  useEffect(() => {
    sfx.setMuted(muted);
  }, [muted]);
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    if (balance < chip && balance >= denom.minBet) {
      setChip([...denom.chips].reverse().find((item) => item.value <= balance)?.value ?? denom.minBet);
    }
  }, [balance, chip, denom.chips, denom.minBet]);

  const setName = useCallback((value: string) => {
    const next = value.slice(0, 18);
    setNameState(next);
    nameRef.current = next;
    storeName(next);
  }, []);

  const ensureSession = useCallback(() => {
    if (sessionStarted.current) return;
    api.initSession(nameRef.current.trim() || "Player");
    api.advanceRound();
    api.emitSessionStart(balanceRef.current + sumBets(betsRef.current));
    sessionStarted.current = true;
  }, []);

  const place = useCallback(
    (spot: SpotId, amount = chip) => {
      if (pausedRef.current || phaseRef.current !== "bet" || screenRef.current === "over" || autoPlayRef.current.active) return false;
      const stake = round2(amount);
      if (!Number.isFinite(stake) || stake < denom.minBet) {
        notice(`Minimum bet: ${denom.fmt(denom.minBet)} ${denom.code}.`);
        sfx.deny();
        return false;
      }
      if (stake > balanceRef.current) {
        notice("Not enough balance. Top up from the wallet.");
        sfx.deny();
        return false;
      }
      ensureSession();
      sfx.resume();
      funds(balanceRef.current - stake);
      const next = { ...betsRef.current, [spot]: round2(betsRef.current[spot] + stake) };
      setBets(next);
      setSelected(spot);
      setScreen("play");
      api.emitBetPlaced(spot, stake, sumBets(next));
      sfx.chip();
      if (effects) {
        const center = elCenter(document.getElementById(`spot-${spot}`));
        fx.burst(center.x, center.y, 7, ["#00e8b3", "#ffffff"], { speed: 140, size: 2.5, life: 0.4 });
      }
      return true;
    },
    [chip, denom, effects, ensureSession, funds, notice, setBets, setScreen],
  );

  const clearBets = useCallback(() => {
    if (pausedRef.current || phaseRef.current !== "bet" || !sumBets(betsRef.current) || autoPlayRef.current.active) return;
    const refund = sumBets(betsRef.current);
    funds(balanceRef.current + refund);
    setBets(emptyBets());
    setTimeLeft(BET_SECONDS);
    api.emitBetCleared(refund);
    sfx.click();
  }, [funds, setBets]);

  const repeatBets = useCallback(() => {
    if (pausedRef.current || phaseRef.current !== "bet" || screenRef.current === "over" || autoPlayRef.current.active) return;
    const amount = sumBets(lastBets.current);
    if (!amount) {
      notice("Your previous bet will appear after the first spin.");
      return;
    }
    if (amount > balanceRef.current) {
      notice("Not enough balance to repeat this bet.");
      sfx.deny();
      return;
    }
    ensureSession();
    const next = { ...betsRef.current };
    SPOT_ORDER.forEach((spot) => {
      next[spot] = round2(next[spot] + lastBets.current[spot]);
    });
    funds(balanceRef.current - amount);
    setBets(next);
    setScreen("play");
    api.emitBetRepeated(amount);
    sfx.chip();
  }, [ensureSession, funds, notice, setBets]);

  const launchSpin = useCallback(async () => {
    if (pausedRef.current || phaseRef.current !== "bet" || screenRef.current === "over" || spinning.current) return;
    if (!sumBets(betsRef.current) && !place(selected)) return;
    ensureSession();
    spinning.current = true;
    setPhase("topslot");
    lastBets.current = { ...betsRef.current };
    setWinnerIdx(null);
    winnerRef.current = null;
    setLastWin(null);
    setTopRevealed(false);
    setTopSlot(null);
    roundServer.current = null;
    cashhuntRef.current = null;
    pendingBonus.current = null;
    huntPick.current = null;
    api.emitSpinStart(sumBets(betsRef.current), { ...betsRef.current });
    if (autoPlayRef.current.active) {
      setAutoPlay({ ...autoPlayRef.current, remaining: Math.max(0, autoPlayRef.current.remaining - 1) });
    }
    sfx.slot();
    try {
      const outcome = await onSpin({ ...betsRef.current });
      roundServer.current = outcome;
      funds(outcome.balance);
      setTopSlot(outcome.topSlot);
      if (outcome.cashhuntToken) {
        cashhuntRef.current = { token: outcome.cashhuntToken, stake: betsRef.current[outcome.landed] };
      }
    } catch (cause) {
      spinning.current = false;
      roundServer.current = null;
      // Refund the locally reserved stakes: the server never saw this round.
      funds(walletRef.current);
      setBets(emptyBets());
      setPhase("bet");
      setTopSlot(null);
      notice(cause instanceof Error ? cause.message : "The round could not start.");
      sfx.deny();
      return;
    }
  }, [ensureSession, funds, notice, onSpin, place, selected, setAutoPlay, setBets, setPhase]);

  const stopAutoPlay = useCallback(
    (reason?: string) => {
      if (!autoPlayRef.current.active) return;
      setAutoPlay({ ...autoPlayRef.current, active: false });
      if (reason) notice(reason);
    },
    [notice, setAutoPlay],
  );

  const startAutoPlay = useCallback(
    (rounds: number, stopLoss: number, takeProfit: number) => {
      if (phaseRef.current !== "bet" || userPaused || hidden || screenRef.current === "over") return false;
      if (!Number.isSafeInteger(rounds) || rounds < 2 || rounds > 100) {
        notice("Choose between 2 and 100 automatic spins.");
        return false;
      }
      if (!sumBets(betsRef.current)) {
        notice("Place your bet before starting Auto Play.");
        return false;
      }
      const wager = sumBets(betsRef.current);
      const state = {
        active: true,
        remaining: rounds,
        total: rounds,
        startBalance: balanceRef.current + wager,
        stopLoss: Math.max(0, round2(stopLoss)),
        takeProfit: Math.max(0, round2(takeProfit)),
      };
      setAutoPlay(state);
      setScreen("play");
      notice(`Auto Play ready: ${rounds} spins.`);
      return true;
    },
    [hidden, notice, setAutoPlay, setScreen, userPaused],
  );

  useEffect(() => {
    if (screen !== "play" || phase !== "bet" || paused || !autoSpin || autoPlay.active || totalBet === 0) return;
    const interval = window.setInterval(() => setTimeLeft((value) => Math.max(0, +(value - 0.1).toFixed(1))), 100);
    return () => window.clearInterval(interval);
  }, [screen, phase, paused, autoSpin, autoPlay.active, totalBet]);
  useEffect(() => {
    if (timeLeft === 0 && totalBet > 0 && autoSpin && !autoPlay.active && !paused && phase === "bet") void launchSpin();
  }, [timeLeft, totalBet, autoSpin, autoPlay.active, paused, phase, launchSpin]);

  // Auto Play starts each prepared round after a short, visible breathing space.
  useEffect(() => {
    if (!autoPlay.active || phase !== "bet" || screen !== "play" || totalBet === 0) return;
    const timer = schedule(() => void launchSpin(), 650);
    return () => cancel(timer);
  }, [autoPlay.active, phase, screen, totalBet, schedule, cancel, launchSpin]);

  useEffect(() => {
    if (screen !== "play" || phase !== "topslot") return;
    const factor = speed === "instant" ? 0.2 : 1 / speed;
    const reveal = schedule(() => {
      setTopRevealed(true);
      if (roundServer.current) api.emitTopSlotResult(roundServer.current.topSlot.spot, roundServer.current.topSlot.multi);
      sfx.slot();
    }, 650 * factor);
    const start = schedule(() => {
      setTarget(roundServer.current?.wheelIndex ?? Math.floor(Math.random() * WHEEL.length));
      setSpinToken((value) => value + 1);
      setPhase("spin");
      sfx.whoosh();
    }, 1200 * factor);
    return () => {
      cancel(reveal);
      cancel(start);
    };
  }, [phase, screen, schedule, cancel, setPhase, speed]);

  const settle = useCallback(
    (spot: SpotId, payout: number, multi: number) => {
      if (screenRef.current !== "play" || settledRound.current === roundRef.current) return;
      settledRound.current = roundRef.current;
      spinning.current = false;
      const safe = Number.isFinite(payout) && payout >= 0 ? round2(payout) : 0;
      bestRef.current = Math.max(bestRef.current, multi);
      setBestMulti(bestRef.current);
      completedRef.current += 1;
      setCompleted(completedRef.current);
      setLastWin({ amount: safe, spot, multi });
      const record: RoundRecord = {
        id: `${api.getSessionId()}-${roundRef.current}`,
        round: roundRef.current,
        player: nameRef.current,
        spot,
        bet: sumBets(betsRef.current),
        payout: safe,
        multiplier: multi,
        time: Date.now(),
      };
      setRecords((previous) => [record, ...previous].slice(0, 100));
      api.emitPayout(spot, safe, balanceRef.current);
      setPhase("result");
      if (safe > 0) {
        sfx.win(safe > sumBets(betsRef.current) * 5 ? 4 : 2);
        if (effects) {
          const center = elCenter(wheelRef.current);
          const big = safe >= Math.max(500, sumBets(betsRef.current) * 5);
          fx.float(center.x, center.y - 20, `+${denom.fmt(safe)}`, "#00edb4", big ? 46 : 32);
          fx.burst(center.x, center.y, big ? 65 : 25, ["#00e8b3", "#a47aff", "#e3b840"], { speed: 340, size: 4, life: 0.9 });
          fx.shake(big ? 18 : 7);
          if (big) fx.confettiRain(window.innerWidth, 60, ["#00e8b3", "#a47aff", "#e3b840"]);
        }
      } else sfx.lose();
    },
    [denom, effects, wheelRef],
  );

  const handleLand = useCallback(
    (index: number) => {
      if (phaseRef.current !== "spin" || index < 0 || index >= WHEEL.length) return;
      const spot = WHEEL[index];
      setWinnerIdx(index);
      winnerRef.current = spot;
      setHistory((previous) => [spot, ...previous].slice(0, 16));
      setPhase("landed");
      api.emitSpinResult(index, spot, SPOTS[spot].pays === null);
      if (effects) fx.shake(6);
      sfx.beep(true);
    },
    [effects, setPhase],
  );

  useEffect(() => {
    if (phase !== "landed" || !winnerRef.current) return;
    const spot = winnerRef.current;
    const timer = schedule(() => {
      const outcome = roundServer.current;
      const stake = betsRef.current[spot];
      const pays = SPOTS[spot].pays;
      if (pays === null && stake > 0 && outcome?.bonus) {
        if (outcome.bonus.kind === "cashhunt") {
          pendingBonus.current = null;
        } else {
          pendingBonus.current = {
            payout: outcome.payouts[spot] ?? 0,
            multiplier: outcome.multipliers[spot] ?? 0,
          };
        }
        api.emitBonusStart(spot, stake, 1);
        setPhase("bonus");
      } else {
        settle(spot, outcome?.payouts[spot] ?? 0, outcome?.multipliers[spot] ?? 0);
      }
    }, speed === "instant" ? 100 : 450);
    return () => cancel(timer);
  }, [phase, schedule, cancel, settle, setPhase, speed]);

  const finishBonus = useCallback(
    (multi: number, cell?: number) => {
      const spot = winnerRef.current;
      if (phaseRef.current !== "bonus" || !spot) return;
      const held = cashhuntRef.current;
      if (held && cell != null) {
        huntPick.current = cell;
        void onCashHunt(held.token, cell).then((result) => {
          cashhuntRef.current = null;
          funds(result.balance);
          settle(spot, result.payout, result.multiplier);
        }).catch((cause) => {
          cashhuntRef.current = null;
          notice(cause instanceof Error ? cause.message : "Cash Hunt could not settle.");
          settle(spot, 0, 0);
        });
        return;
      }
      const pending = pendingBonus.current;
      settle(spot, pending?.payout ?? 0, pending?.multiplier ?? multi);
    },
    [funds, notice, onCashHunt, settle],
  );

  const endRun = useCallback(
    (cashedOut: boolean) => {
      if (screenRef.current !== "play" || !["bet", "result"].includes(phaseRef.current)) return;
      clear();
      const refund = phaseRef.current === "bet" ? sumBets(betsRef.current) : 0;
      const finalBalance = round2(balanceRef.current + refund);
      if (refund) api.emitBetCleared(refund);
      funds(finalBalance);
      setBets(emptyBets());
      const entry = {
        name: nameRef.current || "Player",
        score: finalBalance,
        rounds: completedRef.current,
        best: bestRef.current,
        cashedOut,
        date: Date.now(),
      };
      setScores(saveScore(entry));
      setFinal({ balance: finalBalance, cashedOut, stamp: entry.date });
      if (cashedOut) api.emitCashOut(finalBalance);
      else api.emitBust(finalBalance);
      api.emitSessionEnd(finalBalance, entry.rounds, entry.best, cashedOut);
      setScreen("over");
      setUserPaused(false);
      setAutoPlay({ ...autoPlayRef.current, active: false, remaining: 0 });
      if (cashedOut) sfx.win(3);
      else sfx.lose();
    },
    [clear, funds, setAutoPlay, setBets, setScreen],
  );

  const nextRound = useCallback(() => {
    if (phaseRef.current !== "result" || screenRef.current !== "play") return;
    if (balanceRef.current < denom.minBet) {
      endRun(false);
      return;
    }
    if (autoPlayRef.current.active) {
      const next = { ...lastBets.current };
      const wager = sumBets(next);
      if (!wager || wager > balanceRef.current) {
        stopAutoPlay("Auto Play stopped: not enough balance for the next bet.");
        setBets(emptyBets());
      } else {
        funds(balanceRef.current - wager);
        setBets(next);
        api.emitBetRepeated(wager);
      }
    } else setBets(emptyBets());
    roundRef.current += 1;
    setRound(roundRef.current);
    api.advanceRound();
    setWinnerIdx(null);
    setTopSlot(null);
    setTopRevealed(false);
    setLastWin(null);
    setTimeLeft(BET_SECONDS);
    setPhase("bet");
  }, [denom.minBet, endRun, funds, setBets, setPhase, stopAutoPlay]);

  useEffect(() => {
    if (phase !== "result" || screen !== "play") return;
    if (autoPlay.active) {
      const state = autoPlay;
      const loss = Math.max(0, state.startBalance - balance);
      const profit = Math.max(0, balance - state.startBalance);
      if (state.remaining <= 0) stopAutoPlay("Auto Play complete.");
      else if (state.stopLoss > 0 && loss >= state.stopLoss) stopAutoPlay(`Auto Play stopped at your ${denom.fmt(state.stopLoss)} ${denom.code} loss limit.`);
      else if (state.takeProfit > 0 && profit >= state.takeProfit) stopAutoPlay(`Auto Play stopped at your ${denom.fmt(state.takeProfit)} ${denom.code} profit target.`);
    }
    const timer = schedule(nextRound, speed === "instant" ? 700 : 2200);
    return () => cancel(timer);
  }, [phase, screen, balance, autoPlay, denom, schedule, cancel, nextRound, stopAutoPlay, speed]);

  const restart = useCallback(() => {
    clear();
    if (sessionStarted.current && screenRef.current !== "over") {
      const refundable = phaseRef.current === "bet" ? sumBets(betsRef.current) : 0;
      if (refundable) api.emitBetCleared(refundable);
      api.emitSessionEnd(balanceRef.current + refundable, completedRef.current, bestRef.current, false);
    }
    spinning.current = false;
    setGeneration((value) => value + 1);
    setSpinToken(0);
    setBets(emptyBets());
    lastBets.current = emptyBets();
    funds(walletRef.current);
    roundRef.current = 1;
    completedRef.current = 0;
    bestRef.current = 0;
    sessionStarted.current = false;
    settledRound.current = -1;
    winnerRef.current = null;
    roundServer.current = null;
    cashhuntRef.current = null;
    pendingBonus.current = null;
    setAutoPlay({ active: false, remaining: 0, total: 0, startBalance: 0, stopLoss: 0, takeProfit: 0 });
    setRound(1);
    setCompleted(0);
    setBestMulti(0);
    setRecords([]);
    setHistory([]);
    setWinnerIdx(null);
    setLastWin(null);
    setTopSlot(null);
    setTopRevealed(false);
    setFinal(null);
    setTimeLeft(BET_SECONDS);
    setPhase("bet");
    setScreen("start");
    setUserPaused(false);
    fx.clear();
    sfx.click();
  }, [clear, funds, setAutoPlay, setBets, setPhase, setScreen]);

  return {
    balance,
    screen,
    phase,
    paused,
    userPaused,
    setUserPaused,
    muted,
    setMuted,
    name,
    setName,
    scores,
    final,
    bets,
    totalBet,
    chip,
    setChip,
    selected,
    setSelected,
    round,
    completed,
    timeLeft,
    history,
    records,
    bestMulti,
    topSlot,
    topRevealed,
    autoPlay,
    target,
    spinToken,
    generation,
    winnerIdx,
    winner: winnerIdx === null ? null : WHEEL[winnerIdx],
    bonus: roundServer.current?.bonus ?? null,
    lastWin,
    duration: speed === "instant" ? 450 : 4300 / speed,
    canBet: phase === "bet" && !paused && screen !== "over" && !autoPlay.active,
    canCashOut: screen === "play" && (phase === "bet" || phase === "result"),
    denom,
    place,
    clearBets,
    repeatBets,
    launchSpin,
    handleLand,
    finishBonus,
    nextRound,
    restart,
    startAutoPlay,
    stopAutoPlay,
    cashOut: () => endRun(true),
    ensureSession,
  };
}

export type CrazyTolsGame = ReturnType<typeof useCrazyTols>;
