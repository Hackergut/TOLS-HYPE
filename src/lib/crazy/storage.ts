export type ScoreEntry = {
  name: string;
  score: number;
  rounds: number;
  best: number;
  cashedOut: boolean;
  date: number;
};

const KEY = "tolsfun_crazytime_scores_v1";
const NAME_KEY = "tolsfun_crazytime_name_v1";
const MUTE_KEY = "tolsfun_crazytime_mute_v1";

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is ScoreEntry => {
      if (!entry || typeof entry !== "object") return false;
      const value = entry as Partial<ScoreEntry>;
      return typeof value.name === "string" && typeof value.cashedOut === "boolean"
        && typeof value.score === "number" && Number.isSafeInteger(value.score) && value.score >= 0
        && typeof value.rounds === "number" && Number.isSafeInteger(value.rounds) && value.rounds >= 0
        && typeof value.best === "number" && Number.isFinite(value.best) && value.best >= 0
        && typeof value.date === "number" && Number.isFinite(value.date);
    }).sort((a, b) => b.score - a.score).slice(0, 10);
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const all = [...loadScores(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  return all;
}

export function clearScores(): ScoreEntry[] {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return [];
}

export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
}

export function storeName(n: string) {
  try {
    localStorage.setItem(NAME_KEY, n);
  } catch {
    /* ignore */
  }
}

export function loadMute(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function storeMute(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
}

const B58 = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
export function randomWallet(): string {
  let a = "";
  let b = "";
  for (let i = 0; i < 4; i++) a += B58[(Math.random() * B58.length) | 0];
  for (let i = 0; i < 4; i++) b += B58[(Math.random() * B58.length) | 0];
  return `${a}..${b}`;
}
