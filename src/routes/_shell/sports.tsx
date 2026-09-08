import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
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
import { CURRENCIES, CURRENCY_META, SPORTS, type Currency } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";
import { placeSportBet } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";

export const Route = createFileRoute("/_shell/sports")({ component: SportsPage });

function SportsPage() {
  return (
    <PlayGate>
      <SportsBook />
    </PlayGate>
  );
}

function SportsBook() {
  const { currency, setCurrency, applyBalances } = useWallet();
  const [amount, setAmount] = useState(10);

  async function bet(eventId: string, side: "home" | "away", odds: number) {
    try {
      const res = await placeSportBet({ data: { eventId, side, odds, amount, currency } });
      applyBalances(res.balances);
      if (res.win) toast.success(`Hit · ${formatMoney(res.payout, currency)} ${currency}`);
      else toast.message("The other side closed it");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Sports" }]} />
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Sportsbook</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Instant settle against the house. Stake in the currency selected in the header.
        </p>
      </header>
      <ButtonGroup className="w-full max-w-md">
        <ButtonGroup className="min-w-0 flex-1">
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
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
            className="h-11 min-w-0 flex-1 tabular-nums"
            placeholder="10.00"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </ButtonGroup>
      </ButtonGroup>
      <ul className="grid gap-3">
        {SPORTS.map((ev) => (
          <li key={ev.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  {ev.league}
                  {ev.live ? " · live" : ""}
                </p>
                <h2 className="font-heading mt-1 text-lg font-semibold">
                  {ev.home} vs {ev.away}
                </h2>
                <p className="text-xs text-muted-foreground">{ev.start}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11 justify-between" onClick={() => void bet(ev.id, "home", ev.moneyline[0])}>
                <span>{ev.home}</span>
                <span className="tabular-nums">{ev.moneyline[0].toFixed(2)}</span>
              </Button>
              <Button variant="outline" className="h-11 justify-between" onClick={() => void bet(ev.id, "away", ev.moneyline[1])}>
                <span>{ev.away}</span>
                <span className="tabular-nums">{ev.moneyline[1].toFixed(2)}</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
