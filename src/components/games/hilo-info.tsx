import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const OVERVIEW = [
  ["Type", "TOLS Original — next-card call"],
  ["Mechanic", "Higher or Lower. Same rank wins."],
  ["Streak", "The hand keeps going. A new card is dealt only when it ends."],
  ["Edge", "1.00% house · 99% RTP"],
  ["Pace", "A few seconds per call"],
  ["Rank", "Ace = 1 · King = 13"],
] as const;

const RISK = [
  ["A – 3", "Higher", "Lower", "Higher is the cheap side. Lower pays fat and misses often."],
  ["4 – 6", "Higher", "Lower", "Higher still safer. Lower starts to look tempting."],
  ["7 – 9", "Either", "Either", "Closest to a coin flip. Multipliers sit in the middle."],
  ["10 – Q", "Lower", "Higher", "Lower is the cheap side. Higher is the long shot."],
  ["K", "Lower", "Higher", "Lower is almost free. Higher is rare."],
] as const;

const FAQ = [
  {
    q: "How does TOLS Hi-Lo work?",
    a: "A card is face up. You call Higher or Lower and the hand continues on each hit. A miss ends it at 0×. Cash out any time. The next hand starts from a new card only after that.",
  },
  {
    q: "Is it fair?",
    a: "Yes. HMAC-SHA256 commit-reveal. The footer link opens the current server hash, your client seed, and nonce. Same pipeline as Dice and Crash.",
  },
  {
    q: "Do ties win?",
    a: "Yes. Same rank counts as a hit on both Higher and Lower. There is no separate Same button.",
  },
  {
    q: "What does Skip do?",
    a: "Skip deals a fresh starting card before the hand starts. It does not spend the stake. Once the hand is live, Skip is locked until you cash out or miss.",
  },
  {
    q: "Can I play small?",
    a: "Yes. Use the ½ chip on Bet Amount. Limits follow the wallet currency you picked.",
  },
  {
    q: "Is there a winning system?",
    a: "No. The 1% edge is priced into every multiplier. A budget, a cash-out rule, and skipping ugly mid-ranks keep sessions saner. It is not income.",
  },
] as const;

export function HiloInfo() {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
      <div className="border-b border-border px-4 py-3 md:px-5">
        <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-lime uppercase">TOLS Originals</p>
        <h2 className="font-bluescreens mt-1 text-xl font-bold">Hi-Lo — how the table works</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          One face-up card. Call Higher or Lower. Each hit stays in the same hand and compounds. Cash out
          when you want, or miss and the hand ends. Only then does a new starting card come out. Ace is low,
          King is high, same rank wins. 18+ play-money or real wallet, same math.
        </p>
      </div>

      <div className="grid gap-6 px-4 py-5 md:px-5">
        <section>
          <h3 className="font-sub text-sm font-semibold">Quick sheet</h3>
          <div className="mt-2 overflow-hidden rounded-xl">
            <Table>
              <TableBody>
                {OVERVIEW.map(([k, v]) => (
                  <TableRow key={k}>
                    <TableCell className="w-36 text-muted-foreground">{k}</TableCell>
                    <TableCell className="font-medium">{v}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section>
          <h3 className="font-sub text-sm font-semibold">Play a round</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Set the stake in the left rail. ½ and 2× sit on the field.</li>
            <li>Read the face-up card in the center. Skip deals another if you do not like it.</li>
            <li>Higher or Lower — each button shows the live multiplier for that side.</li>
            <li>Hit: the card flips and the hand continues. Miss: 0×, then a new starting card.</li>
            <li>Cash out to end the hand. The next one starts from the beginning.</li>
          </ol>
        </section>

        <section>
          <h3 className="font-sub text-sm font-semibold">Rank vs risk</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Safer calls pay less. The price on the button is 0.99 divided by that side’s chance.
          </p>
          <div className="mt-2 overflow-x-auto rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Up-card</TableHead>
                  <TableHead>Cheaper call</TableHead>
                  <TableHead>Longer shot</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RISK.map((row) => (
                  <TableRow key={row[0]}>
                    <TableCell className="font-medium">{row[0]}</TableCell>
                    <TableCell>{row[1]}</TableCell>
                    <TableCell>{row[2]}</TableCell>
                    <TableCell className="text-muted-foreground">{row[3]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section>
          <h3 className="font-sub text-sm font-semibold">Two tempos</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Quiet: cheap side on extremes, cash after two or three hits, skip the 7–9 coin-flips.</li>
            <li>Hot: ride mid-ranks for fatter steps. Expect short rounds. Set a stop before you start.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-sub text-sm font-semibold">FAQ</h3>
          <dl className="mt-2 divide-y divide-border border-t border-border">
            {FAQ.map((item) => (
              <div key={item.q} className="py-3">
                <dt className="text-sm font-medium">{item.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </article>
  );
}
