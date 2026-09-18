import { DiceTrack } from "@/components/games/dice-track";
import { RouletteWheel } from "@/components/games/roulette-wheel";
import type { RoundView, SnapCard } from "@/lib/bet-history";
import { widgetWinClass } from "@/lib/palette";
import { roulettePocketClass } from "@/lib/roulette-ui";
import { cn } from "cn";

export function RoundClone({
  view,
  win,
  label,
  size = "card",
}: {
  view: RoundView | null;
  win: boolean;
  label: string;
  size?: "pill" | "card";
}) {
  const pill = size === "pill";
  if (!view) {
    return (
      <span className={cn("grid place-items-center font-semibold tabular-nums", pill ? cn("h-8 min-w-8 px-1.5 text-[0.7rem]", widgetWinClass(win)) : "h-16 text-sm")}>
        {label}
      </span>
    );
  }
  if (view.kind === "dice") {
    return pill ? (
      <span className={cn("grid h-8 min-w-10 place-items-center px-1.5 text-[0.7rem] font-bold tabular-nums", widgetWinClass(win))}>
        {view.roll.toFixed(2)}
      </span>
    ) : (
      <DiceTrack target={view.target ?? 50} over={Boolean(view.over)} roll={view.roll} rollWin={win} compact />
    );
  }
  if (view.kind === "roulette") {
    return pill ? (
      <RouletteChip n={view.number} color={view.color} />
    ) : (
      <div className="flex flex-col items-center gap-1">
        <RouletteWheel number={view.number} spinning={false} className="relative aspect-square w-36" />
        <p className="font-heading text-lg font-bold tabular-nums">
          {view.number} <span className="text-xs font-medium text-muted-foreground">{view.color}</span>
        </p>
      </div>
    );
  }
  if (view.kind === "slots") return <SlotsClone reels={view.reels} pill={pill} win={win} />;
  if (view.kind === "crash") return <CrashClone view={view} win={win} pill={pill} />;
  if (view.kind === "mines") return <MinesClone view={view} pill={pill} />;
  if (view.kind === "keno") return <KenoClone view={view} pill={pill} />;
  if (view.kind === "hilo") return <HiloClone view={view} pill={pill} />;
  if (view.kind === "blackjack") return <BlackjackClone view={view} pill={pill} />;
  if (view.kind === "pool") return <PoolClone view={view} win={win} pill={pill} />;
  if (view.kind === "limbo") return <LimboClone view={view} win={win} pill={pill} />;
  if (view.kind === "plinko") return <PlinkoClone view={view} pill={pill} />;
  if (view.kind === "tower") return <TowerClone view={view} pill={pill} />;
  if (view.kind === "crazy") return <CrazyClone view={view} win={win} pill={pill} />;
  if (view.kind === "derby") return <DerbyClone view={view} pill={pill} />;
  return null;
}

const DERBY_CLONE_COLORS = ["#e63946", "#3d7bff", "#00ffbd", "#ffb703", "#904bf9", "#f4f4f5"];

