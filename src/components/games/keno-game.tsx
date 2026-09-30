import { useRef, useState } from "react";
import { toast } from "sonner";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { playKeno } from "@/lib/casino-api";
import { useWallet } from "@/lib/wallet-context";
import { type Currency } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { formatKenoX, KENO_PAY, KENO_RISK, type KenoRisk } from "@/lib/keno-pay";
import { cn } from "cn";

const RISK_UI: Record<KenoRisk, { label: string; color: string }> = {
  classic: { label: "Classic", color: "#904bf9" },
  low: { label: "Low", color: "#00ffbd" },
  normie: { label: "Medium", color: "#ff8904" },
  degen: { label: "High", color: "#ea2fd4" },
};
const RISK_ORDER: KenoRisk[] = ["classic", "low", "normie", "degen"];

export function KenoGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <KenoTable gameId={gameId} />
    </PlayGate>
  );
}

function KenoTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [picks, setPicks] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [hits, setHits] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);
  const [risk, setRisk] = useState<KenoRisk>("classic");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoN, setAutoN] = useState(0);
  const [autoOn, setAutoOn] = useState(false);
  const autoOnRef = useRef(false);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [onWin, setOnWin] = useState<"reset" | "increase">("reset");
  const [onLoss, setOnLoss] = useState<"reset" | "increase">("reset");
  const [winPct, setWinPct] = useState(0);
  const [lossPct, setLossPct] = useState(0);
  const [stopProfit, setStopProfit] = useState(0);
  const [stopLoss, setStopLoss] = useState(0);

  function toggle(n: number) {
    if (busy) return;
    setDrawn([]);
    setHits(null);
    setPicks((p) => {
      if (p.includes(n)) return p.filter((x) => x !== n);
      if (p.length >= 10) return p;
      playSfx("click");
      return [...p, n].sort((a, b) => a - b);
    });
  }

  function autoPick() {
    playSfx("click");
    const next: number[] = [];
    while (next.length < 8) {
      const n = 1 + Math.floor(Math.random() * 40);
      if (!next.includes(n)) next.push(n);
    }
    setPicks(next.sort((a, b) => a - b));
    setDrawn([]);
    setHits(null);
  }

  function clearBoard() {
    playSfx("click");
    setPicks([]);
    setDrawn([]);
    setHits(null);
  }

  async function play(stake = amount) {
    if (picks.length < 1) {
      toast.message("Select 1–10 numbers");
      return null;
    }
    setBusy(true);
    setDrawn([]);
    setHits(null);
    try {
      const res = await playKeno({ data: { gameId, currency, amount: stake, picks, risk } });
      applyBalances(res.balances);
      const step = speedDelay("step");
      if (step <= 0) {
        setDrawn(res.drawn);
      } else {
        const acc: number[] = [];
        for (const n of res.drawn) {
          acc.push(n);
          setDrawn([...acc]);
          playSfx(picks.includes(n) ? "hit" : "tick");
          await sleep(step);
        }
      }
      setHits(res.hits);
      reportRound({
        win: res.payout > 0,
        label: `${res.hits} hits`,
        stake,
        payout: res.payout,
        multiplier: stake ? res.payout / stake : 0,
        view: { kind: "keno", hits: res.hits, picks: picks.length, selected: picks, drawn: res.drawn },
        replay: () => {
          setDrawn(res.drawn);
          setHits(res.hits);
        },
      });
      if (res.payout > 0) toast.success(`${res.hits} hits · ${formatMoney(res.payout, currency)}`);
      else toast.message(`${res.hits} hits`);
      return { payout: res.payout };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function startAuto() {
    if (autoOnRef.current) {
      autoOnRef.current = false;
      setAutoOn(false);
      return;
    }
    if (picks.length < 1) {
      toast.message("Select 1–10 numbers");
      return;
    }
    autoOnRef.current = true;
    setAutoOn(true);
    let bet = amount;
    let profit = 0;
    const cap = autoN > 0 ? Math.min(autoN, 100) : 100;
    let ran = 0;
    for (let i = 0; i < cap && autoOnRef.current; i += 1) {
      const res = await play(bet);
      if (!res || !autoOnRef.current) break;
      ran += 1;
      profit += res.payout - bet;
      if (stopProfit > 0 && profit >= stopProfit) break;
      if (stopLoss > 0 && -profit >= stopLoss) break;
      const won = res.payout > bet;
      if (won) bet = onWin === "increase" ? bet * (1 + Math.max(0, winPct) / 100) : amount;
      else bet = onLoss === "increase" ? bet * (1 + Math.max(0, lossPct) / 100) : amount;
    }
    if (autoN === 0 && ran >= cap) toast.message("Autobet stopped at 100");
    autoOnRef.current = false;
    setAutoOn(false);
  }

  return (
    <GameShell
      controls={
        <div className="flex flex-col gap-6">
          <div className="flex gap-1 rounded-md bg-[#202329] p-1.5" role="tablist">
            {(
              [
                ["manual", "Manual"],
                ["auto", "Auto"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                disabled={autoOn}
                onClick={() => setMode(id)}
                className={cn(
                  "h-9 flex-1 rounded-md text-sm font-medium",
                  mode === id ? "bg-[#343843] text-white" : "text-[#bec6d1]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <StakeField amount={amount} setAmount={setAmount} disabled={autoOn} />
          <div className="grid gap-1">
            <span className="text-xs font-medium">Risk</span>
            <div className="grid grid-cols-4 gap-2">
              {RISK_ORDER.map((r) => {
                const on = risk === r;
                const color = RISK_UI[r].color;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={autoOn}
                    onClick={() => {
                      setRisk(r);
                      playSfx("click");
                    }}
                    className="flex h-12 items-center justify-center rounded-md text-sm font-medium"
                    style={
                      on
                        ? { background: color, color: "#121418" }
                        : { background: "#2a2e38", color }
                    }
                  >
                    {RISK_UI[r].label}
                  </button>
                );
              })}
            </div>
          </div>
          {mode === "auto" ? (
            <label className="grid gap-1">
              <span className="text-xs font-medium">Number of bets</span>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  disabled={autoOn}
                  value={autoN}
                  onChange={(e) => setAutoN(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className="h-12 w-full rounded-md bg-[#202329] pr-14 pl-4 text-sm text-[#828998] outline-none"
                />
                <button
                  type="button"
                  disabled={autoOn}
                  onClick={() => setAutoN(0)}
                  className={cn(
                    "absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md bg-[#2a2e38] text-xs",
                    autoN === 0 && "border border-white",
                  )}
                  aria-label="Infinite"
                >
                  ∞
                </button>
              </div>
            </label>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={autoPick}
              className="flex h-[54px] items-center justify-center rounded-md bg-[#2a2e38] text-sm font-medium"
            >
              Auto pick
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={clearBoard}
              className="flex h-[54px] items-center justify-center rounded-md bg-[#2a2e38] text-sm font-medium"
            >
              Clear table
            </button>
          </div>
          {mode === "auto" ? (
            <button
              type="button"
              disabled={autoOn}
              onClick={() => setCfgOpen(true)}
              className="flex h-[54px] items-center justify-center rounded-md border border-white text-sm font-medium"
            >
              Configure auto
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy && mode === "manual"}
            onClick={() => void (mode === "auto" ? startAuto() : play())}
            className="flex h-[54px] items-center justify-center rounded-md bg-lime text-sm font-medium text-black disabled:opacity-60"
          >
            {mode === "auto" ? (autoOn ? "Stop Autobet" : "Start Autobet") : "Bet"}
          </button>
          {cfgOpen ? (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setCfgOpen(false)}>
              <div
                className="grid w-full max-w-sm gap-3 rounded-lg bg-[#121418] p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-sm font-medium">Configure auto</p>
                <StepRow label="On win" mode={onWin} setMode={setOnWin} pct={winPct} setPct={setWinPct} />
                <StepRow label="On loss" mode={onLoss} setMode={setOnLoss} pct={lossPct} setPct={setLossPct} />
                <label className="grid gap-1 text-xs">
                  Stop on profit
                  <input
                    type="number"
                    min={0}
                    value={stopProfit}
                    onChange={(e) => setStopProfit(Math.max(0, Number(e.target.value) || 0))}
                    className="h-12 rounded-md bg-[#202329] px-4 text-sm outline-none"
                  />
                </label>
                <label className="grid gap-1 text-xs">
                  Stop on loss
                  <input
                    type="number"
                    min={0}
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Math.max(0, Number(e.target.value) || 0))}
                    className="h-12 rounded-md bg-[#202329] px-4 text-sm outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setCfgOpen(false)}
                  className="flex h-[54px] items-center justify-center rounded-md bg-lime text-sm font-medium text-black"
                >
                  Apply
                </button>
              </div>
            </div>
          ) : null}
        </div>
      }
      play={
        <div className="mx-auto flex w-full max-w-[780px] flex-col gap-4">
          <div className="grid grid-cols-8 justify-center gap-2">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => {
              const selected = picks.includes(n);
              const hit = drawn.includes(n) && selected;
              const house = drawn.includes(n) && !selected;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(n)}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg font-heading text-[clamp(16px,3vw,26px)] font-bold tabular-nums",
                    hit ? "keno-hit" : house ? "keno-house" : selected ? "keno-pick" : "keno-idle",
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <KenoPaytable picks={picks.length} risk={risk} hits={hits} amount={amount} currency={currency} />
          <p className="text-center text-sm text-[#9ba5b4]">
            {hits !== null ? `${hits} hits this round` : "Select 1 to 10 numbers to play"}
          </p>
        </div>
      }
    />
  );
}

function StepRow({
  label,
  mode,
  setMode,
  pct,
  setPct,
}: {
  label: string;
  mode: "reset" | "increase";
  setMode: (m: "reset" | "increase") => void;
  pct: number;
  setPct: (n: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs">
      {label}
      <div className="grid grid-cols-[1fr_88px] gap-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "reset" | "increase")}
          className="h-12 rounded-md bg-[#202329] px-3 text-sm"
        >
          <option value="reset">Reset</option>
          <option value="increase">Increase</option>
        </select>
        <input
          type="number"
          min={0}
          disabled={mode === "reset"}
          value={pct}
          onChange={(e) => setPct(Math.max(0, Number(e.target.value) || 0))}
          className="h-12 rounded-md bg-[#202329] px-3 text-sm outline-none disabled:opacity-40"
        />
      </div>
    </label>
  );
}

function KenoPaytable({
  picks,
  risk,
  hits,
  amount,
  currency,
}: {
  picks: number;
  risk: KenoRisk;
  hits: number | null;
  amount: number;
  currency: Currency;
}) {
  const n = picks > 0 ? picks : 8;
  const table = KENO_PAY[n] ?? [0];
  const scale = KENO_RISK[risk];
  const maxX = Math.max(...table) * scale;
  return (
    <div>
      <div className="flex gap-1 overflow-x-auto">
        {table.map((base, hit) => {
          const x = base * scale;
          const on = hits === hit;
          return (
            <div
              key={hit}
              className={cn(
                "min-w-14 flex-1 rounded-md px-1 py-2 text-center",
                on && x > 0 && "bg-[#00e701] text-black",
                on && x <= 0 && "bg-[#202329] text-white/50",
                !on && x > 0 && "bg-[#202329] text-white",
                !on && x <= 0 && "bg-[#202329]/60 text-white/40",
              )}
            >
              <p className="text-[11px] font-medium uppercase opacity-70">{hit}</p>
              <p className="text-sm font-bold tabular-nums">{formatKenoX(x)}</p>
            </div>
          );
        })}
      </div>
      {picks > 0 && amount > 0 ? (
        <p className="mt-1.5 text-center text-[0.65rem] tabular-nums text-muted-foreground">
          {hits != null
            ? `${hits} hits pay ${formatKenoX((table[hits] ?? 0) * scale)} · ${formatMoney(amount * (table[hits] ?? 0) * scale, currency)} ${currency}`
            : `Catch all ${n} → ${formatKenoX(maxX)} · ${formatMoney(amount * maxX, currency)} ${currency}`}
        </p>
      ) : null}
    </div>
  );
}
