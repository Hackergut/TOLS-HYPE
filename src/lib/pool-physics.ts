/**
 * Deterministic 8-ball break on a 2:1 table.
 * Units: 1 ≈ 0.122 in on an 8-foot playing surface (88×44 in).
 */
export const PLAY_W = 720;
export const PLAY_H = 360;
export const RAIL = 36;
export const TABLE_W = PLAY_W + RAIL * 2;
export const TABLE_H = PLAY_H + RAIL * 2;
export const BALL_R = 9.15;
export const BALL_D = BALL_R * 2;

export type PoolDiff = "beginner" | "intermediate" | "expert" | "pro";

export type PoolBall = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pocketed: boolean;
};

export type PoolFrame = { x: number; y: number; p: boolean }[];

const POCKET_CORNER = {
  beginner: 24,
  intermediate: 23,
  expert: 20,
  pro: 18,
} as const;
const POCKET_SIDE = {
  beginner: 18.5,
  intermediate: 18,
  expert: 16,
  pro: 14.5,
} as const;

function pockets(diff: PoolDiff) {
  const c = POCKET_CORNER[diff];
  const s = POCKET_SIDE[diff];
  return [
    { x: 0, y: 0, r: c },
    { x: PLAY_W, y: 0, r: c },
    { x: 0, y: PLAY_H, r: c },
    { x: PLAY_W, y: PLAY_H, r: c },
    { x: PLAY_W / 2, y: 0, r: s },
    { x: PLAY_W / 2, y: PLAY_H, r: s },
  ];
}

/** Apex (1) at the foot spot, triangle pointing at the kitchen (left). */
export function rackBalls(jitter: number[] = []): PoolBall[] {
  const footX = PLAY_W * 0.75;
  const cy = PLAY_H / 2;
  const gap = BALL_D * 1.002;
  const rowStep = gap * Math.sin(Math.PI / 3);
  const order = [1, 2, 3, 9, 8, 10, 6, 11, 7, 14, 13, 4, 12, 5, 15];
  const balls: PoolBall[] = [];
  let k = 0;
  for (let row = 0; row < 5; row += 1) {
    const count = row + 1;
    const x = footX + row * rowStep;
    const y0 = cy - ((count - 1) * gap) / 2;
    for (let i = 0; i < count; i += 1) {
      const id = order[k]!;
      const jx = ((jitter[k] ?? 0.5) - 0.5) * 0.35;
      const jy = ((jitter[k + 15] ?? 0.5) - 0.5) * 0.35;
      balls.push({
        id,
        x: x + jx,
        y: y0 + i * gap + jy,
        vx: 0,
        vy: 0,
        pocketed: false,
      });
      k += 1;
    }
  }
  return balls;
}

export function cueBall(aimY = 0): PoolBall {
  return {
    id: 0,
    x: PLAY_W * 0.25,
    y: PLAY_H / 2 + aimY,
    vx: 0,
    vy: 0,
    pocketed: false,
  };
}

