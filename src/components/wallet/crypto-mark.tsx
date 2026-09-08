import type { Currency } from "@/lib/games-catalog";
import { cn } from "cn";

export function CryptoMark({ currency, className }: { currency: Currency; className?: string }) {
  if (currency === "BTC") {
    return (
      <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden>
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          fill="#fff"
          d="M21.7 14.4c.3-1.9-1.2-2.9-3.2-3.6l.7-2.6-1.6-.4-.6 2.5c-.4-.1-.9-.2-1.3-.3l.6-2.5-1.6-.4-.7 2.6c-.3-.1-.7-.2-1-.3l-2.2-.6-.4 1.7s1.2.3 1.2.3c.6.2.8.5.7.9l-.7 3c0 .10.0.1.4.1l-.4.1-1.1 4.4c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.1.3l-.7 2.7 1.6.4.7-2.6c.4.1.9.2 1.3.3l-.7 2.6 1.6.4.7-2.7c2.8.5 4.9.3 5.8-2.2.7-2-.03-3.2-1.6-3.9 1.1-.3 2-1 2.2-2.6zm-3.9 5.5c-.5 2.1-4.1.9-5.2.7l.9-3.7c1.1.3 4.8.8 4.3 3zm.5-5.5c-.5 1.9-3.4.9-4.3.7l.8-3.3c.9.2 3.9.7 3.5 2.6z"
        />
      </svg>
    );
  }
  if (currency === "ETH") {
    return (
      <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden>
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <path fill="#fff" fillOpacity=".7" d="M16.5 5v8.1l6.8 3.05z" />
        <path fill="#fff" d="M16.5 5 9.6 16.15l6.9-3.05z" />
        <path fill="#fff" fillOpacity=".7" d="M16.5 21.4v5.5L23.4 17.4z" />
        <path fill="#fff" d="M16.5 26.9v-5.5l-6.9-3.9z" />
        <path fill="#fff" fillOpacity=".4" d="M16.5 20.1 23.3 16.1 16.5 13z" />
        <path fill="#fff" fillOpacity=".7" d="M9.6 16.15 16.5 20.1v-7.05z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        fill="#fff"
        d="M17.9 17.2v-.1c3.2-.2 5.6-1.1 5.6-2.3 0-1.2-2.4-2.1-5.6-2.3V9.4h-1.8v3.1c-3.3.2-5.7 1.1-5.7 2.3 0 1.2 2.4 2.1 5.7 2.3v.1c-4.3.3-7.5 1.4-7.5 2.8s3.2 2.5 7.5 2.8v3.4h1.8v-3.4c4.3-.3 7.4-1.4 7.4-2.8s-3.1-2.5-7.4-2.8zm-1.8-5.2c2.7.1 4.7.7 4.7 1.5s-2 1.4-4.7 1.5zm0 8.4c-3.2-.1-5.6-.8-5.6-1.7s2.4-1.6 5.6-1.7z"
      />
    </svg>
  );
}
