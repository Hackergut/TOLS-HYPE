export type PlayerTone = "mint" | "blue" | "violet";

export type PlayerSkin = {
  handle: string;
  src: string;
  tone: PlayerTone;
};

const ROSTER: PlayerSkin[] = [
  { handle: "nova", src: "/brand/players/annabel.jpg", tone: "mint" },
  { handle: "hex", src: "/brand/players/anthony.jpg", tone: "mint" },
  { handle: "lido", src: "/brand/players/amir.jpg", tone: "blue" },
  { handle: "ash", src: "/brand/players/balaji.jpg", tone: "blue" },
  { handle: "kite", src: "/brand/players/reed.jpg", tone: "violet" },
  { handle: "orio", src: "/brand/players/anthony.jpg", tone: "mint" },
  { handle: "ven", src: "/brand/players/annabel.jpg", tone: "mint" },
  { handle: "sol", src: "/brand/players/amir.jpg", tone: "blue" },
];

const FALLBACK: PlayerSkin[] = [
  { handle: "annabel", src: "/brand/players/annabel.jpg", tone: "mint" },
  { handle: "anthony", src: "/brand/players/anthony.jpg", tone: "mint" },
  { handle: "amir", src: "/brand/players/amir.jpg", tone: "blue" },
  { handle: "balaji", src: "/brand/players/balaji.jpg", tone: "blue" },
  { handle: "reed", src: "/brand/players/reed.jpg", tone: "violet" },
];

export function playerFor(handle: string): PlayerSkin {
  const key = handle.trim().toLowerCase();
  const hit = ROSTER.find((p) => p.handle === key);
  if (hit) return hit;
  let h = 0;
  for (const c of key) h = (h + c.charCodeAt(0) * 17) % 997;
  return { ...FALLBACK[h % FALLBACK.length]!, handle };
}
