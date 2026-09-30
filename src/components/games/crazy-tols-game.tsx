import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { liveTable, placeLiveBet, adjustCrazyBet } from "@/lib/live-room";
import { LiveTape } from "@/components/games/live-tape";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { StakeField } from "@/components/games/stake-field";
import { HistoryPill } from "@/components/games/bet-pills";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { useGameTable } from "@/components/games/game-table";
import { cn } from "cn";
import {
  CRAZY_BET_SPOTS,
  CRAZY_WHEEL,
  PACHINKO_SLOTS,
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
  segment: string;
  segmentLabel: string;
  win: boolean;
  multiplier: number;
  topSlot: { segment: string; multiplier: number } | null;
  bonus: Record<string, unknown> | null;
};

type TapeBet = {
  name: string;
  amount: number;
  currency: string;
  pick: string;
  status: string;
  cashMult: number | null;
  payout: number | null;
  mine: boolean;
};

type Phase = "betting" | "locked" | "spin" | "result";

const CHIPS = [1, 5, 10, 25, 100];

function CrazyTable({ gameId }: { gameId: string }) {
  const { currency, balances, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [amount, setAmount] = useState(1);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoOn, setAutoOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openBets, setOpenBets] = useState(true);
  const [spin, setSpin] = useState(0);
  const [result, setResult] = useState<Shown | null>(null);
  const [phase, setPhase] = useState<Phase>("betting");
  const [tape, setTape] = useState<TapeBet[]>([]);
  const [hash, setHash] = useState("");
  const [left, setLeft] = useState(0);
  const [history, setHistory] = useState<{ n: number; label: string }[]>([]);
  const modeRef = useRef(mode);
  const autoOnRef = useRef(false);
  const currencyRef = useRef(currency);
  const joined = useRef(-1);
  const joining = useRef(false);
  const reported = useRef(-1);
  modeRef.current = mode;
  autoOnRef.current = autoOn;
  currencyRef.current = currency;

  useEffect(() => {
    let stop = false;
    let timer = 0;
    const pull = async () => {
      try {
        const snap = await liveTable({ data: { gameId } });
        if (stop) return;
        setTape(snap.bets);
        setHash(snap.hash);
        setLeft(snap.left);
        setHistory(snap.history);
        const seg = 360 / CRAZY_WHEEL.length;
        const outcome = snap.outcome;
        const mine = snap.bets.filter((bet) => bet.mine);
        const stake = mine.reduce((sum, bet) => sum + bet.amount, 0);
        const payout = mine.reduce((sum, bet) => sum + (bet.payout ?? 0), 0);
        if ((snap.phase === "running" || snap.phase === "result") && outcome) {
          const wheelIndex = Number(outcome.wheelIndex);
          setPhase(snap.phase === "running" ? "spin" : "result");
          setSpin(360 * 5 + (360 - (wheelIndex * seg + seg / 2)));
          setResult({
            wheelIndex,
            segment: String(outcome.segment ?? ""),
            segmentLabel: String(outcome.segmentLabel ?? ""),
            win: snap.phase === "result" && payout > 0,
            multiplier: stake > 0 ? payout / stake : 0,
            topSlot: (outcome.topSlot as Shown["topSlot"]) ?? null,
            bonus: (outcome.bonus as Shown["bonus"]) ?? null,
          });
          if (snap.phase === "result" && mine.length > 0 && reported.current !== snap.n) {
            reported.current = snap.n;
            reportRound({
              win: payout > 0,
              label: String(outcome.segmentLabel ?? "Crazy"),
              stake,
              payout,
              multiplier: stake > 0 ? payout / stake : 0,
              view: { kind: "crazy", segment: String(outcome.segmentLabel ?? "") },
            });
            if (payout > 0) {
              playSfx("win");
              toast.success(`Won ${formatMoney(payout, currencyRef.current)}`);
            }
          }
        } else if (snap.phase === "locked") {
          setPhase("locked");
        } else {
          setPhase("betting");
          setSpin(0);
          setResult(null);
          const covered = snap.bets.some((bet) => bet.mine);
          if (autoOnRef.current && !covered && joined.current !== snap.n && !joining.current) {
            joining.current = true;
            void adjustCrazyBet({ data: { gameId, action: "rebet" } })
              .then((res) => {
                joined.current = snap.n;
                applyBalances(res.balances);
                setTape(res.snap.bets);
              })
              .catch(() => {
                joined.current = snap.n;
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

  const closed = phase !== "betting";
  const mineOn = (id: string) =>
    tape.filter((bet) => bet.mine && bet.pick === id).reduce((sum, bet) => sum + bet.amount, 0);

  async function place(spot: CrazyBetSpot) {
    if (closed || busy) return;
    setBusy(true);
    try {
      const res = await placeLiveBet({ data: { gameId, currency, amount, pick: spot } });
      joined.current = res.snap.n;
      setTape(res.snap.bets);
      applyBalances(res.balances);
      playSfx("click");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  async function adjust(action: "undo" | "clear" | "double" | "rebet") {
    if (closed || busy) return;
    setBusy(true);
    try {
      const res = await adjustCrazyBet({ data: { gameId, action } });
      setTape(res.snap.bets);
      applyBalances(res.balances);
      playSfx("click");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GameShell
      controls={
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
                onClick={() => {
                  setMode(tab);
                  if (tab !== "auto") setAutoOn(false);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <StakeField amount={amount} setAmount={setAmount} disabled={busy || closed} hint="Chip" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1">
            {(
              [
                ["undo", "Undo"],
                ["clear", "Clear"],
                ["double", "Double"],
                ["rebet", "Rebet"],
              ] as const
            ).map(([action, label]) => (
              <button
                key={action}
                type="button"
                disabled={busy || closed}
                onClick={() => void adjust(action)}
                className="h-9 rounded-md bg-[#202329] text-xs font-semibold text-white disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>
          {mode === "auto" ? (
            <button
              type="button"
              disabled={!autoOn && busy}
              onClick={() => setAutoOn((on) => !on)}
              className="mt-4 flex h-[54px] w-full items-center justify-center rounded-md bg-lime text-sm font-medium text-black disabled:opacity-60"
            >
              {autoOn ? "Stop Autobet" : "Start Autobet"}
            </button>
          ) : null}
          <p className="mt-3 text-xs text-[#9ba5b4]">
            {phase === "betting"
              ? `Bets open · ${Math.ceil(left / 1000)}s`
              : phase === "locked"
                ? "Bets closed"
                : phase === "spin"
                  ? "Wheel spinning"
                  : "Result"}
            {" · "}
            {formatMoney(balances[currency], currency)} {currency}
          </p>
          <BetList tape={tape} open={openBets} setOpen={setOpenBets} currency={currency} />
        </div>
      }
      play={
        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex w-full max-w-[520px] gap-1 overflow-x-auto">
            {history.map((item) => (
              <HistoryPill key={item.n} label={item.label} />
            ))}
          </div>
          <TopSlot result={result} phase={phase} />
          <WheelView spin={spin} phase={phase} result={result} />
          <Felt
            closed={closed}
            busy={busy}
            chip={amount}
            setChip={setAmount}
            mineOn={mineOn}
            landed={phase === "result" ? result?.segment ?? null : null}
            onPlace={(spot) => void place(spot)}
          />
          {result?.bonus && phase === "result" ? (
            <BonusStage bonus={result.bonus} label={result.segmentLabel} />
          ) : null}
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

function BetList({
  tape,
  open,
  setOpen,
  currency,
}: {
  tape: TapeBet[];
  open: boolean;
  setOpen: (v: boolean | ((open: boolean) => boolean)) => void;
  currency: string;
}) {
  const total = tape.reduce((sum, bet) => sum + bet.amount, 0);
  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col gap-1">
      <button
        type="button"
        className="grid h-12 w-full grid-cols-[max-content_auto] items-center rounded-md bg-[#202329] px-4 text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Bets: {tape.length}</span>
        <span className="flex items-center justify-end gap-2 tabular-nums">
          {formatMoney(total, currency as "USDT")} {currency}
        </span>
      </button>
      {open ? (
        <div className="flex min-h-36 flex-1 flex-col overflow-y-auto rounded-lg border border-[#2a2e38]">
          {tape.length === 0 ? (
            <p className="grid flex-1 place-items-center text-sm font-medium text-[#4d5361]">No players</p>
          ) : (
            <ul>
              {tape.map((bet, i) => (
                <li
                  key={`${bet.name}-${bet.pick}-${i}`}
                  className={cn("flex items-center justify-between gap-2 px-3 py-1.5 text-xs", bet.mine && "bg-lime/10")}
                >
                  <span className="truncate">{bet.name}</span>
                  <span className="tabular-nums text-[#9ba5b4]">
                    {CRAZY_BET_SPOTS.find((s) => s.id === bet.pick)?.label ?? bet.pick}
                  </span>
                  <span className={cn("tabular-nums", bet.status === "won" ? "text-lime" : bet.status === "lost" ? "text-[#ff8b7b]" : "text-white")}>
                    {formatMoney(bet.amount, currency as "USDT")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Felt({
  closed,
  busy,
  chip,
  setChip,
  mineOn,
  landed,
  onPlace,
}: {
  closed: boolean;
  busy: boolean;
  chip: number;
  setChip: (n: number) => void;
  mineOn: (id: string) => number;
  landed: string | null;
  onPlace: (spot: CrazyBetSpot) => void;
}) {
  const numbers = CRAZY_BET_SPOTS.filter((s) => s.id === "1" || s.id === "2" || s.id === "5" || s.id === "10");
  const bonuses = CRAZY_BET_SPOTS.filter((s) => s.id !== "1" && s.id !== "2" && s.id !== "5" && s.id !== "10");
  return (
    <div className="grid w-full max-w-[520px] gap-1.5">
      <div className="grid grid-cols-4 gap-1.5">
        {numbers.map((s) => (
          <Spot key={s.id} spot={s} mine={mineOn(s.id)} hot={landed === s.id} disabled={closed || busy} onPlace={onPlace} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {bonuses.map((s) => (
          <Spot key={s.id} spot={s} mine={mineOn(s.id)} hot={landed === s.id} disabled={closed || busy} onPlace={onPlace} tall />
        ))}
      </div>
      <div className="mt-1 flex items-center justify-center gap-1.5">
        {CHIPS.map((value) => (
          <button
            key={value}
            type="button"
            disabled={closed || busy}
            onClick={() => setChip(value)}
            className={cn(
              "grid size-10 place-items-center rounded-full font-heading text-xs font-bold",
              chip === value ? "bg-lime text-black" : "bg-[#241c30] text-white",
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function Spot({
  spot,
  mine,
  hot,
  disabled,
  tall,
  onPlace,
}: {
  spot: (typeof CRAZY_BET_SPOTS)[number];
  mine: number;
  hot: boolean;
  disabled: boolean;
  tall?: boolean;
  onPlace: (spot: CrazyBetSpot) => void;
}) {
  const ink = DARK_INK.has(spot.id) ? "#141018" : "#fff";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPlace(spot.id)}
      className={cn(
        "relative rounded-lg px-1 font-heading font-bold disabled:opacity-60",
        tall ? "h-16" : "h-14",
        hot && "ring-2 ring-white",
      )}
      style={{ background: SEG_COLOR[spot.id], color: ink }}
    >
      <span className={cn("block leading-none", tall ? "text-sm" : "text-xl")}>{spot.label}</span>
      <span className="mt-0.5 block text-[0.6rem] font-medium opacity-80">{spot.blurb}</span>
      {mine > 0 ? (
        <span className="absolute -top-2 right-1 rounded-full bg-black px-1.5 py-0.5 text-[0.65rem] text-lime tabular-nums">
          {mine}
        </span>
      ) : null}
    </button>
  );
}

function TopSlot({ result, phase }: { result: Shown | null; phase: string }) {
  const slot = result?.topSlot;
  const tone = slot ? SEG_COLOR[slot.segment] : null;
  const ink = slot && DARK_INK.has(slot.segment) ? "#141018" : "#fff";
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#1a1424] px-2 py-1">
      <span className="font-sub pl-2 text-[0.6rem] tracking-[0.14em] text-white/50 uppercase">Top Slot</span>
      {slot && tone ? (
        <span className="flex items-center gap-1.5 rounded-full py-0.5 pr-2 pl-1" style={{ background: tone, color: ink }}>
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-black/25 px-1.5 font-heading text-sm font-bold">
            {SHORT[slot.segment] ?? slot.segment}
          </span>
          <span className="font-heading text-base font-bold tabular-nums">{slot.multiplier}×</span>
        </span>
      ) : phase === "spin" ? (
        <span className="font-heading px-2 text-sm font-bold text-lime animate-pulse">SPIN</span>
      ) : (
        <span className="px-2 text-xs text-white/40">waiting</span>
      )}
    </div>
  );
}

const SEG_COLOR: Record<string, string> = {
  "1": "#904bf9",
  "2": "#00ffbd",
  "5": "#ea2fd4",
  "10": "#ff8904",
  coinflip: "#f4efe4",
  cashhunt: "#34edcd",
  pachinko: "#ff5b79",
  crazy: "#e11d48",
};

const SHORT: Record<string, string> = {
  "1": "1",
  "2": "2",
  "5": "5",
  "10": "10",
  coinflip: "FLIP",
  cashhunt: "HUNT",
  pachinko: "PACH",
  crazy: "TIME",
};

const DARK_INK = new Set(["2", "10", "coinflip", "cashhunt"]);

function WheelView({ spin, phase, result }: { spin: number; phase: string; result: Shown | null }) {
  const wheel = CRAZY_WHEEL;
  const n = wheel.length;
  const segAngle = 360 / n;
  const R_OUT = 136;
  const R_IN = 58;
  const cx = 160;
  const cy = 160;
  const [angle, setAngle] = useState(0);
  const angleRef = useRef(0);
  const targetRef = useRef(0);

  useEffect(() => {
    if (phase === "betting") {
      targetRef.current = 0;
      angleRef.current = 0;
      setAngle(0);
      return;
    }
    if (targetRef.current === spin) return;
    targetRef.current = spin;
    const from = angleRef.current;
    const to = spin;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 2600);
      const e = 1 - (1 - t) ** 3;
      const next = from + (to - from) * e;
      angleRef.current = next;
      setAngle(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spin, phase]);

  const toXY = (r: number, aDeg: number) => {
    const a = ((aDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  return (
    <div className="relative aspect-square w-full max-w-[520px]">
      <svg viewBox="0 0 320 320" className="size-full">
        <circle cx={cx} cy={cy} r={148} fill="#1c0529" />
        <circle cx={cx} cy={cy} r={144} fill="none" stroke="#00ffbd" strokeWidth="3" />
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "160px 160px" }}>
          {wheel.map((s, i) => {
            const a0 = i * segAngle;
            const a1 = a0 + segAngle;
            const [x0, y0] = toXY(R_OUT, a0);
            const [x1, y1] = toXY(R_OUT, a1);
            const [xi1, yi1] = toXY(R_IN, a1);
            const [xi0, yi0] = toXY(R_IN, a0);
            const won = phase === "result" && result?.wheelIndex === i;
            return (
              <path
                key={i}
                d={`M ${x0} ${y0} A ${R_OUT} ${R_OUT} 0 0 1 ${x1} ${y1} L ${xi1} ${yi1} A ${R_IN} ${R_IN} 0 0 0 ${xi0} ${yi0} Z`}
                fill={s.color}
                stroke={won ? "#00ffbd" : "rgba(0,0,0,0.55)"}
                strokeWidth={won ? 1.8 : 0.6}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={R_IN - 1} fill="#1c0529" stroke="#904bf9" strokeWidth="3" />
        </g>
        {wheel.map((s, i) => {
          const mid = i * segAngle + segAngle / 2 + angle;
          const number = s.type === "1" || s.type === "2" || s.type === "5" || s.type === "10";
          const rText = number ? 112 : 104;
          const [tx, ty] = toXY(rText, mid);
          const ink = DARK_INK.has(s.type) ? "#141018" : "#fff";
          return (
            <text
              key={s.type + i}
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Oswald, sans-serif"
              fontSize={number ? (s.type === "10" ? 12 : 14) : 7}
              fontWeight="700"
              fill={ink}
              stroke={ink === "#fff" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.45)"}
              strokeWidth="0.7"
              paintOrder="stroke"
            >
              {number ? s.type : SHORT[s.type]}
            </text>
          );
        })}
        <circle cx={cx} cy={cy} r="22" fill="#0d0d10" stroke="#00ffbd" strokeWidth="2.5" />
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Oswald, sans-serif"
          fontSize="11"
          fontWeight="700"
          fill="#00ffbd"
        >
          TOLS
        </text>
        <path d={`M ${cx - 11} 4 L ${cx + 11} 4 L ${cx} 26 Z`} fill="#00ffbd" stroke="#0d0d10" strokeWidth="1" />
      </svg>
    </div>
  );
}

function BonusStage({ bonus, label }: { bonus: Record<string, unknown>; label: string }) {
  const kind = String(bonus.kind ?? "");
  const value = Number(bonus.multiplier ?? bonus.value ?? 0);
  return (
    <section className="w-full max-w-[520px] rounded-xl border border-lime/40 bg-[#16121c] p-3">
      <p className="font-heading text-center text-sm font-bold tracking-[0.16em] text-lime uppercase">{label}</p>
      {kind === "coinflip" ? <CoinFlip bonus={bonus} value={value} /> : null}
      {kind === "pachinko" ? <Pachinko bonus={bonus} value={value} /> : null}
      {kind === "cashhunt" ? <CashHunt bonus={bonus} value={value} /> : null}
      {kind === "crazy" ? <CrazyBonus bonus={bonus} value={value} /> : null}
    </section>
  );
}

function CoinFlip({ bonus, value }: { bonus: Record<string, unknown>; value: number }) {
  const side = String(bonus.side ?? "blue");
  const blue = Number(bonus.blue ?? 0);
  const red = Number(bonus.red ?? 0);
  return (
    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <Tile title="Blue" mult={blue} on={side === "blue"} tone="#1d63ff" />
      <div
        className="grid size-16 place-items-center rounded-full border-2 border-white/80 font-heading text-xs font-bold text-white shadow-lg"
        style={{
          background: side === "blue" ? "#1d63ff" : "#e11d48",
          animation: "tols-coin 0.8s ease-out",
        }}
      >
        {side === "blue" ? "B" : "R"}
      </div>
      <Tile title="Red" mult={red} on={side === "red"} tone="#e11d48" />
      <p className="col-span-3 text-center font-heading text-lg font-bold text-lime tabular-nums">{value}×</p>
      <style>{`@keyframes tols-coin { from { transform: rotateY(0deg); } to { transform: rotateY(720deg); } }`}</style>
    </div>
  );
}

function Tile({ title, mult, on, tone }: { title: string; mult: number; on: boolean; tone: string }) {
  return (
    <div
      className={cn("rounded-lg px-2 py-3 text-center", on ? "ring-2 ring-lime" : "opacity-70")}
      style={{ background: tone }}
    >
      <p className="text-[0.65rem] font-bold tracking-widest text-white/80 uppercase">{title}</p>
      <p className="font-heading text-2xl font-bold text-white tabular-nums">{mult}×</p>
    </div>
  );
}

function Pachinko({ bonus, value }: { bonus: Record<string, unknown>; value: number }) {
  const slot = Number(bonus.slot ?? 0);
  const doubles = Number(bonus.doubles ?? 0);
  return (
    <div className="mt-2">
      <div className="mb-2 flex justify-center gap-3">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="size-1.5 rounded-full bg-white/35" />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-[repeat(18,minmax(0,1fr))] gap-px">
        {PACHINKO_SLOTS.map((v, i) => {
          const on = i === slot;
          const dbl = v === 0;
          return (
            <div
              key={i}
              className={cn(
                "relative grid h-7 place-items-center rounded-sm font-heading text-[0.6rem] font-bold leading-none tabular-nums",
                on ? "bg-lime text-black" : dbl ? "bg-[#ea2fd4] text-white" : "bg-[#241c30] text-white",
              )}
            >
              {on ? (
                <span className="absolute -top-2 size-2.5 rounded-full border border-black/40 bg-white" />
              ) : null}
              {dbl ? "2×" : v}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center font-heading text-lg font-bold text-lime tabular-nums">
        {value}×{doubles > 0 ? ` · ${doubles} double${doubles > 1 ? "s" : ""}` : ""}
      </p>
    </div>
  );
}

function CashHunt({ bonus, value }: { bonus: Record<string, unknown>; value: number }) {
  const cell = Number(bonus.cell ?? 0);
  return (
    <div className="relative mt-2">
      <div className="grid grid-cols-12 gap-px">
        {Array.from({ length: 108 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-[2px]",
              i === cell ? "bg-lime" : "bg-[#2a2236]",
            )}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="rounded-lg bg-black/80 px-3 py-1 font-heading text-2xl font-bold text-lime tabular-nums">
          {value}×
        </span>
      </div>
    </div>
  );
}

const CRAZY_GROUPS: { label: string; n: number; color: string; ink: string }[] = [
  { label: "10", n: 12, color: "#904bf9", ink: "#fff" },
  { label: "15", n: 13, color: "#00ffbd", ink: "#141018" },
  { label: "20", n: 7, color: "#ea2fd4", ink: "#fff" },
  { label: "25", n: 8, color: "#ff8904", ink: "#141018" },
  { label: "50", n: 6, color: "#ff5b79", ink: "#fff" },
  { label: "100", n: 2, color: "#e11d48", ink: "#fff" },
  { label: "2×", n: 16, color: "#f4efe4", ink: "#141018" },
];

function CrazyBonus({ bonus, value }: { bonus: Record<string, unknown>; value: number }) {
  const doubles = Number(bonus.doubles ?? 0);
  const idx = Number(bonus.wheelIndex ?? 0);
  const base = doubles > 0 ? value / 2 ** doubles : value;
  const spin = 360 * 3 + (360 - (idx + 0.5) * (360 / 64));
  const cx = 100;
  const cy = 100;
  let cursor = 0;
  return (
    <div className="mt-2 flex flex-col items-center gap-2">
      <svg viewBox="0 0 200 200" className="w-full max-w-[240px]">
        <g
          style={{
            transform: `rotate(${spin}deg)`,
            transformOrigin: "100px 100px",
            transition: "transform 1.8s cubic-bezier(0.12, 0.72, 0.08, 1)",
          }}
        >
          {CRAZY_GROUPS.map((g) => {
            const a0 = cursor;
            const sweep = (g.n / 64) * 360;
            cursor += sweep;
            const a1 = a0 + sweep;
            const polar = (r: number, deg: number) => {
              const a = ((deg - 90) * Math.PI) / 180;
              return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
            };
            const [x0, y0] = polar(78, a0);
            const [x1, y1] = polar(78, a1);
            const large = sweep > 180 ? 1 : 0;
            const mid = a0 + sweep / 2;
            const [tx, ty] = polar(g.label.length > 2 ? 50 : 54, mid);
            return (
              <g key={g.label}>
                <path
                  d={`M ${cx} ${cy} L ${x0} ${y0} A 78 78 0 ${large} 1 ${x1} ${y1} Z`}
                  fill={g.color}
                  stroke="#0d0d10"
                  strokeWidth="0.8"
                />
                <text
                  x={tx}
                  y={ty}
                  transform={`rotate(${mid - 90} ${tx} ${ty})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Oswald, sans-serif"
                  fontSize={g.label.length > 2 ? 11 : 16}
                  fontWeight="700"
                  fill={g.ink}
                >
                  {g.label}
                </text>
              </g>
            );
          })}
        </g>
        <path d="M 90 6 L 110 6 L 100 20 Z" fill="#00ffbd" />
        <circle cx={cx} cy={cy} r="16" fill="#0d0d10" stroke="#00ffbd" strokeWidth="2" />
      </svg>
      <p className="font-heading text-2xl font-bold text-lime tabular-nums">
        {Number.isInteger(base) ? base : base.toFixed(0)}×
        {doubles > 0 ? ` × ${2 ** doubles}` : ""} = {value}×
      </p>
    </div>
  );
}