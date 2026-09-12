import { useState } from "react";
import { Link } from "@tanstack/react-router";
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
import { cn } from "cn";

type Tab = "my" | "high" | "race" | "lottery";

const HIGH: { user: string; game: string; stake: number; payout: number; mult: number }[] = [
  { user: "hex", game: "Crash", stake: 420, payout: 8400, mult: 20 },
  { user: "nova", game: "Dice", stake: 250, payout: 2475, mult: 9.9 },
  { user: "lido", game: "Pool Rush", stake: 180, payout: 2160, mult: 12 },
  { user: "ash", game: "Mines", stake: 500, payout: 0, mult: 0 },
  { user: "kite", game: "Roulette", stake: 300, payout: 600, mult: 2 },
  { user: "orio", game: "Keno", stake: 150, payout: 2100, mult: 14 },
];

const RACE: { rank: number; user: string; wagered: number; prize: number }[] = [
  { rank: 1, user: "nova", wagered: 128400, prize: 25000 },
  { rank: 2, user: "hex", wagered: 97210, prize: 15000 },
  { rank: 3, user: "lido", wagered: 81440, prize: 10000 },
  { rank: 4, user: "kite", wagered: 60120, prize: 8000 },
  { rank: 5, user: "ash", wagered: 44880, prize: 6000 },
  { rank: 6, user: "orio", wagered: 33100, prize: 4500 },
  { rank: 7, user: "ven", wagered: 27450, prize: 3500 },
  { rank: 8, user: "sol", wagered: 19880, prize: 2500 },
];

const LOTTERY: { id: string; name: string; prize: string; ends: string; ticket: string }[] = [
  { id: "daily", name: "Daily Drop", prize: "$2,500", ends: "3h 12m", ticket: "$1" },
  { id: "weekly", name: "Weekly Jackpot", prize: "$25,000", ends: "2d 4h", ticket: "$5" },
  { id: "mega", name: "Mega Ball", prize: "$100,000", ends: "5d 18h", ticket: "$10" },
];

export function LiveFeed({ gameId }: { gameId?: string }) {
  const [tab, setTab] = useState<Tab>("my");
  const bets = useBetHistory();
  const mine = gameId ? bets.filter((b) => b.gameId === gameId) : bets;
  const viewer = useRoundViewerOptional();

  return (
    <section className="overflow-hidden rounded-2xl bg-card">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-0">
        <TabsList variant="line" className="h-11 w-full justify-start gap-0 rounded-none border-b border-border px-2">
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
      </Tabs>
      <div className="p-3 md:p-4">
        {tab === "my" ? <MyBets rows={mine} onOpen={(r) => viewer?.open(r)} /> : null}
        {tab === "high" ? <HighRollers /> : null}
        {tab === "race" ? <WeeklyRace /> : null}
        {tab === "lottery" ? <Lottery /> : null}
      </div>
    </section>
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
  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No bets yet on this table.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Game</TableHead>
          <TableHead>Bet</TableHead>
          <TableHead className="text-right">Payout</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.slice(0, 12).map((r) => (
          <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r)}>
            <TableCell>
              <p className="font-medium">{r.title}</p>
              <p className="text-[0.7rem] text-muted-foreground">{r.label}</p>
            </TableCell>
            <TableCell className="tabular-nums">{r.stake}</TableCell>
            <TableCell className="text-right">
              <Result win={r.win}>{r.win ? `+${r.payout}` : "0"}</Result>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function HighRollers() {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {HIGH.map((r) => (
        <li key={`${r.user}-${r.game}-${r.stake}`}>
          <BetPlayerCard user={r.user} game={r.game} stake={r.stake} payout={r.payout} mult={r.mult} />
        </li>
      ))}
    </ul>
  );
}

function WeeklyRace() {
  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        $100,000 pool · resets Monday · paid bets on Originals
      </p>
      <ul className="grid gap-2">
        {RACE.map((r) => (
          <li key={r.rank} className="bet-player">
            <PlayerShot handle={r.user} />
            <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-2">
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

function Lottery() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {LOTTERY.map((l) => (
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
