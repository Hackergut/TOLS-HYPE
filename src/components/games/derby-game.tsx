import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { RiRefreshLine, RiVolumeUpLine, RiVolumeMuteLine } from "@remixicon/react";
import { useWallet } from "@/lib/wallet-context";
import { playInstant } from "@/lib/casino-api";
import { PlayGate } from "@/components/games/play-gate";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { useGameTable } from "@/components/games/game-table";
import { FieldLabel, StakeField } from "@/components/games/stake-field";
import { formatMoney } from "@/lib/format";
import { playSfx } from "@/lib/game-sound";
import { sleep, speedDelay } from "@/lib/game-speed";
import { DERBY_HORSES, DERBY_RTP } from "@/lib/derby";
import type { DerbyDetail } from "@/lib/casino-api";
import { cn } from "cn";

type Screen = "idle" | "countdown" | "racing" | "result";
type Detail = DerbyDetail;

const RACE_MS = 6800;

interface RunnerState {
  horseId: number;
  x: number; // 0..100
  place?: number;
}

/** Mechanical gallop profil: faster runners lope harder; jostle never crosses the line early. */
function phaseLean(i: number, tMs: number) {
  const t = tMs / 1000;
  return Math.sin(t * 13 + i * 2.1) * 1.4 + Math.sin(t * 22 + i * 0.7) * 0.5;
}

export function DerbyGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <DerbyTable gameId={gameId} />
    </PlayGate>
  );
}

function DerbyTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [screen, setScreen] = useState<Screen>("idle");
  const [selected, setSelected] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [runners, setRunners] = useState<RunnerState[]>(() => DERBY_HORSES.map((h) => ({ horseId: h.id, x: 0 })));
  const [detail, setDetail] = useState<Detail | null>(null);
  const [payout, setPayout] = useState(0);
  const [count, setCount] = useState(3);
  const [muted, setMuted] = useState(false);

  const rafRef = useRef(0);
  const t0Ref = useRef(0);

  const winner = detail ? detail.winnerId : null;

  const selectedHorse = selected !== null ? DERBY_HORSES[selected] : null;
  const potential = selectedHorse ? amount * selectedHorse.odds : 0;

  function toggleMute() {
    setMuted((m) => !m);
  }

  /* ---------------- race choreography: animate the scripted order ---------------- */
  useEffect(() => {
    if (screen !== "racing" || !detail) return;
    const order = detail.order;
    const margins = detail.margins;
    // Scripted progress position per horse, derived from finish-time spread.
    const targets: Record<number, number> = {};
    order.forEach((id, place) => {
      targets[id] = 100 - margins[place]! * 26;
    });
    let finished = 0;
    let lastTick = 0;

    t0Ref.current = performance.now();
    const frame = (ts: number) => {
      const t = ts - t0Ref.current;
      const k = Math.min(1, t / RACE_MS);
      // Smooth ease-in (break from the stalls), then a near-linear run.
      const ease = k < 0.12 ? k / 0.12 * 0.6 : 0.6 + ((k - 0.12) / 0.88) * 0.4;
      const sec = t / 1000;
      if (sec - lastTick >= 0.18) {
        lastTick = sec;
        playSfx("tick");
      }
      setRunners((rs) =>
        rs.map((r, i) => {
          let x = ease * targets[r.horseId]!;
          // Jostle — damped to zero at the line so it can never reorder the finish.
          if (x < 100) {
            const damp = Math.max(0, 1 - Math.pow(x / 100, 3));
            x = Math.min(99.5, x + phaseLean(i, t) * 1.5 * damp);
          }
          if (x >= 100 && r.place === undefined) {
            r.place = (finished += 1) || 1;
            if (r.horseId === detail.winnerId) playSfx("win");
          }
          return { ...r, x };
        }),
      );
      if (k >= 1 || finished >= order.length) {
        cancelAnimationFrame(rafRef.current);
        setScreen("result");
      } else {
        rafRef.current = requestAnimationFrame(frame);
      }
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen, detail]);

  /* ---------------- countdown ---------------- */
  useEffect(() => {
    if (screen !== "countdown") return;
    setCount(3);
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      playSfx("tick");
      if (n <= 0) {
        window.clearInterval(id);
        setScreen("racing");
      } else {
        setCount(n);
      }
    }, 620);
    return () => window.clearInterval(id);
  }, [screen]);

  async function onBet() {
    if (busy || selected === null) return;
    if (amount <= 0) {
      toast.message("Choose a stake to race");
      return;
    }
    setBusy(true);
    setDetail(null);
    setPayout(0);
    try {
      const res = await playInstant({
        data: { gameId, currency, amount, choice: String(selected) },
      });
      applyBalances(res.balances);
      const d = res.detail.derby;
      if (!d) throw new Error("Round failed");
      setDetail(d);
      setPayout(res.payout);
      const step = speedDelay("step");
      // Snappy pre-race: funnel everyone to the stalls, then 3-2-1.
      setRunners(DERBY_HORSES.map((h) => ({ horseId: h.id, x: 0 })));
      setScreen("countdown");
      await sleep(step > 0 ? step * 2 : 0);

      reportRound({
        win: res.payout > 0,
        label: res.payout > 0 ? `${d.choice?.name ?? "Pick"} wins ${d.choice?.odds ?? 0}x` : `Landed on ${DERBY_HORSES[d.winnerId]?.name ?? ""}`,
        stake: amount,
        payout: res.payout,
        multiplier: res.payout > 0 ? d.choice?.odds ?? 0 : 0,
        fair: res.fair,
        view: {
          kind: "derby",
          order: d.order,
          winnerId: d.winnerId,
          pick: selected,
          odds: d.choice?.odds,
        },
        replay: () => {
          setDetail(d);
          setPayout(res.payout);
          setScreen("result");
        },
      });

      if (res.payout > 0) {
        toast.success(`Won ${formatMoney(res.payout, currency)} ${currency} · ${(d.choice?.odds ?? 0).toFixed(2)}×`);
      } else {
        toast.message(`${DERBY_HORSES[d.winnerId]?.name ?? "Field"} took the race`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
      setScreen("idle");
    } finally {
      setBusy(false);
    }
  }

  function resetRound() {
    setDetail(null);
    setPayout(0);
    setRunners(DERBY_HORSES.map((h) => ({ horseId: h.id, x: 0 })));
    setScreen("idle");
  }

  const won = payout > 0;

  return (
    <GameShell
      controls={
        <>
          <LimeBet disabled={busy || selected === null || amount <= 0} onClick={() => void onBet()}>
            {busy ? "Going…" : screen === "idle" ? "Race" : "Race again"}
          </LimeBet>
          <StakeField amount={amount} setAmount={setAmount} disabled={busy} />
          <FieldLabel label="Pick a runner" hint={selectedHorse ? `${selectedHorse.odds.toFixed(2)}x` : "6 runners"}>
            <div className="grid grid-cols-3 gap-1.5">
              {DERBY_HORSES.map((h) => {
                const on = selected === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setSelected(h.id);
                      playSfx("tick");
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border py-2 transition-colors",
                      on
                        ? "border-lime bg-lime text-black"
                        : "border-border bg-muted/50 text-foreground hover:border-lime/50",
                    )}
                  >
                    <Dot color={h.color} />
                    <span className="w-full truncate px-1 text-[0.7rem] font-semibold leading-none">{h.name}</span>
                    <span className={cn("font-heading text-xs font-bold leading-none", on ? "text-black" : "text-lime")}>
                      {h.odds.toFixed(1)}x
                    </span>
                  </button>
                );
              })}
            </div>
          </FieldLabel>
          <FieldLabel label="Potential win">
            <div className="flex h-11 items-center justify-between rounded-lg border border-border bg-muted px-3 text-sm">
              <span className="text-muted-foreground">
                {selectedHorse ? DERBY_HORSES[selectedHorse.id].name : "No runner"}
              </span>
              <span className="font-heading font-bold tabular-nums text-lime">
                {formatMoney(potential, currency)} {currency}
              </span>
            </div>
          </FieldLabel>
          <p className="text-xs text-muted-foreground">
            RTP {(DERBY_RTP * 100).toFixed(0)}% · back 1 of 6 runners · provably fair.
          </p>
        </>
      }
      play={
        <div className="flex min-h-80 flex-col gap-3">
          {/* stalls / result banner */}
          <div className="flex items-center justify-between gap-2">
            <div className="font-sub text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
              Derby Rush
            </div>
            {won ? (
              <span className="rounded-full bg-lime px-3 py-1 font-heading text-sm font-bold text-black">
                +{formatMoney(payout, currency)} {currency}
              </span>
            ) : detail ? (
              <span className="rounded-full bg-purple px-3 py-1 font-heading text-sm font-bold text-lime">
                {DERBY_HORSES[detail.winnerId]?.name} wins
              </span>
            ) : null}
          </div>

          <SlotTop winner={winner} />

          <div
            className={cn(
              "relative space-y-1.5 rounded-2xl border border-border bg-[#0d0d10] p-2 md:p-3",
              screen === "racing" && "ring-1 ring-lime/40",
            )}
          >
            {runners.map((r) => {
              const horse = DERBY_HORSES[r.horseId]!;
              const isWin = r.horseId === winner;
              return (
                <Lane key={r.horseId}>
                  <Runner id={`derby-runner-${r.horseId}`} x={r.x} color={horse.color} light={horse.palette.coatLight} dark={horse.palette.coatDark} />
                  <span
                    className={cn(
                      "absolute right-0 top-1/2 z-20 -translate-y-1/2 font-heading text-lg font-bold leading-none",
                      isWin ? "text-lime" : "text-lime/40",
                    )}
                  >
                    🏁
                  </span>
                </Lane>
              );
            })}

            {/* countdown veil */}
            {screen === "countdown" && (
              <div className="absolute inset-0 z-30 grid place-items-center rounded-2xl bg-black/55 backdrop-blur-[1px]">
                <div key={count} className="animate-pop text-center">
                  <div className="font-heading text-7xl font-black leading-none text-lime drop-shadow-[0_0_24px_var(--lime-300)]">
                    {count}
                  </div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.4em] text-purple">Gates opening</div>
                </div>
              </div>
            )}

            {/* idle prompt */}
            {screen === "idle" && (
              <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-black/35">
                <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Pick a runner · set stake · race
                </p>
              </div>
            )}
          </div>

          <SlotBottom order={detail?.order ?? null} muted={muted} onMute={toggleMute} onReset={resetRound} />
        </div>
      }
    />
  );
}

