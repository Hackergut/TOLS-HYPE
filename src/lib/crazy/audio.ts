import { loadMute, storeMute } from "./storage";

type ToneOpts = {
  freq: number;
  to?: number;
  type?: OscillatorType;
  dur?: number;
  gain?: number;
  delay?: number;
  attack?: number;
};

class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  muted = loadMute();
  private lastTick = 0;

  init() {
    if (this.ctx) return;
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    storeMute(m);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  private tone(o: ToneOpts) {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime + (o.delay ?? 0);
    const dur = o.dur ?? 0.12;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = o.type ?? "triangle";
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
    const peak = o.gain ?? 0.2;
    const atk = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur = 0.2, gain = 0.15, freq = 1400, q = 1) {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start();
  }

  tick(speed = 1) {
    const now = performance.now();
    if (now - this.lastTick < 22) return;
    this.lastTick = now;
    this.tone({
      freq: 900 + speed * 500,
      to: 420,
      type: "square",
      dur: 0.035,
      gain: 0.07 + speed * 0.05,
    });
  }

  click() {
    this.tone({ freq: 660, to: 990, type: "square", dur: 0.05, gain: 0.08 });
  }

  chip() {
    this.tone({ freq: 1200, to: 700, type: "triangle", dur: 0.08, gain: 0.13 });
    this.noise(0.08, 0.07, 3200, 2);
  }

  deny() {
    this.tone({ freq: 220, to: 130, type: "sawtooth", dur: 0.16, gain: 0.1 });
  }

  beep(high = false) {
    this.tone({ freq: high ? 1320 : 880, type: "sine", dur: 0.09, gain: 0.12 });
  }

  whoosh() {
    this.noise(0.5, 0.12, 700, 0.6);
    this.tone({ freq: 120, to: 800, type: "sine", dur: 0.5, gain: 0.08 });
  }

  slot() {
    this.tone({ freq: 520, to: 1040, type: "square", dur: 0.09, gain: 0.1 });
  }

  lose() {
    this.tone({ freq: 300, to: 150, type: "sawtooth", dur: 0.3, gain: 0.09 });
    this.tone({ freq: 220, to: 110, type: "sine", dur: 0.4, gain: 0.07, delay: 0.06 });
  }

  win(level = 1) {
    const base = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const n = Math.min(5, 2 + level);
    for (let i = 0; i < n; i++) {
      this.tone({
        freq: base[i % base.length] * (i >= 5 ? 2 : 1),
        type: "triangle",
        dur: 0.24,
        gain: 0.14,
        delay: i * 0.07,
      });
    }
  }

  jackpot() {
    for (let i = 0; i < 12; i++) {
      this.tone({
        freq: 300 + i * 120,
        to: 400 + i * 160,
        type: "square",
        dur: 0.16,
        gain: 0.1,
        delay: i * 0.05,
      });
    }
    this.noise(1.1, 0.12, 5200, 1.5);
  }

  bonusHit() {
    this.tone({ freq: 440, to: 1760, type: "sawtooth", dur: 0.55, gain: 0.13 });
    this.noise(0.6, 0.12, 2400, 1);
  }

  coin() {
    this.tone({ freq: 1568, type: "triangle", dur: 0.09, gain: 0.1 });
    this.tone({ freq: 2093, type: "triangle", dur: 0.12, gain: 0.08, delay: 0.05 });
  }
}

export const sfx = new AudioEngine();
