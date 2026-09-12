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
  beginner: 26,
  intermediate: 22,
  expert: 19,
  pro: 17,
} as const;
const POCKET_SIDE = {
  beginner: 21,
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
  for (const p of pockets(diff)) {
    const dx = b.x - p.x;
    const dy = b.y - p.y;
    if (dx * dx + dy * dy < p.r * p.r) return true;
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
  const e = 0.96;
  a.vx -= vn * nx * e;
  a.vy -= vn * ny * e;
  b.vx += vn * nx * e;
  b.vy += vn * ny * e;
}

function cushions(b: PoolBall, diff: PoolDiff) {
  if (inPocket(b, diff)) return;
  const e = 0.72;
  const nearSide =
    Math.abs(b.x - PLAY_W / 2) < 28 && (b.y < BALL_R * 1.6 || b.y > PLAY_H - BALL_R * 1.6);
  const nearCorner =
    (b.x < 28 || b.x > PLAY_W - 28) && (b.y < 28 || b.y > PLAY_H - 28);
  if (nearSide || nearCorner) return;
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
  const speed = 720 + Math.max(0, Math.min(1, power)) * 1320;
  cue.vx = Math.cos(aim) * speed;
  cue.vy = Math.sin(aim) * speed;

  const dt = 1 / 120;
  const mu = 130;
  const frames: PoolFrame[] = [];
  let steps = 0;
  const maxSteps = 120 * 7;
  let cracked = false;

  const snapshot = (): PoolFrame => balls.map((b) => ({ x: b.x, y: b.y, p: b.pocketed }));
  frames.push(snapshot());

  function crack(hit: PoolBall) {
    cracked = true;
    collide(cue, hit);
    const kick = 220 + power * 380;
    for (const b of balls) {
      if (b.id === 0 || b.pocketed) continue;
      const dx = b.x - hit.x;
      const dy = b.y - hit.y;
      const dist = Math.hypot(dx, dy) || 1;
      const spread = kick * (0.35 + (jitter[b.id] ?? 0.5) * 0.9) / Math.max(1, dist / BALL_D);
      b.vx += (dx / dist) * spread + cue.vx * 0.22;
      b.vy += (dy / dist) * spread + cue.vy * 0.22;
    }
    hit.vx += Math.cos(aim) * speed * 0.45;
    hit.vy += Math.sin(aim) * speed * 0.45;
    cue.vx *= 0.28;
    cue.vy *= 0.28;
  }

  while (steps < maxSteps) {
    steps += 1;
    let moving = false;
    for (const b of balls) {
      if (b.pocketed) continue;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 1.2) {
        moving = true;
        const ns = Math.max(0, sp - mu * dt);
        b.vx *= ns / sp;
        b.vy *= ns / sp;
      } else {
        b.vx = 0;
        b.vy = 0;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (inPocket(b, difficulty)) {
        b.pocketed = true;
        b.vx = 0;
        b.vy = 0;
      } else {
        cushions(b, difficulty);
      }
    }
    if (!cracked) {
      for (const b of balls) {
        if (b.id === 0 || b.pocketed) continue;
        const d = Math.hypot(b.x - cue.x, b.y - cue.y);
        if (d < BALL_D * 1.04) {
          crack(b);
          break;
        }
      }
    } else {
      for (let i = 0; i < balls.length; i += 1) {
        if (balls[i]!.pocketed) continue;
        for (let j = i + 1; j < balls.length; j += 1) {
          if (balls[j]!.pocketed) continue;
          collide(balls[i]!, balls[j]!);
        }
      }
    }
    if (steps % 2 === 0) frames.push(snapshot());
    if (!moving && steps > 30) break;
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
