import { Link } from "@tanstack/react-router";
import { RiArrowRightLine } from "@remixicon/react";
import { GameCard } from "@/components/games/game-card";
import { ProviderMark } from "@/components/games/provider-mark";
import { BluescreenTitle } from "@/components/brand/bluescreen-title";
import type { ProviderGroup } from "@/lib/providers";

/** Horizontal provider shelf: original logo header + snap-scroll row. */
export function ProviderShelf({ group, limit = 12 }: { group: ProviderGroup; limit?: number }) {
  const cap = group.premium ? Math.max(limit, 14) : limit;
  const games = group.games.slice(0, cap);
  if (games.length === 0) return null;
  return (
    <section aria-label={`${group.name} games`} className="tols-shelf">
      <div className="flex items-center gap-3">
        <ProviderMark
          name={group.name}
          logo={group.logo}
          tone={group.tone}
          className="h-11 w-[4.5rem] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BluescreenTitle as="h2" className="truncate text-base font-bold md:text-xl">
              {group.name}
            </BluescreenTitle>
            {group.premium ? (
              <span className="shrink-0 rounded-full border border-lime/40 bg-lime/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-lime">
                PREMIUM
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {group.games.length} {group.games.length === 1 ? "game" : "games"}
            {group.live ? ` · ${group.live} live` : ""}
          </p>
        </div>
        <Link
          to="/casino"
          search={{ provider: group.slug }}
          className="ml-auto inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-lime/60 hover:text-lime"
        >
          View all
          <RiArrowRightLine className="size-3.5" />
        </Link>
      </div>
      <div className="tols-shelf-scroll">
        <div className="tols-shelf-grid">
          {games.map((game, i) => (
            <GameCard key={game.id} game={game} priority={i < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
