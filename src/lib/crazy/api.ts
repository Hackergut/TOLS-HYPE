/**
 * CrazyTols Game API — callback & event bridge
 *
 * Every significant game event fires through this layer.
 * Integrate with any backend by registering a handler via `onEvent()`.
 *
 * The transport is swappable: REST POST, WebSocket, gRPC-web, etc.
 * Set `setTransport(t)` to point at your production backend.
 *
 * ```ts
 * setTransport((event) => {
 *   fetch("https://api.tols.fun/v1/game/event", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
 *     body: JSON.stringify(event),
 *   });
 * });
 * ```
 */

import type { SpotId } from "./constants";
import { connectLiveRoom, disconnectLiveRoom, type LiveConfig } from "./live";

/* ------------------------------------------------------------------ types */

export type GameEvent =
  | { type: "session_start"; sessionId: string; player: string; balance: number; ts: number }
  | { type: "session_end"; sessionId: string; player: string; finalBalance: number; rounds: number; best: number; cashedOut: boolean; ts: number }
  | { type: "bet_placed"; sessionId: string; round: number; spot: SpotId; amount: number; totalBet: number; ts: number }
  | { type: "bet_cleared"; sessionId: string; round: number; refunded: number; ts: number }
  | { type: "bet_repeated"; sessionId: string; round: number; total: number; ts: number }
  | { type: "spin_start"; sessionId: string; round: number; totalBet: number; bets: Record<SpotId, number>; ts: number }
  | { type: "topslot_result"; sessionId: string; round: number; spot: SpotId; multiplier: number; ts: number }
  | { type: "spin_result"; sessionId: string; round: number; winnerIdx: number; spot: SpotId; isBonus: boolean; ts: number }
  | { type: "bonus_start"; sessionId: string; round: number; bonusType: SpotId; stake: number; topMultiplier: number; ts: number }
  | { type: "bonus_result"; sessionId: string; round: number; bonusType: SpotId; multiplier: number; payout: number; ts: number }
  | { type: "payout"; sessionId: string; round: number; spot: SpotId; amount: number; newBalance: number; ts: number }
  | { type: "cash_out"; sessionId: string; player: string; balance: number; round: number; ts: number }
  | { type: "deposit"; sessionId: string; player: string; amount: number; currency: string; txHash?: string; ts: number }
  | { type: "withdraw"; sessionId: string; player: string; amount: number; currency: string; wallet?: string; ts: number }
  | { type: "bust"; sessionId: string; player: string; balance: number; round: number; ts: number };

export type Transport = (event: GameEvent) => void | Promise<void>;
export type EventListener = (event: GameEvent) => void;

/* ------------------------------------------------------------------ state */

let transport: Transport | null = null;
let listeners: EventListener[] = [];
let sessionId = "";
let playerName = "";
let roundNumber = 0;
let parentOrigin: string | null = null;

/* ---------------------------------------------------------- session mgmt */

export function initSession(name: string): string {
  sessionId =
    "ct_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8);
  playerName = name;
  roundNumber = 0;
  return sessionId;
}

export function getSessionId(): string {
  return sessionId;
}

export function getPlayerName(): string {
  return playerName;
}

export function advanceRound(): number {
  roundNumber++;
  return roundNumber;
}

export function getCurrentRound(): number {
  return roundNumber;
}

/* ---------------------------------------------------------------- transport */

/**
 * Set the backend transport. `null` clears it (events still fire to listeners).
 * The transport is called asynchronously — it never blocks the game loop.
 */
export function setTransport(t: Transport | null) {
  transport = t;
}

export function getTransport(): Transport | null {
  return transport;
}

/* ---------------------------------------------------------------- listeners */

/**
 * Subscribe to all game events (for analytics, UI, debugging).
 * Returns an unsubscribe function.
 */
