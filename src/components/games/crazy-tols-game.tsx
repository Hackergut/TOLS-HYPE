import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { playCrazy, settleCrazyCashHunt } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { CashierDialog } from "@/components/wallet/cashier-dialog";
import { CrazyTolsTable } from "@/components/games/crazy/CrazyTolsTable";
import {
  type Bets,
  type Chip,
  type Denom,
  type SpinOutcome,
} from "@/lib/crazy/useCrazyTols";
import type { Currency } from "@/lib/games-catalog";

export function CrazyTolsGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <CrazyTable gameId={gameId} />
    </PlayGate>
  );
}

const CHIP_COLORS = [
  { color: "#14F195", ring: "#0b8f5b" },
  { color: "#19E8FF", ring: "#0b7d94" },
  { color: "#9945FF", ring: "#5a1cab" },
  { color: "#FF3D6E", ring: "#8f0a31" },
];

/** Chip ladder per platform currency, inside each currency's bet limits. */
const CHIP_VALUES: Record<Currency, number[]> = {
  SOL: [0.1, 0.5, 2, 10],
  USDT: [10, 50, 250, 500],
  BTC: [0.001, 0.005, 0.02, 0.05],
  ETH: [0.01, 0.05, 0.2, 0.5],
};

const DIGITS: Record<Currency, number> = { SOL: 2, USDT: 2, BTC: 4, ETH: 3 };

function denomFor(currency: Currency): Denom {
  const digits = DIGITS[currency];
  const chips: Chip[] = CHIP_VALUES[currency].map((value, index) => ({
    value,
    label: String(value),
    ...CHIP_COLORS[index % CHIP_COLORS.length]!,
  }));
  return {
    code: currency,
    chips,
    minBet: chips[0]!.value,
    fmt: (n: number) =>
      n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits }),
  };
}

function CrazyTable({ gameId }: { gameId: string }) {
  const { currency, balances, applyBalances, refresh } = useWallet();
  // The table touches window/localStorage in initial state: mount it client-side.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [cashierOpen, setCashierOpen] = useState(false);
  const denom = useMemo(() => denomFor(currency), [currency]);
  const walletBalance = balances[currency] ?? 0;

  const onSpin = useCallback(
    async (bets: Bets): Promise<SpinOutcome> => {
      try {
        const res = await playCrazy({ data: { gameId, currency, bets } });
        applyBalances(res.balances);
        return {
          topSlot: res.round.topSlot,
          wheelIndex: res.round.wheelIndex,
          landed: res.round.landed,
          payouts: res.round.payouts,
          multipliers: res.round.multipliers,
          totalPayout: res.round.totalPayout,
          bonus: res.round.bonus,
          cashhuntToken: res.token,
          balance: res.balances[currency] ?? 0,
        };
      } catch (cause) {
        void refresh();
        throw cause;
      }
    },
    [applyBalances, currency, gameId, refresh],
  );

  const onCashHunt = useCallback(
    async (token: string, cell: number) => {
      try {
        const res = await settleCrazyCashHunt({ data: { token, cell } });
        applyBalances(res.balances);
        return {
          payout: res.payout,
          multiplier: res.multiplier,
          balance: res.balances[currency] ?? 0,
        };
      } catch (cause) {
        void refresh();
        throw cause;
      }
    },
    [applyBalances, currency, refresh],
  );

  if (!mounted) {
    return (
      <div className="grid min-h-[560px] place-items-center rounded-3xl bg-[#16181c] ring-1 ring-white/5">
        <div className="flex flex-col items-center gap-3 text-white/60">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#00edb5]" />
          <span className="font-mono text-[11px] tracking-[0.28em] uppercase">Setting up the wheel</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <CrazyTolsTable
        denom={denom}
        walletBalance={walletBalance}
        onSpin={onSpin}
        onCashHunt={onCashHunt}
        externalBlocked={cashierOpen}
        onCashier={() => setCashierOpen(true)}
      />
      <CashierDialog open={cashierOpen} onOpenChange={setCashierOpen} />
    </>
  );
}