/* ------------------------------- pieces ------------------------------- */

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-3 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

function Lane({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-11 overflow-hidden rounded-lg border border-white/5 bg-gradient-to-b from-[#16171b] to-[#0b0b0e]">
      <span className="absolute inset-x-0 top-1/2 h-px bg-white/5" />
      {children}
    </div>
  );
}

function Runner({ id, x, color, light, dark }: { id: string; x: number; color: string; light: string; dark: string }) {
  return (
    <div
      id={id}
      className="absolute top-0 bottom-0 flex items-center"
      style={{ left: `calc(${Math.max(2, Math.min(98, x))}% - 18px)` }}
    >
      <svg viewBox="0 0 48 40" width="34" height="28" aria-hidden>
        {/* body */}
        <path
          d="M16 30 Q11 22 17 16 Q22 9 26 14 Q29 8 25 6 L27 2 Q32 4 34 8 Q40 6 42 3 Q45 6 43 10 Q46 13 42 15 L38 20 Q35 24 30 26 Z"
          fill={color}
          stroke={dark}
          strokeWidth="1"
        />
        {/* legs — gallop stance */}
        <g stroke={dark} strokeWidth="2.4" strokeLinecap="round">
          <line x1="18" y1="27" x2="13" y2="36" />
          <line x1="25" y1="28" x2="22" y2="37" />
          <line x1="32" y1="27" x2="38" y2="35" />
          <line x1="36" y1="26" x2="44" y2="31" />
        </g>
        {/* tail */}
        <path d="M16 24 Q9 20 8 27 Q8 32 11 31" fill="none" stroke={dark} strokeWidth="2.4" strokeLinecap="round" />
        {/* mane + jockey */}
        <path d="M27 4 Q24 8 31 12" fill="none" stroke={light} strokeWidth="1.6" />
        <circle cx="33" cy="3.5" r="2.4" fill={light} />
        {/* head highlight */}
        <path d="M43 10 L40 8 L41 12 Z" fill={light} />
      </svg>
    </div>
  );
}

function SlotTop({ winner }: { winner: number | null }) {
  const colors = DERBY_HORSES.map((h) => h.color);
  return (
    <div className="grid grid-cols-6 gap-1">
      {colors.map((c, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            winner === i ? "opacity-100" : "opacity-30",
          )}
          style={{ background: c, boxShadow: winner === i ? `0 0 10px ${c}` : "none" }}
        />
      ))}
    </div>
  );
}

function SlotBottom({
  order,
  muted,
  onMute,
  onReset,
}: {
  order: number[] | null;
  muted: boolean;
  onMute: () => void;
  onReset: () => void;
}) {
  const medals = ["1st", "2nd", "3rd"];
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {order === null ? (
          <span className="text-xs text-muted-foreground">Final order prints here</span>
        ) : (
          order.slice(0, 3).map((id, i) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-card px-2.5 py-1 text-[0.7rem] font-semibold"
            >
              <Dot color={DERBY_HORSES[id]!.color} />
              <span className="text-muted-foreground">{medals[i]}</span>
              {DERBY_HORSES[id]!.name}
            </span>
          ))
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onMute}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <RiVolumeMuteLine className="size-4" /> : <RiVolumeUpLine className="size-4" />}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          aria-label="Reset race"
        >
          <RiRefreshLine className="size-4" />
        </button>
      </div>
    </div>
  );
}
