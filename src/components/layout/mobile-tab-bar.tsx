import { useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  RiDiceLine,
  RiTvLine,
  RiSearchLine,
  RiBasketballLine,
  RiUser3Line,
} from "@remixicon/react";
import { GAMES } from "@/lib/games-catalog";
import { SPORT_EVENTS } from "@/lib/sports-book";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "cn";

const tabs = [
  { id: "casino", label: "Casino", to: "/casino" as const, icon: RiDiceLine, match: ["/", "/casino", "/games"] },
  { id: "live", label: "Live", to: "/live" as const, icon: RiTvLine, match: ["/live"] },
  { id: "search", label: "Search", to: null, icon: RiSearchLine, match: [] },
  { id: "sports", label: "Sports", to: "/sports" as const, icon: RiBasketballLine, match: ["/sports"] },
  { id: "profile", label: "Profile", to: "/profile" as const, icon: RiUser3Line, match: ["/profile"] },
] as const;

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const sportHits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? SPORT_EVENTS.filter(
          (e) =>
            e.home.toLowerCase().includes(needle) ||
            e.away.toLowerCase().includes(needle) ||
            e.league.toLowerCase().includes(needle),
        )
      : SPORT_EVENTS.filter((e) => e.live);
    return list.slice(0, 6);
  }, [q]);

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return GAMES.slice(0, 8);
    return GAMES.filter(
      (g) =>
        g.title.toLowerCase().includes(needle) ||
        g.provider.toLowerCase().includes(needle) ||
        g.kind.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <>
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid h-14 grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.match.some((p) => pathname === p || (p !== "/" && pathname.startsWith(p)));
            const isSearch = tab.id === "search";
            return (
              <li key={tab.id} className="flex items-center justify-center">
                {isSearch ? (
                  <button
                    type="button"
                    aria-label="Search games"
                    onClick={() => setSearchOpen(true)}
                    className="-mt-4 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-fab)]"
                  >
                    <Icon className="size-5" />
                  </button>
                ) : (
                  <Link
                    to={tab.to!}
                    className={cn(
                      "flex h-full w-full flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium",
                      active ? "text-lime" : "text-muted-foreground",
                    )}
                  >
                    <Icon className={cn("size-5", active && "text-lime")} />
                    {tab.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] rounded-t-2xl bg-card pb-8">
          <SheetHeader className="px-4 pt-2 pb-0">
            <SheetTitle>Search</SheetTitle>
            <SheetDescription>Games and matches.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pt-3">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Milan, dice, crash…"
              className="h-11 rounded-lg"
            />
            <ul className="mt-3 max-h-[50dvh] space-y-1 overflow-y-auto">
              {sportHits.length ? (
                <li className="px-2 pt-1 font-sub text-[0.6rem] tracking-[0.14em] text-muted-foreground uppercase">Sports</li>
              ) : null}
              {sportHits.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted"
                    onClick={() => {
                      setSearchOpen(false);
                      void navigate({ to: "/sports/$id", params: { id: e.id } });
                    }}
                  >
                    <span className="grid size-11 place-items-center rounded-lg bg-muted font-heading text-[0.65rem] text-lime">
                      {e.homeAbbr}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {e.home} vs {e.away}
                      </span>
                      <span className="block text-xs text-muted-foreground">{e.league}</span>
                    </span>
                    {e.live ? <span className="text-[0.65rem] text-lime">Live</span> : null}
                  </button>
                </li>
              ))}
              <li className="px-2 pt-2 font-sub text-[0.6rem] tracking-[0.14em] text-muted-foreground uppercase">Casino</li>
              {hits.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted"
                    onClick={() => {
                      setSearchOpen(false);
                      void navigate({ to: "/games/$id", params: { id: g.id } });
                    }}
                  >
                    <img src={g.cover} alt="" className="size-11 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{g.title}</span>
                      <span className="block text-xs text-muted-foreground">{g.provider}</span>
                    </span>
                    <span className="text-xs tabular-nums text-lime">{g.rtp.toFixed(1)}%</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
