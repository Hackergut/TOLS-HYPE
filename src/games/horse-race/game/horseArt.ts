/**
 * ============================================================
 *  TOLS · HORSE ART — reference renderer
 * ============================================================
 *
 * Anatomical vector racehorse + jockey (the design from the reference
 * build). Local coordinate space: facing RIGHT, origin at body centre,
 * bounding box ≈ x[-46..50] · y[-38..32].
 *
 *  - body / neck / head as quadratic-bezier masses with 3-stop coat gradient
 *  - muscle shading (shoulder + hindquarter), topline highlight
 *  - 4 articulated legs (hip + carpus/hock + hoof), far pair dimmed
 *  - flowing mane / tail driven by gallop phase + speed
 *  - jockey: crouched torso, silks with 5 patterns, helmet + visor,
 *    forward arm with animated whip
 *  - speed streaks when running fast
 *  - saddle cloth with lime TOLS number plate
 */

export interface HorseArt {
  color: string;   // coat
  accent: string;  // light coat / streak tint
  dark: string;    // coat shade / mane / tail
  silk: string;    // jockey silks
  silkPattern: "stripe" | "hoop" | "chevron" | "split" | "star";
}

export interface DrawHorseOpts {
  horse: HorseArt;
  phase: number;  // 0..1 gallop cycle
  speed: number;  // 0..1 → lean, bob, streaks
  scale: number;
  number: number;
}

const TAU = Math.PI * 2;

/* ---------------------------------------------------------- colours */

function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  const v = c.length === 3 ? c.split("").map((s) => s + s).join("") : c;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
export function lighten(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
export function darken(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => Math.round(c * (1 - amt));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/* ------------------------------------------------------------- legs */

function drawLeg(
  ctx: CanvasRenderingContext2D,
  hx: number, hy: number,
  ph: number,
  len1: number, len2: number,
  isFront: boolean,
  upperColor: string, hoofColor: string,
  alpha: number,
) {
  const p = ph - Math.floor(ph);
  const swing = Math.sin(p * TAU);
  const lift = Math.cos(p * TAU);

  const base = isFront ? -0.04 : 0.12;
  const amp = isFront ? 0.72 : 0.84;
  const hip = base + swing * amp;

  // carpus bends backwards, hock bends forwards
  const bend = isFront
    ? Math.max(0, -lift) * 1.25 + 0.12
    : Math.max(0, lift) * 1.4 + 0.18;

  const kx = hx + Math.sin(hip) * len1;
  const ky = hy + Math.cos(hip) * len1;
  const lower = hip + (isFront ? -bend : bend);
  const fx = kx + Math.sin(lower) * len2;
  const fy = ky + Math.cos(lower) * len2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";

  ctx.strokeStyle = upperColor;
  ctx.lineWidth = isFront ? 5.4 : 6.2;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();

  ctx.strokeStyle = hoofColor;
  ctx.lineWidth = 1.6;
  const ha = lower + (isFront ? 0.1 : -0.1);
  ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.sin(ha) * 3.4, fy + Math.cos(ha) * 3.4); ctx.stroke();
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(fx + Math.sin(ha) * 2.2, fy + Math.cos(ha) * 2.2);
  ctx.lineTo(fx + Math.sin(ha) * 4.2, fy + Math.cos(ha) * 4.2);
  ctx.stroke();

  ctx.restore();
}

/* ------------------------------------------------------------- tail */

function drawTail(ctx: CanvasRenderingContext2D, h: HorseArt, phase: number, speed: number) {
  ctx.save();
  ctx.strokeStyle = h.dark;
  ctx.lineCap = "round";
  const sway = Math.sin(phase * TAU) * 4 * (0.3 + speed);
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-31, -8); ctx.quadraticCurveTo(-40, -4, -43 - sway, 6 + sway * 0.3); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-31, -5); ctx.quadraticCurveTo(-38, 2, -40 - sway, 13 + sway * 0.4); ctx.stroke();
  ctx.restore();
}

/* ----------------------------------------------------------- jockey */

