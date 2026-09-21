import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { CRAZY_BET_SPOTS, CRAZY_WHEEL, type CrazyBetSpot } from "@/lib/crazy-tols";
import type { Currency } from "@/lib/games-catalog";
import { cn } from "cn";

type ServerCrazy = NonNullable<NonNullable<Awaited<ReturnType<typeof playInstant>>["detail"]["crazy"]>>;
type Phase = "idle" | "top" | "wheel" | "bonus" | "done";

/* Segments colours — the approved crazy-wheel palette (shared with the hub). */
const SPOT_COLOR: Record<string, string> = {
  "1": "#1d63ff",
  "2": "#e8b84a",
  "5": "#1a8f2c",
  "10": "#7c3aec",
  coinflip: "#d4a017",
  cashhunt: "#0aa3c2",
  pachinko: "#ff5b79",
  crazy: "#e11d48",
};

const SPOT_ICON: Record<CrazyBetSpot, string> = {
  "1": "1",
  "2": "2",
  "5": "5",
  "10": "10",
  coinflip: "🪙",
  cashhunt: "🔫",
  pachinko: "🎯",
  crazy: "🎡",
};

const SPOT_SHORT: Record<CrazyBetSpot, string> = {
  "1": "1:1",
  "2": "2:1",
  "5": "5:1",
  "10": "10:1",
  coinflip: "FLIP",
  cashhunt: "HUNT",
  pachinko: "PACH",
  crazy: "CRAZY",
};

const SPOT_ORDER: CrazyBetSpot[] = ["1", "2", "5", "10", "coinflip", "cashhunt", "pachinko", "crazy"];

export function CrazyTolsGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <CrazyTable gameId={gameId} />
    </PlayGate>
  );
}

function CrazyTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [spot, setSpot] = useState<CrazyBetSpot>("1");
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ServerCrazy | null>(null);
  const [payout, setPayout] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [topRevealed, setTopRevealed] = useState(false);
  const [spinToken, setSpinToken] = useState(0);

  const resultRef = useRef<ServerCrazy | null>(null);
  const phaseRef = useRef<Phase>("idle");
  useEffect(() => {
    resultRef.current = result;
    phaseRef.current = phase;
  }, [result, phase]);

  function settle(crazy: ServerCrazy, won: boolean) {
    setPhase("done");
    if (won) {
      playSfx("win");
      if (crazy.multiplier >= 4) playSfx("cash");
    } else {
      playSfx("lose");
    }
  }

  /* Wheel came to rest on `idx` — settle into bonus or result. */
  const handleLand = useCallback((idx: number) => {
    const crazy = resultRef.current;
    const ph = phaseRef.current;
    if (!crazy || ph !== "wheel") return;
    // Guard: the wheel must come to rest on the committed segment.
    if (idx !== crazy.wheelIndex) return;
    setHistory((h) => [crazy.segmentLabel, ...h].slice(0, 12));
    playSfx("hit");
    if (crazy.win && crazy.bonus) {
      setPhase("bonus");
    } else {
      settle(crazy, crazy.win);
    }
  }, []);

  async function onBet() {
    if (busy) return;
    if (amount <= 0) {
      toast.message("Set a stake to spin");
      return;
    }
    setBusy(true);
    setResult(null);
    setPayout(0);
    setTopRevealed(false);
    setPhase("top");
    try {
      const res = await playInstant({ data: { gameId, currency, amount, choice: spot } });
      applyBalances(res.balances);
      const crazy = res.detail.crazy;
      if (!crazy) throw new Error("Round failed");
      setResult(crazy);
      setPayout(res.payout);

      const step = speedDelay("step");
      // 1) Top Slot rolls, then reveals.
      await sleep(step > 0 ? Math.max(600, step * 8) : 0);
      setTopRevealed(true);
      playSfx("hit");
      // 2) Wheel spins to the committed segment.
      await sleep(step > 0 ? Math.max(300, step * 3) : 0);
      setSpinToken((s) => s + 1);
      setPhase("wheel");

      reportRound({
        win: res.payout > 0,
        label: crazy.win
          ? `${crazy.segmentLabel} pays ${crazy.multiplier.toFixed(2)}×`
          : `Wheel → ${crazy.segmentLabel}`,
        stake: amount,
        payout: res.payout,
        multiplier: crazy.win ? crazy.multiplier : 0,
        fair: res.fair,
        view: {
          kind: "crazy",
          segment: crazy.segment,
          topSlot: crazy.topSlot?.multiplier,
          bonus: crazy.bonus ? crazy.bonus.kind : undefined,
          multiplier: crazy.multiplier,
        },
        replay: () => {
          setResult(crazy);
          setPayout(res.payout);
          setTopRevealed(true);
          setPhase(crazy.win && crazy.bonus ? "bonus" : "done");
        },
      });

      if (res.payout > 0) {
        toast.success(`Won ${formatMoney(res.payout, currency)} ${currency} · ${crazy.multiplier.toFixed(2)}×`);
      } else {
        toast.message(`Wheel landed on ${crazy.segmentLabel}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Spin failed");
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  }

  function onBonusDone() {
    // The server resolved the payout at bet time — the bonus round only reveals it.
    playSfx("cash");
    setPhase("done");
  }

  function nextSpin() {
    setResult(null);
    setPayout(0);
    setTopRevealed(false);
    setPhase("idle");
  }

  const won = payout > 0;
  const chosen = CRAZY_BET_SPOTS.find((s) => s.id === spot);

  return (
    <GameShell
      controls={
        <>
          <LimeBet disabled={busy || amount <= 0} onClick={() => void onBet()}>
            {busy ? "Spinning…" : "Spin"}
          </LimeBet>
          <StakeField amount={amount} setAmount={setAmount} disabled={busy} />
          <FieldLabel label="Bet spot" hint={chosen ? chosen.blurb : undefined}>
            <div className="grid grid-cols-2 gap-1.5">
              {SPOT_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setSpot(id);
                    playSfx("tick");
                  }}
                  className={cn(
                    "h-10 rounded-lg border text-xs font-bold transition-colors",
                    spot === id
                      ? "border-lime bg-lime text-black"
                      : "border-border bg-muted/50 text-foreground hover:border-lime/50",
                  )}
                >
                  {CRAZY_BET_SPOTS.find((s) => s.id === id)?.label ?? id}
                </button>
              ))}
            </div>
          </FieldLabel>
          <p className="text-xs text-muted-foreground">
            Top Slot boosts the payout · bonus segments open mini-games · provably fair.
          </p>
        </>
      }
      play={
        <div className="relative flex min-h-80 flex-col items-center gap-3">
          <TopSlot
            rolling={phase === "top" || phase === "wheel"}
            spot={topRevealed ? (result?.topSlot?.segment ?? null) : null}
            multi={topRevealed ? (result?.topSlot?.multiplier ?? null) : null}
            revealed={topRevealed}
          />

          <div className="relative flex w-full flex-1 items-center justify-center">
            <ShowWheel
              idle={phase === "idle" && result === null}
              spinToken={spinToken}
              targetIndex={result?.wheelIndex ?? 0}
              winner={phase === "done" || phase === "bonus" ? (result?.wheelIndex ?? null) : null}
              onLand={handleLand}
            />

            {phase === "done" && result && (
              <div className="pointer-events-none absolute inset-x-0 bottom-1 z-20 flex justify-center">
                <div className="animate-pop rounded-2xl border border-white/10 bg-black/80 px-4 py-2 text-center backdrop-blur">
                  <div
                    className="font-heading text-lg font-black uppercase leading-none"
                    style={{ color: SPOT_COLOR[result.segment] ?? "#fff" }}
                  >
                    {result.segmentLabel}
                  </div>
                  <div className={cn("mt-1 font-mono text-xs font-bold", won ? "text-lime" : "text-muted-foreground")}>
                    {won ? `+${formatMoney(payout, currency)} ${currency}` : "no win — spin again"}
                  </div>
                  <div className="pointer-events-auto mt-1.5">
                    <button
                      type="button"
                      onClick={nextSpin}
                      className="rounded-md bg-lime px-3 py-1 text-xs font-bold text-black"
                    >
                      Next spin
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <History items={history} />

          <BetBoard
            spot={spot}
            onSpot={setSpot}
            disabled={busy}
            topRevealed={topRevealed}
            topSegment={result?.topSlot?.segment ?? null}
          />

          {phase === "idle" && !result && (
            <p className="text-xs text-muted-foreground">Tap a segment, set stake, spin.</p>
          )}

          {phase === "bonus" && result?.bonus ? (
            <BonusGame bonus={result.bonus} totalMultiplier={result.multiplier} stake={amount} payout={payout} currency={currency} onDone={onBonusDone} />
          ) : null}
        </div>
      }
    />
  );
}

/* ================================ TOP SLOT ================================ */

const TOP_MULTIS = [2, 3, 4, 5, 7, 10, 15, 20, 25, 50];

function TopSlot({
  rolling,
  spot,
  multi,
  revealed,
}: {
  rolling: boolean;
  spot: string | null;
  multi: number | null;
  revealed: boolean;
}) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);

  useEffect(() => {
    if (!rolling) return;
    const i1 = window.setInterval(() => setA((v) => (v + 1) % SPOT_ORDER.length), 70);
    const i2 = window.setInterval(() => setB((v) => (v + 1) % TOP_MULTIS.length), 55);
    return () => {
      window.clearInterval(i1);
      window.clearInterval(i2);
    };
  }, [rolling]);

  const showSpot = revealed && spot ? spot : SPOT_ORDER[a]!;
  const showMulti = revealed && multi ? multi : TOP_MULTIS[b]!;
  const label = CRAZY_BET_SPOTS.find((s) => s.id === showSpot)?.label ?? showSpot;

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-1 text-center font-mono text-[0.6rem] font-bold uppercase tracking-[0.4em] text-muted-foreground">
        top slot
      </div>
      <div
        className={cn(
          "grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-black/50 p-1.5 transition-shadow duration-300",
          revealed ? "shadow-[0_0_30px_rgba(232,184,74,0.35)]" : "shadow-[0_0_18px_rgba(144,75,249,0.22)]",
        )}
      >
        <div className="relative h-11 overflow-hidden rounded-xl bg-card sm:h-14">
          <div
            key={`${String(revealed)}-${showSpot}`}
            className={cn(
              "grid h-full w-full place-items-center font-heading text-lg font-black uppercase leading-none sm:text-2xl",
              revealed && "animate-pop",
              rolling && !revealed && "blur-[1.2px]",
            )}
            style={{ color: SPOT_COLOR[showSpot] ?? "#fff", textShadow: `0 0 18px ${SPOT_COLOR[showSpot] ?? "#fff"}88` }}
          >
            {label}
          </div>
        </div>
        <div className="relative h-11 overflow-hidden rounded-xl bg-card sm:h-14">
          <div
            key={`${String(revealed)}-${showMulti}`}
            className={cn(
              "grid h-full w-full place-items-center font-heading text-lg font-black text-[#e8b84a] sm:text-2xl",
              revealed && "animate-pop",
              rolling && !revealed && "blur-[1.2px]",
            )}
            style={{ textShadow: "0 0 18px rgba(232,184,74,0.7)" }}
          >
            ×{showMulti}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================ BET BOARD ================================ */

const BetBoard = memo(function BetBoard({
  spot,
  onSpot,
  disabled,
  topRevealed,
  topSegment,
}: {
  spot: CrazyBetSpot;
  onSpot: (s: CrazyBetSpot) => void;
  disabled: boolean;
  topRevealed: boolean;
  topSegment: string | null;
}) {
  return (
    <div className="grid w-full grid-cols-4 gap-1.5 sm:gap-2">
      {SPOT_ORDER.map((id) => {
        const c = SPOT_COLOR[id]!;
        const on = spot === id;
        const isTop = topRevealed && topSegment === id;
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => {
              onSpot(id);
              playSfx("tick");
            }}
            className={cn(
              "relative flex h-14 flex-col items-center justify-center overflow-hidden rounded-xl border-2 transition-all active:scale-95 sm:h-16",
              disabled ? "opacity-55" : "hover:-translate-y-0.5",
              on && "ring-2 ring-lime",
            )}
            style={{
              borderColor: on ? "var(--lime-300)" : `${c}88`,
              background: `linear-gradient(160deg, ${c}${on ? "44" : "1a"} 0%, #0b0818 75%)`,
              boxShadow: on ? `0 0 18px ${c}55` : "none",
            }}
          >
            {isTop && (
              <span className="absolute right-0.5 top-0.5 rounded bg-[#e8b84a] px-1 font-mono text-[0.55rem] font-black text-black">
                TOP
              </span>
            )}
            <span className="font-heading text-base font-black leading-none sm:text-lg" style={{ color: c }}>
              {SPOT_ICON[id]}
            </span>
            <span className="mt-0.5 font-mono text-[0.55rem] uppercase leading-none tracking-wider text-white/55">
              {SPOT_SHORT[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
});

/* ================================ HISTORY ================================ */

const History = memo(function History({ items }: { items: string[] }) {
  return (
    <div className="flex w-full items-center gap-1 overflow-hidden">
      <span className="shrink-0 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">last</span>
      <div className="flex flex-1 gap-1 overflow-hidden">
        {items.length === 0 ? (
          <span className="text-[0.7rem] text-muted-foreground/60">history appears here</span>
        ) : (
          items.slice(0, 10).map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="grid h-6 shrink-0 place-items-center rounded-md px-1.5 font-heading text-[0.6rem] font-black"
              style={{ opacity: 1 - i * 0.07, background: "#16171b", border: "1px solid #ffffff14", color: "#a3a4ac" }}
            >
              {s}
            </span>
          ))
        )}
      </div>
    </div>
  );
});

/* ================================ SHOW WHEEL ================================ */

const N = CRAZY_WHEEL.length;
const SEG = (Math.PI * 2) / N;
const CACHE_SIZE = 1024;

function buildWheelCache(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = CACHE_SIZE;
  c.height = CACHE_SIZE;
  const ctx = c.getContext("2d")!;
  const cx = CACHE_SIZE / 2;
  const cy = CACHE_SIZE / 2;
  const R = CACHE_SIZE / 2 - 10;
  const rIn = R * 0.44;

  ctx.beginPath();
  ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
  ctx.fillStyle = "#0d0d10";
  ctx.fill();

  for (let i = 0; i < N; i++) {
    const seg = CRAZY_WHEEL[i]!;
    const mid = -Math.PI / 2 + i * SEG;
    const a0 = mid - SEG / 2;
    const a1 = mid + SEG / 2;
    const g = ctx.createRadialGradient(cx, cy, rIn, cx, cy, R);
    g.addColorStop(0, seg.color);
    g.addColorStop(0.55, seg.color + "cc");
    g.addColorStop(1, "#101020");

    ctx.beginPath();
    ctx.arc(cx, cy, R, a0, a1);
    ctx.arc(cx, cy, rIn, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(4,2,10,0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // soft inner sheen on each segment
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, a0, a1);
    ctx.arc(cx, cy, R * 0.82, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();
    ctx.restore();

    const numeric = ["1", "2", "5", "10"].includes(seg.label);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (numeric) {
      ctx.rotate(mid + Math.PI / 2);
      ctx.font = `900 ${Math.round(R * 0.075)}px Oswald, sans-serif`;
      ctx.fillText(seg.label, 0, -R * 0.76);
    } else {
      ctx.rotate(mid);
      ctx.font = `700 ${Math.round(R * 0.038)}px Oswald, sans-serif`;
      ctx.fillText(seg.label, R * 0.68, 0);
    }
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2);
  ctx.fillStyle = "#0d0d10";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(144,75,249,0.55)";
  ctx.stroke();

  // gold rim pegs at segment boundaries
  for (let i = 0; i < N; i++) {
    const a = -Math.PI / 2 + i * SEG - SEG / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (R + 1), cy + Math.sin(a) * (R + 1), 6, 0, Math.PI * 2);
    ctx.fillStyle = "#e8b84a";
    ctx.fill();
  }

  return c;
}

function ShowWheel({
  idle,
  spinToken,
  targetIndex,
  winner,
  onLand,
}: {
  idle: boolean;
  spinToken: number;
  targetIndex: number;
  winner: number | null;
  onLand: (idx: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<HTMLCanvasElement | null>(null);
  const landRef = useRef(onLand);
  landRef.current = onLand;

  const st = useRef({
    rot: 0,
    spinning: false,
    from: 0,
    to: 0,
    t: 0,
    dur: 3600,
    lastSeg: -1,
    idle: true,
    winner: null as number | null,
    dpr: 1,
    size: 0,
  });

  useEffect(() => {
    st.current.idle = idle;
    st.current.winner = winner;
  }, [idle, winner]);

  useEffect(() => {
    cacheRef.current = buildWheelCache();
  }, []);

  useEffect(() => {
    if (spinToken <= 0) return;
    const s = st.current;
    const offset = (Math.random() - 0.5) * SEG * 0.6;
    const desired = -targetIndex * SEG + offset;
    const spins = 5 + Math.floor(Math.random() * 2);
    const base = s.rot + spins * Math.PI * 2;
    const mod = (((desired - base) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    s.from = s.rot;
    s.to = base + mod;
    s.t = 0;
    s.spinning = true;
  }, [spinToken, targetIndex]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    const wrap = wrapRef.current!;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const size = Math.max(120, Math.min(r.width, r.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      st.current.dpr = dpr;
      st.current.size = size;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = st.current;
      const size = s.size;
      if (!size) return;

      if (s.spinning) {
        s.t += dt * 1000;
        const k = Math.min(1, s.t / s.dur);
        const e = 1 - Math.pow(1 - k, 4.2);
        const wob = Math.sin(k * Math.PI * 2.2) * Math.pow(1 - k, 2.6) * SEG * 0.5;
        s.rot = s.from + (s.to - s.from) * e + wob;
        if (k >= 1) {
          s.spinning = false;
          s.rot = s.to;
          const idx = ((Math.round(-s.rot / SEG) % N) + N) % N;
          landRef.current(idx);
        }
      } else if (s.idle) {
        s.rot += dt * 0.09;
      }

      const segIdx = ((Math.round(-s.rot / SEG) % N) + N) % N;
      if (segIdx !== s.lastSeg) {
        if (s.lastSeg !== -1 && s.spinning) playSfx("tick");
        s.lastSeg = segIdx;
      }

      const dpr = s.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const R = size / 2 - size * 0.045;
      const t = now / 1000;

      // bezel glow
      const bez = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.09);
      bez.addColorStop(0, "rgba(144,75,249,0)");
      bez.addColorStop(0.6, "rgba(144,75,249,0.35)");
      bez.addColorStop(1, "rgba(0,255,189,0)");
      ctx.fillStyle = bez;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.09, 0, Math.PI * 2);
      ctx.fill();

      // rim chase bulbs
      const bulbs = 36;
      for (let i = 0; i < bulbs; i++) {
        const a = (i / bulbs) * Math.PI * 2 - Math.PI / 2;
        const rr = R * 1.045;
        const bx = cx + Math.cos(a) * rr;
        const by = cy + Math.sin(a) * rr;
        const on = s.spinning ? (t * 2.2 + i / bulbs) % 1 < 0.34 : (t * 0.8 + i / bulbs) % 1 < 0.5;
        ctx.beginPath();
        ctx.arc(bx, by, size * 0.0075, 0, Math.PI * 2);
        ctx.fillStyle = on ? (i % 2 ? "#00ffbd" : "#904bf9") : "rgba(80,71,86,0.25)";
        ctx.fill();
      }

      const cache = cacheRef.current;
      if (cache) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(s.rot);
        ctx.drawImage(cache, -R, -R, R * 2, R * 2);
        ctx.restore();
      }

      // winning-segment highlight
      if (s.winner !== null && !s.spinning) {
        const mid = -Math.PI / 2 + s.winner * SEG + s.rot;
        const pulse = 0.35 + 0.3 * Math.sin(t * 8);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, mid - SEG / 2, mid + SEG / 2);
        ctx.arc(cx, cy, R * 0.44, mid + SEG / 2, mid - SEG / 2, true);
        ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${pulse * 0.45})`;
        ctx.fill();
        ctx.restore();
      }

      // hub
      const hr = R * 0.42;
      const hg = ctx.createRadialGradient(cx, cy - hr * 0.3, hr * 0.1, cx, cy, hr);
      hg.addColorStop(0, "#1c0529");
      hg.addColorStop(1, "#0d0d10");
      ctx.beginPath();
      ctx.arc(cx, cy, hr, 0, Math.PI * 2);
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.lineWidth = Math.max(2, size * 0.006);
      ctx.strokeStyle = "#00ffbd";
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${Math.round(hr * 0.26)}px Oswald, sans-serif`;
      ctx.fillText("CRAZY", cx, cy - hr * 0.22);
      ctx.fillStyle = "#00ffbd";
      ctx.fillText("TOLS", cx, cy + hr * 0.08);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `700 ${Math.round(hr * 0.12)}px Oswald, sans-serif`;
      ctx.fillText("TOLS.FUN", cx, cy + hr * 0.34);

      // pointer
      ctx.beginPath();
      ctx.moveTo(cx, cy - R * 0.92);
      ctx.lineTo(cx - size * 0.026, cy - R * 1.02);
      ctx.lineTo(cx + size * 0.026, cy - R * 1.02);
      ctx.closePath();
      ctx.fillStyle = "#e8b84a";
      ctx.fill();
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative flex h-full min-h-60 w-full items-center justify-center">
      <canvas ref={canvasRef} className="block touch-none select-none" />
    </div>
  );
}

/* ================================ BONUS ROUNDS ================================ */

type BonusP = NonNullable<ServerCrazy["bonus"]>;

function BonusGame({
  bonus,
  totalMultiplier,
  stake,
  payout,
  currency,
  onDone,
}: {
  bonus: BonusP;
  totalMultiplier: number;
  stake: number;
  payout: number;
  currency: Currency;
  onDone: () => void;
}) {
  const def = SPOT_COLOR[bonus.kind] ?? "#904bf9";
  const label = CRAZY_BET_SPOTS.find((s) => s.id === bonus.kind)?.label ?? bonus.kind;
  return (
    <div className="absolute inset-0 z-40 grid place-items-center rounded-2xl bg-black/80 p-3 backdrop-blur-sm">
      <div
        className="relative flex w-full max-w-lg flex-col items-center gap-3 rounded-3xl border p-4 sm:p-6"
        style={{
          borderColor: `${def}88`,
          background: `radial-gradient(110% 90% at 50% 0%, ${def}44 0%, #0d0d10 55%, #09090c 100%)`,
          boxShadow: `0 0 90px ${def}33, inset 0 0 60px #00000088`,
        }}
      >
        <div className="text-center">
          <div className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-white/45">bonus round</div>
          <h2 className="font-heading text-3xl font-black uppercase tracking-tight sm:text-4xl" style={{ color: def, textShadow: `0 0 26px ${def}99` }}>
            {label}
          </h2>
          <div className="mt-1 font-mono text-[0.7rem] text-white/60">
            stake {formatMoney(stake, currency)} · pays {totalMultiplier.toFixed(2)}×
          </div>
        </div>

        {bonus.kind === "coinflip" ? (
          <CoinFlipView bonus={bonus} onDone={onDone} />
        ) : bonus.kind === "pachinko" ? (
          <PachinkoView bonus={bonus} onDone={onDone} />
        ) : bonus.kind === "cashhunt" ? (
          <CashHuntView bonus={bonus} stake={stake} payout={payout} onDone={onDone} />
        ) : (
          <CrazyWheelView bonus={bonus} payout={payout} onDone={onDone} />
        )}
      </div>
    </div>
  );
}

function FinalWin({ payout, value }: { payout: number; value: number }) {
  if (payout > 0) {
    return (
      <div className="animate-pop text-center">
        <div className="font-heading text-4xl font-black text-lime sm:text-5xl" style={{ textShadow: "0 0 24px var(--lime-300)" }}>
          +{payout.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </div>
        <div className="mt-1 font-mono text-sm font-bold text-white">×{value.toFixed(2)}</div>
      </div>
    );
  }
  return (
    <div className="animate-pop text-center">
      <div className="font-heading text-4xl font-black text-muted-foreground sm:text-5xl">no win</div>
    </div>
  );
}

/* ---- coin flip ---- */
function CoinFlipView({ bonus, onDone }: { bonus: Extract<BonusP, { kind: "coinflip" }>; onDone: () => void }) {
  const [flipping, setFlipping] = useState(false);
  const [done, setDone] = useState(false);
  const result = bonus.side === "red" ? bonus.red : bonus.blue;

  useEffect(() => {
    const t0 = window.setTimeout(() => {
      setFlipping(true);
      playSfx("spin");
    }, 900);
    const t1 = window.setTimeout(() => {
      setDone(true);
      playSfx("cash");
    }, 3000);
    const t2 = window.setTimeout(onDone, 4300);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full items-center justify-center gap-6 sm:gap-10">
        <div className="text-center">
          <div className="font-heading text-2xl font-black text-[#e1514e] sm:text-3xl">×{bonus.red}</div>
          <div className="font-mono text-[0.6rem] uppercase tracking-widest text-white/40">red</div>
        </div>
        <div className="relative h-28 w-28 select-none sm:h-36 sm:w-36" style={{ perspective: "700px" }}>
          <div
            className="relative h-full w-full rounded-full"
            style={{
              transformStyle: "preserve-3d",
              transition: flipping ? "transform 2.1s cubic-bezier(.2,.7,.3,1)" : "none",
              transform: flipping ? `rotateY(${1800 + (bonus.side === "blue" ? 180 : 0)}deg)` : "rotateY(0deg)",
            }}
          >
            <div
              className="absolute inset-0 grid place-items-center rounded-full border-4 border-white/30 font-heading text-xl font-black text-white"
              style={{ backfaceVisibility: "hidden", background: "radial-gradient(circle at 35% 30%, #ff89a8, #e1514e 45%, #7d0026)" }}
            >
              RED
            </div>
            <div
              className="absolute inset-0 grid place-items-center rounded-full border-4 border-white/30 font-heading text-xl font-black text-white"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "radial-gradient(circle at 35% 30%, #9ef4ff, #3d7bff 45%, #004a66)" }}
            >
              BLUE
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="font-heading text-2xl font-black text-[#3d7bff] sm:text-3xl">×{bonus.blue}</div>
          <div className="font-mono text-[0.6rem] uppercase tracking-widest text-white/40">blue</div>
        </div>
      </div>
      <div className="flex h-16 items-center">
        {done ? (
          <div className="text-center">
            <div className="font-heading text-2xl font-black text-white">
              <span style={{ color: bonus.side === "red" ? "#e1514e" : "#3d7bff" }}>{bonus.side.toUpperCase()}</span> · ×{result}
            </div>
          </div>
        ) : (
          <div className="pt-2 font-mono text-sm text-white/50">{flipping ? "flipping…" : "get ready…"}</div>
        )}
      </div>
    </div>
  );
}

/* ---- pachinko (ball drops to the server-resolved multiplied value) ---- */
function PachinkoView({ bonus, onDone }: { bonus: Extract<BonusP, { kind: "pachinko" }>; onDone: () => void }) {
  const [dropped, setDropped] = useState(false);
  const col = Math.min(8, Math.max(0, Math.round((bonus.slot / 17) * 8)));

  useEffect(() => {
    const t1 = window.setTimeout(() => setDropped(true), 900);
    const t2 = window.setTimeout(() => playSfx("cash"), 1200);
    const t3 = window.setTimeout(onDone, 2600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2">
        <div className="mx-auto grid grid-cols-9 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "grid h-14 place-items-center rounded-lg border font-heading text-[0.7rem] font-black sm:h-16",
                i === col ? "border-lime bg-lime/15 text-lime" : "border-white/10 bg-white/5 text-white/30",
              )}
            >
              {i === col ? `×${bonus.value}` : ""}
            </div>
          ))}
        </div>
        {dropped && (
          <div
            className="pointer-events-none absolute h-3 w-3 rounded-full bg-lime"
            style={{
              left: `calc(${(col + 0.5) * (100 / 9)}% - 6px)`,
              top: "0.75rem",
              boxShadow: "0 0 16px var(--lime-300)",
            }}
          />
        )}
      </div>
      {bonus.doubles > 0 && (
        <div className="animate-pop font-heading text-lg font-black text-purple">DOUBLED ×{Math.pow(2, bonus.doubles)}</div>
      )}
      <div className="h-8 font-mono text-sm text-white/60">{dropped ? `puck landed · ×${bonus.value}` : "dropping…"}</div>
    </div>
  );
}

/* ---- cash hunt ---- */
function CashHuntView({
  bonus,
  stake,
  payout,
  onDone,
}: {
  bonus: Extract<BonusP, { kind: "cashhunt" }>;
  stake: number;
  payout: number;
  onDone: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  // 108-cell wall (classic composition count), render as 12×9 responsive grid.
  const cells = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 108; i++) arr.push(0);
    if (bonus.cell >= 0 && bonus.cell < arr.length) arr[bonus.cell] = bonus.value;
    return arr;
  }, [bonus]);

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setRevealed(true);
      playSfx("cash");
    }, 1200);
    const t2 = window.setTimeout(onDone, 3000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="grid w-full grid-cols-12 gap-1 sm:gap-1.5">
        {cells.map((v, i) => {
          const isWin = i === bonus.cell;
          return (
            <span
              key={i}
              className={cn(
                "grid aspect-square place-items-center rounded-[0.3rem] border font-heading text-[0.6rem] font-black sm:text-[0.7rem]",
                isWin
                  ? "border-lime bg-lime/25 text-lime"
                  : revealed
                    ? "border-white/5 bg-white/[0.03] text-white/25"
                    : "border-white/10 bg-white/5 text-white/40",
              )}
            >
              {revealed && isWin ? `×${v}` : revealed ? "·" : "?"}
            </span>
          );
        })}
      </div>
      <div className="flex h-10 items-center">
        {revealed ? (
          <FinalWin payout={payout} value={bonus.value} />
        ) : (
          <div className="font-mono text-sm text-white/60">scanning the wall…</div>
        )}
      </div>
      <div className="font-mono text-[0.6rem] text-white/40">{stake > 0 ? "108 hidden targets · server-picked cell revealed" : ""}</div>
    </div>
  );
}

