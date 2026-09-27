import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * ============================================================
 *  TOLS.FUN DESIGN SYSTEM — PRIMITIVES
 * ============================================================
 * Every surface, control and label in the game is composed from these.
 * Variants map 1:1 onto the tokens in `tokens.ts` / `index.css`.
 */

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

/* ---------------------------------------------------------------- Button */
type BtnVariant = "lime" | "purple" | "ghost" | "outline" | "danger";
type BtnSize = "sm" | "md" | "lg";

const BTN_BASE =
  "btn-press inline-flex items-center justify-center gap-2 rounded-xl font-heading font-bold uppercase leading-none disabled:cursor-not-allowed select-none";

const BTN_VARIANT: Record<BtnVariant, string> = {
  lime: "btn-lime disabled:!bg-[#202024] disabled:!bg-none disabled:!text-[#5b5c66] disabled:!shadow-none",
  purple: "btn-purple disabled:!bg-[#202024] disabled:!bg-none disabled:!text-[#5b5c66] disabled:!shadow-none",
  ghost: "bg-white/[.04] text-[#a3a4ac] hover:bg-white/[.08] hover:text-[#fafafa] disabled:opacity-40",
  outline:
    "border border-white/[.10] bg-transparent text-[#a3a4ac] hover:border-[#904bf9]/50 hover:text-[#fafafa] disabled:opacity-40",
  danger: "bg-[#e1514e] text-white hover:bg-[#ec6b68] disabled:opacity-40",
};

const BTN_SIZE: Record<BtnSize, string> = {
  sm: "px-2.5 py-1.5 text-[11px] tracking-[0.12em]",
  md: "px-4 py-2.5 text-[13px] tracking-[0.16em]",
  lg: "px-6 py-3.5 text-base tracking-[0.18em]",
};

export function Button({
  variant = "ghost",
  size = "md",
  className,
  children,
  ...rest
}: { variant?: BtnVariant; size?: BtnSize } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ Card */
export function Card({
  children,
  className,
  tone = "plain",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  tone?: "plain" | "purple";
  as?: "div" | "section" | "aside";
}) {
  return (
    <As className={cx("silicone rounded-2xl", tone === "purple" && "silicone-purple", className)}>
      {children}
    </As>
  );
}

/* ------------------------------------------------------------------ Chip */
type ChipTone = "lime" | "purple" | "neutral" | "warning" | "danger";

const CHIP_TONE: Record<ChipTone, string> = {
  lime: "border-[#00ffbd]/30 bg-[#00ffbd]/10 text-[#00ffbd]",
  purple: "border-[#904bf9]/40 bg-[#904bf9]/12 text-[#c9a6ff]",
  neutral: "border-white/10 bg-white/[.04] text-[#a3a4ac]",
  warning: "border-[#facc15]/30 bg-[#facc15]/10 text-[#facc15]",
  danger: "border-[#e1514e]/35 bg-[#e1514e]/12 text-[#e1514e]",
};

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em]",
        CHIP_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Label */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b6c76]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------- Stat */
export function Stat({
  label,
  value,
  tone = "neutral",
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: ChipTone;
  sub?: ReactNode;
  className?: string;
}) {
  const valueTone = {
    lime: "text-[#00ffbd]",
    purple: "text-[#c9a6ff]",
    neutral: "text-[#fafafa]",
    warning: "text-[#facc15]",
    danger: "text-[#e1514e]",
  }[tone];
  return (
    <div
      className={cx(
        "rounded-xl border border-white/[.07] bg-[#09090c]/70 px-2.5 py-2 text-center",
        className,
      )}
    >
      <Label>{label}</Label>
      <div className={cx("font-mono text-base font-bold leading-tight tabular-nums", valueTone)}>
        {value}
      </div>
      {sub && <div className="text-[9px] text-[#6b6c76]">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ Meter */
export function Meter({
  value,
  tone = "lime",
  className,
  height = 6,
}: {
  value: number; // 0..1
  tone?: "lime" | "purple" | "danger";
  className?: string;
  height?: number;
}) {
  const bg = {
    lime: "linear-gradient(90deg,#00c48f,#00ffbd)",
    purple: "linear-gradient(90deg,#5e2bb5,#a665f5)",
    danger: "linear-gradient(90deg,#8a1c27,#e1514e)",
  }[tone];
  return (
    <div
      className={cx("w-full overflow-hidden rounded-full bg-black/50", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: bg }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------- Kbd */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-white/12 bg-white/[.06] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#a3a4ac]">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------- SectionHead */
export function SectionHead({
  title,
  right,
  className,
}: {
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-2 flex items-center justify-between gap-2", className)}>
      <h3 className="font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a3a4ac]">
        {title}
      </h3>
      {right}
    </div>
  );
}

/* ----------------------------------------------------------------- Divider */
export function Divider({ className }: { className?: string }) {
  return <div className={cx("h-px w-full bg-white/[.07]", className)} />;
}

/* ------------------------------------------------------------------ Modal */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        tone="purple"
        className={cx(
          "animate-slideDown flex max-h-[88dvh] w-full flex-col overflow-hidden bg-[#16171b]",
          wide ? "max-w-2xl" : "max-w-md",
        )}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[.08] px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-[#fafafa]">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div
          className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
        {footer && (
          <div
            className="shrink-0 border-t border-white/[.08] px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            {footer}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ utils */
export { cx };
