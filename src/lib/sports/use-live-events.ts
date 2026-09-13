/**
 * Client hook for the sportsboard feed served by `/api/sportsbook/events`.
 *
 * The feed is The Odds API v4 when the operator has a key, otherwise the
 * curated in-repo book — the component does not need to know which.
 *
 * Deliberately not react-query: this app has no QueryClientProvider, so the
 * hook keeps its own module-level cache (shared by every consumer, so the
 * dashboard strip and the markets page cost one fetch, not two) and always
 * renders the curated book on the first paint. That keeps SSR and the first
 * client render identical — swapping in cached live data after mount is what
 * avoids a hydration mismatch on a hard refresh.
 */
import { useEffect, useState } from "react";
import { SPORT_EVENTS, type SportEvent, type SportKind } from "@/lib/sports-book";

export type BoardSource = "odds-api" | "tols";

export type LiveBoard = {
  events: SportEvent[];
  source: BoardSource;
  fetchedAt: string | null;
  error: string | null;
};

const FALLBACK: LiveBoard = { events: SPORT_EVENTS, source: "tols", fetchedAt: null, error: null };

/** Client-side refresh floor; the server has its own (longer) vendor TTL. */
const CLIENT_TTL_MS = 120_000;

let cached: (LiveBoard & { at: number }) | null = null;
let inflight: Promise<LiveBoard> | null = null;
const listeners = new Set<(board: LiveBoard) => void>();

function publish(board: LiveBoard) {
  for (const fn of listeners) fn(board);
}

async function fetchBoard(): Promise<LiveBoard> {
  const res = await fetch("/api/sportsbook/events", {
    headers: { accept: "application/json" },
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`events ${res.status}`);
  const json = (await res.json()) as {
    events?: SportEvent[];
    source?: BoardSource;
    fetchedAt?: string | null;
    error?: string | null;
  };
  const events = Array.isArray(json.events) ? json.events : [];
  // An empty live feed is not an upgrade over the curated book.
  if (!events.length) return { ...FALLBACK, error: json.error ?? "empty feed" };
  return {
    events,
    source: json.source === "odds-api" ? "odds-api" : "tols",
    fetchedAt: json.fetchedAt ?? null,
    error: json.error ?? null,
  };
}

/** One fetch per TTL however many components ask; failures keep the last board. */
export function loadBoard(): Promise<LiveBoard> {
  if (cached && Date.now() - cached.at < CLIENT_TTL_MS) return Promise.resolve(cached);
  inflight ??= fetchBoard()
    .then((board) => {
      cached = { ...board, at: Date.now() };
      publish(board);
      return board;
    })
    .catch((err: unknown) => {
      const board: LiveBoard = cached
        ? { ...cached, error: err instanceof Error ? err.message : "fetch failed" }
        : { ...FALLBACK, error: err instanceof Error ? err.message : "fetch failed" };
      publish(board);
      return board;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export type UseLiveEventsOptions = { liveOnly?: boolean; limit?: number };

/**
 * Events for the board, filtered by sport. Always returns something renderable
 * on the first render (the curated book), then swaps to the live feed.
 */
export function useLiveEvents(sport: SportKind | "all" = "all", opts: UseLiveEventsOptions = {}) {
  const [board, setBoard] = useState<LiveBoard>(cached ?? FALLBACK);

  useEffect(() => {
    let live = true;
    // Render the cached board immediately, then refresh in the background.
    if (cached) setBoard(cached);
    listeners.add(setBoard);
    void loadBoard().then((b) => {
      if (live) setBoard(b);
    });
    return () => {
      live = false;
      listeners.delete(setBoard);
    };
  }, []);

  let events = sport === "all" ? board.events : board.events.filter((e) => e.sport === sport);
  if (opts.liveOnly) events = events.filter((e) => e.live);
  if (opts.limit) events = events.slice(0, opts.limit);

  return { events, source: board.source, fetchedAt: board.fetchedAt, error: board.error };
}