/* ---- crazy time bonus wheel ---- */
function CrazyWheelView({
  bonus,
  payout,
  onDone,
}: {
  bonus: Extract<BonusP, { kind: "crazy" }>;
  payout: number;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const spin = useRef<{ from: number; to: number; t: number; dur: number } | null>(null);
  const rot = useRef(0);

  useEffect(() => {
    const CT_N = 64;
    const target = ((bonus.wheelIndex % CT_N) + CT_N) % CT_N;
    const seg = (Math.PI * 2) / CT_N;
    const base = 6 * Math.PI * 2;
    const desired = -target * seg;
    const mod = (((desired - base) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    spin.current = { from: 0, to: base + mod, t: 0, dur: 4200 };

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const S = 300;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    let raf = 0;
    let last = performance.now();

    // Classic 64-stop wall: 10/15/20/25/50/100 + DOUBLE stops.
    const spec: Array<[number | "2x", number]> = [
      [10, 12],
      [15, 13],
      [20, 7],
      [25, 8],
      [50, 6],
      [100, 2],
      ["2x", 16],
    ];
    const wall: Array<number | "2x"> = [];
    for (const [v, count] of spec) for (let i = 0; i < count; i++) wall.push(v);
    const values: Array<number | "2x"> = Array.from({ length: CT_N }, (_, i) => wall[i % wall.length]!);
    // ensure the winning stop reads its resolved value
    values[target] = bonus.value;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sp = spin.current;
      if (sp) {
        sp.t += dt * 1000;
        const k = Math.min(1, sp.t / sp.dur);
        rot.current = sp.from + (sp.to - sp.from) * (1 - Math.pow(1 - k, 4));
        if (k >= 1) {
          spin.current = null;
          setDone(true);
          playSfx("cash");
          window.setTimeout(onDone, 1600);
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      const cx = S / 2;
      const cy = S / 2;
      const R = S / 2 - 16;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot.current);
      const segA = (Math.PI * 2) / CT_N;
      for (let i = 0; i < CT_N; i++) {
        const mid = -Math.PI / 2 + i * segA;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, mid - segA / 2, mid + segA / 2);
        ctx.closePath();
        ctx.fillStyle = i === target ? "#00ffbd" : i % 2 ? "#1c0529" : "#16171b";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.stroke();
        ctx.save();
        ctx.rotate(mid);
        ctx.fillStyle = i === target ? "#000" : "#e9dcff";
        ctx.font = "900 11px Oswald, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(i === target ? "WIN" : String(values[i]), R * 0.72, 0);
        ctx.restore();
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = "#0d0d10";
      ctx.fill();
      ctx.strokeStyle = "#904bf9";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffd23f";
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 12);
      ctx.lineTo(cx + 8, cy - 12);
      ctx.lineTo(cx, cy + 2);
      ctx.closePath();
      ctx.fill();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [bonus, onDone]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="h-[220px] w-[220px] touch-none sm:h-[280px] sm:w-[280px]" />
      <div className="flex h-12 items-center">
        {done ? (
          <FinalWin payout={payout} value={bonus.value} />
        ) : bonus.doubles > 0 ? (
          <div className="font-mono text-sm text-white/60">doubles ×{Math.pow(2, bonus.doubles)} — spinning…</div>
        ) : (
          <div className="font-mono text-sm text-white/60">spinning…</div>
        )}
      </div>
    </div>
  );
}
