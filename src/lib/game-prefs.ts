const FAV_KEY = "tols-favorites";
const SOUND_KEY = "tols-sound";
const ANIM_KEY = "tols-anim";
const INSTANT_KEY = "tols-instant";
const HOTKEY_KEY = "tols-hotkeys";
const CONFIRM_KEY = "tols-confirm-max";
const SPEED_KEY = "tols-speed";

export type GameSpeed = "regular" | "fast" | "instant";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function loadFavorites(): string[] {
  return readList(FAV_KEY);
}

export function saveFavorites(ids: string[]) {
  window.localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

export function isFavorite(id: string): boolean {
  return loadFavorites().includes(id);
}

export function toggleFavorite(id: string): boolean {
  const cur = loadFavorites();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  saveFavorites(next);
  return next.includes(id);
}

export function loadSoundOn(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) !== "off";
}

export function saveSoundOn(on: boolean) {
  window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}

export function loadAnimOn(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ANIM_KEY) !== "off";
}

export function saveAnimOn(on: boolean) {
  window.localStorage.setItem(ANIM_KEY, on ? "on" : "off");
}

export function loadInstantOn(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(INSTANT_KEY) === "on";
}

export function saveInstantOn(on: boolean) {
  window.localStorage.setItem(INSTANT_KEY, on ? "on" : "off");
}

export function loadHotkeysOn(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(HOTKEY_KEY) !== "off";
}

export function saveHotkeysOn(on: boolean) {
  window.localStorage.setItem(HOTKEY_KEY, on ? "on" : "off");
}

export function loadConfirmMax(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(CONFIRM_KEY) !== "off";
}

export function saveConfirmMax(on: boolean) {
  window.localStorage.setItem(CONFIRM_KEY, on ? "on" : "off");
}

export function loadGameSpeed(): GameSpeed {
  if (typeof window === "undefined") return "regular";
  const v = window.localStorage.getItem(SPEED_KEY);
  if (v === "fast" || v === "instant" || v === "regular") return v;
  return loadInstantOn() ? "instant" : "regular";
}

export function saveGameSpeed(speed: GameSpeed) {
  window.localStorage.setItem(SPEED_KEY, speed);
  saveInstantOn(speed === "instant");
}
