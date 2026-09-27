import type { HighScore } from "./types";

const KEY = "horserace_highscores_v1";
const MAX = 10;

export function loadHighScores(): HighScore[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HighScore[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX);
  } catch {
    return [];
  }
}

export function saveHighScore(score: number, name = "You"): HighScore[] {
  const list = loadHighScores();
  list.push({ name, score, date: Date.now() });
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
  return trimmed;
}

export function isHighScore(score: number): boolean {
  const list = loadHighScores();
  if (list.length < MAX) return score > 0;
  return score > list[list.length - 1].score;
}
