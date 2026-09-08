import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { cashOutMines, revealMine, startMines } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { formatMoney, formatMultiplier } from "@/lib/format";
import { CURRENCY_META } from "@/lib/games-catalog";

export function MinesGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <MinesTable gameId={gameId} />
    </PlayGate>
  );
}

function MinesTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const meta = CURRENCY_META[currency];
  const [roundId, setRoundId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<number[] | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(meta.minBet);
  const [mineCount, setMineCount] = useState(3);

  async function start() {
    setBusy(true);
    try {
      const res = await startMines({ data: { gameId, currency, amount, mineCount } });
      setRoundId(res.roundId);
      setRevealed([]);
      setMines(null);
      setMultiplier(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  async function reveal(index: number) {
    if (!roundId || mines) return;
    try {
      const res = await revealMine({ data: { roundId, index } });
      setRevealed(res.revealed);
      setMultiplier(res.multiplier);
      if (res.boom) {
        setMines(res.mines);
        if (res.balances) applyBalances(res.balances);
        setRoundId(null);
        reportRound({
          win: false,
          label: "Mine",
          stake: amount,
          payout: 0,
          multiplier: 0,
          view: { kind: "mines", boom: true, multiplier: 0 },
          replay: () => {
            setRevealed(res.revealed);
            setMines(res.mines);
          },
        });
        toast.error("Mine. Round over.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reveal failed");
    }
  }

  async function cash() {
    if (!roundId) return;
    try {
      const res = await cashOutMines({ data: { roundId } });
      applyBalances(res.balances);
      setMines(res.mines);
      setRoundId(null);
      reportRound({
        win: true,
        label: `Cashout ${res.multiplier.toFixed(2)}×`,
        stake: amount,
        payout: res.payout,
        multiplier: res.multiplier,
        view: { kind: "mines", boom: false, multiplier: res.multiplier },
        replay: () => setMines(res.mines),
      });
      toast.success(`Cashed ${formatMoney(res.payout, currency)} ${currency}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cash out failed");
    }
  }

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} disabled={Boolean(roundId)} />
          <FieldLabel label="Mines">
            <select
              className="h-11 w-full rounded-lg border border-border bg-muted px-3"
              value={mineCount}
              disabled={Boolean(roundId)}
              onChange={(e) => setMineCount(Number(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </FieldLabel>
          {roundId ? (
            <LimeBet onClick={() => void cash()}>Cash out {formatMultiplier(multiplier)}</LimeBet>
          ) : (
            <LimeBet disabled={busy} onClick={() => void start()}>
              Bet
            </LimeBet>
          )}
        </>
      }
      play={
        <div className="mx-auto grid w-full max-w-md grid-cols-5 gap-2">
          {Array.from({ length: 25 }).map((_, i) => {
            const isMine = mines?.includes(i);
            const isSafe = revealed.includes(i);
            return (
              <button
                key={i}
                type="button"
                disabled={!roundId || Boolean(mines) || isSafe}
                onClick={() => void reveal(i)}
                className={`aspect-square rounded-xl transition-colors duration-(--motion-quick) ${
                  isMine ? "bg-destructive/80" : isSafe ? "bg-lime/80" : "bg-tile hover:bg-tile/80"
                }`}
                aria-label={`Tile ${i + 1}`}
              >
                {isMine ? <Bomb /> : isSafe ? <Gem /> : null}
              </button>
            );
          })}
        </div>
      }
    />
  );
}

function Gem() {
  return (
    <svg viewBox="0 0 24 24" className="mx-auto size-1/2 text-primary-foreground" fill="currentColor" aria-hidden>
      <path d="M12 2 4 9l8 13 8-13-8-7zm0 3.2 4.6 4.3L12 18.4 7.4 9.5 12 5.2z" />
    </svg>
  );
}

function Bomb() {
  return (
    <svg viewBox="0 0 24 24" className="mx-auto size-1/2 text-white" fill="currentColor" aria-hidden>
      <circle cx="11" cy="14" r="7" />
      <path d="M14 8.5 17 5l1.5 1.5-2 3z" />
      <rect x="16.5" y="3.2" width="3" height="1.6" rx="0.4" transform="rotate(45 18 4)" />
    </svg>
  );
}