function drawJockey(ctx: CanvasRenderingContext2D, h: HorseArt, phase: number, speed: number) {
  const crouch = Math.sin(phase * TAU) * 1.4 * (0.3 + speed);
  ctx.save();
  ctx.translate(0, crouch);

  // far leg / boot
  ctx.strokeStyle = "#111827";
  ctx.lineCap = "round";
  ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-1, -14); ctx.lineTo(6, -11); ctx.lineTo(9, -7); ctx.stroke();

  // torso (silks)
  ctx.beginPath();
  ctx.moveTo(-8, -15);
  ctx.quadraticCurveTo(-4, -25, 3, -28);
  ctx.quadraticCurveTo(9, -28, 11, -24);
  ctx.quadraticCurveTo(11, -20, 8, -17);
  ctx.quadraticCurveTo(2, -13, -6, -13);
  ctx.closePath();
  const grad = ctx.createLinearGradient(-6, -28, 8, -13);
  grad.addColorStop(0, lighten(h.silk, 0.25));
  grad.addColorStop(1, h.silk);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(6,10,20,0.55)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // silk pattern
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.9;
  switch (h.silkPattern) {
    case "stripe":
      ctx.fillStyle = "#ffffff"; ctx.fillRect(-1, -29, 3.5, 18); break;
    case "hoop":
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(-8, -22); ctx.lineTo(12, -21); ctx.stroke(); break;
    case "chevron":
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-6, -17); ctx.lineTo(1, -23); ctx.lineTo(9, -18); ctx.stroke(); break;
    case "split":
      ctx.fillStyle = "#0b0b12";
      ctx.beginPath(); ctx.moveTo(3, -29); ctx.lineTo(13, -29); ctx.lineTo(13, -12); ctx.lineTo(1, -12); ctx.closePath(); ctx.fill(); break;
    default:
      ctx.fillStyle = "#0b0b12";
      ctx.beginPath(); ctx.arc(2, -21, 2.6, 0, TAU); ctx.fill();
  }
  ctx.restore();

  // near leg
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-3, -14); ctx.lineTo(5, -12); ctx.lineTo(8, -6.5); ctx.stroke();

  // arm + whip
  ctx.strokeStyle = h.silk;
  ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(7, -25); ctx.quadraticCurveTo(14, -23, 19, -19); ctx.stroke();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  const whipWag = Math.sin(phase * TAU * 2) * 5 * speed;
  ctx.beginPath(); ctx.moveTo(19, -19); ctx.lineTo(27, -24 - whipWag); ctx.stroke();

  // helmet
  ctx.beginPath(); ctx.arc(8, -30, 4.6, 0, TAU);
  ctx.fillStyle = "#f8fafc"; ctx.fill();
  ctx.strokeStyle = "rgba(6,10,20,0.5)"; ctx.lineWidth = 1.2; ctx.stroke();
  // visor
  ctx.beginPath(); ctx.moveTo(11, -31.5); ctx.lineTo(13.5, -30); ctx.lineTo(11, -28.6); ctx.closePath();
  ctx.fillStyle = "#0b0b12"; ctx.fill();
  // helmet stripe in silk colour
  ctx.strokeStyle = h.silk; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(4.5, -31); ctx.lineTo(11, -33); ctx.stroke();

  ctx.restore();
}

/* ------------------------------------------------------------- main */

