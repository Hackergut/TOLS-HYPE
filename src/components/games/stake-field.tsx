import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, CURRENCY_META, type Currency } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";

export function StakeField({
  amount,
  setAmount,
  disabled,
  hint,
}: {
  amount: number;
  setAmount: (n: number) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const { currency, setCurrency, balances } = useWallet();
  const meta = CURRENCY_META[currency];
  const balance = balances[currency];

  function clampBet(n: number) {
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(meta.maxBet, n);
  }

  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between text-xs text-muted-foreground">
        Bet Amount
        <span className="tabular-nums">
          {hint ?? `${formatMoney(balance, currency)} ${currency}`}
        </span>
      </span>
      <ButtonGroup className="w-full min-w-0">
        <Select
          value={currency}
          onValueChange={(v) => setCurrency(v as Currency)}
          disabled={disabled}
        >
          <SelectTrigger className="h-11 w-16 shrink-0 font-mono">
            <SelectValue>{CURRENCY_META[currency].symbol}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_META[c].symbol}{" "}
                  <span className="text-muted-foreground">{c}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={0}
          step="any"
          disabled={disabled}
          value={amount}
          onChange={(e) => setAmount(clampBet(Number(e.target.value)))}
          placeholder="10.00"
          inputMode="decimal"
          className="h-11 min-w-0 flex-1 tabular-nums"
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-11 shrink-0 px-3"
          onClick={() => setAmount(clampBet(amount / 2))}
        >
          ½
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-11 shrink-0 px-3"
          onClick={() => setAmount(clampBet(Math.min(balance, amount * 2 || meta.minBet)))}
        >
          2×
        </Button>
      </ButtonGroup>
    </label>
  );
}

export function FieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        {hint ? <span className="tabular-nums">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
