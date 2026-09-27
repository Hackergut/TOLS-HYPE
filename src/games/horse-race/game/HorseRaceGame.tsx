import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FairnessPanel, { type FairState } from "./FairnessPanel";
import HorseIcon from "./HorseIcon";
import { randomClientSeed, randomSeed, sha256 } from "./fair";
import { resolveRound, streakMultiplier, TARGET_RTP } from "./rtp";
import Track from "./Track";
import LivePanel from "./LivePanel";
import {
  HORSES,
  MIN_BET,
  makeRunners,
  type FeedItem,
  type HighScore,
  type Player,
  type Runner,
  type Screen,
} from "./types";
import { loadHighScores, saveHighScore } from "./highscores";
import { lobbyTarget, makeBot, youEntry } from "./players";
import { setMuted, sfx, unlockAudio } from "./sfx";
import { SolGlyph, TolsBadge, TolsLockup, TolsWordmark } from "../brand/TolsLogo";

const START_BALANCE = 1000;
const AUTO_SECONDS = 10;
const BET_CHIPS = [10, 50, 100, 500];

interface RaceResult {
  winnerId: number;
  placements: { id: number; place: number }[];
  players: Player[];
  yourPayout: number;
  mult: number;
  streak: number;
}

const fmt = (n: number) => n.toLocaleString();
const chance = (horseId: number) => HORSES[horseId].pop;

