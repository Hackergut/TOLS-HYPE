import { ProviderMark } from "@/components/games/provider-mark";
import type { ProviderGroup } from "@/lib/providers";
import { cn } from "cn";

/** Horizontally scrolling provider filter chips with original logo marks. */
export function ProviderStrip({
  providers,
  selected,
  onSelect,
}: {
  providers: ProviderGroup[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  if (providers.length === 0) return null;
  return (
    <div
      className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 md:mx-0 md:px-0"
      role="tablist"
      aria-label="Filter by provider"
    >
      <button
        type="button"
        role="tab"
        aria-selected={selected === null}
        onClick={() => onSelect(null)}
        className={cn(
          "inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
          selected === null
            ? "border-lime/70 bg-lime/10 text-lime"
            : "border-border text-muted-foreground hover:border-lime/40 hover:text-foreground",
        )}
      >
        All providers
      </button>
      {providers.map((p) => {
        const active = selected === p.slug;
        return (
          <button
            key={p.slug}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(active ? null : p.slug)}
            title={`${p.name} — ${p.games.length} games`}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-semibold transition-colors",
              active
                ? "border-lime/70 bg-lime/10 text-lime"
                : "border-border text-muted-foreground hover:border-lime/40 hover:text-foreground",
            )}
          >
            <ProviderMark name={p.name} logo={p.logo} tone={p.tone} className="h-8 w-12 rounded-md" />
            <span className="max-w-32 truncate">{p.name}</span>
            {p.premium ? (
              <span className="rounded-full bg-lime/15 px-1.5 text-[10px] font-bold tracking-wide text-lime">
                PRO
              </span>
            ) : null}
            <span className="text-xs font-normal opacity-60">{p.games.length}</span>
          </button>
        );
      })}
    </div>
  );
}