export function onEvent(listener: EventListener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/* ----------------------------------------------------------- emit + fanout */

function emit(event: GameEvent) {
  // notify local listeners synchronously
  for (const l of listeners) {
    try {
      l(event);
    } catch {
      /* swallow listener errors */
    }
  }
  // Same-page hosts can subscribe without importing the game package.
  window.dispatchEvent(new CustomEvent("crazytols:event", { detail: event }));
  // Cross-frame delivery is opt-in and pinned to an explicit origin.
  if (parentOrigin && window.parent !== window) {
    window.parent.postMessage({ source: "CRAZYTOLS", event }, parentOrigin);
  }
  // Capture the adapter and catch asynchronous rejections as well as throws.
  const send = transport;
  if (send) {
    void Promise.resolve().then(() => send(event)).catch((error: unknown) => {
      console.warn("[CRAZYTOLS] Event transport failed", event.type, error);
    });
  }
}

/* ---------------------------------------------------------------- helpers */

function base() {
  return { sessionId, ts: Date.now() } as const;
}

/* --------------------------------------------------------- public emitters */

export function emitSessionStart(balance: number) {
  emit({ type: "session_start", player: playerName, balance, ...base() });
}

export function emitSessionEnd(finalBalance: number, rounds: number, best: number, cashedOut: boolean) {
  emit({ type: "session_end", player: playerName, finalBalance, rounds, best, cashedOut, ...base() });
}

export function emitBetPlaced(spot: SpotId, amount: number, totalBet: number) {
  emit({ type: "bet_placed", round: roundNumber, spot, amount, totalBet, ...base() });
}

export function emitBetCleared(refunded: number) {
  emit({ type: "bet_cleared", round: roundNumber, refunded, ...base() });
}

export function emitBetRepeated(total: number) {
  emit({ type: "bet_repeated", round: roundNumber, total, ...base() });
}

export function emitSpinStart(totalBet: number, bets: Record<SpotId, number>) {
  emit({ type: "spin_start", round: roundNumber, totalBet, bets, ...base() });
}

export function emitTopSlotResult(spot: SpotId, multiplier: number) {
  emit({ type: "topslot_result", round: roundNumber, spot, multiplier, ...base() });
}

export function emitSpinResult(winnerIdx: number, spot: SpotId, isBonus: boolean) {
  emit({ type: "spin_result", round: roundNumber, winnerIdx, spot, isBonus, ...base() });
}

export function emitBonusStart(bonusType: SpotId, stake: number, topMultiplier: number) {
  emit({ type: "bonus_start", round: roundNumber, bonusType, stake, topMultiplier, ...base() });
}

export function emitBonusResult(bonusType: SpotId, multiplier: number, payout: number) {
  emit({ type: "bonus_result", round: roundNumber, bonusType, multiplier, payout, ...base() });
}

export function emitPayout(spot: SpotId, amount: number, newBalance: number) {
  emit({ type: "payout", round: roundNumber, spot, amount, newBalance, ...base() });
}

export function emitCashOut(balance: number) {
  emit({ type: "cash_out", player: playerName, balance, round: roundNumber, ...base() });
}

export function emitDeposit(amount: number, currency: string, txHash?: string) {
  emit({ type: "deposit", player: playerName, amount, currency, txHash, ...base() });
}

export function emitWithdraw(amount: number, currency: string, wallet?: string) {
  emit({ type: "withdraw", player: playerName, amount, currency, wallet, ...base() });
}

export function emitBust(balance: number) {
  emit({ type: "bust", player: playerName, balance, round: roundNumber, ...base() });
}

export type HttpTransportConfig = {
  endpoint: string;
  operatorId: string;
  getAccessToken?: () => string | Promise<string>;
  timeoutMs?: number;
};

/** Production-oriented event adapter. Financial settlement must still be server-authoritative. */
export function createHttpTransport(config: HttpTransportConfig): Transport {
  const endpoint = new URL(config.endpoint, window.location.href);
  const local = endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1";
  if (endpoint.protocol !== "https:" && !local) throw new Error("CRAZYTOLS transport requires HTTPS outside localhost.");
  if (!config.operatorId.trim()) throw new Error("operatorId is required.");
  return async (event) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), config.timeoutMs ?? 8000);
    try {
      const token = await config.getAccessToken?.();
      const idempotencyKey = `${event.sessionId}:${event.type}:${"round" in event ? event.round : 0}:${event.ts}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-crazytols-version": "1.0",
          "x-operator-id": config.operatorId,
          "idempotency-key": idempotencyKey,
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(event),
        signal: controller.signal,
        credentials: "omit",
      });
      if (!response.ok) throw new Error(`CRAZYTOLS event endpoint returned ${response.status}.`);
    } finally {
      window.clearTimeout(timeout);
    }
  };
}

export function configurePlatform(options: { transport?: Transport | null; parentOrigin?: string | null }) {
  if ("transport" in options) setTransport(options.transport ?? null);
  if ("parentOrigin" in options) {
    if (options.parentOrigin) {
      const origin = new URL(options.parentOrigin).origin;
      if (origin === "null") throw new Error("A valid parent origin is required.");
      parentOrigin = origin;
    } else parentOrigin = null;
  }
}

declare global {
  interface Window {
    CRAZYTOLS?: {
      onEvent: typeof onEvent;
      setTransport: typeof setTransport;
      createHttpTransport: typeof createHttpTransport;
      configurePlatform: typeof configurePlatform;
      getSessionId: typeof getSessionId;
      getCurrentRound: typeof getCurrentRound;
      connectLive: (config: LiveConfig) => Promise<void>;
      disconnectLive: typeof disconnectLiveRoom;
    };
  }
}

if (typeof window !== "undefined") {
  window.CRAZYTOLS = { onEvent, setTransport, createHttpTransport, configurePlatform, getSessionId, getCurrentRound, connectLive: connectLiveRoom, disconnectLive: disconnectLiveRoom };
}
