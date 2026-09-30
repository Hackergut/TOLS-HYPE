import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell } from "@/components/games/game-shell";
import { LiveBetDesk } from "@/components/games/live-bet-desk";
import { useWallet } from "@/lib/wallet-context";
import { liveTable, placeLiveBet, type LiveSnap } from "@/lib/live-room";
import { playSfx } from "@/lib/game-sound";
import { HistoryPill } from "@/components/games/bet-pills";
import { formatMultiplier } from "@/lib/format";

export function SlideGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <SlideTable gameId={gameId} />
    </PlayGate>
  );
}

function SlideTable({ gameId }: { gameId: string }) {
  const { currency, balances, applyBalances } = useWallet();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoOn, setAutoOn] = useState(false);
  const [amount, setAmount] = useState(0);
  const [target, setTarget] = useState(2);
  const [phase, setPhase] = useState<LiveSnap["phase"]>("betting");
  const [left, setLeft] = useState(6);
  const [point, setPoint] = useState<number | null>(null);
  const [shown, setShown] = useState(1);
  const [bets, setBets] = useState<LiveSnap["bets"]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [openBets, setOpenBets] = useState(true);
  const [busy, setBusy] = useState(false);
  const modeRef = useRef(mode);
  const autoOnRef = useRef(false);
  const amountRef = useRef(amount);
  const targetRef = useRef(target);
  const currencyRef = useRef(currency);
  const sent = useRef(-1);
  const seen = useRef(-1);
  modeRef.current = mode;
  autoOnRef.current = autoOn;
  amountRef.current = amount;
  targetRef.current = target;
  currencyRef.current = currency;

  useEffect(() => {
    let stop = false;
    let timer = 0;
    const pull = async () => {
      try {
        const snap = await liveTable({ data: { gameId } });
        if (stop) return;
        setPhase(snap.phase);
        setLeft(Math.max(0, Math.round(snap.left / 100) / 10));
        setBets(snap.bets);
        setHistory(snap.history.map((h) => Number.parseFloat(h.label)).filter((n) => Number.isFinite(n)));
        if (snap.phase === "betting" || snap.phase === "locked") {
          setPoint(null);
          setShown(1);
        }
        if (snap.phase === "result" && seen.current !== snap.n) {
          seen.current = snap.n;
          const at = Number(snap.outcome?.crashAt ?? 1);
          setPoint(at);
          const mine = snap.bets.filter((b) => b.mine);
          if (mine.some((b) => b.status === "won")) playSfx("win");
          else if (mine.length) playSfx("lose");
        }
        if (autoOnRef.current && snap.phase === "betting" && sent.current !== snap.n && amountRef.current >= 0) {
          sent.current = snap.n;
          try {
            const res = await placeLiveBet({
              data: {
                gameId,
                currency: currencyRef.current,
                amount: amountRef.current,
                pick: targetRef.current.toFixed(2),
              },
            });
            applyBalances(res.balances);
            setBets(res.snap.bets);
          } catch (err) {
            sent.current = -1;
            toast.error(err instanceof Error ? err.message : "Bet missed the round");
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
  }, [applyBalances, gameId]);

  useEffect(() => {
    if (point == null) return;
    const from = 1;
    const to = point;
    const start = performance.now();
    const ms = Math.min(4800, 1100 + Math.log(Math.max(to, 1.01)) * 900);
    let raf = 0;
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - t) ** 3;
      setShown(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [point]);

  async function addBet() {
    setBusy(true);
    try {
      const res = await placeLiveBet({
        data: { gameId, currency, amount, pick: target.toFixed(2) },
      });
      applyBalances(res.balances);
      setBets(res.snap.bets);
      playSfx("click");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

  const profit = amount * Math.max(0, target - 1);
  const closed = phase !== "betting";
  const display = point == null ? 1 : shown;

  return (
    <GameShell
      controls={
        <LiveBetDesk
          mode={mode}
          setMode={(next) => {
            setMode(next);
            if (next !== "auto") setAutoOn(false);
          }}
          amount={amount}
          setAmount={setAmount}
          busy={busy}
          currency={currency}
          balance={balances[currency]}
          profit={profit}
          closed={closed}
          onAdd={() => void addBet()}
          autoRunning={autoOn}
          onAutoToggle={() => setAutoOn((on) => !on)}
          bets={bets}
          openBets={openBets}
          setOpenBets={setOpenBets}
          formatPick={(bet) => `${bet.pick}×`}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium">Target multiplier</span>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min={1.01}
                max={1_000_000}
                step={0.01}
                value={target}
                onChange={(e) => setTarget(clampTarget(Number(e.target.value)))}
                className="h-12 w-full rounded-md bg-[#202329] pr-20 pl-4 text-sm tabular-nums outline-none"
              />
              <span className="absolute top-1/2 right-3 flex -translate-y-1/2 gap-1">
                <Step onClick={() => setTarget((n) => clampTarget(n - 1))}>−</Step>
                <Step onClick={() => setTarget((n) => clampTarget(n + 1))}>+</Step>
              </span>
            </div>
          </label>
        </LiveBetDesk>
      }
      play={<SlideStage display={display} phase={phase} point={point} left={left} history={history} target={target} bets={bets} />}
    />
  );
}

function clampTarget(n: number) {
  if (!Number.isFinite(n)) return 1.01;
  return Math.min(1_000_000, Math.max(1.01, Math.round(n * 100) / 100));
}

function Step({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={children === "+" ? "increase by 1" : "decrease by 1"} onClick={onClick} className="grid size-8 place-items-center rounded-md bg-[#2a2e38] text-sm">
      {children}
    </button>
  );
}

function SlideStage({
  display,
  phase,
  point,
  target,
  history,
}: {
  display: number;
  phase: LiveSnap["phase"];
  point: number | null;
  left: number;
  history: number[];
  target: number;
  bets: LiveSnap["bets"];
}) {
  const mult = Math.max(1, display);
  const betting = phase === "betting" || phase === "locked";
  const stopped = point != null && display >= point - 0.001 && !betting;
  const missed = stopped && point < target;
  const strip = useMemo(() => buildStrip(point), [point]);
  const span = Math.max(0.01, (point ?? mult) - 1);
  const t = point == null || betting ? 0 : Math.min(1, (mult - 1) / span);
  const index = strip.from + (strip.to - strip.from) * t;
  const label = betting ? "Next round" : stopped ? `${(point ?? mult).toFixed(2)}x` : "Sliding";
  return (
    <div className="flex w-full flex-col">
      <div className="mb-8 flex gap-1.5 overflow-hidden">
        {history.slice(0, 8).map((n, i) => (
          <HistoryPill key={`${n}-${i}`} label={formatMultiplier(n)} />
        ))}
      </div>
      <div className="relative mx-auto h-[400px] w-full">
        <div className="pointer-events-none absolute inset-x-0 top-[188px] overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <div
            className="flex w-max items-center"
            style={{ marginLeft: "50%", transform: `translateX(${-(index * STEP + STEP / 2)}px)` }}
          >
            {strip.tiles.map((n, i) => (
              <div key={`${n}-${i}`} className="grid shrink-0 place-items-center" style={{ width: STEP }}>
                <GhostHex value={n} />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-1 left-1/2 z-10 flex h-[352px] w-[158px] -translate-x-1/2 flex-col items-center rounded-[32px] border-2 border-[#2ef6c8] bg-[#121418]">
          <div className="mt-8">
            <HotHex value={betting ? 1 : mult} missed={missed} />
          </div>
          <div className="mt-6 w-px flex-1 bg-white" />
          <div className="relative h-[52px] w-full rounded-b-[28px] bg-[#2ef6c8]">
            <span className="absolute top-0 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </div>
        </div>
      </div>
      <p className="flex items-center justify-center gap-2 text-sm text-white/90">
        <span className="size-2 rounded-full bg-[#2ef6c8]" />
        {label}
      </p>
    </div>
  );
}

const STEP = 118;
const LEAD = [1.01, 1.28, 1, 1.35, 1];
const RUN = [1.12, 1.48, 1.06, 2.4, 1.18, 1.77, 1.03, 4.2, 1.31, 1.09, 1.55, 1.22];
const TAIL = [1.35, 1, 1.16, 1.44];

function buildStrip(point: number | null) {
  if (point == null) return { tiles: [...LEAD, ...TAIL], from: 2, to: 2 };
  return { tiles: [...LEAD, ...RUN, point, ...TAIL], from: 2, to: LEAD.length + RUN.length };
}

function HotHex({ value, missed }: { value: number; missed: boolean }) {
  const fill = missed ? "#ff5b73" : "#2ef6c8";
  return (
    <svg width="92" height="100" viewBox="0 0 92 100" aria-hidden>
      <polygon points="46,6 84,28 84,72 46,94 8,72 8,28" fill={fill} />
      <text x="46" y="56" textAnchor="middle" fill="#062018" fontFamily="Oswald, sans-serif" fontSize="16" fontWeight="700">
        {value.toFixed(2)}x
      </text>
    </svg>
  );
}

function GhostHex({ value }: { value: number }) {
  return (
    <svg width="78" height="86" viewBox="0 0 78 86" className="opacity-40" aria-hidden>
      <polygon points="39,4 72,23 72,63 39,82 6,63 6,23" fill="#1a2228" stroke="#2c3640" strokeWidth="2" />
      <text x="39" y="48" textAnchor="middle" fill="#8b949e" fontFamily="Oswald, sans-serif" fontSize="13" fontWeight="700">
        {value.toFixed(2)}x
      </text>
    </svg>
  );
}
