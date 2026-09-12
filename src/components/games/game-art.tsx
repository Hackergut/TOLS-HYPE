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
  iframe: ({ hue }) => <SlotsArt hue={hue} />,
};

export function GameArt({ game, ratio = 9 / 16 }: { game: CatalogGame; ratio?: number }) {
  return (
    <AspectRatio ratio={ratio} className="overflow-hidden bg-muted">
      {ART[game.kind]({ hue: 150 })}
    </AspectRatio>
  );
}
