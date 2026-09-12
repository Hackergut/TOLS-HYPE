import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { formatMoney } from "@/lib/format";
import { CURRENCY_META } from "@/lib/games-catalog";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { SLOT_SYMBOLS, type SlotSymbol } from "@/lib/rng";

export function SlotsGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <SlotsTable gameId={gameId} />
    </PlayGate>
  );
}

function SlotsTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const meta = CURRENCY_META[currency];
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>(["A", "K", "Q"]);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(meta.minBet);

  async function play() {
    setBusy(true);
    try {
      playSfx("spin");
      const res = await playInstant({ data: { gameId, currency, amount } });
      applyBalances(res.balances);
      const next = res.detail.reels as [SlotSymbol, SlotSymbol, SlotSymbol];
      const reel = speedDelay("reel");
      if (reel > 0) {
        const spins = reel > 40 ? 10 : 5;
        for (let i = 0; i < spins; i += 1) {
          setReels([
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!,
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!,
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!,
          ]);
          playSfx("tick");
          await sleep(reel);
        }
      }
      setReels(next);
      reportRound({
        win: res.payout > 0,
        label: next.join(" "),
        stake: amount,
        payout: res.payout,
        multiplier: amount ? res.payout / amount : 0,
        fair: res.fair,
        view: { kind: "slots", reels: next },
        replay: () => setReels(next),
      });
      if (res.payout > 0) toast.success(`Won ${formatMoney(res.payout, currency)} ${currency}`);
      else toast.message("No line");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Spin failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} disabled={busy} />
          <p className="text-xs text-muted-foreground">
            Three of a kind pays 5–25x. Two matching symbols pay 1.5x.
          </p>
          <LimeBet disabled={busy} onClick={() => void play()}>
            Bet
          </LimeBet>
        </>
      }
      play={
        <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-3">
          {reels.map((s, i) => (
            <div
              key={`${s}-${i}`}
              className="grid aspect-3/4 place-items-center rounded-xl bg-tile font-heading text-3xl font-semibold"
            >
              {s}
            </div>
          ))}
        </div>
      }
    />
  );
}
