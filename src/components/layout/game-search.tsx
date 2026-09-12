import { useEffect, useMemo, useState } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { RiSearchLine } from "@remixicon/react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { GAMES, type CatalogGame } from "@/lib/games-catalog"
import { useRemoteCatalog } from "@/hooks/use-remote-catalog"
import { useGamePreview } from "@/components/games/guest-game-preview"

export function GameSearch() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { games: remote } = useRemoteCatalog()
  const preview = useGamePreview()

  const catalog = useMemo(() => {
    const seen = new Set<string>()
    const out: CatalogGame[] = []
    for (const g of [...GAMES, ...remote]) {
      if (seen.has(g.id)) continue
      seen.add(g.id)
      out.push(g)
    }
    return out
  }, [remote])

  const originals = catalog.filter((g) => g.original)
  const live = catalog.filter((g) => g.live && !g.original)
  const studio = catalog.filter((g) => !g.original && !g.live)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function go(game: CatalogGame) {
    setOpen(false)
    if (preview.isGuest) {
      window.setTimeout(() => preview.open(game), 80)
      return
    }
    void navigate({ to: "/games/$id", params: { id: game.id } })
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="size-10 md:hidden"
        aria-label="Search games"
        onClick={() => setOpen(true)}
      >
        <RiSearchLine className="size-5" />
      </Button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative mx-auto hidden h-10 max-w-md flex-1 items-center rounded-lg border border-border bg-muted/40 px-3 text-left text-sm text-muted-foreground md:flex"
      >
        <RiSearchLine className="mr-2 size-4 shrink-0" />
        <span className="flex-1">Search games…</span>
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search originals, slots, live…" />
        <CommandList>
          <CommandEmpty>No games match that search.</CommandEmpty>
          {originals.length > 0 ? (
            <CommandGroup heading="Originals">
              {originals.map((g) => (
                <CommandItem key={g.id} value={`${g.title} ${g.provider} original`} onSelect={() => go(g)}>
                  <span className="min-w-0 flex-1 truncate">{g.title}</span>
                  <span className="text-xs text-muted-foreground">{g.provider}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {live.length > 0 ? (
            <CommandGroup heading="Live">
              {live.slice(0, 40).map((g) => (
                <CommandItem key={g.id} value={`${g.title} ${g.provider} live`} onSelect={() => go(g)}>
                  <span className="min-w-0 flex-1 truncate">{g.title}</span>
                  <span className="text-xs text-muted-foreground">{g.provider}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {studio.length > 0 ? (
            <CommandGroup heading="Slots & studio">
              {studio.slice(0, 80).map((g) => (
                <CommandItem key={g.id} value={`${g.title} ${g.provider} slots`} onSelect={() => go(g)}>
                  <span className="min-w-0 flex-1 truncate">{g.title}</span>
                  <span className="text-xs text-muted-foreground">{g.provider}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  )
}
