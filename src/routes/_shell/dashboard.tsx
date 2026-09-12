import { Link, createFileRoute } from "@tanstack/react-router";
import {
  RiArrowRightUpLine,
  RiDashboard3Line,
  RiDiceLine,
  RiLock2Line,
  RiWallet3Line,
} from "@remixicon/react";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { FieldBoard } from "@/components/sports/field-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useBetHistory } from "@/lib/bet-history";
import { CURRENCIES, CURRENCY_META, type Currency } from "@/lib/games-catalog";
import { formatMoney } from "@/lib/format";
import { featuredEvents } from "@/lib/sports-book";
import { useWallet } from "@/lib/wallet-context";

export const Route = createFileRoute("/_shell/dashboard")({ component: DashboardPage });

const VIP = [
  { name: "Member", min: 0 },
  { name: "Gold", min: 1000 },
  { name: "Diamond", min: 5000 },
  { name: "Obsidian", min: 25000 },
];

function vipFor(wagered: number) {
  let current = VIP[0]!;
  let next = VIP[1];
  for (let i = VIP.length - 1; i >= 0; i--) {
    if (wagered >= VIP[i]!.min) {
      current = VIP[i]!;
      next = VIP[i + 1];
      break;
    }
  }
  const span = (next?.min ?? current.min + 1) - current.min;
  const pct = next ? Math.min(100, ((wagered - current.min) / span) * 100) : 100;
  return { current, next, pct };
}

function DashboardPage() {
  const { user } = useCurrentUserState();
  const { balances, wagered, currency, transactions, loading, refresh } = useWallet();
  const bets = useBetHistory();
  const live = featuredEvents();
  const vip = vipFor(wagered);
  const recent = bets.slice(0, 8);
  const tx = transactions.slice(0, 6);
  const totalFiat = balances.USDT;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Dashboard" }]} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-sub text-[0.65rem] tracking-[0.14em] text-lime uppercase">House desk</p>
          <BluescreenTitle as="h1" className="text-3xl font-bold md:text-4xl">
            Dashboard
          </BluescreenTitle>
          <p className="font-sub mt-1 text-sm text-muted-foreground">
            {user?.displayName ? `Welcome back, ${user.displayName}.` : "Sign in to see balances, tickets, and VIP."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/profile">
              <RiWallet3Line className="size-3.5" />
              Wallet
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/sports">Sports</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Balance" value={`${formatMoney(totalFiat, "USDT")} USDT`} hint="Primary rail" />
        <Kpi label="Wagered" value={`${formatMoney(wagered, "USDT")} USDT`} hint="Lifetime" />
        <Kpi label="VIP" value={vip.current.name} hint={vip.next ? `Next ${vip.next.name}` : "Top of house"} />
        <Kpi label="Live markets" value={String(live.length)} hint="On the board now" />
      </section>

      <p className="font-sub text-[0.65rem] tracking-[0.14em] text-lime uppercase">Casino</p>
      <section className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Casino rounds</CardTitle>
            <Link to="/profile" className="text-xs text-lime">
              History
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{loading ? "Loading…" : "No rounds yet."}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead className="text-right">Stake</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.title}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(b.stake, b.currency as Currency)} {b.currency}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${b.win ? "text-lime" : "text-muted-foreground"}`}>
                        {b.win ? `+${formatMoney(b.payout, b.currency as Currency)}` : b.label}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Ledger</CardTitle>
            <Link to="/profile" className="text-xs text-lime">
              Wallet
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {tx.length === 0 ? (
              <p className="text-sm text-muted-foreground">No movements.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Rail</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tx.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="capitalize">{t.type}</TableCell>
                      <TableCell>{t.currency}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(t.amount, t.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/casino">
            <RiDiceLine className="size-3.5" />
            Originals
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/vault">
            <RiLock2Line className="size-3.5" />
            Vault
          </Link>
        </Button>
        <Button variant="outline" onClick={() => void refresh()}>
          <RiDashboard3Line className="size-3.5" />
          Refresh
        </Button>
      </section>

      <p className="font-sub text-[0.65rem] tracking-[0.14em] text-lime uppercase">Sports</p>
      <section className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Live board</CardTitle>
            <Link to="/sports" className="inline-flex items-center gap-1 text-xs text-lime">
              Markets <RiArrowRightUpLine className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {live.length ? (
              live.map((ev) => (
                <Link key={ev.id} to="/sports/$id" params={{ id: ev.id }} className="sb-card block">
                  <FieldBoard event={ev} />
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No live events.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>VIP</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="font-heading text-2xl tracking-wide">{vip.current.name}</p>
            <div className="vip-progress">
              <div className="vip-progress-bar" style={{ width: `${vip.pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {vip.next
                ? `${formatMoney(Math.max(0, vip.next.min - wagered), "USDT")} USDT to ${vip.next.name}`
                : "Obsidian. Top of the house."}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/vip">VIP program</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl tracking-wide tabular-nums">{value}</p>
        <p className="mt-1 text-[0.7rem] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
