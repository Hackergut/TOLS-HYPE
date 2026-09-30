import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RiRefreshLine } from "@remixicon/react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { formatMoney } from "@/lib/format";
import { CURRENCY_META } from "@/lib/games-catalog";
import { DiceTrack } from "@/components/games/dice-track";
import { DiceTrends } from "@/components/games/dice-trends";
import { useBetHistory } from "@/lib/bet-history";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { ORIGINALS_RTP, payoutFromChance } from "@/lib/originals";
import { cn } from "cn";

const MIN_CHANCE = 1;
const MAX_CHANCE = 98;
const AUTO_CAP = 100;
type StepMode = "reset" | "increase";
type StrategyId = "martingale" | "delayed-martingale" | "paroli" | "dalembert";
type Condition = { on: "win" | "loss"; action: "reset" | "increase" | "decrease"; percent: number };

const STRATEGIES: { id: StrategyId; label: string }[] = [
  { id: "martingale", label: "Martingale" },
  { id: "delayed-martingale", label: "Delayed Martingale" },
  { id: "paroli", label: "Paroli" },
  { id: "dalembert", label: "D'Alembert" },
];

function presetConditions(id: StrategyId): Condition[] {
  if (id === "paroli") {
    return [
      { on: "win", action: "increase", percent: 100 },
      { on: "loss", action: "reset", percent: 0 },
    ];
  }
  if (id === "dalembert") {
    return [
      { on: "loss", action: "increase", percent: 100 },
      { on: "win", action: "decrease", percent: 100 },
    ];
  }
  if (id === "delayed-martingale") {
    return [
      { on: "loss", action: "reset", percent: 0 },
      { on: "loss", action: "increase", percent: 100 },
      { on: "win", action: "reset", percent: 0 },
    ];
  }
  return [
    { on: "loss", action: "increase", percent: 100 },
    { on: "win", action: "reset", percent: 0 },
  ];
}

function nextStrategyBet(
  bet: number,
  base: number,
  win: boolean,
  lossStreak: number,
  strategy: StrategyId,
  conditions: Condition[],
  maxBet: number,
) {
  if (strategy === "dalembert") {
    const unit = Math.max(base, 0);
    return win ? Math.max(unit, bet - unit) : Math.min(maxBet, bet + unit);
  }
  if (strategy === "martingale") {
    return win ? base : Math.min(maxBet, bet * 2);
  }
  if (strategy === "delayed-martingale") {
    if (win) return base;
    return lossStreak >= 1 ? Math.min(maxBet, bet * 2) : bet;
  }
  const matches = conditions.filter((step) => step.on === (win ? "win" : "loss"));
  const step = matches[Math.min(win ? 0 : lossStreak, Math.max(0, matches.length - 1))];
  if (!step || step.action === "reset") return base;
  const sign = step.action === "decrease" ? -1 : 1;
  const next = bet * (1 + (sign * Math.max(0, step.percent)) / 100);
  return Math.min(maxBet, Math.max(0, next));
}

type AutoValue = {
  onWinMode: StepMode;
  onWinInc: number;
  onLossMode: StepMode;
  onLossInc: number;
  stopProfit: number;
  stopLoss: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function chanceFromTarget(target: number, over: boolean) {
  return clamp(over ? 100 - target : target, MIN_CHANCE, MAX_CHANCE);
}

function multiplierFromChance(chance: number) {
  return payoutFromChance(chance);
}

export function DiceGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <DiceTable gameId={gameId} />
    </PlayGate>
  );
}

function DiceTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const history = useBetHistory(gameId);
  const meta = CURRENCY_META[currency];
  const [over, setOver] = useState(false);
  const [target, setTarget] = useState(49.5);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [tab, setTab] = useState("manual");
  const [autoN, setAutoN] = useState(0);
  const [onWinInc, setOnWinInc] = useState(0);
  const [onLossInc, setOnLossInc] = useState(0);
  const [onWinMode, setOnWinMode] = useState<StepMode>("reset");
  const [onLossMode, setOnLossMode] = useState<StepMode>("reset");
  const [stopProfit, setStopProfit] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);
  const [autoOpen, setAutoOpen] = useState(false);
  const [strategy, setStrategy] = useState<StrategyId>("martingale");
  const [conditions, setConditions] = useState<Condition[]>(() => presetConditions("martingale"));
  const [condOpen, setCondOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [autoPlayed, setAutoPlayed] = useState(0);
  const [autoStaked, setAutoStaked] = useState(0);
  const stopRef = useRef(false);

  const chance = chanceFromTarget(target, over);
  const multiplier = multiplierFromChance(chance);
  const profit = amount * (multiplier - 1);

  function setChance(next: number) {
    const c = clamp(next, MIN_CHANCE, MAX_CHANCE);
    setTarget(over ? 100 - c : c);
  }

  function setMultiplier(next: number) {
    if (!Number.isFinite(next) || next <= 1) return;
    setChance(clamp((ORIGINALS_RTP * 100) / next, MIN_CHANCE, MAX_CHANCE));
  }

  function wonRoll(roll: number) {
    return over ? roll >= target : roll < target;
  }

  async function playOnce(bet: number, quiet = false): Promise<{ win: boolean; payout: number }> {
    const res = await playInstant({
      data: {
        gameId,
        currency,
        amount: bet,
        choice: over ? "over" : "under",
        target,
      },
    });
    applyBalances(res.balances);
    const roll = Number(res.detail.roll);
    const win = wonRoll(roll);
    if (!quiet) {
      const step = speedDelay("step");
      if (step > 0) {
        const n = step > 40 ? 8 : 4;
        for (let i = 0; i < n; i += 1) {
          setLast(Math.random() * 100);
          setLastWin(null);
          playSfx("tick");
          await sleep(step);
        }
      }
    }
    setLast(roll);
    setLastWin(win);
    playSfx(win ? "win" : "lose");
    reportRound({
      win,
      label: `${roll.toFixed(2)} · ${win ? "hit" : "miss"}`,
      stake: bet,
      payout: res.payout,
      multiplier: win ? multiplier : 0,
      fair: res.fair,
      view: { kind: "dice", roll, over, target },
      replay: () => {
        setLast(roll);
        setLastWin(win);
      },
    });
    if (!quiet) {
      if (res.payout > 0) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
      else toast.message("Missed");
    }
    return { win, payout: res.payout };
  }

  async function onBet() {
    if (running) {
      stopRef.current = true;
      return;
    }
    setBusy(true);
    stopRef.current = false;
    if (tab !== "manual") {
      setRunning(true);
      setAutoPlayed(0);
      setAutoStaked(0);
    }
    try {
      if (tab === "manual") {
        await playOnce(amount);
        return;
      }
      const infinite = autoN <= 0;
      const n = infinite ? AUTO_CAP : Math.min(autoN, AUTO_CAP);
      let bet = amount;
      let pnl = 0;
      let lossStreak = 0;
      let played = 0;
      for (let i = 0; i < n; i += 1) {
        if (stopRef.current) break;
        played += 1;
        const { win, payout } = await playOnce(bet, true);
        setAutoPlayed(played);
        setAutoStaked((sum) => sum + bet);
        pnl += payout - bet;
        if (stopProfit > 0 && pnl >= stopProfit) break;
        if (stopLoss > 0 && pnl <= -stopLoss) break;
        if (tab === "advanced") {
          bet = nextStrategyBet(bet, amount, win, lossStreak, strategy, conditions, meta.maxBet);
          lossStreak = win ? 0 : lossStreak + 1;
        } else if (win) {
          bet = onWinMode === "increase" ? Math.min(meta.maxBet, bet * (1 + Math.max(0, onWinInc) / 100)) : amount;
        } else {
          bet = onLossMode === "increase" ? Math.min(meta.maxBet, bet * (1 + Math.max(0, onLossInc) / 100)) : amount;
        }
        const gap = speedDelay("step");
        if (gap > 0 && !stopRef.current) await sleep(gap);
      }
      if (!stopRef.current && infinite && played >= AUTO_CAP) toast.message("Autobet stopped at 100");
      else toast.message(`${played} bets · ${formatMoney(pnl, currency)} ${currency}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      stopRef.current = false;
      setRunning(false);
      setBusy(false);
    }
  }

  return (
    <GameShell
      controls={
        <div className="flex flex-col gap-6">
          <div className="flex gap-1 rounded-md bg-[#202329] p-1.5">
            {(
              [
                ["manual", "Manual"],
                ["auto", "Auto"],
                ["advanced", "Advanced"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "h-9 flex-1 rounded-md text-sm font-medium",
                  tab === id ? "bg-[#343843] text-white" : "text-[#bec6d1]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "manual" ? (
            <div className="grid gap-4">
              <StakeField amount={amount} setAmount={setAmount} />
              <FieldLabel label="Profit" hint={`${formatMoney(profit, currency)} ${currency}`}>
                <Input readOnly value={profit.toFixed(8)} className="h-12 rounded-md border-transparent bg-[#202329] tabular-nums shadow-none" />
              </FieldLabel>
            </div>
          ) : (
            <div className="grid gap-4">
              <StakeField amount={amount} setAmount={setAmount} />
              <label className="grid gap-1">
                <span className="text-xs font-medium">Number of bets</span>
                <span className="relative">
                  <Input
                    type="number"
                    min={0}
                    value={autoN}
                    onChange={(e) => setAutoN(Math.max(0, Number(e.target.value)))}
                    className="h-12 rounded-md border-transparent bg-[#202329] pr-14 text-sm text-[#828998] tabular-nums shadow-none"
                  />
                  <button
                    type="button"
                    aria-label="Infinite bets"
                    onClick={() => setAutoN(0)}
                    className={cn(
                      "absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md bg-[#2a2e38] text-sm",
                      autoN === 0 && "ring-1 ring-white",
                    )}
                  >
                    ∞
                  </button>
                </span>
              </label>
              {tab === "auto" ? (
                <div className="grid gap-1">
                  <span className="text-xs font-medium">Strategy</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={running}
                      onClick={() => {
                        setOnWinMode("reset");
                        setOnWinInc(0);
                        setOnLossMode("reset");
                        setOnLossInc(0);
                      }}
                      className={cn(
                        "h-12 rounded-md text-sm font-medium",
                        onLossMode !== "increase" ? "bg-[#343843] text-white" : "bg-[#202329] text-[#bec6d1]",
                      )}
                    >
                      Flat
                    </button>
                    <button
                      type="button"
                      disabled={running}
                      onClick={() => {
                        setOnWinMode("reset");
                        setOnWinInc(0);
                        setOnLossMode("increase");
                        setOnLossInc(100);
                      }}
                      className={cn(
                        "h-12 rounded-md text-sm font-medium",
                        onLossMode === "increase" && onLossInc === 100 && onWinMode === "reset"
                          ? "bg-lime text-black"
                          : "bg-[#202329] text-[#bec6d1]",
                      )}
                    >
                      Martingale
                    </button>
                  </div>
                </div>
              ) : null}
              {tab === "auto" && running ? (
                <div className="flex h-12 items-center justify-between rounded-md bg-[#202329] px-4 text-sm">
                  <span>Bets: {autoPlayed}</span>
                  <span className="tabular-nums">
                    {formatMoney(autoStaked, currency)} {currency}
                  </span>
                </div>
              ) : null}
              {tab === "auto" && showBoard ? (
                <div className="max-h-64 overflow-auto rounded-lg border border-[#2a2e38]">
                  <table className="w-full text-sm font-medium">
                    <tbody>
                      {history.length === 0 ? (
                        <tr className="h-9 bg-[#080808]">
                          <td className="px-4 text-[#bec6d1]">No bets yet</td>
                        </tr>
                      ) : (
                        history.slice(0, 12).map((round) => (
                          <tr key={round.id} className="h-9 bg-[#080808]">
                            <td className="border-b border-[#2a2e38] px-4 text-[#bec6d1]">
                              <span className="inline-flex items-center gap-2">
                                <span className="size-4 rounded-full bg-[#cd7f32]" />
                                you
                              </span>
                            </td>
                            <td className="border-b border-[#2a2e38] px-4 text-right tabular-nums">
                              {formatMoney(round.stake, currency)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {tab === "auto" ? (
                <div className="rounded-lg border border-[#2a2e38] p-4">
                  <div className="flex">
                    <SideStat label="On win" value={onWinMode === "reset" ? "-" : `${onWinInc}%`} />
                    <SideStat label="On loss" value={onLossMode === "reset" ? "-" : `${onLossInc}%`} />
                  </div>
                  <hr className="my-2 border-[#2a2e38]" />
                  <div className="flex">
                    <SideStat label="Stop on profit" value={stopProfit.toFixed(2)} mark={currency.slice(0, 1)} />
                    <SideStat label="Stop on loss" value={stopLoss.toFixed(2)} mark={currency.slice(0, 1)} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-1">
                    <span className="flex items-center justify-between text-xs font-medium">
                      Strategy
                      <button
                        type="button"
                        className="text-lime"
                        onClick={() => {
                          setConditions([{ on: "loss", action: "increase", percent: 100 }]);
                          setCondOpen(true);
                        }}
                      >
                        Create strategy
                      </button>
                    </span>
                    <span className="relative">
                      <select
                        aria-label="Strategy"
                        value={strategy}
                        onChange={(e) => {
                          const next = e.target.value as StrategyId;
                          setStrategy(next);
                          setConditions(presetConditions(next));
                        }}
                        className="h-12 w-full appearance-none rounded-md bg-[#202329] px-4 pr-10 text-sm"
                      >
                        {STRATEGIES.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-white/70">▾</span>
                    </span>
                  </div>
                  <div className="grid gap-1">
                    <span className="flex items-center justify-between text-xs font-medium">
                      Conditions
                      <button type="button" className="text-lime" onClick={() => setCondOpen(true)}>
                        Edit
                      </button>
                    </span>
                    <div className="grid grid-cols-5 gap-2">
                      {conditions.map((step, index) => (
                        <button
                          key={`${step.on}-${index}`}
                          type="button"
                          onClick={() => setCondOpen(true)}
                          className="h-12 rounded-md bg-[#202329] text-sm"
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid gap-4">
            {tab === "auto" ? (
              <button
                type="button"
                role="switch"
                aria-checked={showBoard}
                onClick={() => setShowBoard((on) => !on)}
                className="flex flex-row-reverse items-center justify-end gap-2.5 rounded-lg border border-[#2a2e38] p-2.5"
              >
                <span className={cn("relative h-6 w-[42px] rounded-full", showBoard ? "bg-lime" : "bg-[#2a2e38]")}>
                  <span
                    className={cn(
                      "absolute top-[5px] size-3.5 rounded-full bg-white transition-transform",
                      showBoard ? "translate-x-5" : "translate-x-1",
                    )}
                  />
                </span>
                <span className="flex-1 text-left text-sm">Show leaderboard</span>
              </button>
            ) : null}
            {tab === "auto" ? (
              <button
                type="button"
                onClick={() => setAutoOpen(true)}
                className="flex h-[54px] w-full items-center justify-center rounded-md border border-white text-sm font-medium"
              >
                Configure auto
              </button>
            ) : null}
            <button
              type="button"
              disabled={running ? false : busy}
              onClick={() => void onBet()}
              className="flex h-[54px] w-full items-center justify-center rounded-md bg-lime text-sm font-medium text-black disabled:opacity-60"
            >
              {tab === "manual" ? "Bet" : running ? "Stop Autobet" : "Start Autobet"}
            </button>
          </div>

          <AutoConfig
            open={autoOpen}
            onOpenChange={setAutoOpen}
            currency={currency}
            value={{ onWinMode, onWinInc, onLossMode, onLossInc, stopProfit, stopLoss }}
            onApply={(next) => {
              setOnWinMode(next.onWinMode);
              setOnWinInc(next.onWinInc);
              setOnLossMode(next.onLossMode);
              setOnLossInc(next.onLossInc);
              setStopProfit(next.stopProfit);
              setStopLoss(next.stopLoss);
            }}
          />
          <ConditionEditor open={condOpen} onOpenChange={setCondOpen} conditions={conditions} onApply={setConditions} />
        </div>
      }
      play={
        <div className="relative flex min-h-[380px] flex-col justify-between px-1 py-2 md:px-4">
          <div className="flex min-h-[30px] items-center">
            <button
              type="button"
              onClick={() => setTrendsOpen(true)}
              className="shrink-0 rounded-md border border-lime px-2 text-xs font-medium text-lime"
            >
              Trends
            </button>
          </div>
          <DiceTrends
            open={trendsOpen}
            onClose={() => setTrendsOpen(false)}
            rolls={history.flatMap((round) => {
              if (round.view?.kind !== "dice") return [];
              return [{ id: round.id, roll: round.view.roll, win: round.win, mult: round.multiplier }];
            })}
          />
          <div className="px-1 py-6 md:px-6">
            <DiceTrack target={target} over={over} roll={last} rollWin={lastWin} onTarget={setTarget} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MiniField label="Multiplier" value={multiplier.toFixed(4)} onChange={(v) => setMultiplier(Number(v))} />
            <MiniField
              label={over ? "Roll Over" : "Roll Under"}
              value={target.toFixed(2)}
              onChange={(v) => setTarget(clamp(Number(v), 2, 98))}
              action={() => setOver((o) => !o)}
            />
            <MiniField label="Chance" value={chance.toFixed(4)} suffix="%" onChange={(v) => setChance(Number(v))} />
          </div>
        </div>
      }
    />
  );
}

function SideStat({ label, value, mark }: { label: string; value: string; mark?: string }) {
  return (
    <div className="grid w-1/2 gap-1.5">
      <p className="text-xs text-[#bec6d1]">{label}</p>
      <p className="flex items-center gap-2 text-sm">
        {mark ? (
          <span className="grid size-4 place-items-center rounded-full bg-lime text-[8px] font-bold text-black">{mark}</span>
        ) : null}
        {value}
      </p>
    </div>
  );
}

function ConditionEditor({
  open,
  onOpenChange,
  conditions,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conditions: Condition[];
  onApply: (next: Condition[]) => void;
}) {
  const [draft, setDraft] = useState(conditions);
  useEffect(() => {
    if (open) setDraft(conditions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function patch(index: number, partial: Partial<Condition>) {
    setDraft((cur) => cur.map((step, i) => (i === index ? { ...step, ...partial } : step)));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 bg-[#121418] p-8 sm:max-w-[32rem]">
        <DialogTitle className="text-center text-[22px] font-bold">Conditions</DialogTitle>
        <div className="grid max-h-[24rem] gap-3 overflow-y-auto">
          {draft.map((step, index) => (
            <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
              <span className="grid size-8 place-items-center rounded-md bg-[#202329] text-sm">{index + 1}</span>
              <select
                value={step.on}
                onChange={(e) => patch(index, { on: e.target.value as Condition["on"] })}
                className="h-12 rounded-md bg-[#202329] px-2 text-sm"
              >
                <option value="win">On win</option>
                <option value="loss">On loss</option>
              </select>
              <select
                value={step.action}
                onChange={(e) => patch(index, { action: e.target.value as Condition["action"] })}
                className="h-12 rounded-md bg-[#202329] px-2 text-sm"
              >
                <option value="reset">Reset</option>
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
              <button
                type="button"
                className="text-sm text-[#bec6d1]"
                onClick={() => setDraft((cur) => cur.filter((_, i) => i !== index))}
              >
                ×
              </button>
              {step.action !== "reset" ? (
                <Input
                  type="number"
                  min={0}
                  value={step.percent}
                  onChange={(e) => patch(index, { percent: Number(e.target.value) })}
                  className="col-span-4 h-12 rounded-md border-transparent bg-[#202329] tabular-nums shadow-none"
                />
              ) : null}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="text-sm text-lime"
          onClick={() =>
            setDraft((cur) => [...cur, { on: "loss", action: "increase", percent: 100 } satisfies Condition].slice(0, 5))
          }
        >
          Add condition
        </button>
        <button
          type="button"
          className="flex min-h-[54px] w-full items-center justify-center rounded-md bg-lime text-sm font-medium text-black"
          onClick={() => {
            onApply(draft.length ? draft : presetConditions("martingale"));
            onOpenChange(false);
          }}
        >
          Apply
        </button>
      </DialogContent>
    </Dialog>
  );
}

function AutoConfig({
  open,
  onOpenChange,
  currency,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  value: AutoValue;
  onApply: (next: AutoValue) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (open) setDraft(value);
    // Snapshot the committed settings only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function patch(partial: Partial<AutoValue>) {
    setDraft((cur) => ({ ...cur, ...partial }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 bg-[#121418] p-8 sm:max-w-[32rem]">
        <DialogTitle className="text-center text-[22px] font-bold">Configure auto</DialogTitle>
        <div className="grid gap-4">
          <StepRow
            label="On win"
            mode={draft.onWinMode}
            percent={draft.onWinInc}
            onMode={(onWinMode) => patch({ onWinMode })}
            onPercent={(onWinInc) => patch({ onWinInc })}
          />
          <StepRow
            label="On loss"
            mode={draft.onLossMode}
            percent={draft.onLossInc}
            onMode={(onLossMode) => patch({ onLossMode })}
            onPercent={(onLossInc) => patch({ onLossInc })}
          />
          <StopRow
            label="Stop on profit"
            currency={currency}
            amount={draft.stopProfit}
            onChange={(stopProfit) => patch({ stopProfit })}
          />
          <StopRow
            label="Stop on loss"
            currency={currency}
            amount={draft.stopLoss}
            onChange={(stopLoss) => patch({ stopLoss })}
          />
          <button
            type="button"
            className="mt-2 flex min-h-[54px] w-full items-center justify-center rounded-md bg-lime text-sm font-medium text-black"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            Apply
          </button>
          <button
            type="button"
            className="mx-auto w-max border-b border-white text-sm"
            onClick={() =>
              setDraft({
                onWinMode: "reset",
                onWinInc: 0,
                onLossMode: "reset",
                onLossInc: 0,
                stopProfit: 0,
                stopLoss: 0,
              })
            }
          >
            Reset all
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepRow({
  label,
  mode,
  percent,
  onMode,
  onPercent,
}: {
  label: string;
  mode: StepMode;
  percent: number;
  onMode: (mode: StepMode) => void;
  onPercent: (n: number) => void;
}) {
  const locked = mode === "reset";
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium">{label}</span>
      <span className="relative">
        <span className="absolute top-1/2 left-1.5 z-10 flex -translate-y-1/2 gap-0.5">
          <button
            type="button"
            onClick={() => onMode("reset")}
            className={cn(
              "h-9 rounded-md px-3 text-sm",
              locked ? "bg-[#343843] text-white" : "bg-[#202329] text-[#bec6d1]",
            )}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onMode("increase")}
            className={cn(
              "h-9 rounded-md px-3 text-sm",
              !locked ? "bg-[#343843] text-white" : "bg-[#202329] text-[#bec6d1]",
            )}
          >
            Increase by
          </button>
        </span>
        <Input
          type="number"
          min={0}
          disabled={locked}
          value={locked ? "0.00" : percent}
          onChange={(e) => onPercent(Number(e.target.value))}
          className={cn(
            "h-12 rounded-md border-transparent bg-[#202329] pr-8 pl-44 text-right text-sm tabular-nums shadow-none",
            locked && "text-[#4d5361] opacity-70",
          )}
        />
        <span className={cn("absolute top-1/2 right-3 -translate-y-1/2 text-sm", locked && "text-[#4d5361] opacity-70")}>
          %
        </span>
      </span>
    </label>
  );
}

function StopRow({
  label,
  currency,
  amount,
  onChange,
}: {
  label: string;
  currency: string;
  amount: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="flex items-center justify-between gap-3 text-xs font-medium">
        {label}
        <span className="max-w-40 truncate text-[#9ba5b4]">
          {amount.toFixed(8)} {currency}
        </span>
      </span>
      <span className="relative">
        <span className="absolute top-1/2 left-3.5 z-10 grid size-4 -translate-y-1/2 place-items-center rounded-full bg-lime text-[8px] font-bold text-black">
          {currency.slice(0, 1)}
        </span>
        <Input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-12 rounded-md border-transparent bg-[#202329] pl-10 text-sm tabular-nums shadow-none"
        />
      </span>
    </label>
  );
}

function MiniField({
  label,
  value,
  suffix,
  onChange,
  action,
}: {
  label: string;
  value: string;
  suffix?: string;
  onChange: (v: string) => void;
  action?: () => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium">{label}</span>
      <span className="relative">
        <Input
          value={value}
          inputMode="decimal"
          onChange={(e) => onChange(e.target.value)}
          className="h-12 rounded-md border-transparent bg-[#202329] pr-10 pl-4 text-sm tabular-nums shadow-none"
        />
        {suffix ? (
          <span className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center text-xs font-bold text-white/80">
            {suffix}
          </span>
        ) : null}
        {action ? (
          <button
            type="button"
            onClick={action}
            className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center text-white/80 hover:text-white"
            aria-label="Flip roll direction"
          >
            <RiRefreshLine className="size-4" />
          </button>
        ) : null}
      </span>
    </label>
  );
}
