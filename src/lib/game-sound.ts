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

function burst(dur: number, vol: number, freq: number, delay = 0) {
  const ac = audio();
  if (!ac || !loadSoundOn()) return;
  const t0 = ac.currentTime + delay;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
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
  | "flip"
  | "gem"
  | "boom"
  | "cash"
  | "pocket"
  | "gate"
  | "photo";

export function unlockGameAudio() {
  void audio()?.resume();
}

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
  if (kind === "flip") {
    burst(0.045, 0.09, 2800);
    tone(420, 0.05, "triangle", 0.05);
    tone(880, 0.07, "sine", 0.04, 0.04);
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
  if (kind === "gate") {
    tone(160, 0.07, "square", 0.07);
    tone(70, 0.22, "sawtooth", 0.09, 0.02, 36);
    burst(0.16, 0.1, 520);
  }
  if (kind === "photo") {
    tone(1760, 0.05, "square", 0.045);
    tone(2340, 0.08, "sine", 0.04, 0.05);
  }
}

let gallopOn = false;
let gallopTimer = 0;
let gallopPace = 1;
let crowd: AudioBufferSourceNode | null = null;
let crowdGain: GainNode | null = null;

function hoof() {
  burst(0.04, 0.11, 1900);
  burst(0.035, 0.07, 1300, 0.06);
}

export function startRaceBed() {
  if (gallopOn || !loadSoundOn()) return;
  const ac = audio();
  if (!ac) return;
  void ac.resume();
  gallopOn = true;
  gallopPace = 1;
  const step = () => {
    if (!gallopOn) return;
    if (loadSoundOn()) hoof();
    if (crowdGain) crowdGain.gain.value = loadSoundOn() ? 0.035 : 0;
    const gap = 150 / Math.max(0.18, gallopPace);
    gallopTimer = window.setTimeout(step, gap);
  };
  step();
  if (crowd) return;
  const dur = 1.4;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const g = ac.createGain();
  g.gain.value = 0.035;
  src.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  src.start();
  crowd = src;
  crowdGain = g;
}

export function setRacePace(pace: number) {
  gallopPace = Math.min(1.3, Math.max(0.18, pace));
}

export function stopRaceBed() {
  gallopOn = false;
  window.clearTimeout(gallopTimer);
  try {
    crowd?.stop();
  } catch {
    // already stopped
  }
  crowd?.disconnect();
  crowd = null;
  crowdGain = null;
}
