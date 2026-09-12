import { EURO_WHEEL } from "@/lib/rng";
import { TOLS } from "@/lib/palette";
import { roulettePocketFill, roulettePocketInk } from "@/lib/roulette-ui";

/** CAELIA mark inks (official wheel SVG). */
const GREY = "#545454";
const RIM = "#2d2d2d";
const LIME = "#c1ff72";

function star8(cx: number, cy: number, rOut: number, rIn: number) {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

export function RouletteWheel({
  number,
  spinning,
  className,
  durationMs = 1600,
}: {
  number: number | null;
  spinning: boolean;
  className?: string;
  durationMs?: number;
}) {
  const idx = number == null ? 0 : Math.max(0, EURO_WHEEL.indexOf(number));
  const slice = 360 / EURO_WHEEL.length;
  const rot = spinning ? 1260 : 360 - idx * slice - slice / 2;
  const spinEase = `${Math.max(120, durationMs)}ms cubic-bezier(0.12, 0.7, 0.2, 1)`;

  return (
    <div className={className ?? "relative mx-auto aspect-square w-64 md:w-80"}>
      <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
        <defs>
          <linearGradient id="rw-lime" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c4ff00" />
            <stop offset="1" stopColor={LIME} />
          </linearGradient>
          <linearGradient id="rw-purp" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9b4de0" />
            <stop offset="50%" stopColor={TOLS.purple} />
            <stop offset="100%" stopColor="#3d0d70" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="99" fill={GREY} />
        <circle cx="100" cy="100" r="96" fill="none" stroke={RIM} strokeWidth="7" />
        <circle cx="100" cy="100" r="82" fill={GREY} />
        <circle cx="100" cy="100" r="79" fill="none" stroke={RIM} strokeWidth="9" />
        <circle cx="100" cy="100" r="71" fill="none" stroke="url(#rw-lime)" strokeWidth="2.8" />

        <g
          style={{
            transformOrigin: "100px 100px",
            transform: `rotate(${rot}deg)`,
            transition: spinning ? `transform ${spinEase}` : "transform 900ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {EURO_WHEEL.map((n, i) => {
            const a0 = ((i * slice - 90) * Math.PI) / 180;
            const a1 = (((i + 1) * slice - 90) * Math.PI) / 180;
            const r0 = 52;
            const r1 = 68;
            const p = [
              [100 + r0 * Math.cos(a0), 100 + r0 * Math.sin(a0)],
              [100 + r1 * Math.cos(a0), 100 + r1 * Math.sin(a0)],
              [100 + r1 * Math.cos(a1), 100 + r1 * Math.sin(a1)],
              [100 + r0 * Math.cos(a1), 100 + r0 * Math.sin(a1)],
            ];
            const d = `M ${p[0]![0]} ${p[0]![1]} L ${p[1]![0]} ${p[1]![1]} A ${r1} ${r1} 0 0 1 ${p[2]![0]} ${p[2]![1]} L ${p[3]![0]} ${p[3]![1]} A ${r0} ${r0} 0 0 0 ${p[0]![0]} ${p[0]![1]}`;
            const purple = roulettePocketFill(n) !== TOLS.lime;
            const hit = !spinning && number === n;
            return (
              <path
                key={n}
                d={d}
                fill={purple ? "url(#rw-purp)" : LIME}
                stroke={hit ? "#fff" : RIM}
                strokeWidth={hit ? 1.1 : 0.4}
              />
            );
          })}
          {EURO_WHEEL.map((n, i) => {
            const mid = (i + 0.5) * slice - 90;
            const rad = (mid * Math.PI) / 180;
            const r = 60;
            const x = 100 + r * Math.cos(rad);
            const y = 100 + r * Math.sin(rad);
            return (
              <text
                key={`n${n}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="5.6"
                fontWeight="800"
                fill={roulettePocketInk(n)}
                transform={`rotate(${mid + 90} ${x} ${y})`}
              >
                {n}
              </text>
            );
          })}
        </g>

        <circle cx="100" cy="100" r="51" fill={GREY} />
        <circle cx="100" cy="100" r="38" fill="none" stroke={RIM} strokeWidth="5" />
        <circle cx="100" cy="100" r="34" fill={GREY} />

        <path d={star8(100, 100, 22, 9)} fill={LIME} stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
        <path d={star8(100, 100, 16, 5.5)} fill={RIM} />
        <circle cx="100" cy="100" r="5" fill={GREY} />

        <polygon points="100,22 103.5,29 96.5,29" fill={LIME} />
      </svg>
    </div>
  );
}
