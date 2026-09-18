import type { ReactNode } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { CatalogGame } from "@/lib/games-catalog";

function CrashArt({ hue }: { hue: number }) {
  return (
    <svg viewBox="0 0 300 400" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="cbg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={`hsl(${hue} 40% 8%)`} />
          <stop offset="1" stopColor={`hsl(${hue + 40} 50% 14%)`} />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#cbg)" />
      <path
        d="M20 340 C 80 330, 90 280, 130 220 S 190 90, 280 40"
        fill="none"
        stroke="var(--neon)"
        strokeWidth="4"
      />
      <circle cx="248" cy="62" r="7" fill="var(--neon)" />
      <path d="M20 340 H 280" stroke="white" strokeOpacity="0.12" />
    </svg>
  );
}

function RouletteArt({ hue: _hue }: { hue: number }) {
  const slices = 24;
  function star8(rOut: number, rIn: number) {
    const pts: string[] = [];
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? rOut : rIn;
      const a = (i * Math.PI) / 8 - Math.PI / 2;
      pts.push(`${r * Math.cos(a)},${r * Math.sin(a)}`);
    }
    return `M ${pts.join(" L ")} Z`;
  }
  return (
    <svg viewBox="0 0 300 400" className="size-full" aria-hidden>
      <rect width="300" height="400" fill="#09090c" />
      <g transform="translate(150 210)">
        <circle r="96" fill="#545454" />
        <circle r="92" fill="none" stroke="#2d2d2d" strokeWidth="8" />
        <circle r="78" fill="#545454" />
        <circle r="74" fill="none" stroke="#2d2d2d" strokeWidth="10" />
        <circle r="66" fill="none" stroke="#c1ff72" strokeWidth="4" />
        {Array.from({ length: slices }).map((_, i) => (
          <path
            key={i}
            d="M 0 -48 L 0 -62 A 62 62 0 0 1 16.1 -59.8 L 12.4 -47.2 Z"
            fill={i % 2 === 0 ? "#c1ff72" : "var(--color-purple)"}
            transform={`rotate(${(360 / slices) * i})`}
          />
        ))}
        <circle r="46" fill="#545454" />
        <circle r="34" fill="none" stroke="#2d2d2d" strokeWidth="6" />
        <path d={star8(22, 9)} fill="#c1ff72" stroke="#000" strokeWidth="2" />
        <path d={star8(15, 5)} fill="#2d2d2d" />
      </g>
    </svg>
  );
}

function BlackjackArt({ hue }: { hue: number }) {
  return (
    <svg viewBox="0 0 300 400" className="size-full" aria-hidden>
      <rect width="300" height="400" fill={`hsl(${hue} 28% 9%)`} />
      <g transform="translate(92 130) rotate(-12)">
        <rect width="88" height="124" rx="8" fill="#f4f1ea" />
        <text x="12" y="32" fontSize="22" fill="#8b1e1e">
          A
        </text>
      </g>
      <g transform="translate(128 148) rotate(10)">
        <rect width="88" height="124" rx="8" fill="#f4f1ea" />
        <text x="12" y="32" fontSize="22" fill="#141414">
          K
        </text>
      </g>
    </svg>
  );
}

function SlotsArt({ hue }: { hue: number }) {
  return (
    <svg viewBox="0 0 300 400" className="size-full" aria-hidden>
      <rect width="300" height="400" fill={`hsl(${hue} 32% 9%)`} />
      <rect x="40" y="110" width="220" height="170" rx="18" fill="#0c0c10" stroke="#e8b84a" />
      {["7", "BAR", "◆"].map((s, i) => (
        <g key={s}>
          <rect x={58 + i * 68} y="128" width="58" height="134" rx="8" fill="#16161c" />
          <text
            x={87 + i * 68}
            y="208"
            textAnchor="middle"
            fontSize="22"
            fill={i === 0 ? "#00e887" : "#e8b84a"}
            fontFamily="Outfit, sans-serif"
          >
            {s}
          </text>
        </g>
      ))}
    </svg>
  );
}

