export type PlayerTone = "mint" | "blue" | "violet";

export type PlayerSkin = {
  handle: string;
  initial: string;
  tone: PlayerTone;
};

const TONES: PlayerTone[] = ["mint", "blue", "violet"];

const ROSTER: PlayerSkin[] = [
  { handle: "nova", initial: "N", tone: "mint" },
  { handle: "hex", initial: "H", tone: "mint" },
  { handle: "lido", initial: "L", tone: "blue" },
  { handle: "ash", initial: "A", tone: "blue" },
  { handle: "kite", initial: "K", tone: "violet" },
  { handle: "orio", initial: "O", tone: "mint" },
  { handle: "ven", initial: "V", tone: "mint" },
  { handle: "sol", initial: "S", tone: "blue" },
];

export function playerFor(handle: string): PlayerSkin {
  const key = handle.trim().toLowerCase();
  const hit = ROSTER.find((p) => p.handle === key);
  if (hit) return hit;
  let h = 0;
  for (const c of key) h = (h + c.charCodeAt(0) * 17) % 997;
  const initial = (key[0] || "?").toUpperCase();
  return { handle, initial, tone: TONES[h % TONES.length]! };
}
