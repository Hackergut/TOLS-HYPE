import type { DualStat } from "@/lib/match-live";

export function StatBlock({ title, rows }: { title?: string; rows: DualStat[] }) {
  return (
    <section className="sb-card px-3 py-3">
      {title ? <h3 className="font-sub mb-3 text-center text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">{title}</h3> : null}
      <ul className="grid gap-3">
        {rows.map((r) => (
          <StatRow key={r.label} {...r} />
        ))}
      </ul>
    </section>
  );
}

export function StatRow({ label, home, away }: DualStat) {
  const sum = home + away || 1;
  const hp = (home / sum) * 100;
  const ap = (away / sum) * 100;
  return (
    <li>
      <div className="mb-1 flex items-center gap-2 text-xs tabular-nums">
        <span className="w-10 text-left font-medium text-lime">{fmt(home)}</span>
        <span className="min-w-0 flex-1 text-center text-[0.65rem] tracking-wide text-muted-foreground uppercase">{label}</span>
        <span className="w-10 text-right font-medium" style={{ color: "#904bf9" }}>{fmt(away)}</span>
      </div>
      <div className="flex h-1 gap-1">
        <div className="flex flex-1 justify-end overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-lime" style={{ width: `${hp}%` }} />
        </div>
        <div className="flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${ap}%`, background: "#904bf9" }} />
        </div>
      </div>
    </li>
  );
}

function fmt(n: number) {
  return n >= 20 && n <= 100 && !Number.isInteger(n / 5) ? `${n}` : String(n);
}