function inPocket(b: PoolBall, diff: PoolDiff): boolean {
  const mouth = b.id === 0 ? 0.64 : 1;
  for (const p of pockets(diff)) {
    const dx = b.x - p.x;
    const dy = b.y - p.y;
    const r = p.r * mouth;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

function collide(a: PoolBall, b: PoolBall) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1e-6;
  const min = BALL_D;
  if (dist >= min) return;
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = min - dist;
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;
  const dvx = a.vx - b.vx;
  const dvy = a.vy - b.vy;
  const vn = dvx * nx + dvy * ny;
  if (vn <= 0) return;
  const e = 0.985;
  a.vx -= vn * nx * e;
  a.vy -= vn * ny * e;
  b.vx += vn * nx * e;
  b.vy += vn * ny * e;
}

function cushions(b: PoolBall, diff: PoolDiff) {
  if (b.pocketed) return;
  if (inPocket(b, diff)) {
    b.pocketed = true;
    b.vx = 0;
    b.vy = 0;
    return;
  }
  const e = 0.78;
  if (b.x < BALL_R) {
    b.x = BALL_R;
    b.vx = Math.abs(b.vx) * e;
  } else if (b.x > PLAY_W - BALL_R) {
    b.x = PLAY_W - BALL_R;
    b.vx = -Math.abs(b.vx) * e;
  }
  if (b.y < BALL_R) {
    b.y = BALL_R;
    b.vy = Math.abs(b.vy) * e;
  } else if (b.y > PLAY_H - BALL_R) {
    b.y = PLAY_H - BALL_R;
    b.vy = -Math.abs(b.vy) * e;
  }
}

export type BreakInput = {
  power: number;
  aimDeg: number;
  floats: number[];
  difficulty: PoolDiff;
  /** Client plays these back. The server only needs the pocket result. */
  record?: boolean;
};

export type BreakResult = {
  frames: PoolFrame[];
  pocketed: number[];
  scratch: boolean;
  balls: number;
};

export function simulateBreak(input: BreakInput): BreakResult {
  const { power, difficulty } = input;
  const jitter = input.floats;
  const cueY = ((jitter[30] ?? 0.5) - 0.5) * 6;
  const cue = cueBall(cueY);
  const rack = rackBalls(jitter);
  const balls = [cue, ...rack];

  const aim = (input.aimDeg * Math.PI) / 180;
  const speed = 1100 + Math.max(0, Math.min(1, power)) * 1700;
  cue.vx = Math.cos(aim) * speed;
  cue.vy = Math.sin(aim) * speed;

  const dt = 1 / 120;
  const mu = 78;
  const record = input.record !== false;
  const frames: PoolFrame[] = [];
  let steps = 0;
  const maxSteps = 120 * 6;
  const sub = 4;
  const subDt = dt / sub;

  const snapshot = (): PoolFrame => balls.map((b) => ({ x: b.x, y: b.y, p: b.pocketed }));
  if (record) frames.push(snapshot());

  while (steps < maxSteps) {
    steps += 1;
    let moving = false;
    for (let s = 0; s < sub; s += 1) {
      for (const b of balls) {
        if (b.pocketed) continue;
        const sp = Math.hypot(b.vx, b.vy);
        const capped = Math.min(sp, 1600);
        if (capped > 2) {
          moving = true;
          const ns = Math.max(0, capped - mu * subDt);
          const scale = sp > 0 ? ns / sp : 0;
          b.vx *= scale;
          b.vy *= scale;
          b.x += b.vx * subDt;
          b.y += b.vy * subDt;
        } else {
          b.vx = 0;
          b.vy = 0;
        }
        if (inPocket(b, difficulty)) {
          b.pocketed = true;
          b.vx = 0;
          b.vy = 0;
        } else {
          cushions(b, difficulty);
        }
      }
      for (let pass = 0; pass < 2; pass += 1) {
        for (let i = 0; i < balls.length; i += 1) {
          const a = balls[i]!;
          if (a.pocketed) continue;
          for (let j = i + 1; j < balls.length; j += 1) {
            const b = balls[j]!;
            if (b.pocketed) continue;
            collide(a, b);
          }
        }
      }
    }
    if (record && steps % 4 === 0) frames.push(snapshot());
    if (!moving && steps > 24) break;
  }

  const scratch = Boolean(balls[0]?.pocketed);
  const pocketed = balls.filter((b) => b.id > 0 && b.pocketed).map((b) => b.id);
  return {
    frames,
    pocketed,
    scratch,
    balls: scratch ? 0 : Math.min(7, pocketed.length),
  };
}

export const POOL_LADDER = [0, 1, 2, 4, 8, 15, 30, 100] as const;

export function poolMultiplier(pocketedCount: number, scratch: boolean): number {
  if (scratch) return 0;
  return POOL_LADDER[Math.max(0, Math.min(7, pocketedCount))] ?? 0;
}

export function toSvg(x: number, y: number) {
  return { x: x + RAIL, y: y + RAIL };
}
