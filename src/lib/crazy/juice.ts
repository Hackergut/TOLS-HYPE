export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  grav: number;
  drag: number;
  rot: number;
  vr: number;
  shape: 0 | 1 | 2; // 0 circle, 1 rect(confetti), 2 spark line
  glow: boolean;
};

export type FloatText = {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  text: string;
  color: string;
  size: number;
};

const MAX_PARTICLES = 520;

class Fx {
  enabled = true;
  particles: Particle[] = [];
  texts: FloatText[] = [];
  shakeAmt = 0;
  shakeTarget: HTMLElement | null = null;
  private seed = 1;

  private rnd() {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  shake(amount: number) {
    if (!this.enabled) return;
    this.shakeAmt = Math.min(46, this.shakeAmt + amount);
  }

  private push(p: Particle) {
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
    this.particles.push(p);
  }

  burst(
    x: number,
    y: number,
    count: number,
    colors: string[],
    opts: { speed?: number; size?: number; grav?: number; life?: number; shape?: 0 | 1 | 2; spread?: number; dir?: number } = {},
  ) {
    if (!this.enabled) return;
    const speed = opts.speed ?? 320;
    const size = opts.size ?? 4;
    const grav = opts.grav ?? 900;
    const life = opts.life ?? 0.9;
    const shape = opts.shape ?? 0;
    const spread = opts.spread ?? Math.PI * 2;
    const dir = opts.dir ?? 0;
    for (let i = 0; i < count; i++) {
      const a = dir + (this.rnd() - 0.5) * spread;
      const s = speed * (0.35 + this.rnd() * 0.9);
      this.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0,
        max: life * (0.6 + this.rnd() * 0.8),
        size: size * (0.5 + this.rnd()),
        color: colors[(this.rnd() * colors.length) | 0],
        grav,
        drag: 0.86,
        rot: this.rnd() * Math.PI,
        vr: (this.rnd() - 0.5) * 16,
        shape,
        glow: shape !== 1,
      });
    }
  }

  confettiRain(w: number, count: number, colors: string[]) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      this.push({
        x: this.rnd() * w,
        y: -20 - this.rnd() * 260,
        vx: (this.rnd() - 0.5) * 120,
        vy: 120 + this.rnd() * 260,
        life: 0,
        max: 2.6 + this.rnd() * 1.6,
        size: 5 + this.rnd() * 6,
        color: colors[(this.rnd() * colors.length) | 0],
        grav: 240,
        drag: 0.99,
        rot: this.rnd() * Math.PI,
        vr: (this.rnd() - 0.5) * 12,
        shape: 1,
        glow: false,
      });
    }
  }

  float(x: number, y: number, text: string, color = "#14F195", size = 28) {
    if (!this.enabled) return;
    if (this.texts.length > 24) this.texts.shift();
    this.texts.push({ x, y, vy: -70, life: 0, max: 1.3, text, color, size });
  }

  update(dt: number) {
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life += dt;
      if (p.life >= p.max) {
        ps.splice(i, 1);
        continue;
      }
      p.vy += p.grav * dt;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    const ts = this.texts;
    for (let i = ts.length - 1; i >= 0; i--) {
      const t = ts[i];
      t.life += dt;
      if (t.life >= t.max) {
        ts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
      t.vy *= Math.pow(0.94, dt * 60);
    }
    // shake decay
    this.shakeAmt *= Math.pow(0.0009, dt);
    if (this.shakeAmt < 0.08) this.shakeAmt = 0;
    if (this.shakeTarget) {
      if (this.shakeAmt > 0) {
        const a = this.shakeAmt;
        const x = (Math.random() - 0.5) * a;
        const y = (Math.random() - 0.5) * a;
        const r = (Math.random() - 0.5) * a * 0.12;
        this.shakeTarget.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${r.toFixed(3)}deg)`;
      } else if (this.shakeTarget.style.transform) {
        this.shakeTarget.style.transform = "";
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.particles) {
      const t = p.life / p.max;
      const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;
      if (p.shape === 1) {
        ctx.globalCompositeOperation = "source-over";
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size * 0.5, -p.size * 0.28, p.size, p.size * 0.56);
        ctx.restore();
        ctx.globalCompositeOperation = "lighter";
      } else if (p.shape === 2) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillRect(-p.size * 2.4, -p.size * 0.22, p.size * 4.8, p.size * 0.44);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const t of this.texts) {
      const k = t.life / t.max;
      ctx.globalAlpha = k < 0.1 ? k / 0.1 : 1 - (k - 0.1) / 0.9;
      const pop = k < 0.18 ? 1 + (0.18 - k) * 2.2 : 1;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(pop, pop);
      ctx.font = `750 ${t.size}px "Inter", system-ui, sans-serif`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  clear() {
    if (this.shakeTarget) this.shakeTarget.style.transform = "";
    this.particles.length = 0;
    this.texts.length = 0;
    this.shakeAmt = 0;
  }
}

export const fx = new Fx();

export function elCenter(el: Element | null): { x: number; y: number } {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
