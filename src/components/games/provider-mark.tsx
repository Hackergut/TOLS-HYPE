import { useState } from "react";
import { cn } from "cn";

export type ProviderTone = "light" | "dark" | "mono";

const HUES = [265, 96, 18, 205, 330, 160, 45, 230, 0, 290] as const;

function initials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9'& ]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return (words[0] ?? "?").slice(0, 2).toUpperCase();
  return `${(words[0] ?? "")[0] ?? ""}${(words[1] ?? "")[0] ?? ""}`.toUpperCase();
}

function hue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length] ?? 265;
}

/** Monochrome lockup on transparent ground. No tile, no color fill. */
export function ProviderMark({
  name,
  logo,
  tone = "mono",
  className,
  imgClassName,
}: {
  name: string;
  logo?: string | null;
  tone?: ProviderTone;
  className?: string;
  imgClassName?: string;
}) {
  const [broken, setBroken] = useState(false);
  const showLogo = Boolean(logo) && !broken;
  const mono = tone === "mono" || Boolean(logo?.includes("/mono/"));
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden",
        mono ? "bg-transparent" : tone === "light" ? "rounded-lg bg-white" : "rounded-lg bg-black/70 ring-1 ring-white/10",
        className,
      )}
      title={name}
      aria-label={`${name} logo`}
      role="img"
    >
      {showLogo ? (
        <img
          src={logo as string}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setBroken(true)}
          className={cn("max-h-full max-w-full object-contain", imgClassName ?? "px-0.5")}
        />
      ) : (
        <span
          aria-hidden
          className="grid size-full place-items-center font-bluescreens text-sm font-bold tracking-widest text-white"
          style={{
            background: `linear-gradient(135deg, hsl(${hue(name)} 60% 42%), hsl(${(hue(name) + 40) % 360} 65% 28%))`,
          }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
