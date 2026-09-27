/** Tiny WebAudio SFX engine — no assets, instant load, mobile safe. */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

export function setMuted(m: boolean) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.22;
}

export function isMuted() {
  return muted;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.5,
  delay = 0,
  freqEnd?: number,
) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol = 0.4, delay = 0, filterFreq = 900) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
}

export const sfx = {
  click: () => tone(680, 0.06, "square", 0.25),
  select: () => tone(880, 0.08, "triangle", 0.3, 0, 1200),
  chip: () => tone(1400, 0.05, "square", 0.18),
  tick: () => tone(1000, 0.07, "square", 0.3),
  go: () => {
    tone(1400, 0.1, "square", 0.35);
    tone(1800, 0.18, "square", 0.3, 0.06);
    noise(0.35, 0.3, 0, 1600);
  },
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.24, "triangle", 0.4, i * 0.09));
    tone(1568, 0.5, "sine", 0.22, 0.36);
  },
  bigwin: () => {
    [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.3, "triangle", 0.42, i * 0.08));
    noise(0.5, 0.2, 0.1, 2400);
  },
  lose: () => {
    tone(300, 0.35, "sawtooth", 0.28, 0, 90);
    noise(0.25, 0.2, 0, 500);
  },
  photo: () => tone(2200, 0.09, "square", 0.2),
  bust: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, "sawtooth", 0.3, i * 0.13));
  },
};
