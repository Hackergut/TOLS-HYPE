import { useEffect, useState } from "react";
import type { CatalogGame } from "@/lib/games-catalog";
import { remoteToCatalog } from "@/lib/operator/remote-catalog";
import type { RemoteGame } from "@/lib/operator/types";

const KEY = "tols-remote-catalog-v1";

function readCache(): CatalogGame[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CatalogGame[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useRemoteCatalog() {
  const [games, setGames] = useState<CatalogGame[]>(readCache);
  const [ready, setReady] = useState(() => readCache().length > 0);

  useEffect(() => {
    const ac = new AbortController();
    void fetch("/api/operator/games", { signal: ac.signal })
      .then((r) => r.json())
      .then((j: { remote?: RemoteGame[] }) => {
        const remote = Array.isArray(j.remote) ? j.remote : [];
        const next = remote.map(remoteToCatalog).filter((g): g is CatalogGame => g != null);
        setGames(next);
        try {
          sessionStorage.setItem(KEY, JSON.stringify(next.slice(0, 800)));
        } catch {
          /* quota */
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setGames((cur) => cur);
      })
      .finally(() => setReady(true));
    return () => ac.abort();
  }, []);

  return { games, ready };
}