export default function HorseRaceGame() {
  const [screen, setScreen] = useState<Screen>("start");
  const [balance, setBalance] = useState(START_BALANCE);
  const [peak, setPeak] = useState(START_BALANCE);
  const [bet, setBet] = useState(50);
  const [selected, setSelected] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [paused, setPaused] = useState(false);
  const [count, setCount] = useState(3);
  const [auto, setAuto] = useState(AUTO_SECONDS);
  const [burst, setBurst] = useState(0);
  const [burstColors, setBurstColors] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [highScores, setHighScores] = useState<HighScore[]>(() => loadHighScores());
  const [mute, setMute] = useState(false);
  const [mobileLive, setMobileLive] = useState(false);
  const [lastWinner, setLastWinner] = useState<number | null>(null);
  const [runnersState, setRunnersState] = useState<Runner[]>(() => makeRunners());
  const [fairOpen, setFairOpen] = useState(false);
  const [fair, setFair] = useState<FairState>(() => {
    const ss = randomSeed();
    return {
      serverSeed: ss,
      serverSeedHash: sha256(ss),
      clientSeed: randomClientSeed(),
      nonce: 1,
      prevServerSeed: null,
      prevNonce: 0,
      prevClientSeed: "",
    };
  });
  const fairRef = useRef(fair);
  useEffect(() => { fairRef.current = fair; }, [fair]);
  /** Outcome + choreography targets for the round in progress. */
  const scriptRef = useRef<{ order: number[]; finishAt: number[] } | null>(null);

  // --- mutable game data (avoids React re-renders during the race) ---
  const runnersRef = useRef<Runner[]>(makeRunners());
  const playersRef = useRef<Player[]>([]);
  const fxRef = useRef({ shake: 0 });
  const pausedRef = useRef(false);
  const streakRef = useRef(0);
  const feedId = useRef(1);
  const targetRef = useRef(lobbyTarget());
  const startedRef = useRef(false);
  const screenRef = useRef<Screen>("start");

  pausedRef.current = paused;
  screenRef.current = screen;

  useEffect(() => setPeak((p) => (balance > p ? balance : p)), [balance]);
  useEffect(() => setMuted(mute), [mute]);

  // ---------- helpers ----------
  const pushFeed = useCallback((kind: FeedItem["kind"], text: string, amount: number, horseId: number) => {
    setFeed((prev) => [{ id: feedId.current++, kind, text, amount, horseId, ts: Date.now() }, ...prev].slice(0, 24));
  }, []);

  const addBot = useCallback(() => {
    const b = makeBot();
    playersRef.current = [b, ...playersRef.current];
    setPlayers(playersRef.current);
    pushFeed("join", `${b.name} → ${HORSES[b.horseId].name}`, b.bet, b.horseId);
  }, [pushFeed]);

  // ---------- lobby: players joining live ----------
  useEffect(() => {
    if (screen !== "betting" && screen !== "countdown") return;
    const fast = screen === "countdown";
    const id = setInterval(() => {
      if (playersRef.current.length >= targetRef.current) return;
      addBot();
    }, fast ? 140 : 380 + Math.random() * 260);
    return () => clearInterval(id);
  }, [screen, addBot]);

  // ---------- race simulation (mutates runners in place; Track reads by ref) ----------
  const settle = useCallback(() => {
    const rs = runnersRef.current;
    const placed = rs.filter((r) => r.place > 0).sort((a, b) => a.place - b.place);
    const winnerId = placed[0]?.horse.id ?? 0;
    const mult = streakMultiplier(streakRef.current);
    const youBefore = playersRef.current.find((p) => p.isYou);
    const iWon = youBefore?.horseId === winnerId;

    const settled = playersRef.current.map((p) => {
      const win = p.horseId === winnerId;
      const payout = win ? Math.floor(p.bet * HORSES[p.horseId].odds * mult) : 0;
      return { ...p, win, payout };
    });
    playersRef.current = settled;
    setPlayers(settled);

    const yourPayout = settled.find((p) => p.isYou)?.payout ?? 0;
    if (yourPayout > 0) setBalance((b) => b + yourPayout);

    const newStreak = iWon ? streakRef.current + 1 : 0;
    streakRef.current = newStreak;
    setStreak(newStreak);
    setLastWinner(winnerId);

    const winners = settled
      .filter((p) => p.payout > 0)
      .sort((a, b) => b.payout - a.payout)
      .slice(0, 5);
    for (const p of winners) {
      pushFeed(
        p.isYou || p.payout >= 8000 ? "bigwin" : "win",
        `${p.name} cashed on ${HORSES[p.horseId].name}`,
        p.payout,
        p.horseId,
      );
    }

    setResult({
      winnerId,
      placements: placed.map((r) => ({ id: r.horse.id, place: r.place })),
      players: settled,
      yourPayout,
      mult,
      streak: newStreak,
    });

    // juice
    const w = HORSES[winnerId];
    setBurstColors([w.color, "#facc15", "#ffffff", w.palette.silk, "#38bdf8"]);
    setBurst((b) => b + 1);
    if (iWon) {
      fxRef.current.shake = 1;
      if (yourPayout >= 4000) sfx.bigwin();
      else sfx.win();
    } else {
      fxRef.current.shake = 0.45;
      sfx.lose();
    }
    // Reveal the seed that produced this race and commit a fresh one.
    setFair((f) => {
      const next = randomSeed();
      return {
        serverSeed: next,
        serverSeedHash: sha256(next),
        clientSeed: f.clientSeed,
        nonce: f.nonce + 1,
        prevServerSeed: f.serverSeed,
        prevNonce: f.nonce,
        prevClientSeed: f.clientSeed,
      };
    });
    setScreen("result");
  }, [pushFeed]);

  useEffect(() => {
    if (screen !== "racing") return;
    let raf = 0;
    const t0 = performance.now();
    let places = 0;
    let timer: number | undefined;
    let pausedFor = 0;
    let pauseStart = 0;

    const script = scriptRef.current;
    const step = (ts: number) => {
      if (pausedRef.current) {
        if (!pauseStart) pauseStart = ts;
        raf = requestAnimationFrame(step);
        return;
      }
      if (pauseStart) { pausedFor += ts - pauseStart; pauseStart = 0; }

      const elapsed = (ts - t0 - pausedFor) / 1000;
      const rs = runnersRef.current;

      // Collect everyone who crosses this frame so ties can be broken by the
      // exact scripted finish time — never by array index (that would silently
      // reorder photo finishes and break the published RTP).
      const crossed: { i: number; at: number }[] = [];

      for (let i = 0; i < rs.length; i++) {
        const r = rs[i];
        if (r.finished) continue;

        // Base progress is a pure function of time / that runner's scripted
        // finish time, so the provably-fair order is always delivered.
        const finishAt = script ? script.finishAt[i] : 8;
        const base = elapsed / finishAt;

        // Jostle: lead changes + surges mid-race, damped to zero at the line
        // so noise can never reorder the finish.
        const damp = Math.max(0, 1 - Math.pow(base, 2.6));
        const wob =
          Math.sin(elapsed * (2.1 + i * 0.47) + i * 2.3) * 0.055 +
          Math.sin(elapsed * (0.9 + i * 0.21) + i) * 0.035;
        const gate = base < 0.06 ? base / 0.06 : 1; // break from the stalls

        r.momentum = wob * damp;
        r.x = Math.max(0, Math.min(1, (base + r.momentum) * gate));

        if (base >= 1) {
          r.x = 1;
          crossed.push({ i, at: finishAt });
        }
      }

      if (crossed.length) {
        crossed.sort((a, b) => a.at - b.at);
        for (const c of crossed) {
          const r = rs[c.i];
          places += 1;
          r.finished = true;
          r.place = places;
          if (places === 1) sfx.photo();
        }
      }

      if (places > 0 && timer === undefined) timer = window.setTimeout(settle, 1150);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [screen, settle]);

  // ---------- countdown 3-2-1 ----------
  const beginRace = useCallback(() => {
    sfx.go();
    fxRef.current.shake = 0.7;
    const rs = makeRunners();

    // ---- Provably-fair outcome, drawn BEFORE a single pixel moves ----
    const f = fairRef.current;
    const outcome = resolveRound(f.serverSeed, f.clientSeed, f.nonce, rs.length);

    // Choreograph finish times from the scripted order + margins.
    const BASE = 7.4;                       // winner's time (s)
    const SPREAD = outcome.photoFinish ? 0.55 : 1.9;
    const finishAt = new Array(rs.length).fill(BASE);
    outcome.order.forEach((horseId, place) => {
      finishAt[horseId] = BASE + outcome.margins[place] * SPREAD;
    });
    scriptRef.current = { order: outcome.order, finishAt };

    runnersRef.current = rs;
    setRunnersState(rs);
    setScreen("racing");
  }, []);

  useEffect(() => {
    if (screen !== "countdown") return;
    let n = 3;
    setCount(3);
    sfx.tick();
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        beginRace();
      } else {
        setCount(n);
        sfx.tick();
      }
    }, 780);
    return () => clearInterval(id);
  }, [screen, beginRace]);

  // ---------- actions ----------
  const enterLobby = useCallback(() => {
    unlockAudio();
    targetRef.current = lobbyTarget();
    playersRef.current = [];
    setPlayers([]);
    setFeed([]);
    setResult(null);
    runnersRef.current = makeRunners();
    setRunnersState(runnersRef.current);
    setScreen("betting");
  }, []);

  const startRace = useCallback(() => {
    if (screenRef.current !== "betting") return;
    if (selected === null || bet > balance || bet < MIN_BET) return;
    unlockAudio();
    sfx.chip();
    setBalance((b) => b - bet);
    const you = youEntry(bet, selected);
    playersRef.current = [you, ...playersRef.current.filter((p) => !p.isYou)];
    setPlayers(playersRef.current);
    pushFeed("join", `You → ${HORSES[selected].name}`, bet, selected);
    setResult(null);
    startedRef.current = true;
    setScreen("countdown");
  }, [bet, balance, selected, pushFeed]);

  // auto-start countdown while a horse is picked
  useEffect(() => {
    if (screen !== "betting" || selected === null) return;
    setAuto(AUTO_SECONDS);
    const id = setInterval(() => setAuto((a) => (a <= 1 ? 0 : a - 1)), 1000);
    return () => clearInterval(id);
  }, [screen, selected]);

  useEffect(() => {
    if (screen === "betting" && auto === 0 && selected !== null) startRace();
  }, [auto, screen, selected, startRace]);

  const nextRace = useCallback(() => {
    if (balance < MIN_BET) {
      const scores = saveHighScore(peak, "You");
      setHighScores(scores);
      sfx.bust();
      setScreen("gameover");
      return;
    }
    setResult(null);
    targetRef.current = lobbyTarget();
    playersRef.current = [];
    setPlayers([]);
    runnersRef.current = makeRunners();
    setRunnersState(runnersRef.current);
    setPaused(false);
    setScreen("betting");
  }, [balance, peak]);

  const restart = useCallback(() => {
    setBalance(START_BALANCE);
    setPeak(START_BALANCE);
    setBet(50);
    setSelected(null);
    setStreak(0);
    streakRef.current = 0;
    setResult(null);
    setPaused(false);
    fxRef.current.shake = 0;
    runnersRef.current = makeRunners();
    setRunnersState(runnersRef.current);
    enterLobby();
  }, [enterLobby]);

  const toStart = useCallback(() => {
    setHighScores(loadHighScores());
    setScreen("start");
  }, []);

  // busted right after a result
  useEffect(() => {
    if (screen === "result" && balance < MIN_BET) {
      const id = setTimeout(() => {
        const scores = saveHighScore(peak, "You");
        setHighScores(scores);
        sfx.bust();
        setScreen("gameover");
      }, 1500);
      return () => clearTimeout(id);
    }
  }, [screen, balance, peak]);

  // ---------- keyboard ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const s = screenRef.current;
      if (s === "start") {
        if (k === "enter" || k === " ") { e.preventDefault(); enterLobby(); }
      } else if (s === "betting") {
        if (/^[1-6]$/.test(k)) { e.preventDefault(); setSelected(Number(k) - 1); sfx.select(); }
        else if (k === "arrowup" || k === "arrowright") { e.preventDefault(); setBet((b) => Math.min(balance, b * 2)); sfx.chip(); }
        else if (k === "arrowdown" || k === "arrowleft") { e.preventDefault(); setBet((b) => Math.max(MIN_BET, Math.floor(b / 2))); sfx.chip(); }
        else if (k === "enter" || k === " ") { e.preventDefault(); startRace(); }
        else if (k === "m") { e.preventDefault(); setBet(Math.max(MIN_BET, balance)); sfx.chip(); }
        else if (k === "l") { e.preventDefault(); setMobileLive((v) => !v); }
        else if (k === "escape") { e.preventDefault(); toStart(); }
      } else if (s === "countdown") {
        if (k === "escape") { e.preventDefault(); setScreen("betting"); }
      } else if (s === "racing") {
        if (k === "p" || k === " ") { e.preventDefault(); setPaused((p) => !p); }
        else if (k === "escape") { e.preventDefault(); toStart(); }
      } else if (s === "result") {
        if (k === "enter" || k === " ") { e.preventDefault(); nextRace(); }
        else if (k === "r") { e.preventDefault(); restart(); }
      } else if (s === "gameover") {
        if (k === "enter" || k === " " || k === "r") { e.preventDefault(); restart(); }
        else if (k === "escape") { e.preventDefault(); toStart(); }
      }
      if (k === "n") { e.preventDefault(); setMute((m) => !m); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enterLobby, startRace, nextRace, restart, toStart, balance]);

  const selectedHorse = selected !== null ? HORSES[selected] : null;
  const potential = selectedHorse ? Math.floor(bet * selectedHorse.odds) : 0;
  const streakMult = streakMultiplier(streak);
  const pot = useMemo(() => players.reduce((s, p) => s + p.bet, 0), [players]);
  const stakePerHorse = useMemo(() => {
    const a = new Array(HORSES.length).fill(0);
    for (const p of players) if (p.horseId >= 0) a[p.horseId] += p.bet;
    return a;
  }, [players]);
  const picks = useMemo(() => {
    const c = new Array(HORSES.length).fill(0) as number[];
    for (const p of players) c[p.horseId]++;
    return c;
  }, [players]);

  const racing = screen === "racing" || screen === "result";
  const phase: "betting" | "countdown" | "racing" | "result" =
    screen === "countdown" ? "countdown" : racing ? "result" : "betting";

  return (
    <div className="horse-race-screen relative flex h-full min-h-[32rem] w-full flex-col overflow-hidden bg-[#0d0d10] text-[#fafafa]">
      {/* ambience */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(144,75,249,.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(0,255,189,.13),transparent_55%),radial-gradient(ellipse_at_top_right,rgba(166,101,245,.10),transparent_50%)]" />
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-40" />

      <TopBar
        balance={balance}
        streak={streak}
        pot={pot}
        players={players.length}
        mute={mute}
        setMute={setMute}
        onFair={() => setFairOpen(true)}
        onMenu={toStart}
        onToggleLive={() => setMobileLive((v) => !v)}
        showLiveToggle
      />

      <div className="relative mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 gap-2.5 p-2.5 lg:flex-row lg:gap-3 lg:p-3">
        {/* main column */}
        <div className="flex min-h-0 flex-1 flex-col gap-2.5">
          <div className="relative min-h-[190px] flex-1 overflow-hidden silicone silicone-purple rounded-2xl bg-[#09090c] sm:min-h-[240px]">
            <Track
              runners={runnersState}
              running={racing}
              paused={paused}
              parade={screen === "betting" || screen === "countdown"}
              fx={fxRef.current}
              burstToken={burst}
              burstColors={burstColors}
              yourHorseId={selected}
              onPhotoFinish={sfx.photo}
            />

            {/* pause button */}
            {screen === "racing" && (
              <div className="absolute left-2 top-2 flex gap-1.5">
                <button
                  onClick={() => { setPaused((p) => !p); sfx.click(); }}
                  className="btn-press rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 backdrop-blur hover:bg-black/80"
                >
                  {paused ? "▶" : "⏸"}
                </button>
                <div className="rounded-lg border border-[#a665f5]/30 bg-[#a665f5]/10 px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#d6bfff] backdrop-blur">
                  ● Live
                </div>
              </div>
            )}

            {/* countdown overlay */}
            {screen === "countdown" && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#0d0d10]/35 backdrop-blur-[1px]">
                <div key={count} className="animate-countPop text-center">
                  <div className="text-[86px] font-black leading-none text-glow text-[#00ffbd] sm:text-[120px]">
                    {count}
                  </div>
                  <div className="mt-1 text-xs font-black uppercase tracking-[0.4em] text-[#c9a6ff]">
                    Gates opening
                  </div>
                </div>
              </div>
            )}

            {/* start screen */}
            {screen === "start" && <StartScreen onStart={enterLobby} highScores={highScores} />}

            {/* result */}
            {screen === "result" && result && (
              <ResultScreen result={result} onNext={nextRace} onRestart={restart} />
            )}

            {/* game over */}
            {screen === "gameover" && (
              <GameOverScreen peak={peak} highScores={highScores} onRestart={restart} onMenu={toStart} />
            )}
          </div>

          {/* bet panel */}
          {(screen === "betting" || screen === "countdown" || racing) && (
            <BetPanel
              bet={bet}
              setBet={setBet}
              balance={balance}
              selected={selected}
              onSelect={(id) => { setSelected(id); sfx.select(); }}
              disabled={screen !== "betting"}
              onStart={startRace}
              potential={potential}
              picks={picks}
              auto={selected === null ? AUTO_SECONDS : auto}
              streakMult={streakMult}
              lastWinner={lastWinner}
            />
          )}
        </div>

        {/* desktop live panel */}
        <aside className="hidden w-[318px] shrink-0 lg:flex lg:min-h-0 lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <LivePanel players={players} feed={feed} phase={phase} />
          </div>
          <MiniStats players={players} pot={pot} />
        </aside>
      </div>

      {/* mobile live sheet */}
      {mobileLive && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-[#0d0d10]/80 backdrop-blur-sm lg:hidden">
          <div className="animate-rise mx-2 mb-2 flex h-[70vh] flex-col">
            <LivePanel players={players} feed={feed} phase={phase} onClose={() => setMobileLive(false)} />
            <MiniStats players={players} pot={pot} />
          </div>
        </div>
      )}

      {/* footer hints */}
      <div className="relative hidden shrink-0 items-center justify-between gap-3 px-4 pb-2 text-[10px] text-slate-500 sm:flex">
        <span className="flex items-center gap-1.5 font-bold tracking-wider text-[#00ffbd]/80">
          <SolGlyph size={10} /> TOLS.FUN
        </span>
        <div className="flex gap-3">
          <Hint k="1-6">pick</Hint>
          <Hint k="↑ ↓">bet</Hint>
          <Hint k="M">max</Hint>
          <Hint k="Space">race</Hint>
          <Hint k="P">pause</Hint>
          <Hint k="R">restart</Hint>
          <Hint k="L">lobby</Hint>
          <Hint k="N">mute</Hint>
        </div>
        <span className="text-slate-600">TOLS Originals · 18+ play-money tables</span>
      </div>
      <div className="relative flex shrink-0 items-center justify-center gap-1.5 pb-1.5 text-[9px] font-bold tracking-wider text-slate-600 sm:hidden">
        <SolGlyph size={9} /> TOLS.FUN · 18+ play money
      </div>

      {/* win flash */}
      {screen === "result" && result?.yourPayout && result.yourPayout > 0 && (
        <div className="animate-flashOut pointer-events-none absolute inset-0 z-30 bg-[#00ffbd]/20" />
      )}
      <FairnessPanel
        open={fairOpen}
        onClose={() => setFairOpen(false)}
        fair={fair}
        stakePerHorse={stakePerHorse}
        streak={streak}
        onClientSeed={(cs) => setFair((f) => ({ ...f, clientSeed: cs }))}
        onRotate={() =>
          setFair((f) => {
            const ns = randomSeed();
            return { ...f, serverSeed: ns, serverSeedHash: sha256(ns), nonce: 1 };
          })
        }
      />
    </div>
  );
}