export function drawHorse(ctx: CanvasRenderingContext2D, o: DrawHorseOpts) {
  const { horse: h, phase, speed, scale, number } = o;

  ctx.save();
  ctx.scale(scale, scale);

  const pitch = Math.sin(phase * TAU) * 0.055 + speed * 0.03;
  const bob = Math.sin(phase * TAU * 2) * 1.6 * speed;
  ctx.translate(0, bob);
  ctx.rotate(pitch);

  // speed streaks
  if (speed > 0.25) {
    ctx.save();
    ctx.globalAlpha = (speed - 0.25) * 0.5;
    for (let i = 0; i < 3; i++) {
      const y = -14 + i * 12 + Math.sin(phase * TAU + i) * 2;
      const len = 26 + i * 12;
      const g = ctx.createLinearGradient(-46 - len, 0, -40, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, h.accent + "cc");
      ctx.fillStyle = g;
      ctx.fillRect(-46 - len, y, len, 1.6);
    }
    ctx.restore();
  }

  // far legs (behind body)
  drawLeg(ctx, -23, 1, phase + 0.45, 11, 11, false, h.dark, h.dark, 0.72);
  drawLeg(ctx, 15, 3, phase + 0.45, 10.5, 10.5, true, h.dark, h.dark, 0.72);

  // tail
  drawTail(ctx, h, phase, speed);

  // body
  ctx.beginPath();
  ctx.moveTo(16, -13);
  ctx.quadraticCurveTo(8, -16, -2, -12.5);
  ctx.quadraticCurveTo(-14, -11, -22, -12);
  ctx.quadraticCurveTo(-32, -11, -33, -2);
  ctx.quadraticCurveTo(-33, 4, -27, 7);
  ctx.quadraticCurveTo(-14, 11, -2, 10.5);
  ctx.quadraticCurveTo(8, 10, 14, 7);
  ctx.quadraticCurveTo(21, 5, 22.5, -2);
  ctx.quadraticCurveTo(23, -9, 16, -13);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(0, -16, 0, 12);
  bodyGrad.addColorStop(0, lighten(h.color, 0.22));
  bodyGrad.addColorStop(0.55, h.color);
  bodyGrad.addColorStop(1, h.dark);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(6,10,20,0.65)";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // muscle shading + topline highlight (clipped to body)
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = h.dark;
  ctx.beginPath(); ctx.ellipse(15, 0, 8, 9, -0.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-23, -1, 8, 9, 0.2, 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.ellipse(2, -10, 16, 4, 0, 0, TAU); ctx.fill();
  ctx.restore();

  // neck
  ctx.beginPath();
  ctx.moveTo(15, -13);
  ctx.quadraticCurveTo(22, -20, 30, -26);
  ctx.lineTo(36, -22);
  ctx.quadraticCurveTo(30, -18, 27, -14);
  ctx.quadraticCurveTo(23, -8, 17, -4);
  ctx.closePath();
  const neckGrad = ctx.createLinearGradient(20, -26, 22, -4);
  neckGrad.addColorStop(0, lighten(h.color, 0.16));
  neckGrad.addColorStop(1, h.dark);
  ctx.fillStyle = neckGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(6,10,20,0.6)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // head
  ctx.beginPath();
  ctx.moveTo(30, -25);
  ctx.lineTo(33.5, -32);
  ctx.lineTo(36.5, -30.5);
  ctx.lineTo(38, -28.5);
  ctx.quadraticCurveTo(42, -27, 45, -22);
  ctx.quadraticCurveTo(49, -18.5, 48.5, -15.5);
  ctx.quadraticCurveTo(48, -13.5, 45.5, -13.5);
  ctx.quadraticCurveTo(41, -13.8, 38, -16);
  ctx.quadraticCurveTo(34, -18, 30.5, -20);
  ctx.closePath();
  const headGrad = ctx.createLinearGradient(36, -30, 42, -13);
  headGrad.addColorStop(0, lighten(h.color, 0.24));
  headGrad.addColorStop(1, h.dark);
  ctx.fillStyle = headGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(6,10,20,0.6)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // far ear
  ctx.beginPath(); ctx.moveTo(34, -30); ctx.lineTo(31, -35.5); ctx.lineTo(36.5, -32); ctx.closePath();
  ctx.fillStyle = h.dark; ctx.fill();

  // eye
  ctx.fillStyle = "#0b0b12";
  ctx.beginPath(); ctx.ellipse(38.6, -22.6, 1.9, 1.6, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath(); ctx.arc(39.3, -23.2, 0.6, 0, TAU); ctx.fill();
  // nostril
  ctx.fillStyle = "rgba(6,10,20,0.5)";
  ctx.beginPath(); ctx.ellipse(46.4, -16.6, 1.1, 1.4, 0.4, 0, TAU); ctx.fill();
  // bridle
  ctx.strokeStyle = "rgba(10,14,25,0.55)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(37, -26); ctx.lineTo(36.5, -16.5);
  ctx.moveTo(43.5, -23); ctx.quadraticCurveTo(44, -19, 46, -17);
  ctx.stroke();

  // mane
  ctx.strokeStyle = h.dark;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const sx = 16 + t * 15;
    const sy = -13 + t * -11;
    const flow = Math.sin(phase * TAU + i * 0.7) * 3 * (0.4 + speed);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx - 6, sy + 2 + flow * 0.4, sx - 9 - flow, sy + 5 + flow);
    ctx.stroke();
  }
  // forelock
  ctx.beginPath(); ctx.moveTo(34, -28); ctx.quadraticCurveTo(31, -27, 31.5, -24); ctx.stroke();

  // near legs (over body)
  drawLeg(ctx, -20, 2, phase, 11.5, 11.5, false, lighten(h.color, 0.08), h.dark, 1);
  drawLeg(ctx, 18, 4, phase, 11, 11, true, lighten(h.color, 0.08), h.dark, 1);

  // saddle cloth (silk colour) with TOLS lime number plate
  ctx.beginPath();
  ctx.moveTo(4, -12); ctx.lineTo(16, -12); ctx.lineTo(17, -1); ctx.lineTo(5, 0); ctx.closePath();
  ctx.fillStyle = h.silk;
  ctx.globalAlpha = 0.95;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(6,10,20,0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#00ffbd";
  ctx.fillRect(7, -9.5, 8, 7);
  ctx.fillStyle = "#04120d";
  ctx.font = "bold 7px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), 11, -6);

  // jockey
  drawJockey(ctx, h, phase, speed);

  ctx.restore();
}
