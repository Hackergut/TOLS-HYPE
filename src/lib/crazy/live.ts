import { useEffect, useState } from "react";

export type LivePlayer = { id: string; name: string; color: string };
export type LiveEvent = { id: string; type: "join" | "bet" | "win"; player: string; amount?: number; at: number; simulated?: boolean };
export type LiveMessage = { id: string; player: string; text: string; at: number; own?: boolean; simulated?: boolean };
export type LiveSnapshot = { mode: "demo" | "live" | "connecting"; online: number; players: LivePlayer[]; events: LiveEvent[]; messages: LiveMessage[] };
export type LiveConfig = { url: string; getAccessToken?: () => string | Promise<string> };

const demoPlayers: LivePlayer[] = [
  { id: "p1", name: "Mira.sol", color: "#00d7ad" }, { id: "p2", name: "0xNico", color: "#8d63ee" },
  { id: "p3", name: "Luna", color: "#dbad40" }, { id: "p4", name: "Teo77", color: "#dc5276" },
  { id: "p5", name: "Sora", color: "#3d85eb" }, { id: "p6", name: "Kappa", color: "#00a9c4" },
];
const demoChat = ["Good luck, table.", "That last click was close.", "Going for Cash Hunt.", "Nice hit.", "One more spin."];
let snapshot: LiveSnapshot = {
  mode: "demo", online: 128, players: demoPlayers,
  events: [{ id: "welcome", type: "join", player: "TOLS Host", at: Date.now(), simulated: true }],
  messages: [{ id: "hello", player: "TOLS Host", text: "Welcome to the CRAZYTOLS practice room.", at: Date.now(), simulated: true }],
};
let socket: WebSocket | null = null;
let demoTimer = 0;
let connectionEpoch = 0;
const listeners = new Set<(value: LiveSnapshot) => void>();
const publish = () => listeners.forEach((listener) => listener(snapshot));
const safeText = (value: unknown, max = 80) => typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, max) : "";
const safePlayer = (value: unknown): LivePlayer | null => {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<LivePlayer>;
  const name = safeText(input.name, 20);
  const id = safeText(input.id, 50);
  return name && id ? { id, name, color: /^#[0-9a-f]{6}$/i.test(input.color ?? "") ? input.color! : "#00d7ad" } : null;
};

function startDemo() {
  if (demoTimer || snapshot.mode !== "demo") return;
  demoTimer = window.setInterval(() => {
    const player = demoPlayers[Math.floor(Math.random() * demoPlayers.length)];
    const roll = Math.random();
    const event: LiveEvent = roll < 0.18
      ? { id: crypto.randomUUID(), type: "join", player: `${player.name.split(".")[0]}${Math.floor(Math.random() * 90 + 10)}`, at: Date.now(), simulated: true }
      : roll < 0.64
        ? { id: crypto.randomUUID(), type: "bet", player: player.name, amount: [10, 20, 50, 100, 250][Math.floor(Math.random() * 5)], at: Date.now(), simulated: true }
        : { id: crypto.randomUUID(), type: "win", player: player.name, amount: [40, 80, 150, 320, 750][Math.floor(Math.random() * 5)], at: Date.now(), simulated: true };
    snapshot = { ...snapshot, online: Math.max(110, snapshot.online + (Math.random() > 0.48 ? 1 : -1)), events: [event, ...snapshot.events].slice(0, 18) };
    if (Math.random() < 0.24) snapshot = { ...snapshot, messages: [...snapshot.messages, { id: crypto.randomUUID(), player: player.name, text: demoChat[Math.floor(Math.random() * demoChat.length)], at: Date.now(), simulated: true }].slice(-30) };
    publish();
  }, 2600);
}

function stopDemo() { window.clearInterval(demoTimer); demoTimer = 0; }

export function subscribeLive(listener: (value: LiveSnapshot) => void) {
  listeners.add(listener);
  listener(snapshot);
  startDemo();
  return () => { listeners.delete(listener); if (!listeners.size) stopDemo(); };
}

export function useLiveRoom() {
  const [value, setValue] = useState(snapshot);
  useEffect(() => subscribeLive(setValue), []);
  return value;
}

export async function connectLiveRoom(config: LiveConfig) {
  const endpoint = new URL(config.url, window.location.href);
  const local = endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1";
  if (endpoint.protocol !== "wss:" && !(local && endpoint.protocol === "ws:")) throw new Error("Live room requires WSS outside localhost.");
  disconnectLiveRoom();
  const epoch = ++connectionEpoch;
  stopDemo();
  snapshot = { ...snapshot, mode: "connecting" };
  publish();
  const token = await config.getAccessToken?.();
  socket = new WebSocket(endpoint, ["crazytols-v1"]);
  socket.addEventListener("open", () => {
    if (epoch !== connectionEpoch || !socket) return;
    // Authenticate as the first application message over WSS. The server must
    // reject all other messages until the short-lived token is validated.
    socket.send(JSON.stringify({ type: "auth", token: token || "" }));
    snapshot = { ...snapshot, mode: "live", events: [] };
    publish();
  });
  socket.addEventListener("message", (message) => {
    if (epoch !== connectionEpoch) return;
    if (typeof message.data !== "string" || message.data.length > 50_000) return;
    try {
      const data = JSON.parse(message.data) as Record<string, unknown>;
      if (data.type === "snapshot") {
        const players = Array.isArray(data.players) ? data.players.map(safePlayer).filter((player): player is LivePlayer => Boolean(player)).slice(0, 100) : snapshot.players;
        snapshot = { ...snapshot, mode: "live", online: Math.max(0, Math.floor(Number(data.online) || players.length)), players };
      } else if (data.type === "event") {
        const type = ["join", "bet", "win"].includes(String(data.eventType)) ? data.eventType as LiveEvent["type"] : null;
        const player = safeText(data.player, 20);
        if (type && player) snapshot = { ...snapshot, events: [{ id: safeText(data.id, 60) || crypto.randomUUID(), type, player, amount: Math.max(0, Math.floor(Number(data.amount) || 0)), at: Date.now() }, ...snapshot.events].slice(0, 30) };
      } else if (data.type === "chat") {
        const player = safeText(data.player, 20);
        const text = safeText(data.text);
        if (player && text) snapshot = { ...snapshot, messages: [...snapshot.messages, { id: safeText(data.id, 60) || crypto.randomUUID(), player, text, at: Date.now() }].slice(-50) };
      }
      publish();
    } catch { /* Ignore malformed realtime payloads. */ }
  });
  socket.addEventListener("close", () => {
    if (epoch !== connectionEpoch) return;
    socket = null;
    snapshot = { ...snapshot, mode: "demo", players: demoPlayers, online: 128 };
    publish();
    startDemo();
  });
}

export function disconnectLiveRoom() {
  connectionEpoch += 1;
  const active = socket;
  socket = null;
  active?.close(1000, "client disconnect");
}

export function sendLiveChat(player: string, raw: string) {
  const text = safeText(raw);
  const name = safeText(player, 20) || "Player";
  if (!text) return false;
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "chat", text }));
  const message: LiveMessage = { id: crypto.randomUUID(), player: name, text, at: Date.now(), own: true, simulated: snapshot.mode !== "live" };
  snapshot = { ...snapshot, messages: [...snapshot.messages, message].slice(-50) };
  publish();
  return true;
}