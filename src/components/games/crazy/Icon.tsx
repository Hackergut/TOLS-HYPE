import type { CSSProperties } from "react";

const paths = {
  home: "m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9",
  wheel: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 6v2m0 8v2M6 12h2m8 0h2M8 8l1 1m6 6 1 1m0-8-1 1m-6 6-1 1M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  ticket: "M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Zm9 0v3m0 3v2m0 3v3",
  share: "m14 3 7 6-7 6v-4C8 11 5 13 3 18c0-8 4-13 11-13V3Z",
  shield: "m12 2 8 3v6c0 5-3 8-8 11-5-3-8-6-8-11V5l8-3Zm-4 10 3 3 5-6",
  heart: "M12 20S3 15 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 12-9 12Z",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM16 16l5 5",
  chat: "M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.4-5a9 9 0 1 1 16.6-4.5Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9ZM10 21h4",
  plus: "M12 5v14M5 12h14",
  chevron: "m8 4 8 8-8 8",
  down: "m6 9 6 6 6-6",
  settings: "m9 3-1 3-3 1-2 3 2 2v3l3 2 1 4h6l1-4 3-2v-3l2-2-2-3-3-1-1-3H9ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  chart: "M4 3h16v18H4V3ZM8 17v-5m4 5V7m4 10v-8",
  sound: "M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  mute: "M11 4 6 8H3v8h3l5 4V4Zm5 5 5 6m0-6-5 6",
  pause: "M8 5v14M16 5v14",
  play: "m8 4 12 8-12 8V4Z",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  close: "m6 6 12 12M6 18 18 6",
  repeat: "M20 7H8a5 5 0 0 0-5 5m17-5-4-4m4 4-4 4M4 17h12a5 5 0 0 0 5-5M4 17l4-4m-4 4 4 4",
  undo: "M3 10h11a6 6 0 0 1 0 12M3 10l6-6M3 10l6 6",
  wallet: "M4 6V4h14v3M3 7h18v14H3V7Zm18 5h-6v5h6M17 14.5h.1",
  info: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 11v6m0-10v.1",
  check: "m5 12 4 4L19 6",
  trophy: "M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H3v3a5 5 0 0 0 5 5M17 5h4v3a5 5 0 0 1-5 5M12 15v6m-5 0h10",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 6v6l4 2",
  copy: "M9 9h12v12H9V9ZM15 9V3H3v12h6",
  code: "m7 6-6 6 6 6m10-12 6 6-6 6m-4-14-2 16",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  logout: "M10 3H3v18h7m-2-9h13m-5-5 5 5-5 5",
} as const;

export type IconName = keyof typeof paths;

export default function Icon({ name, size = 20, className = "", style }: {
  name: IconName; size?: number; className?: string; style?: CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}