function DerbyClone({ view, pill }: { view: Extract<RoundView, { kind: "derby" }>; pill: boolean }) {
  if (pill) {
    return (
      <span className="grid h-8 min-w-10 place-items-center px-1.5 text-[0.7rem] font-heading font-bold tabular-nums bg-muted">
        🏇{view.winnerId + 1}
      </span>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {view.order.map((id, i) => (
        <span
          key={id}
          className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold"
          style={{
            borderColor: `${DERBY_CLONE_COLORS[id] ?? "#fff"}55`,
            color: DERBY_CLONE_COLORS[id],
          }}
        >
          <span className="font-mono text-[0.6rem] text-muted-foreground">{i + 1}.</span>
          H{id + 1}
        </span>
      ))}
    </div>
  );
}

function LimboClone({ view, win, pill }: { view: Extract<RoundView, { kind: "limbo" }>; win: boolean; pill: boolean }) {
  return (
    <span className={cn("grid place-items-center font-heading font-bold tabular-nums", pill ? cn("h-8 min-w-10 px-1.5 text-[0.7rem]", widgetWinClass(win)) : "h-16 text-2xl")}>
      {view.roll.toFixed(2)}×
    </span>
  );
}

function PlinkoClone({ view, pill }: { view: Extract<RoundView, { kind: "plinko" }>; pill: boolean }) {
  return (
    <span className={cn("grid place-items-center font-heading font-bold tabular-nums", pill ? "h-8 min-w-10 px-1.5 text-[0.7rem] bg-muted" : "h-16 text-2xl")}>
      {view.multiplier.toFixed(2)}×
    </span>
  );
}

function TowerClone({ view, pill }: { view: Extract<RoundView, { kind: "tower" }>; pill: boolean }) {
  return (
    <span className={cn("grid place-items-center font-heading font-bold tabular-nums", pill ? "h-8 min-w-10 px-1.5 text-[0.7rem] bg-muted" : "h-16 text-2xl")}>
      L{view.row}
    </span>
  );
}

function CrazyClone({ view, win, pill }: { view: Extract<RoundView, { kind: "crazy" }>; pill: boolean; win: boolean }) {
  const t = view.segment === "1" || view.segment === "2" || view.segment === "5" || view.segment === "10" ? "" : "";
  return (
    <span className={cn("grid place-items-center font-heading font-bold tabular-nums", pill ? cn("h-8 min-w-10 px-1.5 text-[0.7rem]", widgetWinClass(win)) : "h-16 text-2xl")}>
      {view.segment}
      {t}
    </span>
  );
}

function RouletteChip({ n, color }: { n: number; color: string }) {
  return (
    <span className={cn("grid size-8 place-items-center rounded-full text-[0.7rem] font-bold tabular-nums", roulettePocketClass(color))}>
      {n}
    </span>
  );
}

function SlotsClone({ reels, pill, win }: { reels: string[]; pill: boolean; win: boolean }) {
  return (
    <div className={cn("flex items-center", pill ? "h-8 gap-0.5 bg-muted px-0.5" : "justify-center gap-2", win && !pill && "drop-shadow-[0_0_12px_var(--lime-300)]")}>
      {reels.slice(0, 3).map((s, i) => (
        <span
          key={`${s}-${i}`}
          className={cn(
            "grid place-items-center rounded-md bg-tile font-heading font-bold",
            pill ? "h-7 w-6 text-[0.65rem]" : "h-16 w-12 text-xl",
          )}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function CrashClone({ view, win, pill }: { view: Extract<RoundView, { kind: "crash" }>; win: boolean; pill: boolean }) {
  const x = view.cashAt ?? view.crashAt ?? 0;
  return (
    <span className={cn("grid place-items-center font-heading font-bold tabular-nums", pill ? "h-8 min-w-10 px-1.5 text-[0.7rem]" : "h-16 text-2xl", widgetWinClass(win))}>
      {x.toFixed(2)}×
    </span>
  );
}

function MinesClone({ view, pill }: { view: Extract<RoundView, { kind: "mines" }>; pill: boolean }) {
  const revealed = view.revealed ?? [];
  const mines = view.mines ?? [];
  if (pill) {
    return (
      <span className={cn("grid h-8 min-w-8 place-items-center px-1.5 text-[0.7rem] font-semibold", widgetWinClass(!view.boom))}>
        {view.boom ? "boom" : `${view.multiplier ?? 0}×`}
      </span>
    );
  }
  return (
    <div className="grid grid-cols-5 gap-0.5">
      {Array.from({ length: 25 }, (_, i) => {
        const mine = mines.includes(i);
        const open = revealed.includes(i);
        return (
          <span
            key={i}
            className={cn(
              "grid aspect-square place-items-center rounded-sm text-[0.55rem] font-bold",
              mine && open ? "bg-purple text-lime" : open ? "bg-lime text-black" : "bg-tile",
            )}
          >
            {mine && open ? "●" : open ? "◆" : ""}
          </span>
        );
      })}
    </div>
  );
}

function KenoClone({ view, pill }: { view: Extract<RoundView, { kind: "keno" }>; pill: boolean }) {
  const selected = view.selected ?? [];
  const drawn = view.drawn ?? [];
  if (pill) {
    return (
      <span className={cn("grid h-8 min-w-8 place-items-center px-1.5 text-[0.7rem] font-semibold tabular-nums", widgetWinClass(view.hits > 0))}>
        {view.picks ? `${view.hits}/${view.picks}` : `${view.hits}`}
      </span>
    );
  }
  return (
    <div className="grid grid-cols-8 gap-0.5">
      {Array.from({ length: 40 }, (_, i) => {
        const n = i + 1;
        const sel = selected.includes(n);
        const hit = drawn.includes(n) && sel;
        const house = drawn.includes(n) && !sel;
        return (
          <span
            key={n}
            className={cn(
              "grid aspect-square place-items-center rounded text-[0.55rem] font-semibold tabular-nums",
              hit
                ? "keno-hit"
                : house
                  ? "keno-house"
                  : sel
                    ? "keno-pick"
                    : "keno-idle",
            )}
          >
            {n}
          </span>
        );
      })}
    </div>
  );
}

function rankGlyph(n?: number) {
  if (n == null) return "?";
  if (n === 1) return "A";
  if (n === 11) return "J";
  if (n === 12) return "Q";
  if (n === 13) return "K";
  return String(n);
}

function HiloClone({ view, pill }: { view: Extract<RoundView, { kind: "hilo" }>; pill: boolean }) {
  const arrow = view.pick === "lower" ? "↓" : "↑";
  if (pill) {
    const a = rankGlyph(view.prev);
    const b = rankGlyph(view.next);
    return (
      <span className="grid h-8 place-items-center px-1.5 text-[0.7rem] font-semibold tabular-nums bg-muted">
        {view.prev != null && view.next != null ? `${a}${arrow}${b}` : `${arrow}`}
      </span>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2">
      <MiniCard rank={rankGlyph(view.prev)} suit={view.prevSuit ?? "♠"} />
      <span className="text-lg text-lime">{arrow}</span>
      <MiniCard rank={rankGlyph(view.next)} suit={view.nextSuit ?? "♠"} />
    </div>
  );
}

function MiniCard({ rank, suit }: { rank: string | number; suit: string }) {
  const red = suit === "♥" || suit === "♦";
  return (
    <span className={cn("grid h-14 w-10 place-content-center rounded-md bg-card ring-1 ring-border text-sm font-bold", red ? "text-primary-bright" : "text-foreground")}>
      {rank}
      {suit}
    </span>
  );
}

function BlackjackClone({ view, pill }: { view: Extract<RoundView, { kind: "blackjack" }>; pill: boolean }) {
  if (pill) {
    return (
      <span className="grid h-8 place-items-center px-1.5 text-[0.7rem] font-semibold tabular-nums bg-muted">
        {view.playerTotal ?? "—"}/{view.dealerTotal ?? "—"}
      </span>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <HandRow cards={view.dealer} total={view.dealerTotal} kicker="Dealer" />
      <HandRow cards={view.player} total={view.playerTotal} kicker="You" />
    </div>
  );
}

function HandRow({ cards, total, kicker }: { cards?: SnapCard[]; total?: number; kicker: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-12 text-[0.6rem] uppercase text-muted-foreground">{kicker}</span>
      {(cards ?? []).slice(0, 6).map((c, i) => (
        <MiniCard key={`${c.rank}${c.suit}${i}`} rank={c.rank} suit={c.suit} />
      ))}
      <span className="ml-1 text-xs font-semibold tabular-nums">{total}</span>
    </div>
  );
}

function PoolClone({ view, win, pill }: { view: Extract<RoundView, { kind: "pool" }>; win: boolean; pill: boolean }) {
  if (pill) {
    return (
      <span className={cn("grid h-8 min-w-8 place-items-center px-1.5 text-[0.7rem] font-semibold", widgetWinClass(win))}>
        {view.scratch ? "scratch" : `${view.balls}`}
      </span>
    );
  }
  return (
    <p className="text-center text-sm tabular-nums">
      {view.scratch ? "Scratch" : `${view.balls} pocketed`}
    </p>
  );
}
