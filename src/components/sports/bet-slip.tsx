import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { comboOdds, formatOdds, impliedProb, type OddsFormat } from "@/lib/odds";
import type { SlipPick } from "@/lib/sports-book";
import { formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/games-catalog";
import { cn } from "cn";

export type SlipMode = "single" | "combo";

export function BetSlip({
  picks,
  amount,
  currency,
  busy,
  mode,
  format,
  onMode,
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
  format: OddsFormat;
  onMode: (m: SlipMode) => void;
  onAmount: (n: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onPlace: () => void;
}) {
  const combo = comboOdds(picks.map((p) => p.odds));
  const singlesStake = amount * picks.length;
  const comboWin = picks.length ? amount * combo : 0;
  const singlesWin = picks.reduce((acc, p) => acc + amount * p.odds, 0);
  const stake = mode === "combo" ? amount : singlesStake;
  const toWin = mode === "combo" ? comboWin : singlesWin;

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
      <div className="mt-2 grid grid-cols-2 rounded-lg bg-muted p-0.5">
        {(["single", "combo"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={cn(
              "h-8 rounded-md text-xs font-medium capitalize",
              mode === m ? "bg-lime text-black" : "text-muted-foreground",
            )}
            onClick={() => onMode(m)}
          >
            {m === "combo" ? "Acca" : "Singles"}
          </button>
        ))}
      </div>
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
        {mode === "combo" ? "Stake" : "Stake each"}
      </label>
      <Input
        type="number"
        inputMode="decimal"
        className="mt-1 h-11 tabular-nums"
        value={amount}
        onChange={(e) => onAmount(Number(e.target.value))}
      />
      <dl className="mt-3 grid gap-1 text-sm">
        {mode === "combo" && picks.length > 1 ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Combo</dt>
            <dd className="font-heading tabular-nums">{formatOdds(combo, format)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Stake</dt>
          <dd className="tabular-nums">
            {formatMoney(stake, currency)} {currency}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">To win</dt>
          <dd className="font-heading tabular-nums text-lime">
            {formatMoney(toWin, currency)} {currency}
          </dd>
        </div>
      </dl>
      <Button className="mt-3 h-11 w-full" disabled={!picks.length || busy || amount <= 0} onClick={onPlace}>
        {busy ? "Placing…" : mode === "combo" ? `Place acca · ${picks.length}` : `Place ${picks.length || ""} singles`}
      </Button>
    </aside>
  );
}
