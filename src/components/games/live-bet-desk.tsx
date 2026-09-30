import type { ReactNode } from "react";
import { LimeBet } from "@/components/games/game-shell";
import { StakeField } from "@/components/games/stake-field";
import { formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/games-catalog";
import { cn } from "cn";

export type DeskBet = {
  name: string;
  pick: string;
  amount: number;
  status: string;
  cashMult?: number | null;
  mine?: boolean;
};

const MARK: Record<Currency, string> = { USDT: "₮", SOL: "◎", BTC: "₿", ETH: "Ξ" };

/** Same live-bet desk as Slide: manual or auto, stake, profit, add bet, open bet list. */
export function LiveBetDesk({
  mode,
  setMode,
  amount,
  setAmount,
  busy,
  inputsLocked,
  currency,
  balance,
  profit,
  closed,
  inRound,
  onAdd,
  buttonLabel,
  onButton,
  autoRunning,
  onAutoToggle,
  bets,
  openBets,
  setOpenBets,
  formatPick,
  children,
}: {
  mode: "manual" | "auto";
  setMode: (mode: "manual" | "auto") => void;
  amount: number;
  setAmount: (n: number) => void;
  busy?: boolean;
  inputsLocked?: boolean;
  currency: Currency;
  balance: number;
  profit: number;
  closed: boolean;
  inRound?: boolean;
  onAdd: () => void;
  buttonLabel?: string;
  onButton?: () => void;
  autoRunning?: boolean;
  onAutoToggle?: () => void;
  bets: DeskBet[];
  openBets: boolean;
  setOpenBets: (v: boolean | ((open: boolean) => boolean)) => void;
  formatPick?: (bet: DeskBet) => string;
  children?: ReactNode;
}) {
  const total = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const cashing = Boolean(onButton);
  const auto = mode === "auto" && Boolean(onAutoToggle) && !cashing;
  const label = auto ? (autoRunning ? "Stop Autobet" : "Start Autobet") : (buttonLabel ?? (closed ? "Next round" : "Add bet"));
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex gap-1 rounded-md bg-[#202329] p-1.5" role="tablist">
        {(["manual", "auto"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mode === tab}
            className={cn(
              "h-9 flex-1 rounded-md text-sm font-medium capitalize",
              mode === tab ? "bg-[#343843] text-white" : "text-[#bec6d1]",
            )}
            disabled={inputsLocked}
            onClick={() => setMode(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4">
        <StakeField amount={amount} setAmount={setAmount} disabled={busy || inputsLocked} />
        {children}
        <div className="grid gap-1">
          <span className="flex items-center justify-between text-xs font-medium">
            Profit
            <span className="max-w-40 truncate text-[#9ba5b4] tabular-nums">
              {formatMoney(balance, currency)} {currency}
            </span>
          </span>
          <div className="flex h-12 items-center gap-2 rounded-md border border-[#2a2e38] px-4 text-sm tabular-nums">
            <span>{MARK[currency]}</span>
            {formatMoney(profit, currency)}
          </div>
        </div>
      </div>
      <LimeBet
        className="mt-4 h-[54px]"
        disabled={cashing ? busy : auto ? (autoRunning ? false : busy) : busy || closed || inRound}
        onClick={cashing ? onButton : auto ? onAutoToggle : onAdd}
      >
        {label}
      </LimeBet>
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-1">
        <button
          type="button"
          className="grid h-12 w-full grid-cols-[max-content_auto] items-center rounded-md bg-[#202329] px-4 text-sm"
          onClick={() => setOpenBets((v) => !v)}
        >
          <span>Bets: {bets.length}</span>
          <span className="flex items-center justify-end gap-2 tabular-nums">
            {formatMoney(total, currency)} {currency}
            <svg viewBox="0 0 16 16" className={cn("size-4 text-[#9ba5b4] transition", openBets && "rotate-180")} aria-hidden>
              <path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
        </button>
        {openBets ? (
          <div className="flex min-h-36 flex-1 flex-col overflow-y-auto rounded-lg border border-[#2a2e38]">
            {bets.length === 0 ? (
              <p className="grid flex-1 place-items-center text-sm font-medium text-[#4d5361]">No players</p>
            ) : (
              <ul>
                {bets.map((bet, i) => (
                  <li key={`${bet.name}-${bet.pick}-${i}`} className={cn("flex items-center justify-between gap-2 px-3 py-1.5 text-xs", bet.mine && "bg-lime/10")}>
                    <span className="truncate">{bet.name}</span>
                    {formatPick ? <span className="tabular-nums text-[#9ba5b4]">{formatPick(bet)}</span> : null}
                    <span className={cn("tabular-nums", bet.status === "won" ? "text-lime" : bet.status === "lost" ? "text-[#ff8b7b]" : "text-white")}>
                      {formatMoney(bet.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
