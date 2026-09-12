import { useState } from "react";
import { toast } from "sonner";
import { RiRefreshLine } from "@remixicon/react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { formatMoney } from "@/lib/format";
import { CURRENCY_META } from "@/lib/games-catalog";
import { DiceTrack } from "@/components/games/dice-track";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { ORIGINALS_RTP, payoutFromChance } from "@/lib/originals";

const MIN_CHANCE = 1;
const MAX_CHANCE = 98;
const AUTO_CAP = 25;

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
  const meta = CURRENCY_META[currency];
  const [over, setOver] = useState(false);
  const [target, setTarget] = useState(49.5);
  const [amount, setAmount] = useState(meta.minBet);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [tab, setTab] = useState("manual");
  const [autoN, setAutoN] = useState(0);
  const [onWinInc, setOnWinInc] = useState(0);
  const [onLossInc, setOnLossInc] = useState(100);
  const [stopProfit, setStopProfit] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);

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

  async function playOnce(bet: number): Promise<{ win: boolean; payout: number }> {
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
    setLast(roll);
    setLastWin(win);
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
    if (res.payout > 0) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
    else toast.message("Missed");
    return { win, payout: res.payout };
  }

  async function onBet() {
    setBusy(true);
    try {
      if (tab === "manual") {
        await playOnce(amount);
        return;
      }
      const n = autoN > 0 ? Math.min(autoN, AUTO_CAP) : AUTO_CAP;
      let bet = amount;
      let pnl = 0;
      for (let i = 0; i < n; i += 1) {
        const { win, payout } = await playOnce(bet);
        pnl += payout - bet;
        if (stopProfit > 0 && pnl >= stopProfit) break;
        if (stopLoss > 0 && pnl <= -stopLoss) break;
        if (win) bet = onWinInc > 0 ? Math.min(meta.maxBet, bet * (1 + onWinInc / 100)) : amount;
        else bet = onLossInc > 0 ? Math.min(meta.maxBet, bet * (1 + onLossInc / 100)) : amount;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GameShell
      controls={
        <>
          <LimeBet disabled={busy} onClick={() => void onBet()}>
            {tab === "manual" ? "Bet" : "Start Autobet"}
          </LimeBet>
          {tab === "manual" ? (
            <div className="space-y-3">
              <StakeField amount={amount} setAmount={setAmount} />
              <FieldLabel label="Profit" hint={`${formatMoney(profit, currency)} ${currency}`}>
                <Input readOnly value={profit.toFixed(8)} className="h-11 tabular-nums" />
              </FieldLabel>
            </div>
          ) : tab === "auto" ? (
            <div className="space-y-3">
              <StakeField amount={amount} setAmount={setAmount} />
              <FieldLabel label="Number of bets">
                <Input
                  type="number"
                  min={0}
                  value={autoN}
                  onChange={(e) => setAutoN(Number(e.target.value))}
                  className="h-11 tabular-nums"
                />
              </FieldLabel>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3">
                <FieldLabel label="On win %">
                  <Input
                    type="number"
                    min={0}
                    value={onWinInc}
                    onChange={(e) => setOnWinInc(Number(e.target.value))}
                    className="h-10 tabular-nums"
                  />
                </FieldLabel>
                <FieldLabel label="On loss %">
                  <Input
                    type="number"
                    min={0}
                    value={onLossInc}
                    onChange={(e) => setOnLossInc(Number(e.target.value))}
                    className="h-10 tabular-nums"
                  />
                </FieldLabel>
                <FieldLabel label="Stop profit">
                  <Input
                    type="number"
                    min={0}
                    value={stopProfit}
                    onChange={(e) => setStopProfit(Number(e.target.value))}
                    className="h-10 tabular-nums"
                  />
                </FieldLabel>
                <FieldLabel label="Stop loss">
                  <Input
                    type="number"
                    min={0}
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="h-10 tabular-nums"
                  />
                </FieldLabel>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <StakeField amount={amount} setAmount={setAmount} />
              <FieldLabel label="Number of bets">
                <Input
                  type="number"
                  min={0}
                  value={autoN}
                  onChange={(e) => setAutoN(Number(e.target.value))}
                  className="h-11 tabular-nums"
                />
              </FieldLabel>
              <FieldLabel label="Strategy">
                <div className="flex h-11 items-center rounded-lg border border-border bg-muted px-3 text-sm">
                  Martingale
                </div>
              </FieldLabel>
              <p className="text-xs text-muted-foreground">On loss, stake doubles. On win, reset.</p>
            </div>
          )}
          <Tabs value={tab} onValueChange={setTab} className="gap-0">
            <TabsList className="h-10 w-full rounded-lg bg-muted">
              <TabsTrigger value="manual" className="h-8 flex-1">
                Manual
              </TabsTrigger>
              <TabsTrigger value="auto" className="h-8 flex-1">
                Auto
              </TabsTrigger>
              <TabsTrigger value="advanced" className="h-8 flex-1">
                Advanced
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </>
      }
      play={
        <>
          <div className="px-1 md:px-8">
            <DiceTrack
              target={target}
              over={over}
              roll={last}
              rollWin={lastWin}
              onTarget={setTarget}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MiniField label="Multiplier" value={multiplier.toFixed(4)} onChange={(v) => setMultiplier(Number(v))} />
            <MiniField
              label={over ? "Roll Over" : "Roll Under"}
              value={target.toFixed(2)}
              onChange={(v) => setTarget(clamp(Number(v), 2, 98))}
              action={() => setOver((o) => !o)}
            />
            <MiniField
              label="Chance"
              value={chance.toFixed(4)}
              suffix="%"
              onChange={(v) => setChance(Number(v))}
            />
          </div>
        </>
      }
    />
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
    <label className="rounded-xl border border-border bg-card p-2">
      <span className="text-[0.65rem] tracking-wide text-muted-foreground">{label}</span>
      <span className="mt-1 flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 border-0 bg-transparent px-0 tabular-nums shadow-none"
        />
        {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
        {action ? (
          <button type="button" onClick={action} className="text-muted-foreground hover:text-foreground" aria-label="Flip">
            <RiRefreshLine className="size-4" />
          </button>
        ) : null}
      </span>
    </label>
  );
}
