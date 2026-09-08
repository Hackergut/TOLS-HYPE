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
        before you bet. Your client seed and a nonce feed the HMAC. After the bet, the
        float in [0, 1) is the only randomness — dice, crash, mines, keno, hi-lo, slots,
        roulette, blackjack shuffles, and Pool Rush physics jitter all consume it.
      </p>
      <pre className="mt-6 overflow-x-auto rounded-xl bg-muted p-4 text-xs">{`HMAC_SHA256(serverSeed, clientSeed:nonce:chunk)
float = first 4 bytes / 2^32

dice    roll = floor(float * 10000) / 100     RTP 99%
crash   if float < edge → 1.00x else (1-edge)/(1-float)
pool    floats jitter the rack; 2D elastic break; RTP 96%`}</pre>
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
