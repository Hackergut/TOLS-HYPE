import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
    <label className="grid gap-1">
      <span className="flex items-center justify-between text-xs font-medium leading-[18px]">
        Bet Amount
        <span className="max-w-40 truncate text-[#9ba5b4] tabular-nums">
          {hint ?? `${formatMoney(balance, currency)} ${currency}`}
        </span>
      </span>
      <div className="relative flex h-12 items-center rounded-md bg-[#202329]">
        <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)} disabled={disabled}>
          <SelectTrigger className="absolute top-1/2 left-2 z-1 h-8 w-10 -translate-y-1/2 border-0 bg-transparent p-0 shadow-none">
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
          placeholder="0.00"
          inputMode="decimal"
          className="h-12 border-0 bg-transparent pr-24 pl-10 tabular-nums shadow-none"
        />
        <span className="absolute top-1/2 right-2 flex -translate-y-1/2 gap-1">
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className="size-8 rounded-md bg-[#2a2e38] px-0 text-xs font-medium"
            onClick={() => setAmount(clampBet(amount / 2))}
          >
            ½
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className="size-8 rounded-md bg-[#2a2e38] px-0 text-xs font-medium"
            onClick={() => setAmount(clampBet(Math.min(balance, amount * 2 || meta.minBet)))}
          >
            2x
          </Button>
        </span>
      </div>
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
