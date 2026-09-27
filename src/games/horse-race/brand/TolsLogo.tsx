import { Component, lazy, Suspense, type ReactNode } from "react";

/**
 * TOLS.FUN brand — tokens taken from https://www.tols.fun
 *   lime chip      #00FFBD
 *   fluo purple    #904BF9
 *   dark silicone  #0D0D10 / #16171B
 *   heading font   Oswald · body IBM Plex Sans
 *
 *  - <TolsLogo3D/>   WebGL chrome "TOLS" (three.js via `3dsvg`), lazy-loaded
 *                   and mounted only on start / game-over screens.
 *  - <TolsLockup/>   3D mark + lime ".FUN" line.
 *  - <TolsWordmark/> CSS chrome "TOLS" + lime ".FUN" for HUD (zero WebGL).
 *  - <TolsChip/>     the lime casino chip with the T mark (hero asset on tols.fun).
 *  - <TolsBadge/>    compact top-bar identity: chip + wordmark.
 */

const SVG3D = lazy(() => import("3dsvg").then((m) => ({ default: m.SVG3D })));

class LogoBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* silent — CSS wordmark stands in */
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const OSWALD = "'Oswald', ui-sans-serif, system-ui, sans-serif";

/** Lime casino chip with the official-style T mark. */
export function TolsChip({ size = 28, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      className={spin ? "animate-[spin_9s_linear_infinite]" : undefined}
      style={{ filter: "drop-shadow(0 0 10px rgba(0,255,189,.45))" }}
    >
      <defs>
        <radialGradient id="tols-chip-face" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#8dffe4" />
          <stop offset="0.45" stopColor="#00ffbd" />
          <stop offset="1" stopColor="#00c48f" />
        </radialGradient>
        <linearGradient id="tols-chip-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9a6ff" />
          <stop offset="1" stopColor="#5e2bb5" />
        </linearGradient>
      </defs>
      {/* purple silicone rim */}
      <circle cx="32" cy="32" r="31" fill="url(#tols-chip-rim)" />
      <circle cx="32" cy="32" r="31" fill="none" stroke="#1c0529" strokeWidth="1.5" />
      {/* lime face */}
      <circle cx="32" cy="32" r="25" fill="url(#tols-chip-face)" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      {/* edge notches */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x = 32 + Math.cos(a) * 28;
        const y = 32 + Math.sin(a) * 28;
        return <circle key={i} cx={x} cy={y} r="2.4" fill="#0d0d10" opacity="0.85" />;
      })}
      {/* inner ring */}
      <circle cx="32" cy="32" r="19" fill="none" stroke="rgba(13,13,16,.55)" strokeWidth="1.2" strokeDasharray="3 2.5" />
      {/* T mark */}
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={OSWALD}
        fontWeight="700"
        fontSize="30"
        fill="#0d0d10"
      >
        T
      </text>
      {/* specular */}
      <ellipse cx="24" cy="20" rx="9" ry="4.5" fill="rgba(255,255,255,.45)" transform="rotate(-25 24 20)" />
    </svg>
  );
}

interface Logo3DProps {
  size?: number;
  className?: string;
  tone?: "purple" | "lime";
}

export function TolsLogo3D({ size = 190, className, tone = "purple" }: Logo3DProps) {
  const color = tone === "purple" ? "#904bf9" : "#00ffbd";
  return (
    <div className={className} style={{ width: size * 2.6, height: size, pointerEvents: "none" }}>
      <LogoBoundary fallback={<TolsWordmark size={size * 0.38} sweep />}>
        <Suspense fallback={<TolsWordmark size={size * 0.38} />}>
          <SVG3D
            text="TOLS"
            font="Oswald"
            smoothness={0.6}
            color={color}
            material="chrome"
            metalness={1}
            roughness={0.34}
            animate="pulse"
            animateSpeed={0.8}
            cursorOrbit
            resetOnIdle
            lightPosition={[9, -4, 3.5]}
            lightIntensity={5}
            ambientIntensity={1.8}
            width="100%"
            height="100%"
            background="transparent"
          />
        </Suspense>
      </LogoBoundary>
    </div>
  );
}

export function TolsLockup({
  logoSize = 128,
  tone = "purple",
}: {
  logoSize?: number;
  tone?: "purple" | "lime";
}) {
  return (
    <div className="flex flex-col items-center">
      <TolsLogo3D size={logoSize} tone={tone} />
      <div
        className="tols-fun -mt-2 font-bold leading-none"
        style={{
          fontFamily: OSWALD,
          fontSize: logoSize * 0.24,
          letterSpacing: "0.55em",
          paddingLeft: "0.55em",
        }}
      >
        .FUN
      </div>
    </div>
  );
}

export function TolsWordmark({
  size = 15,
  sweep = false,
  className = "",
}: {
  size?: number;
  sweep?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-baseline leading-none ${className}`}
      style={{ fontFamily: OSWALD, fontSize: size, fontWeight: 700, letterSpacing: "0.08em" }}
    >
      <span className="tols-chrome">TOLS</span>
      <span className="tols-fun" style={{ marginLeft: "0.1em" }}>
        .FUN
      </span>
      {sweep && (
        <span
          aria-hidden
          className="animate-shimmer pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(100deg,transparent 30%,rgba(255,255,255,.85) 50%,transparent 70%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          TOLS.FUN
        </span>
      )}
    </span>
  );
}

export function TolsBadge({ size = 15 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <TolsChip size={size * 1.9} />
      <TolsWordmark size={size * 1.05} />
    </span>
  );
}

/** Kept for call-site compatibility: a tiny lime chip used as the "coin". */
export function SolGlyph({ size = 12 }: { size?: number }) {
  return <TolsChip size={size + 2} />;
}
