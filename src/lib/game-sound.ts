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

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, delay = 0) {
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
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.stop(t + dur + 0.02);
}

export function playSfx(kind: "win" | "lose" | "click" | "star") {
  if (!loadSoundOn()) return;
  void audio()?.resume();
  if (kind === "click") tone(420, 0.05, "square", 0.04);
  if (kind === "star") tone(880, 0.08, "sine", 0.06);
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
