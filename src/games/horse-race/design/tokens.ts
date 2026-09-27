/**
 * ============================================================
 *  TOLS.FUN DESIGN SYSTEM — TOKENS
 * ============================================================
 * Single source of truth, mirrored in `src/index.css` as CSS custom
 * properties. Extracted from the live https://www.tols.fun stylesheet:
 * "Silicone originals · lime · fluo purple".
 */

export const color = {
  /* surfaces */
  bg0: "#09090c",
  bg1: "#16171b",
  bg: "#0d0d10",
  card: "#16171b",
  muted: "#202024",
  elevated: "#2a2a30",
  purpleDeep: "#1c0529",

  /* brand */
  lime: "#00ffbd",
  limeSoft: "#8dffe4",
  limeDeep: "#00c48f",
  purple: "#904bf9",
  purpleBright: "#a665f5",
  purpleSoft: "#c9a6ff",

  /* text */
  fg: "#fafafa",
  fgMuted: "#a3a4ac",
  fgFaint: "#6b6c76",

  /* status */
  warning: "#facc15",
  danger: "#e1514e",
  border: "rgba(255,255,255,0.08)",
} as const;

export const glow = {
  lime: "0 0 24px rgba(0,255,189,.35)",
  violet: "0 0 32px rgba(144,75,249,.38)",
  brand: "0 0 56px #904bf947, 0 0 90px #00ffbd1a",
} as const;

export const radius = {
  xs: "0.125rem",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.625rem",
  xl: "0.875rem",
  "2xl": "1rem",
  full: "9999px",
} as const;

export const font = {
  heading: "'Oswald', ui-sans-serif, system-ui, sans-serif",
  sans: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  mono: "'Roboto Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
} as const;

/** Runner accent colours, kept in sync with HORSES[].color */
export const runnerColor = [
  "#e63946",
  "#3d7bff",
  "#00ffbd",
  "#ffb703",
  "#904bf9",
  "#f4f4f5",
] as const;

export const duration = {
  fast: 120,
  base: 220,
  slow: 380,
} as const;
