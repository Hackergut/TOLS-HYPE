import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { RiListCheck2 } from "@remixicon/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBetHistory, type BetRound } from "@/lib/bet-history";
import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { formatMoney } from "@/lib/format";
import { BetPlayerCard, PlayerShot } from "@/components/players/player-shot";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { WeeklyRaceModal } from "@/components/promos/weekly-race-modal";
import { LiveRaceStats } from "@/components/promos/live-race-stats";
import { cn } from "cn";

type Tab = "my" | "high" | "race" | "lottery";

const HIGH_SEED: { user: string; game: string; stake: number; payout: number; mult: number }[] = [
  { user: "hex", game: "Crash", stake: 420, payout: 8400, mult: 20 },
  { user: "nova", game: "Dice", stake: 250, payout: 2475, mult: 9.9 },
  { user: "lido", game: "Pool Rush", stake: 180, payout: 2160, mult: 12 },
  { user: "ash", game: "Mines", stake: 500, payout: 0, mult: 0 },
  { user: "kite", game: "Roulette", stake: 300, payout: 600, mult: 2 },
  { user: "orio", game: "Keno", stake: 150, payout: 2100, mult: 14 },
];

const HIGH = Array.from({ length: 100 }, (_, i) => {
  const base = HIGH_SEED[i % HIGH_SEED.length]!;
  const lap = Math.floor(i / HIGH_SEED.length);
  return {
    user: lap === 0 ? base.user : `${base.user}${lap + 1}`,
    game: base.game,
    stake: base.stake + lap * 20,
    payout: base.payout === 0 ? 0 : base.payout + lap * 50,
    mult: base.mult,
  };
});

const RACE = Array.from({ length: 100 }, (_, i) => ({
  rank: i + 1,
  user: ["nova", "hex", "lido", "kite", "ash", "orio", "ven", "sol"][i % 8]! + (i < 8 ? "" : String(Math.floor(i / 8) + 1)),
  wagered: Math.max(500, 128400 - i * 1100),
  prize: Math.max(50, Math.round(25000 / (1 + i * 0.35))),
}));

const LOTTERY: { id: string; name: string; prize: string; ends: string; ticket: string }[] = [
  { id: "daily", name: "Daily Drop", prize: "$2,500", ends: "3h 12m", ticket: "$1" },
  { id: "weekly", name: "Weekly Jackpot", prize: "$25,000", ends: "2d 4h", ticket: "$5" },
  { id: "mega", name: "Mega Ball", prize: "$100,000", ends: "5d 18h", ticket: "$10" },
];

export function LiveFeed({ gameId }: { gameId?: string }) {
  const [tab, setTab] = useState<Tab>("my");
  const [limit, setLimit] = useState<PageSize>(10);
  const bets = useBetHistory();
  const mine = gameId ? bets.filter((b) => b.gameId === gameId) : bets;
  const viewer = useRoundViewerOptional();

  return (
    <section className="overflow-hidden rounded-2xl bg-card">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-0">
        <div className="flex items-center border-b border-border pr-2">
          <TabsList variant="line" className="h-11 min-w-0 flex-1 justify-start gap-0 rounded-none px-2">
            <TabsTrigger value="my" className="px-3">
              My Bets
            </TabsTrigger>
            <TabsTrigger value="high" className="px-3">
              High Roller
            </TabsTrigger>
            <TabsTrigger value="race" className="px-3">
              Weekly Race
            </TabsTrigger>
            <TabsTrigger value="lottery" className="px-3">
              Lottery
            </TabsTrigger>
          </TabsList>
          <PageSizePicker value={limit} onChange={setLimit} />
        </div>
      </Tabs>
      <div className="p-3 md:p-4">
        {tab === "my" ? <MyBets rows={mine.slice(0, limit)} onOpen={(r) => viewer?.open(r)} /> : null}
        {tab === "high" ? <HighRollers rows={HIGH.slice(0, limit)} /> : null}
        {tab === "race" ? <WeeklyRace rows={RACE.slice(0, limit)} /> : null}
        {tab === "lottery" ? <Lottery rows={LOTTERY.slice(0, limit)} /> : null}
      </div>
    </section>
  );
}

