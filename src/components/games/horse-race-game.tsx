import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GameShell } from "@/components/games/game-shell";
import { PlayGate } from "@/components/games/play-gate";
import { LiveBetDesk } from "@/components/games/live-bet-desk";
import { useGameTable } from "@/components/games/game-table";
import Track from "@/games/horse-race/game/Track";
import { HORSES, makeRunners, type Runner } from "@/games/horse-race/game/types";
import { liveTable, placeLiveBet } from "@/lib/live-room";
import { LiveTape } from "@/components/games/live-tape";
import { formatMoney } from "@/lib/format";
import { playSfx, setRacePace, startRaceBed, stopRaceBed, unlockGameAudio } from "@/lib/game-sound";
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
  const { currency, balances, applyBalances } = useWallet();
  const { reportRound } = useGameTable();
  const [phase, setPhase] = useState<Phase>("betting");
  const [left, setLeft] = useState(12);
  const [count, setCount] = useState(3);
  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoOn, setAutoOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openBets, setOpenBets] = useState(true);
  const [selected, setSelected] = useState(0);
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
  const modeRef = useRef(mode);
  const autoOnRef = useRef(false);
  const currencyRef = useRef(currency);
  const reported = useRef(false);
  const raced = useRef(-1);
  const joined = useRef(-1);
  const joining = useRef(false);
  const heardTick = useRef(-1);

  phaseRef.current = phase;
  amountRef.current = amount;
  selectedRef.current = selected;
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
          if (autoOnRef.current && amountRef.current >= 0 && !snap.you && joined.current !== snap.n && !joining.current) {
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
                playSfx("pocket");
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
            stopRaceBed();
            if (payout > 0) {
              playSfx(payout >= stake * 6 ? "win" : "cash");
              toast.success(`Won ${formatMoney(payout, currencyRef.current)} ${currencyRef.current}`);
            } else {
              playSfx("lose");
            }
          } else {
            stopRaceBed();
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
    if (phase !== "countdown") {
      heardTick.current = -1;
      return;
    }
    if (heardTick.current === count) return;
    heardTick.current = count;
    playSfx("tick");
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "racing") return;
    playSfx("gate");
    startRaceBed();
    return () => stopRaceBed();
  }, [phase]);

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
    let clock = 0;
    let timeScale = 1;
    let prev = performance.now();
    const step = (ts: number) => {
      const dt = Math.min(0.05, (ts - prev) / 1000);
      prev = ts;
      let lead = 0;
      for (const r of rs) lead = Math.max(lead, r.x);
      const wantSlow = lead > 0.9 ? 0.1 : lead > 0.72 ? Math.max(0.16, 1 - ((lead - 0.72) / 0.18) * 0.84) : 1;
      timeScale += (wantSlow - timeScale) * (1 - Math.exp(-dt * 2.4));
      setRacePace(timeScale);
      clock += dt * timeScale;
      const crossed: { i: number; at: number }[] = [];
      for (let i = 0; i < rs.length; i++) {
        const r = rs[i]!;
        if (r.finished) continue;
        const at = finishAt[i] ?? BASE;
        const target = Math.min(1, Math.max(0, clock / at));
        const follow = 1 - Math.exp(-dt * (lead > 0.72 ? 3.4 : 8));
        const next = r.x + (target - r.x) * follow;
        r.x = Number.isFinite(next) ? Math.max(0, Math.min(1, next)) : target;
        r.momentum = timeScale;
        if (target >= 1 && r.x > 0.992) {
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
  const profit = amount * Math.max(0, (pick?.odds ?? 1) - 1);

  async function addBet() {
    if (locked || amount < 0 || busy) return;
    setBusy(true);
    try {
      const res = await placeLiveBet({
        data: { gameId, currency, amount, pick: String(selected) },
      });
      joined.current = res.snap.n;
      setTape(res.snap.bets);
      applyBalances(res.balances);
      playSfx("pocket");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setBusy(false);
    }
  }

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
          closed={locked}
          onAdd={() => void addBet()}
          autoRunning={autoOn}
          onAutoToggle={() => setAutoOn((on) => !on)}
          bets={tape}
          openBets={openBets}
          setOpenBets={setOpenBets}
          formatPick={(bet) => HORSES[Number(bet.pick)]?.name ?? bet.pick}
        >
          <div className="grid grid-cols-3 gap-1.5">
            {HORSES.map((horse) => (
              <button
                key={horse.id}
                type="button"
                disabled={locked}
                onClick={() => {
                  setSelected(horse.id);
                  playSfx("click");
                }}
                className={`overflow-hidden rounded-md border text-left ${
                  selected === horse.id ? "border-lime bg-lime/10" : "border-[#2a2e38] bg-black"
                } disabled:opacity-60`}
              >
                <img
                  src={horse.silkSrc}
                  alt=""
                  className="h-16 w-full bg-black object-contain object-top"
                />
                <span className="block px-1.5 py-1">
                  <span className="block truncate text-[10px] font-semibold text-white">{horse.name}</span>
                  <span className="text-[11px] font-bold tabular-nums text-lime">{horse.odds.toFixed(2)}×</span>
                </span>
              </button>
            ))}
          </div>
        </LiveBetDesk>
      }
      play={
        <div className="flex w-full flex-col gap-3" onPointerDown={unlockGameAudio}>
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
              yourHorseId={selected}
              onPhotoFinish={() => playSfx("photo")}
            />
          </div>
          <LiveTape bets={tape} hash={hash} />
        </div>
      }
    />
  );
}
