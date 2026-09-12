import { createFileRoute } from "@tanstack/react-router";
import { TolsBreadcrumb } from "@/components/layout/tols-breadcrumb";
import { GAMES } from "@/lib/games-catalog";

export const Route = createFileRoute("/_shell/fairness")({ component: FairnessPage });

function FairnessPage() {
  return (
    <main className="mx-auto w-full max-w-3xl">
      <TolsBreadcrumb items={[{ label: "Lobby", to: "/" }, { label: "Provably Fair" }]} />
      <h1 className="font-heading mt-6 text-3xl font-semibold tracking-tight">Fairness</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Every Original is a SHA-256 HMAC round. The house commits to a server seed hash
        before you bet. Your client seed, a nonce, and a counter feed the HMAC. Discrete
        outcomes (dice, roulette, mines, keno, slots, hi-lo, blackjack shuffle) use
        rejection sampling so every bucket in 0..N-1 is equally likely. Crash and Pool
        Rush consume 53-bit units in [0, 1).
      </p>
      <pre className="mt-6 overflow-x-auto rounded-xl bg-muted p-4 text-xs">{`HMAC_SHA256(serverSeed, clientSeed:nonce:counter)
u64    = first 8 bytes, big-endian
int(N) = u64 mod N, redraw if u64 ≥ floor(2^64 / N) * N   // rejection sampling
unit   = (u64 >> 11) / 2^53                               // uniform [0, 1)

dice      roll = int(10000) / 100                         RTP 99%
roulette  pocket = int(37)
crash     if unit < edge → 1.00x else (1-edge)/(1-unit)
mines     sample without replacement via int(remaining)
keno      10 unique draws from 1..40 via int(remaining)
slots     weighted symbol via int(sum weights)
blackjack Fisher–Yates with int(i+1)
pool      53-bit units jitter the rack; 2D elastic break; RTP 96%`}</pre>
      <h2 className="font-heading mt-8 text-xl font-semibold">Published RTP</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-2">Game</th>
            <th>Edge</th>
            <th>RTP</th>
          </tr>
        </thead>
        <tbody>
          {GAMES.filter((g) => g.original).map((g) => (
            <tr key={g.id} className="border-t border-border">
              <td className="py-2">{g.title}</td>
              <td>{(g.edge * 100).toFixed(1)}%</td>
              <td className="text-lime">{g.rtp}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-muted-foreground">
        Open any table → Settings → Advanced to set a client seed, read the hash, and
        reveal the previous server seed.
      </p>
      <h2 className="font-heading mt-8 text-xl font-semibold">What is not real</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Wallet addresses are derived for display. They do not receive chain deposits.</li>
        <li>USDT, BTC, and ETH balances are ledger rows, not tokens.</li>
      </ul>
    </main>
  );
}
