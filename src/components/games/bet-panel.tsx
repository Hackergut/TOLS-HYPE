import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCY_META, type Currency } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";

export function BetPanel({
  disabled,
  onPlay,
  actionLabel = "Play",
}: {
  disabled?: boolean;
  onPlay: (amount: number) => void;
  actionLabel?: string;
}) {
  const { currency, balances } = useWallet();
  const meta = CURRENCY_META[currency];
  const balance = balances[currency];

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const amount = Number(fd.get("amount"));
        if (!Number.isFinite(amount) || amount <= 0) return;
        onPlay(amount);
      }}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="bet-amount">Bet ({currency})</Label>
          <Input
            id="bet-amount"
            name="amount"
            type="number"
            step="any"
            min={meta.minBet}
            max={Math.min(meta.maxBet, balance || meta.maxBet)}
            defaultValue={meta.minBet}
            className="h-11 tabular-nums"
          />
        </div>
        <p className="pb-2 text-xs text-muted-foreground tabular-nums">
          {formatMoney(balance, currency)} {currency}
        </p>
      </div>
      <div className="flex gap-2">
        {[0.5, 1, 2].map((mult) => (
          <Button
            key={mult}
            type="button"
            variant="outline"
            className="h-11 flex-1"
            onClick={(e) => {
              const form = e.currentTarget.form;
              if (!form) return;
              const input = form.elements.namedItem("amount") as HTMLInputElement;
              const next = Math.min(meta.maxBet, Math.max(meta.minBet, Number(input.value) * mult));
              input.value = String(Number(next.toPrecision(6)));
            }}
          >
            {mult}x
          </Button>
        ))}
      </div>
      <Button type="submit" className="h-11" disabled={disabled}>
        {actionLabel}
      </Button>
    </form>
  );
}

export function currencyLabel(currency: Currency) {
  return currency;
}
