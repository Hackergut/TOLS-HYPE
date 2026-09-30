import { useEffect, useState, type ReactNode } from "react";
import { RiArrowDownSLine, RiListCheck2 } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GAME_LEGENDS } from "@/lib/game-legends";
import { listGameWins, type GameWinRow } from "@/lib/casino-api";
import { formatMoney } from "@/lib/format";
import type { CatalogGame } from "@/lib/games-catalog";
import { cn } from "cn";

const WINDOWS = [
  { id: "24h", label: "24 Hours" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
] as const;

export function GameLegend({ game }: { game: CatalogGame }) {
  const copy = GAME_LEGENDS[game.kind];
  const [open, setOpen] = useState(true);
  const [sort, setSort] = useState<"luckiest" | "highest">("luckiest");
  const [windowId, setWindowId] = useState<(typeof WINDOWS)[number]["id"]>("24h");
  const [wins, setWins] = useState<GameWinRow[]>([]);
  const [limit, setLimit] = useState(10);
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    let live = true;
    void listGameWins({ data: { gameId: game.id, window: windowId, sort, limit: limit as 10 | 50 | 100 } })
      .then((rows) => {
        if (live) setWins(rows);
      })
      .catch(() => {
        if (live) setWins([]);
      });
    return () => {
      live = false;
    };
  }, [game.id, windowId, sort, limit]);

  const tags = game.original
    ? ["TOLS Games", "TOLS Originals"]
    : game.live
      ? ["TOLS Games", "Live"]
      : ["TOLS Games"];

  const sections = [
    { id: "what", title: `What is ${game.title} on TOLS?`, body: copy.what },
    { id: "how", title: `How to play ${game.title}`, list: copy.how },
    { id: "features", title: "Features", list: copy.features },
    { id: "payouts", title: "Payouts", payouts: copy.payouts },
    { id: "symbols", title: "Special symbols", list: copy.symbols },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <article className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img src={game.cover} alt="" className="size-10 rounded-lg object-cover" />
            <h2 className="font-bluescreens truncate text-lg font-bold">{game.title}</h2>
          </div>
          <RiArrowDownSLine className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-4 py-4 md:px-5 md:py-5">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full">
                  {t}
                </Badge>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{copy.summary}</p>
            <p className="mt-3 text-sm">
              Edge: <span className="font-semibold text-lime">{(game.edge * 100).toFixed(2)}%</span>
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Tabs value={sort} onValueChange={(v) => setSort(v as "luckiest" | "highest")}>
                <TabsList variant="line" className="h-9">
                  <TabsTrigger value="luckiest">Luckiest Wins</TabsTrigger>
                  <TabsTrigger value="highest">Highest Wins</TabsTrigger>
                </TabsList>
              </Tabs>
              <select
                value={windowId}
                onChange={(e) => setWindowId(e.target.value as typeof windowId)}
                className="h-8 rounded-lg border border-border bg-muted px-2 text-xs"
                aria-label="Window"
              >
                {WINDOWS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
              <div className="relative">
                <button
                  type="button"
                  aria-label={`Rows: ${limit}`}
                  onClick={() => setLimitOpen((v) => !v)}
                  className="flex h-8 items-center gap-1 rounded-md px-1.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  <RiListCheck2 className="size-4" />
                  <span className="tabular-nums">{limit}</span>
                </button>
                {limitOpen ? (
                  <div className="absolute top-9 right-0 z-20 grid min-w-16 overflow-hidden rounded-md border border-border bg-card shadow-md">
                    {[10, 50, 100].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setLimit(n);
                          setLimitOpen(false);
                        }}
                        className={cn("px-3 py-1.5 text-left text-xs tabular-nums hover:bg-muted", n === limit && "text-lime")}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Multiplier</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        No wins in this window yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    wins.slice(0, limit).map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.user}</TableCell>
                        <TableCell className="text-right tabular-nums text-lime">
                          {w.multiplier ? `${w.multiplier.toFixed(2)}×` : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(w.payout, w.currency)} {w.currency}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 divide-y divide-border border-t border-border">
              {sections.map((s, i) => (
                <LegendBlock key={s.id} title={s.title} defaultOpen={i === 0}>
                  {s.body ? <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p> : null}
                  {s.list ? (
                    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {s.list.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                  {s.payouts ? (
                    <ul className="grid gap-1.5 text-sm">
                      {s.payouts.map((p) => (
                        <li key={p.label} className="flex justify-between gap-3">
                          <span className="text-muted-foreground">{p.label}</span>
                          <span className="tabular-nums text-lime">{p.value}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </LegendBlock>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </article>
    </Collapsible>
  );
}

function LegendBlock({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-3 text-left">
        <span className="font-sub text-sm font-medium">{title}</span>
        <RiArrowDownSLine className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}
