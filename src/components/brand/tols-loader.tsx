"use client";

import { useMemo } from "react";

/*
 * Official TOLS slot-reel wordmark — SLOT → TOLS.
 * `mini`  inline splash (reels + Loading)
 * `page`  section-sized splash
 * `full`  boot overlay letters only (VideoLoader wraps dismiss)
 */

const FINAL = ["T", "O", "L", "S"] as const;
const START = ["S", "L", "O", "T"] as const;
const TARGET_IDX = 7;
const BASE_LEN = 14;

export type TolsLoaderSize = "mini" | "page" | "full";

const SIZE: Record<TolsLoaderSize, { font: string; duration: string; stroke: string }> = {
  mini: { font: "28px", duration: "1.7s", stroke: "1px" },
  page: { font: "clamp(36px, 9vw, 56px)", duration: "2s", stroke: "1.15px" },
  full: { font: "clamp(44px, 16vw, 120px)", duration: "2.4s", stroke: "1px" },
};

const REEL_CSS = `
@keyframes tols-reel-spin-0{0%,6%{transform:translateY(0)}40%{transform:translateY(calc(-1em * ${TARGET_IDX}))}52%{transform:translateY(calc(-1em * ${TARGET_IDX}))}100%{transform:translateY(calc(-1em * ${BASE_LEN}))}}
@keyframes tols-reel-spin-1{0%,8%{transform:translateY(0)}46%{transform:translateY(calc(-1em * ${TARGET_IDX}))}58%{transform:translateY(calc(-1em * ${TARGET_IDX}))}100%{transform:translateY(calc(-1em * ${BASE_LEN}))}}
@keyframes tols-reel-spin-2{0%,10%{transform:translateY(0)}52%{transform:translateY(calc(-1em * ${TARGET_IDX}))}64%{transform:translateY(calc(-1em * ${TARGET_IDX}))}100%{transform:translateY(calc(-1em * ${BASE_LEN}))}}
@keyframes tols-reel-spin-3{0%,12%{transform:translateY(0)}58%{transform:translateY(calc(-1em * ${TARGET_IDX}))}70%{transform:translateY(calc(-1em * ${TARGET_IDX}))}100%{transform:translateY(calc(-1em * ${BASE_LEN}))}}
@media (prefers-reduced-motion: reduce){
  .tols-reel-strip{animation:none !important;transform:translateY(calc(-1em * ${TARGET_IDX})) !important}
}
`;

function buildReels() {
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return FINAL.map((target, i) => {
    const symbols: string[] = [];
    for (let n = 0; n < BASE_LEN; n++) symbols.push(alpha[(n * 5 + i * 3 + 2) % alpha.length]);
    symbols[0] = START[i];
    symbols[TARGET_IDX] = target;
    symbols.push(...symbols.slice(0, 4));
    return symbols;
  });
}

export function TolsReels({
  size = "mini",
  className = "",
}: {
  size?: TolsLoaderSize;
  className?: string;
}) {
  const reels = useMemo(() => buildReels(), []);
  const spec = SIZE[size];
  const stroke = "var(--lime-300, #00ffbd)";
  const letter: React.CSSProperties = {
    fontFamily: "var(--font-wordmark), Oswald, 'Arial Narrow', sans-serif",
    fontSize: spec.font,
    fontWeight: 700,
    lineHeight: "1em",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    WebkitTextStroke: `${spec.stroke} ${stroke}`,
    textShadow: `0 0 1px ${stroke}aa, 0 0 8px ${stroke}55`,
    userSelect: "none",
  };

  return (
    <div className={`tols-reels tols-reels--${size} ${className}`} role="img" aria-label="TOLS">
      <style>{REEL_CSS}</style>
      <div style={{ display: "flex", alignItems: "center", gap: "0.02em" }}>
        {reels.map((symbols, i) => (
          <span
            key={i}
            style={{
              position: "relative",
              width: "0.62em",
              height: "1em",
              overflow: "hidden",
              ...letter,
            }}
          >
            <span
              className="tols-reel-strip"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                animation: `tols-reel-spin-${i} ${spec.duration} cubic-bezier(0.22, 0.61, 0.36, 1) infinite`,
                willChange: "transform",
              }}
            >
              {symbols.map((ch, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "1em",
                    ...letter,
                  }}
                >
                  {ch}
                </span>
              ))}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Caption({ text }: { text: string }) {
  return (
    <p
      className="m-0 text-[11px] font-medium uppercase tracking-[0.28em] text-white/40"
      style={{ fontFamily: "var(--font-sans), Inter, sans-serif" }}
    >
      {text}
    </p>
  );
}

export function TolsLoader({
  size = "mini",
  className = "",
  caption = "Loading",
}: {
  size?: Exclude<TolsLoaderSize, "full">;
  className?: string;
  caption?: string;
}) {
  if (size === "page") {
    return (
      <div
        className={`flex min-h-[28vh] w-full flex-col items-center justify-center gap-4 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={caption}
      >
        <TolsReels size="page" />
        <Caption text={caption} />
      </div>
    );
  }
  return (
    <div
      className={`inline-flex flex-col items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={caption}
    >
      <TolsReels size="mini" />
      <Caption text={caption} />
    </div>
  );
}

export function TolsPageLoader({ className = "" }: { className?: string }) {
  return <TolsLoader size="page" className={className} />;
}