function CrazyArt({ hue }: { hue: number }) {
  // 54-segment Crazy Time layout, miniaturized for the card.
  const segs = [
    { label: "1", color: "#1d63ff", count: 21 },
    { label: "2", color: "#e8b84a", count: 13 },
    { label: "5", color: "#1a8f2c", count: 7 },
    { label: "10", color: "#7c3aec", count: 4 },
    { label: "PACHINKO", color: "#ff5b79", count: 2 },
    { label: "CASH HUNT", color: "#0aa3c2", count: 2 },
    { label: "COIN FLIP", color: "#d4a017", count: 4 },
    { label: "CRAZY TIME", color: "#e11d48", count: 1 },
  ];
  let cursor = 0;
  const R_OUT = 150;
  const R_IN = 46;
  const toXY = (r: number, a: number) => [150 + r * Math.cos(a), 210 + r * Math.sin(a)];
  return (
    <svg viewBox="0 0 300 400" className="size-full" aria-hidden>
      <rect width="300" height="400" fill={`hsl(${hue} 40% 7%)`} />
      <g transform="translate(0 0)">
        <circle cx="150" cy="210" r="152" fill="#0c0c10" />
        {segs.map((s) => {
          const span = (s.count / 54) * Math.PI * 2;
          const a0 = cursor;
          const a1 = cursor + span;
          cursor = a1;
          const [x0, y0] = toXY(R_OUT, a0);
          const [x1, y1] = toXY(R_OUT, a1);
          const [xi1, yi1] = toXY(R_IN, a1);
          const [xi0, yi0] = toXY(R_IN, a0);
          const mid = a0 + span / 2;
          const long = span > Math.PI ? 1 : 0;
          return (
            <g key={s.label}>
              <path
                d={`M ${x0} ${y0} A ${R_OUT} ${R_OUT} 0 ${long} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${R_IN} ${R_IN} 0 ${long} 0 ${xi0} ${yi0} Z`}
                fill={s.color}
                fillOpacity="0.92"
              />
              <text
                x={150 + 100 * Math.cos(mid)}
                y={210 + 100 * Math.sin(mid)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={s.label.length > 3 ? "6" : "16"}
                fontWeight="bold"
                fill="#fff"
                fontFamily="Outfit, sans-serif"
              >
                {s.label}
              </text>
            </g>
          );
        })}
        <circle cx="150" cy="210" r="42" fill="#0c0c10" stroke="#e8b84a" strokeWidth="4" />
        <text x="150" y="206" textAnchor="middle" fontSize="13" fontWeight="bold" fill="var(--lime)" fontFamily="Outfit, sans-serif">
          TOLS
        </text>
        <text x="150" y="222" textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="Outfit, sans-serif">
          CRAZY WHEEL
        </text>
      </g>
    </svg>
  );
}

function DerbyArt({ hue }: { hue: number }) {
  const row = [
    ["#e63946", 44],
    ["#3d7bff", 52],
    ["#00ffbd", 60],
    ["#ffb703", 68],
    ["#904bf9", 76],
    ["#f4f4f5", 84],
  ] as const;
  return (
    <svg viewBox="0 0 300 400" className="size-full" aria-hidden>
      <rect width="300" height="400" fill={`hsl(${hue} 32% 8%)`} />
      {row.map(([color, y], i) => (
        <g key={color}>
          <rect x="16" y={y - 2} width="268" height="7" rx="3.5" fill="#16171b" />
          <path
            d={`M ${20 + 0} ${y} Q ${60} ${y - 14} ${96} ${y - 2} L ${96} ${y + 2} Q ${60} ${y - 10} ${20} ${y + 4} Z`}
            fill={color}
            opacity="0.9"
          />
          <circle cx={92} cy={y - 8} r="3" fill={color} />
          <line x1="16" y1={y + 8} x2="118" y2={y + 8} stroke={color} strokeWidth="1.4" opacity="0.5" />
          <text x="230" y={y} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff" fontFamily="Outfit, sans-serif">
            {i + 1}
          </text>
        </g>
      ))}
      <path d="M168 330 l-20 26 h40 z" fill="var(--lime)" opacity="0.9" />
      <path d="M178 330 l0 20 M168 336 l0 14 M188 336 l0 14" stroke="#0d0d10" strokeWidth="2.4" />
    </svg>
  );
}

function DiceArt({ hue }: { hue: number }) {
  return (
    <svg viewBox="0 0 300 400" className="size-full" aria-hidden>
      <rect width="300" height="400" fill={`hsl(${hue} 30% 8%)`} />
      <g transform="translate(78 140) rotate(-8)">
        <rect width="110" height="110" rx="16" fill="#f4f1ea" />
        <circle cx="32" cy="32" r="9" fill="#141414" />
        <circle cx="78" cy="78" r="9" fill="#141414" />
        <circle cx="55" cy="55" r="9" fill="#141414" />
      </g>
      <g transform="translate(128 168) rotate(14)">
        <rect width="110" height="110" rx="16" fill="#7c5cfc" />
        <circle cx="32" cy="32" r="9" fill="#f5f0ff" />
        <circle cx="78" cy="32" r="9" fill="#f5f0ff" />
        <circle cx="32" cy="78" r="9" fill="#f5f0ff" />
        <circle cx="78" cy="78" r="9" fill="#f5f0ff" />
      </g>
    </svg>
  );
}

function MinesArt({ hue }: { hue: number }) {
  return (
    <svg viewBox="0 0 300 400" className="size-full" aria-hidden>
      <rect width="300" height="400" fill={`hsl(${hue} 28% 8%)`} />
      {Array.from({ length: 16 }).map((_, i) => {
        const x = 54 + (i % 4) * 50;
        const y = 110 + Math.floor(i / 4) * 50;
        const mine = i === 5 || i === 10 || i === 14;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="40"
            height="40"
            rx="8"
            fill={mine ? "#7c5cfc" : "#1a1f27"}
            stroke="rgba(255,255,255,0.08)"
          />
        );
      })}
    </svg>
  );
}

const ART: Record<CatalogGame["kind"], (p: { hue: number }) => ReactNode> = {
  crash: ({ hue }) => <CrashArt hue={hue} />,
  roulette: ({ hue }) => <RouletteArt hue={hue} />,
  blackjack: ({ hue }) => <BlackjackArt hue={hue} />,
  slots: ({ hue }) => <SlotsArt hue={hue} />,
  dice: ({ hue }) => <DiceArt hue={hue} />,
  mines: ({ hue }) => <MinesArt hue={hue} />,
  keno: ({ hue }) => <MinesArt hue={hue} />,
  hilo: ({ hue }) => <BlackjackArt hue={hue} />,
  pool: ({ hue }) => <MinesArt hue={hue} />,
  limbo: ({ hue }) => <CrashArt hue={hue} />,
  plinko: ({ hue }) => <MinesArt hue={hue} />,
  tower: ({ hue }) => <MinesArt hue={hue} />,
  crazy: ({ hue }) => <CrazyArt hue={hue} />,
  derby: ({ hue }) => <DerbyArt hue={hue} />,
  iframe: ({ hue }) => <SlotsArt hue={hue} />,
};

export function GameArt({ game, ratio = 9 / 16 }: { game: CatalogGame; ratio?: number }) {
  return (
    <AspectRatio ratio={ratio} className="overflow-hidden bg-muted">
      {ART[game.kind]({ hue: 150 })}
    </AspectRatio>
  );
}