const PAGE_SIZES = [10, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

function PageSizePicker({ value, onChange }: { value: PageSize; onChange: (n: PageSize) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={`Rows: ${value}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <RiListCheck2 className="size-4" />
        <span className="tabular-nums">{value}</span>
      </button>
      {open ? (
        <div className="absolute top-9 right-0 z-20 grid min-w-16 overflow-hidden rounded-md border border-border bg-card shadow-md">
          {PAGE_SIZES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                onChange(n);
                setOpen(false);
              }}
              className={cn("px-3 py-1.5 text-left text-xs tabular-nums hover:bg-muted", n === value && "text-lime")}
            >
              {n}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Result({ win, children }: { win: boolean; children: string }) {
  return (
    <span className={cn("font-semibold tabular-nums", win ? "text-lime" : "text-muted-foreground")}>
      {children}
    </span>
  );
}

function MyBets({ rows, onOpen }: { rows: BetRound[]; onOpen: (r: BetRound) => void }) {
  const { user } = useCurrentUserState();
  const handle = user?.displayName?.split("@")[0] || user?.primaryEmail?.split("@")[0] || "you";
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Game</TableHead>
          <TableHead>Bet Amount</TableHead>
          <TableHead>Multiplier</TableHead>
          <TableHead className="text-right">Payout</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
              No bets yet on this table.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r)}>
              <TableCell>
                <span className="inline-flex max-w-36 items-center gap-2">
                  <PlayerShot handle={handle} />
                  <span className="truncate font-medium">{handle}</span>
                </span>
              </TableCell>
              <TableCell>
                <p className="font-medium">{r.title}</p>
                <p className="text-[0.7rem] text-muted-foreground">{r.label}</p>
              </TableCell>
              <TableCell className="tabular-nums">{r.stake}</TableCell>
              <TableCell className="tabular-nums">{r.multiplier.toFixed(2)}×</TableCell>
              <TableCell className="text-right">
                <Result win={r.win}>{r.win ? `+${r.payout}` : "0"}</Result>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function HighRollers({ rows }: { rows: typeof HIGH }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {rows.map((r) => (
        <li key={`${r.user}-${r.game}-${r.stake}`}>
          <BetPlayerCard user={r.user} game={r.game} stake={r.stake} payout={r.payout} mult={r.mult} />
        </li>
      ))}
    </ul>
  );
}

function WeeklyRace({ rows }: { rows: typeof RACE }) {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(false);
  return (
    <div>
      <div className="mb-3 flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center justify-between rounded-lg bg-lime px-4 py-3 text-left text-black"
        >
          <span>
            <span className="block text-sm font-bold">$100,000 Weekly Race</span>
            <span className="text-xs text-black/70">Resets Monday · paid bets on Originals</span>
          </span>
          <span className="text-sm font-medium">Details</span>
        </button>
        <button
          type="button"
          onClick={() => setStats(true)}
          className="rounded-lg border border-[#2a2e38] px-3 text-sm font-medium"
        >
          Stats
        </button>
      </div>
      <WeeklyRaceModal open={open} onClose={() => setOpen(false)} />
      <LiveRaceStats open={stats} onClose={() => setStats(false)} />
      <ul className="grid gap-2">
        {rows.map((r) => (
          <li key={r.rank} className="bet-player">
            <PlayerShot handle={r.user} />
            <div className="flex min-w-0 items-center justify-between gap-3 py-1.5 pr-3 pl-2">
              <div className="min-w-0">
                <p className="font-sub text-[0.65rem] tracking-[0.14em] text-lime uppercase">#{r.rank}</p>
                <p className="truncate font-medium">{r.user}</p>
                <p className="text-xs tabular-nums text-muted-foreground">{formatMoney(r.wagered, "USDT")} wagered</p>
              </div>
              <p className="font-heading text-sm tabular-nums text-lime">{formatMoney(r.prize, "USDT")}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Lottery({ rows }: { rows: typeof LOTTERY }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {rows.map((l) => (
        <li key={l.id} className="rounded-xl bg-muted/50 p-4">
          <p className="text-[0.65rem] font-semibold tracking-wider text-lime uppercase">{l.ends}</p>
          <h3 className="font-bluescreens mt-1 text-sm uppercase">{l.name}</h3>
          <p className="mt-2 font-heading text-xl font-bold text-lime">{l.prize}</p>
          <p className="mt-1 text-xs text-muted-foreground">Ticket {l.ticket}</p>
          <Link
            to="/promotions"
            hash="jackpot"
            className="mt-3 inline-flex h-8 items-center rounded-lg bg-lime px-3 text-xs font-bold text-black"
          >
            Enter
          </Link>
        </li>
      ))}
    </ul>
  );
}
