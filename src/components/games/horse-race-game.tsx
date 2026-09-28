import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GameShell, LimeBet } from "@/components/games/game-shell";
import { PlayGate } from "@/components/games/play-gate";
import { StakeField } from "@/components/games/stake-field";
import { useGameTable } from "@/components/games/game-table";
import HorseIcon from "@/games/horse-race/game/HorseIcon";
import Track from "@/games/horse-race/game/Track";
import { HORSES, makeRunners, type Runner } from "@/games/horse-race/game/types";
import { liveTable, placeLiveBet } from "@/lib/live-room";
import { LiveTape } from "@/components/games/live-tape";
import { formatMoney } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";

type Phase = "betting" | "locking" | "countdown" | "racing" | "result";

type Script = {
  winnerId: number;
  order: number[];
  margins: number[];
  photoFinish: boolean;
  horseId: number;
  odds: number;
  payout: number;
  multiplier: number;
  stake: number;
  fair?: { serverHash: string; clientSeed: string; nonce: number };
};

export function HorseRaceGame({ gameId }: { gameId: string }) {
  return (
    <PlayGate>
      <HorseTable gameId={gameId} />
    </PlayGate>
  );
}

function HorseTable({ gameId }: { gameId: string }) {
  const { currency, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [phase, setPhase] = useState<Phase>("betting");
  const [left, setLeft] = useState(12);
  const [count, setCount] = useState(3);
  const [amount, setAmount] = useState(0);
  const [selected, setSelected] = useState(0);
  const [armed, setArmed] = useState(true);
  const [runners, setRunners] = useState<Runner[]>(() => makeRunners());
  const [banner, setBanner] = useState("Live · gates open");
  const [tape, setTape] = useState<{ name: string; amount: number; currency: string; pick: string; status: string; cashMult: number | null; payout: number | null; mine: boolean }[]>([]);
  const [hash, setHash] = useState("");
  const runnersRef = useRef<Runner[]>(runners);
  const scriptRef = useRef<Script | null>(null);
  const fxRef = useRef({ shake: 0 });
  const phaseRef = useRef<Phase>("betting");
  const amountRef = useRef(amount);
  const selectedRef = useRef(selected);
  const armedRef = useRef(armed);
  const currencyRef = useRef(currency);
  const reported = useRef(false);
  const raced = useRef(-1);
  const joined = useRef(-1);
  const joining = useRef(false);

  phaseRef.current = phase;
  amountRef.current = amount;
  selectedRef.current = selected;
  armedRef.current = armed;
  currencyRef.current = currency;

  useEffect(() => {
    let stop = false;
    let timer = 0;
    const pull = async () => {
      try {
        const snap = await liveTable({ data: { gameId } });
        if (stop) return;
        setLeft(Math.max(0, Math.ceil((snap.phase === "locked" ? snap.startsAt - snap.serverNow : snap.left) / 1000)));
        setTape(snap.bets);
        setHash(snap.hash);
        if (snap.phase === "betting") {
          if (phaseRef.current !== "betting") {
            runnersRef.current = makeRunners();
            setRunners(runnersRef.current);
            setBanner("Live · gates open");
            setPhase("betting");
            reported.current = false;
          }
          if (armedRef.current && amountRef.current > 0 && !snap.you && joined.current !== snap.n && !joining.current) {
            joining.current = true;
            void placeLiveBet({
              data: {
                gameId,
                currency: currencyRef.current,
                amount: amountRef.current,
                pick: String(selectedRef.current),
              },
            })
              .then((res) => {
                joined.current = snap.n;
                applyBalances(res.balances);
              })
              .catch((err) => {
                joined.current = snap.n;
                toast.error(err instanceof Error ? err.message : "Bet missed the gate");
              })
              .finally(() => {
                joining.current = false;
              });
          }
        } else if (snap.phase === "locked") {
          setPhase("countdown");
          setCount(Math.max(1, Math.ceil((snap.startsAt - snap.serverNow) / 1000)));
          setBanner("Live · locking the gate");
        } else if (snap.phase === "running" && snap.outcome && raced.current !== snap.n) {
          raced.current = snap.n;
          const outcome = snap.outcome;
          scriptRef.current = {
            winnerId: Number(outcome.winnerId),
            order: outcome.order as number[],
            margins: outcome.margins as number[],
            photoFinish: Boolean(outcome.photoFinish),
            horseId: Number(snap.you?.pick ?? selectedRef.current),
            odds: 0,
            payout: 0,
            multiplier: 0,
            stake: snap.you?.amount ?? 0,
          };
          reported.current = false;
          setPhase("racing");
          setBanner("Live · they're off");
        } else if (snap.phase === "result" && !reported.current) {
          const script = scriptRef.current;
          const payout = snap.you?.payout ?? 0;
          const stake = snap.you?.amount ?? script?.stake ?? 0;
          const winnerId = Number(snap.outcome?.winnerId ?? script?.winnerId ?? 0);
          reported.current = true;
          const horse = HORSES[winnerId];
          setBanner(
            payout > 0
              ? `Paid ${formatMoney(payout, currencyRef.current)} ${currencyRef.current}`
              : `${horse?.name ?? "Winner"}`,
          );
          if (stake > 0) {
            reportRound({
              win: payout > 0,
              label: `${horse?.name ?? "Race"} · ${payout > 0 ? "win" : "miss"}`,
              stake,
              payout,
              multiplier: stake > 0 ? payout / stake : 0,
              fair: snap.seed ? { serverHash: snap.hash, clientSeed: snap.seed, nonce: snap.n } : undefined,
            });
            if (payout > 0) toast.success(`Won ${formatMoney(payout, currencyRef.current)} ${currencyRef.current}`);
          }
          setPhase("result");
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

  useEffect(() => {
    if (phase !== "racing") return;
    const script = scriptRef.current;
    const rs = makeRunners();
    const BASE = 7.4;
    const spread = script?.photoFinish ? 0.55 : 1.9;
    const finishAt = new Array(rs.length).fill(BASE);
    script?.order.forEach((horseId, place) => {
      finishAt[horseId] = BASE + (script.margins[place] ?? 0) * spread;
    });
    runnersRef.current = rs;
    setRunners(rs);
    let raf = 0;
    let places = 0;
    let timer: number | undefined;
    const t0 = performance.now();
    const step = (ts: number) => {
      const elapsed = (ts - t0) / 1000;
      const crossed: { i: number; at: number }[] = [];
      for (let i = 0; i < rs.length; i++) {
        const r = rs[i]!;
        if (r.finished) continue;
        const at = finishAt[i] ?? BASE;
        const base = elapsed / at;
        const damp = Math.max(0, 1 - Math.pow(base, 2.6));
        const wob =
          Math.sin(elapsed * (2.1 + i * 0.47) + i * 2.3) * 0.055 +
          Math.sin(elapsed * (0.9 + i * 0.21) + i) * 0.035;
        const gate = base < 0.06 ? base / 0.06 : 1;
        r.momentum = wob * damp;
        r.x = Math.max(0, Math.min(1, (base + r.momentum) * gate));
        if (base >= 1) {
          r.x = 1;
          crossed.push({ i, at });
        }
      }
      if (crossed.length) {
        crossed.sort((a, b) => a.at - b.at);
        for (const c of crossed) {
          places += 1;
          rs[c.i]!.finished = true;
          rs[c.i]!.place = places;
        }
      }
      if (places > 0 && timer === undefined) {
        timer = window.setTimeout(() => undefined, 1100);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      if (timer) window.clearTimeout(timer);
    };
  }, [phase]);

  const locked = phase !== "betting";
  const pick = HORSES[selected];

  return (
    <GameShell
      controls={
        <>
          <StakeField amount={amount} setAmount={setAmount} disabled={locked} />
          <div className="grid grid-cols-2 gap-2">
            {HORSES.map((horse) => (
              <button
                key={horse.id}
                type="button"
                disabled={locked}
                onClick={() => setSelected(horse.id)}
                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left ${
                  selected === horse.id ? "border-lime bg-lime/10" : "border-[#2a2e38] bg-black/20"
                } disabled:opacity-60`}
              >
                <HorseIcon horse={horse} size={36} running={phase === "racing" && selected === horse.id} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-white">{horse.name}</span>
                  <span className="text-[11px] tabular-nums text-lime">{horse.odds.toFixed(2)}×</span>
                </span>
              </button>
            ))}
          </div>
          {phase === "betting" ? (
            <LimeBet onClick={() => setArmed((v) => !v)}>
              {armed ? `In · ${left}s` : `Sit out · ${left}s`}
            </LimeBet>
          ) : (
            <LimeBet disabled>
              {phase === "racing" ? "Live" : phase === "result" ? "Paying" : "Locked"}
            </LimeBet>
          )}
          <p className="text-[11px] text-[#9ba5b4]">
            Stake is taken when the gate locks. Win pays {pick ? pick.odds.toFixed(2) : "—"}× back to the wallet.
          </p>
        </>
      }
      play={
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-lime" />
              {banner}
            </span>
            {phase === "countdown" ? (
              <span className="font-heading text-2xl font-bold text-white">{count}</span>
            ) : null}
          </div>
          <div className="h-72 overflow-hidden rounded-xl bg-black">
            <Track
              runners={runners}
              running={phase === "racing"}
              paused={false}
              parade={phase === "betting" || phase === "locking" || phase === "countdown"}
              fx={fxRef.current}
              burstToken={phase === "result" ? 1 : 0}
              burstColors={["#00ffbd", "#904bf9", "#ffffff"]}
              yourHorseId={armed ? selected : null}
              onPhotoFinish={() => undefined}
            />
          </div>
          <LiveTape bets={tape} hash={hash} />
        </div>
      }
    />
  );
}
