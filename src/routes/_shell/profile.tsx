import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useWallet } from "@/lib/wallet-context";
import { CURRENCIES } from "@/lib/games-catalog";
import { formatMoney, mockAddressFromUserId, shortAddress, explorerAddressUrl } from "@/lib/format";
import { getNetworkMeta } from "@/lib/onchain/config";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { ResponsibleTools } from "@/components/wallet/responsible-tools";
import { useBetHistory, recordBet } from "@/lib/bet-history";
import { listBetRounds } from "@/lib/bet-history.server";
import { useRoundViewerOptional } from "@/components/games/round-dialog";
import { useEffect } from "react";

export const Route = createFileRoute("/_shell/profile")({ component: ProfilePage });

function vipLabel(wagered: number) {
  if (wagered >= 25000) return "Obsidian";
  if (wagered >= 5000) return "Diamond";
  if (wagered >= 1000) return "Gold";
  return "Member";
}

function ProfilePage() {
  const { user, isPending } = useCurrentUserState();
  const { balances, transactions, wagered } = useWallet();
  const bets = useBetHistory();
  const viewer = useRoundViewerOptional();

  useEffect(() => {
    void listBetRounds()
      .then((rows) => rows.forEach(recordBet))
      .catch(() => undefined);
  }, []);

  if (isPending) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  if (!user) return <RedirectToSignIn />;

  const vip = vipLabel(wagered);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Profile" }]} />
      <header>
        <p className="text-xs font-medium tracking-[0.18em] text-gold uppercase">{vip}</p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight">
          {user.displayName ?? "Player"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.primaryEmail}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {(() => {
            const address = mockAddressFromUserId(user.id);
            const href = explorerAddressUrl(address);
            const net = getNetworkMeta(1).name;
            return href ? (
              <a href={href} target="_blank" rel="noreferrer" className="hover:text-foreground">
                {shortAddress(address)}
                {net ? ` · ${net}` : null}
              </a>
            ) : (
              shortAddress(address)
            );
          })()}
        </p>
        <Link to="/vip" className="mt-3 inline-block text-sm text-primary hover:underline">
          VIP Program
        </Link>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        {CURRENCIES.map((c) => (
          <div key={c} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted-foreground">{c}</p>
            <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
              {formatMoney(balances[c], c)}
            </p>
          </div>
        ))}
      </section>
      <ResponsibleTools />
      <section>
        <h2 className="font-heading mb-3 text-xl font-semibold">Bet history</h2>
        <ul className="grid gap-2">
          {bets.length === 0 ? (
            <li className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
              Play an Original — each round is saved here with its seed.
            </li>
          ) : (
            bets.slice(0, 40).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => viewer?.open(r)}
                  className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3 text-left shadow-[var(--shadow-border)]"
                >
                  <span>
                    <span className={`text-xs font-bold ${r.win ? "text-lime" : "text-muted-foreground"}`}>
                      {r.win ? "WIN" : "LOSE"}
                    </span>
                    <span className="ml-2 text-sm font-medium">{r.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{r.label}</span>
                  </span>
                  <span className="text-sm tabular-nums">
                    {r.multiplier ? `${r.multiplier.toFixed(2)}×` : "0×"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
      <section>
        <h2 className="font-heading mb-3 text-xl font-semibold">Ledger</h2>
        <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No movement yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="capitalize">{t.type}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatMoney(t.amount, t.currency)} {t.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.note ?? t.gameId}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