function Hint({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-400">
        {k}
      </kbd>
      {children}
    </span>
  );
}

/* ============================= TOP BAR ============================= */
function TopBar({
  balance, streak, pot, players, mute, setMute, onMenu, onToggleLive, showLiveToggle, onFair,
}: {
  balance: number; streak: number; pot: number; players: number; mute: boolean;
  setMute: (m: boolean) => void; onMenu: () => void; onToggleLive: () => void; showLiveToggle?: boolean;
  onFair: () => void;
}) {
  return (
    <header className="relative z-20 flex shrink-0 items-center justify-between gap-2 border-b border-white/[.08] bg-[#0d0d10]/90 px-2.5 py-2 backdrop-blur sm:px-4">
      <div className="flex items-center gap-2.5">
        <TolsBadge size={15} />
        <div className="hidden border-l border-white/10 pl-2.5 leading-none sm:block">
          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#00ffbd]/80">
            Live Crypto Racing
          </div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Horse Derby
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {streak > 1 && (
          <div className="animate-pop hidden items-center gap-1 rounded-lg border border-[#a665f5]/30 bg-[#a665f5]/10 px-2 py-1.5 sm:flex">
            <span className="text-sm">🔥</span>
            <span className="font-mono text-xs font-black text-[#d6bfff]">
              {streak}× · {streakMultiplier(streak).toFixed(2)}x
            </span>
          </div>
        )}
        <div className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 md:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-[#a665f5]" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-[#a665f5]" />
          </span>
          <span className="font-mono text-[11px] font-bold text-slate-300">{players} live</span>
          <span className="font-mono text-[11px] font-bold text-[#00ffbd]">₡{fmt(pot)}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-[#00ffbd]/25 bg-[#00ffbd]/10 px-2.5 py-1.5">
          <SolGlyph size={13} />
          <span className="font-mono text-sm font-black tabular-nums text-[#00ffbd]">{fmt(balance)}</span>
          <span className="hidden text-[8px] font-black uppercase tracking-widest text-[#00b386] sm:inline">tols</span>
        </div>
        <button
          onClick={onFair}
          className="btn-press hidden items-center gap-1.5 rounded-lg border border-[#904bf9]/35 bg-[#904bf9]/12 px-2 py-1.5 sm:flex"
          title="Fairness & RTP"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#c9a6ff]">RTP</span>
          <span className="font-mono text-[11px] font-bold text-[#00ffbd]">
            {(TARGET_RTP * 100).toFixed(0)}%
          </span>
          <span className="text-[9px] text-[#c9a6ff]">🛡</span>
        </button>
        <button
          onClick={onFair}
          className="btn-press grid h-8 w-8 place-items-center rounded-lg border border-[#904bf9]/35 bg-[#904bf9]/12 text-xs sm:hidden"
          title="Fairness & RTP"
        >
          🛡
        </button>
        <button
          onClick={() => setMute(!mute)}
          className="btn-press grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-xs hover:bg-white/10"
          title="Mute (N)"
        >
          {mute ? "🔇" : "🔊"}
        </button>
        {showLiveToggle && (
          <button
            onClick={onToggleLive}
            className="btn-press grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-xs hover:bg-white/10 lg:hidden"
            title="Live lobby (L)"
          >
            👥
          </button>
        )}
        <button
          onClick={onMenu}
          className="btn-press grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-xs hover:bg-white/10"
          title="Menu"
        >
          ☰
        </button>
      </div>
    </header>
  );
}

function MiniStats({ players, pot }: { players: Player[]; pot: number }) {
  const top = [...players].sort((a, b) => b.bet - a.bet)[0];
  return (
    <div className="mt-2 grid shrink-0 grid-cols-3 gap-1.5 text-center">
      <Stat label="Pot" value={`₡${fmt(pot)}`} tone="amber" />
      <Stat label="Players" value={String(players.length)} tone="emerald" />
      <Stat label="Top bet" value={top ? `₡${fmt(top.bet)}` : "—"} tone="sky" />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "amber" | "emerald" | "sky" }) {
  const tones = {
    amber: "border-[#00ffbd]/25 text-[#00ffbd]",
    emerald: "border-[#904bf9]/30 text-[#c9a6ff]",
    sky: "border-[#a665f5]/25 text-[#d6bfff]",
  }[tone];
  return (
    <div className={`rounded-lg border bg-slate-900/60 px-1.5 py-1.5 ${tones}`}>
      <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="font-mono text-xs font-black">{value}</div>
    </div>
  );
}

/* ============================= BET PANEL ============================= */
function BetPanel({
  bet, setBet, balance, selected, onSelect, disabled, onStart, potential, picks, auto, streakMult, lastWinner,
}: {
  bet: number; setBet: (n: number) => void; balance: number; selected: number | null;
  onSelect: (id: number) => void; disabled: boolean; onStart: () => void; potential: number;
  picks: number[]; auto: number; streakMult: number; lastWinner: number | null;
}) {
  const maxBet = Math.max(MIN_BET, balance);
  const clamp = (n: number) => Math.max(MIN_BET, Math.min(Math.floor(n), maxBet));
  return (
    <div className="shrink-0 silicone rounded-2xl p-2 sm:p-3">
      {/* horses */}
      <div className="mb-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
        {HORSES.map((h) => {
          const on = selected === h.id;
          const won = lastWinner === h.id;
          return (
            <button
              key={h.id}
              onClick={() => !disabled && onSelect(h.id)}
              disabled={disabled}
              className={`btn-press group relative overflow-hidden rounded-xl border p-1.5 text-left transition-all sm:p-2 ${
                on ? "bg-white/10" : "border-white/5 bg-[#09090c]/70 hover:border-white/20 hover:bg-slate-800/60"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              style={{
                borderColor: on ? h.color : undefined,
                boxShadow: on ? `0 0 0 1px ${h.color}, 0 10px 30px -12px ${h.color}` : undefined,
              }}
            >
              {on && (
                <span
                  className="animate-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-white/15"
                />
              )}
              {won && <span className="absolute right-1 top-1 text-[10px]">🏆</span>}
              {picks[h.id] > 0 && (
                <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1 font-mono text-[8px] font-bold text-slate-400">
                  {picks[h.id]}👥
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-black text-white shadow"
                  style={{ background: `linear-gradient(140deg,${h.palette.coatLight},${h.palette.coatDark})`, boxShadow: `0 0 12px ${h.color}55` }}
                >
                  {h.id + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[9px] font-bold text-slate-300 sm:text-[10px]">{h.name}</div>
                  <div className="font-mono text-sm font-black leading-tight text-[#00ffbd] sm:text-base">
                    {h.odds.toFixed(1)}×
                  </div>
                  <div className="text-[8px] font-semibold text-slate-500">{chance(h.id)}% win</div>
                </div>
                <div className="hidden shrink-0 opacity-95 sm:block">
                  <HorseIcon horse={h} size={34} running={on} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="flex-1 rounded-xl border border-white/5 bg-[#09090c]/70 p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Bet amount</span>
            <span className="font-mono text-[9px] text-slate-500">bal ₡{fmt(balance)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setBet(clamp(bet / 2)); sfx.chip(); }} disabled={disabled}
              className="btn-press rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-white/10 disabled:opacity-40">½</button>
            <button onClick={() => { setBet(clamp(bet * 2)); sfx.chip(); }} disabled={disabled}
              className="btn-press rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-white/10 disabled:opacity-40">2×</button>
            <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#00ffbd]/25 bg-black/40 px-2 py-1.5">
              <span className="text-[#00ffbd]">₡</span>
              <input
                value={bet}
                onChange={(e) => setBet(clamp(Number(e.target.value.replace(/\D/g, "")) || MIN_BET))}
                disabled={disabled}
                inputMode="numeric"
                className="w-full max-w-[110px] bg-transparent text-center font-mono text-lg font-black tabular-nums text-[#00ffbd] outline-none"
              />
            </div>
            <button onClick={() => { setBet(clamp(bet - 10)); sfx.chip(); }} disabled={disabled}
              className="btn-press rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-slate-300 hover:bg-white/10 disabled:opacity-40">−</button>
            <button onClick={() => { setBet(clamp(bet + 10)); sfx.chip(); }} disabled={disabled}
              className="btn-press rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-slate-300 hover:bg-white/10 disabled:opacity-40">+</button>
          </div>
          <div className="mt-1.5 grid grid-cols-5 gap-1">
            {BET_CHIPS.map((v) => (
              <button key={v} onClick={() => { setBet(clamp(v)); sfx.chip(); }} disabled={disabled}
                className="btn-press rounded-md border border-white/5 bg-[#202024] py-1 text-[10px] font-bold text-slate-300 hover:bg-[#2a2a30] disabled:opacity-40">
                {v}
              </button>
            ))}
            <button onClick={() => { setBet(maxBet); sfx.chip(); }} disabled={disabled}
              className="btn-press rounded-md border border-[#904bf9]/40 bg-[#904bf9]/15 py-1 text-[10px] font-black text-[#c9a6ff] hover:bg-[#904bf9]/25 disabled:opacity-40">
              MAX
            </button>
          </div>
        </div>

        <div className="flex gap-2 sm:w-[248px] sm:flex-col">
          <div className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-white/5 bg-[#09090c]/70 px-3 py-2 sm:flex-none">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-500">To win</div>
              <div className="font-mono text-lg font-black leading-none text-[#00ffbd]">
                {fmt(Math.floor(potential * streakMult))}
              </div>
            </div>
            {streakMult > 1 && (
              <span className="rounded bg-[#a665f5]/15 px-1.5 py-0.5 font-mono text-[10px] font-black text-[#d6bfff]">
                🔥{streakMult.toFixed(1)}x
              </span>
            )}
          </div>
          <button
            onClick={onStart}
            disabled={disabled || selected === null || bet > balance || bet < MIN_BET}
            className="btn-press relative flex-1 overflow-hidden rounded-xl btn-lime px-5 py-3 font-heading text-base font-bold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:!bg-[#202024] disabled:!bg-none disabled:!text-[#5b5c66] disabled:!shadow-none sm:flex-none sm:py-3.5"
          >
            <span className="relative z-10">
              {disabled ? "Race in progress" : selected === null ? "Pick a horse" : `Race ${bet > balance ? "—" : "▶"}`}
            </span>
            {!disabled && selected !== null && (
              <span className="animate-shimmer absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-white/30" />
            )}
          </button>
          {selected !== null && !disabled && (
            <div className="sm:hidden">
              <AutoBar seconds={auto} />
            </div>
          )}
        </div>
      </div>

      {selected !== null && !disabled && (
        <div className="mt-2 hidden sm:block">
          <AutoBar seconds={auto} />
        </div>
      )}
    </div>
  );
}

function AutoBar({ seconds }: { seconds: number }) {
  const pct = (seconds / AUTO_SECONDS) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%`, background: seconds <= 3 ? "#f43f5e" : "#00ffbd" }}
        />
      </div>
      <span className={`font-mono text-[10px] font-black ${seconds <= 3 ? "text-rose-400" : "text-slate-400"}`}>
        auto {seconds}s
      </span>
    </div>
  );
}

/* ============================= START ============================= */
function StartScreen({ onStart, highScores }: { onStart: () => void; highScores: HighScore[] }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-gradient-to-b from-[#0d0d10]/92 via-[#0d0d10]/88 to-[#09090c]/96 p-3 backdrop-blur-sm">
      <div className="animate-rise w-full max-w-md text-center">
        <div className="mb-1 flex justify-center">
          <TolsLockup logoSize={124} />
        </div>
        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.35em] text-[#c9a6ff]">
          Horse Derby · Retro Arcade
        </p>
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-[#a3a4ac]">
          Silicone originals · lime · fluo purple
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-[#904bf9]/40 bg-[#904bf9]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#c9a6ff]">
            <SolGlyph size={9} /> TOLS Original
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[#00ffbd]/30 bg-[#00ffbd]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#00ffbd]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-[#00ffbd]" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[#00ffbd]" />
            </span>
            Live Lobby
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
            6 Runners
          </span>
        </div>

        <div className="my-3 flex justify-center gap-0.5 sm:gap-1">
          {HORSES.map((h) => (
            <div key={h.id} className="animate-bob" style={{ animationDelay: `${h.id * 0.12}s` }}>
              <HorseIcon horse={h} size={40} running />
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="btn-press group relative mb-4 w-full overflow-hidden rounded-2xl btn-lime px-8 py-4 font-heading text-xl font-bold uppercase tracking-[0.18em]"
          style={{ animation: "pulseGlow 2.2s ease-in-out infinite" }}
        >
          <span className="relative z-10">Join the race</span>
          <span className="animate-shimmer absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-white/30" />
        </button>

        <div className="silicone rounded-2xl p-3 text-left">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">🏆 Top balances</span>
            <span className="font-mono text-[9px] text-slate-600">local</span>
          </div>
          {highScores.length === 0 ? (
            <div className="py-2 text-center text-[11px] text-slate-500">No records yet — set the first one.</div>
          ) : (
            <div className="space-y-0.5">
              {highScores.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-4 text-right font-mono text-slate-600">{i + 1}</span>
                    <span className="font-semibold text-slate-300">{h.name}</span>
                  </span>
                  <span className="font-mono font-black text-[#00ffbd]">{fmt(h.score)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
          ₡1,000 free TOLS credits · bet on 6 horses · beat the live lobby.<br />
          Longer odds = bigger payout · chain wins for a 🔥 multiplier · no wallet needed.
        </p>
      </div>
    </div>
  );
}

/* ============================= RESULT ============================= */
function ResultScreen({ result, onNext, onRestart }: { result: RaceResult; onNext: () => void; onRestart: () => void }) {
  const w = HORSES[result.winnerId];
  const won = result.yourPayout > 0;
  const board = [...result.players].sort((a, b) => (b.payout ?? 0) - (a.payout ?? 0)).slice(0, 7);
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[#0d0d10]/75 p-3 backdrop-blur-sm">
      <div className="animate-slideDown w-full max-w-md overflow-hidden silicone silicone-purple rounded-2xl bg-[#16171b]">
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: `linear-gradient(100deg,${w.color}33,transparent)` }}
        >
          <div className="text-3xl">{won ? "🎉" : "😐"}</div>
          <div className="min-w-0 flex-1">
            <TolsWordmark size={10} className="mb-0.5 block opacity-70" />
            <div className={`text-lg font-black leading-tight ${won ? "text-glow text-[#00ffbd]" : "text-slate-200"}`}>
              {won ? "YOU WIN!" : "NO LUCK"}
            </div>
            <div className="truncate text-[11px] text-slate-400">
              🏆 <span style={{ color: w.color }}>{w.name}</span> took the race
              {result.streak > 1 && <span className="ml-1 text-[#d6bfff]">· 🔥 {result.streak} streak</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">payout</div>
            <div className={`font-mono text-lg font-black ${won ? "text-[#00ffbd]" : "text-slate-500"}`}>
              {won ? `+${fmt(result.yourPayout)}` : "—"}
            </div>
          </div>
        </div>

        <div className="border-y border-white/5 bg-slate-950/50 px-4 py-2">
          <div className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Final order</div>
          <div className="flex flex-wrap gap-1">
            {result.placements
              .slice()
              .sort((a, b) => a.place - b.place)
              .map((p, i) => {
                const h = HORSES[p.id];
                return (
                  <span
                    key={p.id}
                    className="flex items-center gap-1 rounded-md border border-white/5 bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ color: h.color }}
                  >
                    <span className="text-slate-500">{["🥇", "🥈", "🥉"][i] ?? `${p.place}.`}</span>
                    {h.name}
                  </span>
                );
              })}
          </div>
        </div>

        <div className="max-h-[132px] overflow-y-auto px-4 py-2 scroll-thin">
          <div className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Lobby payouts</div>
          {board.map((p) => (
            <div key={p.id} className={`flex items-center gap-2 py-0.5 text-[11px] ${p.isYou ? "text-[#00ffbd]" : "text-slate-300"}`}>
              <span className="w-20 truncate font-semibold">{p.name}</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: HORSES[p.horseId].color }} />
              <span className="flex-1 truncate text-[10px] text-slate-500">₡{fmt(p.bet)}</span>
              <span className={`font-mono font-black ${p.payout ? "text-[#00ffbd]" : "text-slate-600"}`}>
                {p.payout ? `+${fmt(p.payout)}` : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t border-white/5 p-3">
          <button
            onClick={onRestart}
            className="btn-press rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-xs font-black uppercase tracking-wider text-slate-300 hover:bg-white/10"
          >
            ↻
          </button>
          <button
            onClick={onNext}
            className="btn-press relative flex-1 overflow-hidden rounded-xl btn-lime px-4 py-3 font-heading text-base font-bold uppercase tracking-[0.18em]"
          >
            <span className="relative z-10">Next race ▶</span>
            <span className="animate-shimmer absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-white/25" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================= GAME OVER ============================= */
function GameOverScreen({
  peak, highScores, onRestart, onMenu,
}: { peak: number; highScores: HighScore[]; onRestart: () => void; onMenu: () => void }) {
  const rank = highScores.findIndex((h) => h.score === peak && h.name === "You") + 1;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[#0d0d10]/92 p-3 backdrop-blur">
      <div className="animate-rise w-full max-w-sm text-center">
        <div className="mb-1 flex justify-center opacity-90">
          <TolsLockup logoSize={82} tone="lime" />
        </div>
        <h2 className="font-heading text-4xl font-bold uppercase tracking-wider text-[#e1514e] text-glow">
          BUSTED
        </h2>
        <p className="mb-3 text-xs text-slate-400">Out of credits</p>
        <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-[#00ffbd]/25 bg-[#00ffbd]/10 px-4 py-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#00b386]">peak</span>
          <span className="font-mono text-xl font-black text-[#00ffbd]">₡{fmt(peak)}</span>
          {rank > 0 && <span className="rounded bg-[#904bf9]/25 px-1.5 text-[10px] font-black text-[#c9a6ff]">#{rank}</span>}
        </div>
        <div className="mb-4 silicone rounded-2xl p-3">
          {highScores.slice(0, 5).map((h, i) => (
            <div key={i} className="flex items-center justify-between py-0.5 text-xs">
              <span className="flex items-center gap-2">
                <span className="w-4 text-right font-mono text-slate-600">{i + 1}</span>
                <span className="font-semibold text-slate-300">{h.name}</span>
              </span>
              <span className="font-mono font-black text-[#00ffbd]">{fmt(h.score)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onMenu} className="btn-press flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-300 hover:bg-white/10">
            Menu
          </button>
          <button onClick={onRestart} className="btn-press flex-[2] rounded-xl btn-lime px-4 py-3 font-heading text-base font-bold uppercase tracking-[0.18em]">
            ↻ Play again
          </button>
        </div>
      </div>
    </div>
  );
}
