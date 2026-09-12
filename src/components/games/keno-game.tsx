import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { StakeField } from "@/components/games/stake-field";
import { playKeno } from "@/lib/casino-api";
import { useWallet } from "@/lib/wallet-context";
import { CURRENCY_META, type Currency } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { formatKenoX, KENO_PAY, KENO_RISK, type KenoRisk } from "@/lib/keno-pay";
import { cn } from "cn";

const RISKS: KenoRisk[] = ["low", "classic", "normie", "degen"];

const RISK_TONE = {
  low: {
    hint: "0.7× safer",
    idle: "bg-sky-400/15 text-sky-400 hover:bg-sky-400/25",
    on: "bg-sky-400 text-black",
    bet: "bg-sky-400 text-black hover:bg-sky-300",
  },
  classic: {
    hint: "1× standard",
    idle: "bg-lime/15 text-lime hover:bg-lime/25",
    on: "bg-lime text-black",
    bet: "bg-lime text-black hover:bg-lime-400",
  },
  normie: {
    hint: "1.25× spicy",
    idle: "bg-gold/15 text-gold hover:bg-gold/25",
    on: "bg-gold text-black",
    bet: "bg-gold text-black hover:bg-amber-300",
  },
  degen: {
    hint: "1.7× max",
    idle: "bg-primary/25 text-primary-bright hover:bg-primary/35",
    on: "bg-primary text-lime",
    bet: "bg-primary text-lime hover:bg-primary/90",
  },
} as const;

export function KenoGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <KenoTable gameId={gameId} />
    </PlayGate>
  );
}

function KenoTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const meta = CURRENCY_META[currency];
  const [picks, setPicks] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [hits, setHits] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);
  const [risk, setRisk] = useState<KenoRisk>("classic");
  const [busy, setBusy] = useState(false);

  function toggle(n: number) {
    if (busy) return;
    setDrawn([]);
    setHits(null);
    setPicks((p) => {
      if (p.includes(n)) return p.filter((x) => x !== n);
      if (p.length >= 10) return p;
      playSfx("click");
      return [...p, n].sort((a, b) => a - b);
    });
  }

  function autoPick() {
    playSfx("click");
    const next: number[] = [];
    while (next.length < 8) {
      const n = 1 + Math.floor(Math.random() * 40);
      if (!next.includes(n)) next.push(n);
    }
    setPicks(next.sort((a, b) => a - b));
    setDrawn([]);
    setHits(null);
  }

  async function play() {
    if (picks.length < 1) {
      toast.message("Select 1–10 numbers");
      return;
    }
    setBusy(true);
    setDrawn([]);
    setHits(null);
    try {
      const res = await playKeno({ data: { gameId, currency, amount, picks, risk } });
      applyBalances(res.balances);
      const step = speedDelay("step");
      if (step <= 0) {
        setDrawn(res.drawn);
      } else {
        const acc: number[] = [];
        for (const n of res.drawn) {
          acc.push(n);
          setDrawn([...acc]);
          playSfx(picks.includes(n) ? "hit" : "tick");
          await sleep(step);
        }
      }
      setHits(res.hits);
      reportRound({
        win: res.payout > 0,
        label: `${res.hits} hits`,
        stake: amount,
        payout: res.payout,
        multiplier: amount ? res.payout / amount : 0,
        view: { kind: "keno", hits: res.hits, picks: picks.length, selected: picks, drawn: res.drawn },
        replay: () => {
          setDrawn(res.drawn);
          setHits(res.hits);
        },
      });
      if (res.payout > 0) toast.success(`${res.hits} hits · ${formatMoney(res.payout, currency)}`);
      else toast.message(`${res.hits} hits`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} />
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Risk · {RISK_TONE[risk].hint}</p>
            <div className="grid grid-cols-4 gap-1">
              {RISKS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={cn(
                    "flex h-11 flex-col items-center justify-center rounded-lg leading-none",
                    risk === r ? RISK_TONE[r].on : RISK_TONE[r].idle,
                  )}
                  onClick={() => {
                    setRisk(r);
                    playSfx("click");
                  }}
                >
                  <span className="text-[0.65rem] font-bold capitalize">{r}</span>
                  <span className="mt-0.5 text-[0.55rem] opacity-80">{RISK_TONE[r].hint.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
          <LimeBet disabled={busy} onClick={() => void play()} className={RISK_TONE[risk].bet}>
            Bet
          </LimeBet>
        </>
      }
      play={
        <div className="mx-auto flex w-full max-w-lg flex-col items-stretch gap-3">
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => {
              const selected = picks.includes(n);
              const hit = drawn.includes(n) && selected;
              const house = drawn.includes(n) && !selected;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggle(n)}
                  className={cn(
                    "aspect-square rounded-lg text-xs font-semibold tabular-nums",
                    hit
                      ? "keno-hit"
                      : house
                        ? "keno-house"
                        : selected
                          ? "keno-pick"
                          : "keno-idle hover:brightness-125",
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <KenoLegend />
          <KenoPaytable picks={picks.length} risk={risk} hits={hits} amount={amount} currency={currency} />
          <p className="text-center text-xs text-muted-foreground">
            {hits !== null ? `${hits} hits this round` : `${picks.length}/10 picks`}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-11" onClick={autoPick} disabled={busy}>
              Auto pick
            </Button>
            <Button
              variant="outline"
              className="h-11"
              disabled={busy}
              onClick={() => {
                setPicks([]);
                setDrawn([]);
                setHits(null);
              }}
            >
              Clear table
            </Button>
          </div>
        </div>
      }
    />
  );
}

function KenoLegend() {
  return (
    <ul className="flex flex-wrap justify-center gap-3 text-[0.65rem] text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm keno-pick" /> Pick
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm keno-hit" /> Hit
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm keno-house" /> Drawn
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm keno-idle" /> Empty
      </li>
    </ul>
  );
}

function KenoPaytable({
  picks,
  risk,
  hits,
  amount,
  currency,
}: {
  picks: number;
  risk: KenoRisk;
  hits: number | null;
  amount: number;
  currency: Currency;
}) {
  const n = picks > 0 ? picks : 8;
  const table = KENO_PAY[n] ?? [0];
  const scale = KENO_RISK[risk];
  const maxX = Math.max(...table) * scale;
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="mb-1.5 text-center text-[0.65rem] text-muted-foreground">
        {picks > 0 ? `${n} pick${n === 1 ? "" : "s"}` : "Paytable · 8 picks"} · {risk}
        {scale === 1 ? "" : ` · ${scale}× risk`} · max {formatKenoX(maxX)}
      </p>
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {table.map((base, hit) => {
          const x = base * scale;
          const on = hits === hit;
          return (
            <div
              key={hit}
              className={cn(
                "min-w-11 flex-1 rounded-md px-1 py-1 text-center",
                on && x > 0 && "bg-lime text-black",
                on && x <= 0 && "bg-muted text-muted-foreground ring-1 ring-border",
                !on && x > 0 && "bg-transparent text-lime ring-2 ring-lime",
                !on && x <= 0 && "bg-muted/60 text-muted-foreground",
              )}
            >
              <p className="text-[0.55rem] font-medium tracking-wide uppercase opacity-70">
                {hit} hit{hit === 1 ? "" : "s"}
              </p>
              <p className="text-[0.75rem] font-bold tabular-nums">{formatKenoX(x)}</p>
            </div>
          );
        })}
      </div>
      {picks > 0 && amount > 0 ? (
        <p className="mt-1.5 text-center text-[0.65rem] tabular-nums text-muted-foreground">
          {hits != null
            ? `${hits} hits pay ${formatKenoX((table[hits] ?? 0) * scale)} · ${formatMoney(amount * (table[hits] ?? 0) * scale, currency)} ${currency}`
            : `Catch all ${n} → ${formatKenoX(maxX)} · ${formatMoney(amount * maxX, currency)} ${currency}`}
        </p>
      ) : null}
    </div>
  );
}
