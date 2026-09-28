import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { liveTable, placeLiveBet } from "@/lib/live-room";
import { LiveTape } from "@/components/games/live-tape";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { cn } from "cn";
import {
  CRAZY_BET_SPOTS,
  CRAZY_WHEEL,
  type CrazyBetSpot,
} from "@/lib/crazy-tols";

export function CrazyTolsGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <CrazyTable gameId={gameId} />
    </PlayGate>
  );
}

type Shown = {
  wheelIndex: number;
  segmentLabel: string;
  win: boolean;
  multiplier: number;
  topSlot: { segment: string; multiplier: number } | null;
  bonus: Record<string, unknown> | null;
};

function CrazyTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [spot, setSpot] = useState<CrazyBetSpot>("1");
  const [amount, setAmount] = useState(0);
  const [armed, setArmed] = useState(true);
  const [left, setLeft] = useState(8);
  const [spin, setSpin] = useState(0);
  const [result, setResult] = useState<Shown | null>(null);
  const [phase, setPhase] = useState<"betting" | "spin" | "result">("betting");
  const [tape, setTape] = useState<{ name: string; amount: number; currency: string; pick: string; status: string; cashMult: number | null; payout: number | null; mine: boolean }[]>([]);
  const [hash, setHash] = useState("");
  const spotRef = useRef(spot);
  const amountRef = useRef(amount);
  const armedRef = useRef(armed);
  const currencyRef = useRef(currency);
  const joined = useRef(-1);
  const joining = useRef(false);
  const reported = useRef(-1);
  spotRef.current = spot;
  amountRef.current = amount;
  armedRef.current = armed;
  currencyRef.current = currency;

  useEffect(() => {
    let stop = false;
    let timer = 0;
    const pull = async () => {
      try {
        const snap = await liveTable({ data: { gameId } });
        if (stop) return;
        setLeft(Math.max(0, Math.ceil(snap.left / 1000)));
        setTape(snap.bets);
        setHash(snap.hash);
        const seg = 360 / CRAZY_WHEEL.length;
        const outcome = snap.outcome;
        if ((snap.phase === "running" || snap.phase === "result") && outcome) {
          const wheelIndex = Number(outcome.wheelIndex);
          setPhase(snap.phase === "running" ? "spin" : "result");
          setSpin(360 * 5 + (360 - wheelIndex * seg));
          const paid = snap.phase === "result" && (snap.you?.payout ?? 0) > 0;
          setResult({
            wheelIndex,
            segmentLabel: String(outcome.segmentLabel ?? ""),
            win: paid,
            multiplier: paid && snap.you?.amount ? (snap.you.payout ?? 0) / snap.you.amount : 0,
            topSlot: (outcome.topSlot as Shown["topSlot"]) ?? null,
            bonus: (outcome.bonus as Shown["bonus"]) ?? null,
          });
          if (snap.phase === "result" && snap.you && reported.current !== snap.n) {
            reported.current = snap.n;
            const payout = snap.you.payout ?? 0;
            reportRound({
              win: payout > 0,
              label: String(outcome.segmentLabel ?? "Crazy"),
              stake: snap.you.amount,
              payout,
              multiplier: snap.you.amount > 0 ? payout / snap.you.amount : 0,
              view: { kind: "crazy", segment: String(outcome.segmentLabel ?? "") },
            });
            if (payout > 0) {
              playSfx("win");
              toast.success(`Won ${formatMoney(payout, currencyRef.current)}`);
            }
          }
        } else {
          setPhase("betting");
          setSpin(0);
          setResult(null);
          if (armedRef.current && amountRef.current > 0 && !snap.you && joined.current !== snap.n && !joining.current) {
            joining.current = true;
            const stake = amountRef.current;
            const chosen = spotRef.current;
            void placeLiveBet({
              data: { gameId, currency: currencyRef.current, amount: stake, pick: chosen },
            })
              .then((res) => {
                joined.current = snap.n;
                applyBalances(res.balances);
              })
              .catch((err) => {
                joined.current = snap.n;
                toast.error(err instanceof Error ? err.message : "Bet missed the wheel");
              })
              .finally(() => {
                joining.current = false;
              });
          }
        }
      } catch {
        // next poll retries
      } finally {
        if (!stop) timer = window.setTimeout(pull, 400);
      }
    };
    void pull();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [applyBalances, gameId, reportRound]);

  return (
    <GameShell
      controls={
        <>
          <LimeBet disabled={phase !== "betting"} onClick={() => setArmed((v) => !v)}>
            {phase === "betting" ? (armed ? `In · ${left}s` : `Sit out · ${left}s`) : phase === "spin" ? "Live spin" : "Result"}
          </LimeBet>
          <div className="space-y-3">
            <StakeField amount={amount} setAmount={setAmount} />
            <FieldLabel label="Bet spot">
              <div className="grid grid-cols-2 gap-1.5">
                {CRAZY_BET_SPOTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={phase !== "betting"}
                    onClick={() => setSpot(s.id)}
                    className={cn(
                      "h-10 rounded-lg border text-xs font-bold transition-colors",
                      spot === s.id
                        ? "border-lime bg-lime text-black"
                        : "border-border bg-muted/50 text-foreground hover:border-lime/50",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </FieldLabel>
            <p className="text-xs text-muted-foreground">
              {CRAZY_BET_SPOTS.find((s) => s.id === spot)?.blurb} · stake {formatMoney(amount, currency)} {currency}
            </p>
          </div>
        </>
      }
      play={
        <div className="flex flex-col items-center gap-4">
          <TopSlot result={result} phase={phase} />
          <WheelView spin={spin} phase={phase} result={result} />
          {result?.bonus ? <BonusPanel bonus={result.bonus} label={result.segmentLabel} /> : null}
          {result && !result.bonus && phase === "result" && (
            <p className={cn("font-heading text-lg font-bold", result.win ? "text-lime" : "text-muted-foreground")}>
              {result.win ? `WIN ${result.multiplier.toFixed(2)}×` : `LANDED ${result.segmentLabel}`}
            </p>
          )}
          <LiveTape bets={tape} hash={hash} />
        </div>
      }
    />
  );
}

function TopSlot({ result, phase }: { result: Shown | null; phase: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
      <span className="font-sub text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">Top Slot</span>
      {result?.topSlot ? (
        <span className="font-heading text-sm font-bold text-lime">
          {result.topSlot.segment} · {result.topSlot.multiplier}×
        </span>
      ) : phase === "spin" ? (
        <span className="font-heading text-sm font-bold animate-pulse text-lime">…</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
      );
}

function WheelView({ spin, phase, result }: { spin: number; phase: string; result: Shown | null }) {
  const wheel = CRAZY_WHEEL;
  const segAngle = 360 / wheel.length;
  const R_OUT = 140;
  const R_IN = 52;
  const [cx, cy] = [150, 150];
  const toXY = (r: number, aDeg: number) => {
    const a = ((aDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  return (
    <div className="relative aspect-square w-full max-w-md">
      <svg viewBox="0 0 300 300" className="size-full">
        <g
          style={{
            transform: `rotate(${spin}deg)`,
            transformOrigin: "150px 150px",
            transition: phase === "betting" ? "none" : "transform 2.4s cubic-bezier(0.12, 0.8, 0.16, 1)",
          }}
        >
          {wheel.map((s, i) => {
            const a0 = i * segAngle;
            const a1 = a0 + segAngle;
            const [x0, y0] = toXY(R_OUT, a0);
            const [x1, y1] = toXY(R_OUT, a1);
            const [xi1, yi1] = toXY(R_IN, a1);
            const [xi0, yi0] = toXY(R_IN, a1 - segAngle);
            const mid = (a0 + a1) / 2;
            const big = segAngle > 180 ? 1 : 0;
            return (
              <g key={i}>
                <path
                  d={`M ${x0} ${y0} A ${R_OUT} ${R_OUT} 0 ${big} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${R_IN} ${R_IN} 0 ${big} 0 ${xi0} ${yi0} Z`}
                  fill={s.color}
                />
                <text
                  x={cx + 96 * Math.cos(((mid - 90) * Math.PI) / 180)}
                  y={cy + 96 * Math.sin(((mid -90) * Math.PI) / 180)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={s.label.length > 3 ? 7 : 14}
                  fontWeight="bold"
                  fill="#fff"
                >
                  {s.label}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={R_IN} fill="#0c0c10" stroke="#e8b84a" strokeWidth="4" />
        </g>
        <circle cx={cx} cy={cy} r="18" fill="#0c0c10" stroke="var(--lime)" strokeWidth="3" />
        <text x={cx} y={cy - 1} textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--lime)" fontFamily="Oswald, sans-serif">
          TOLS
        </text>
        {/* pointer at top */}
        <path d={`M ${cx - 7} 6 L ${cx + 7} 6 L ${cx} 22 Z`} fill="var(--lime)" />
      </svg>
      {result && phase === "done" ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="rounded-lg bg-black/70 px-3 py-1 font-heading text-lg font-bold text-lime">
            {result.segmentLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function BonusPanel({ bonus, label }: { bonus: Record<string, unknown>; label: string }) {
  const kind = String(bonus.kind ?? "");
  const value = Number(bonus.multiplier ?? bonus.value ?? 0);
  return (
    <section className="sb-card grid w-full max-w-md gap-2 p-4 text-center">
      <p className="font-sub text-[0.65rem] tracking-[0.14em] text-lime uppercase">{label}</p>
      {kind === "coinflip" ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-blue-500/20 px-3 py-2">
            <p className="text-[0.6rem] uppercase text-blue-300">Blue</p>
            <p className="font-heading text-xl font-bold tabular-nums">{String(bonus.blue)}×</p>
          </div>
          <div className="rounded-lg bg-red-500/20 px-3 py-2">
            <p className="text-[0.6rem] uppercase text-red-300">Red</p>
            <p className="font-heading text-xl font-bold tabular-nums">{String(bonus.red)}×</p>
          </div>
          <p className="col-span-2 text-sm font-semibold">
            Coin landed {String(bonus.side)} · <span className="text-lime">{value}×</span>
          </p>
        </div>
      ) : kind === "pachinko" ? (
        <p className="text-sm">
          Puck landed in slot {Number(bonus.slot) + 1} · <span className="text-lime">{value}×</span>
          {Number(bonus.doubles) > 0 ? ` · ${Number(bonus.doubles)} double${Number(bonus.doubles) > 1 ? "s" : ""}` : ""}
        </p>
      ) : kind === "cashhunt" ? (
        <p className="text-sm">
          Cell {Number(bonus.cell) + 1} revealed · <span className="text-lime">{value}×</span>
        </p>
      ) : kind === "crazy" ? (
        <p className="text-sm">
          Bonus wheel {String(bonus.value)}× {Number(bonus.doubles) > 0 ? `· ${Number(bonus.doubles)} doubles` : ""} ·{" "}
          <span className="text-lime">{value}×</span>
        </p>
      ) : null}
    </section>
  );
}