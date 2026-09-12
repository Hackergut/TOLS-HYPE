import { loadSoundOn } from "@/lib/game-prefs";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, delay = 0, endFreq?: number) {
  const ac = audio();
  if (!ac || !loadSoundOn()) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime + delay;
  osc.start(t);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + dur);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.stop(t + dur + 0.02);
}

export type Sfx =
  | "win"
  | "lose"
  | "click"
  | "star"
  | "tick"
  | "hit"
  | "spin"
  | "deal"
  | "gem"
  | "boom"
  | "cash"
  | "pocket";

export function playSfx(kind: Sfx) {
  if (!loadSoundOn()) return;
  void audio()?.resume();
  if (kind === "click") tone(420, 0.05, "square", 0.04);
  if (kind === "star") tone(880, 0.08, "sine", 0.06);
  if (kind === "tick") tone(760, 0.04, "square", 0.035);
  if (kind === "hit") {
    tone(988, 0.08, "sine", 0.06);
    tone(1318, 0.1, "sine", 0.05, 0.04);
  }
  if (kind === "spin") tone(420, 0.42, "sawtooth", 0.04, 0, 90);
  if (kind === "deal") {
    tone(196, 0.07, "triangle", 0.05);
    tone(247, 0.08, "triangle", 0.04, 0.05);
  }
  if (kind === "gem") tone(660, 0.09, "sine", 0.05);
  if (kind === "boom") tone(70, 0.32, "sawtooth", 0.09, 0, 32);
  if (kind === "cash") {
    tone(523, 0.1, "sine", 0.06);
    tone(784, 0.12, "sine", 0.06, 0.08);
    tone(1046, 0.16, "sine", 0.07, 0.16);
  }
  if (kind === "pocket") tone(330, 0.07, "square", 0.045);
  if (kind === "win") {
    tone(523, 0.12, "sine", 0.07, 0);
    tone(659, 0.14, "sine", 0.07, 0.09);
    tone(784, 0.18, "sine", 0.08, 0.18);
  }
  if (kind === "lose") {
    tone(220, 0.22, "triangle", 0.07);
    tone(160, 0.28, "sine", 0.05, 0.08);
  }
}
