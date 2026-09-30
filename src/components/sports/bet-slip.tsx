import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { comboOdds, formatOdds, impliedProb, systemCombos, type OddsFormat } from "@/lib/odds";
import type { SlipPick } from "@/lib/sports-book";
import { formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/games-catalog";
import { cn } from "cn";

export type SlipMode = "single" | "combo" | "system";

/** Max k shown in the system selector. */
const SYSTEM_KS = [2, 3, 4] as const;

export function BetSlip({
  picks,
  amount,
  currency,
  busy,
  mode,
  systemK,
  format,
  onMode,
  onSystemK,
  onAmount,
  onRemove,
  onClear,
  onPlace,
}: {
  picks: SlipPick[];
  amount: number;
  currency: Currency;
  busy: boolean;
  mode: SlipMode;
  systemK: number;
  format: OddsFormat;
  onMode: (m: SlipMode) => void;
  onSystemK: (k: number) => void;
  onAmount: (n: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onPlace: () => void;
}) {
  const n = picks.length;
  const combo = comboOdds(picks.map((p) => p.odds));
  const mode2 =
    mode === "single" || (mode === "combo" && n >= 2) || (mode === "system" && n >= 3) ? mode : "single";
  const k = Math.min(systemK, n - 1);
  const combos = mode2 === "system" ? systemCombos(n, k) : [];
  const comboCount = mode2 === "system" ? combos.length : 0;

  const stake = mode2 === "single" ? amount * n : amount;
  const toWin = (() => {
    if (mode2 === "combo") return amount * combo;
    if (mode2 === "system" && comboCount > 0) {
      const stakeEach = amount / comboCount;
      // best-case: every combo hits
      return combos.reduce((acc, c) => acc + stakeEach * comboOdds(c.map((i) => picks[i]!.odds)), 0);
    }
    return picks.reduce((acc, p) => acc + amount * p.odds, 0);
  })();

  return (
    <aside className="sb-card flex flex-col p-3 lg:sticky lg:top-20">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm tracking-wide">Bet slip</h2>
        {picks.length ? (
          <button type="button" className="text-[0.7rem] text-muted-foreground hover:text-foreground" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-3 rounded-lg bg-muted p-0.5">
        {(["single", "combo", "system"] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={m === "combo" ? n < 2 : m === "system" ? n < 3 : false}
            className={cn(
              "h-8 rounded-md text-xs font-medium",
              mode2 === m ? "bg-lime text-black" : "text-muted-foreground disabled:opacity-40",
            )}
            onClick={() => onMode(m)}
          >
            {m === "combo" ? "Acca" : m === "system" ? "System" : "Singles"}
          </button>
        ))}
      </div>
      {mode2 === "system" && n > 2 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="font-sub text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">Combos</span>
          {SYSTEM_KS.filter((kk) => kk < n).map((kk) => (
            <button
              key={kk}
              type="button"
              className={cn(
                "h-7 rounded-full px-2.5 text-[0.7rem] font-semibold",
                k === kk ? "bg-lime text-black" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onSystemK(kk)}
            >
              {kk}/{n}
            </button>
          ))}
        </div>
      ) : null}
      {mode2 === "system" && n > 2 ? (
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          {comboCount} combination{comboCount === 1 ? "" : "s"} · stake {formatMoney(amount / (comboCount || 1), currency)} each
        </p>
      ) : null}
      {picks.length === 0 ? (
        <p className="mt-6 mb-4 text-center text-xs text-muted-foreground">Tap an odd to build a ticket.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {picks.map((p) => (
            <li key={p.id} className="rounded-lg bg-muted/50 px-2.5 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">{p.fixture}</p>
                  <p className="text-sm font-medium">
                    {p.marketLabel} · {p.label}
                  </p>
                </div>
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => onRemove(p.id)} aria-label="Remove">
                  ×
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between text-[0.7rem]">
                <span className="text-muted-foreground">{(impliedProb(p.odds) * 100).toFixed(1)}%</span>
                <span className="font-heading text-sm tabular-nums text-lime">{formatOdds(p.odds, format)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label className="font-sub mt-4 text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">
        {mode2 === "combo" ? "Stake" : mode2 === "system" ? "Total stake" : "Stake each"}
      </label>
      <Input
        type="number"
        inputMode="decimal"
        className="mt-1 h-11 tabular-nums"
        value={amount}
        onChange={(e) => onAmount(Number(e.target.value))}
      />
      <dl className="mt-3 grid gap-1 text-sm">
        {mode2 === "combo" && n > 1 ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Acca</dt>
            <dd className="font-heading tabular-nums">{formatOdds(combo, format)}</dd>
          </div>
        ) : null}
        {mode2 === "system" && n > 2 ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">System</dt>
            <dd className="font-heading tabular-nums">
              {k}/{n} · {comboCount}×
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Stake</dt>
          <dd className="tabular-nums">
            {formatMoney(stake, currency)} {currency}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Max win</dt>
          <dd className="font-heading tabular-nums text-lime">
            {formatMoney(toWin, currency)} {currency}
          </dd>
        </div>
      </dl>
      <Button className="mt-3 h-11 w-full" disabled={!picks.length || busy || amount < 0} onClick={onPlace}>
        {busy
          ? "Placing…"
          : mode2 === "system"
            ? `Place system ${k}/${n}`
            : mode2 === "combo"
              ? `Place acca · ${n}`
              : `Place ${n || ""} singles`}
      </Button>
    </aside>
  );
}