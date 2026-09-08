const EURO = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

function pocketFill(n: number) {
  if (n === 0) return "#cdf32b";
  const i = EURO.indexOf(n);
  return i % 2 === 0 ? "#2a2a2c" : "#151517";
}

export function RouletteWheel({
  number,
  spinning,
}: {
  number: number | null;
  spinning: boolean;
}) {
  const idx = number == null ? 0 : Math.max(0, EURO.indexOf(number));
  const slice = 360 / EURO.length;
  const rot = spinning ? 720 : 360 - idx * slice - slice / 2;

  return (
    <div className="relative mx-auto aspect-square w-56 md:w-72" style={{ perspective: "900px" }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          transform: spinning ? "rotateX(22deg) scale(1.04)" : "rotateX(18deg)",
          transformStyle: "preserve-3d",
          transition: "transform 700ms cubic-bezier(0.22,1,0.36,1)",
          boxShadow: "0 28px 40px -18px rgb(0 0 0 / 0.7), 0 0 0 3px #cdf32b",
        }}
      >
        <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
          <circle cx="100" cy="100" r="99" fill="#101012" />
          <g
            style={{
              transformOrigin: "100px 100px",
              transform: `rotate(${rot}deg)`,
              transition: spinning
                ? "transform 1.6s cubic-bezier(0.12, 0.7, 0.2, 1)"
                : "transform 900ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {EURO.map((n, i) => {
              const a0 = ((i * slice - 90) * Math.PI) / 180;
              const a1 = (((i + 1) * slice - 90) * Math.PI) / 180;
              const r0 = 38;
              const r1 = 94;
              const p = [
                [100 + r0 * Math.cos(a0), 100 + r0 * Math.sin(a0)],
                [100 + r1 * Math.cos(a0), 100 + r1 * Math.sin(a0)],
                [100 + r1 * Math.cos(a1), 100 + r1 * Math.sin(a1)],
                [100 + r0 * Math.cos(a1), 100 + r0 * Math.sin(a1)],
              ];
              const d = `M ${p[0]![0]} ${p[0]![1]} L ${p[1]![0]} ${p[1]![1]} A ${r1} ${r1} 0 0 1 ${p[2]![0]} ${p[2]![1]} L ${p[3]![0]} ${p[3]![1]} A ${r0} ${r0} 0 0 0 ${p[0]![0]} ${p[0]![1]}`;
              return <path key={n} d={d} fill={pocketFill(n)} />;
            })}
            <circle cx="100" cy="100" r="36" fill="#1c1c1e" />
            <circle cx="100" cy="100" r="22" fill="#0e0e10" />
            <circle cx="100" cy="100" r="8" fill="#cdf32b" />
          </g>
          <circle cx="100" cy="100" r="96" fill="none" stroke="#cdf32b" strokeWidth="2.5" />
        </svg>
        <span
          className="absolute top-[11%] left-1/2 size-3 -translate-x-1/2 rounded-full bg-lime shadow-[0_8px_16px_rgb(0_0_0_/_0.45)]"
          aria-hidden
        />
      </div>
    </div>
  );
}
