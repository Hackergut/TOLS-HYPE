import type { LinkProps } from "@tanstack/react-router";

export type NavLink = {
  title: string;
  to: LinkProps["to"];
  icon:
    | "home"
    | "dice"
    | "live"
    | "dashboard"
    | "sports"
    | "fairness"
    | "wallet"
    | "vip"
    | "vault"
    | "token"
    | "affiliate"
    | "alerts"
    | "tx"
    | "redeem"
    | "settings"
    | "responsible"
    | "help";
};

/** Left rail / mobile drawer — house home. */
export const BROWSE_NAV: NavLink[] = [
  { title: "Lobby", to: "/", icon: "home" },
  { title: "Dashboard", to: "/dashboard", icon: "dashboard" },
  { title: "Affiliates", to: "/affiliate", icon: "affiliate" },
];

export const BROWSE_FOOT: NavLink[] = [
  { title: "Fairness", to: "/fairness", icon: "fairness" },
];

export type OriginalNav = {
  title: string;
  id: string;
};

/** TOLS Originals — deep links into playable tables. */
export const ORIGINAL_SECTIONS: OriginalNav[] = [
  { title: "Crash", id: "neon-crash" },
  { title: "Dice", id: "signal-dice" },
  { title: "Mines", id: "grid-mines" },
  { title: "Keno", id: "keno-40" },
  { title: "Hi-Lo", id: "hilo-ace" },
  { title: "Limbo", id: "pulse-limbo" },
  { title: "Plinko", id: "grid-plinko" },
  { title: "Tower", id: "sky-tower" },
  { title: "Roulette", id: "midnight-roulette" },
  { title: "Blackjack", id: "obsidian-blackjack" },
  { title: "Neon Sevens", id: "pulse-slots" },
  { title: "Pool Rush", id: "pool-rush" },
];

export type CasinoSection = {
  title: string;
  to: "/casino" | "/live" | "/originals";
  cat?: "all" | "originals" | "slots" | "table" | "live" | "crash";
};

/** Casino categories in the left rail. */
export const CASINO_SECTIONS: CasinoSection[] = [
  { title: "Lobby", to: "/casino", cat: "all" },
  { title: "Originals", to: "/originals", cat: "originals" },
  { title: "Slots", to: "/casino", cat: "slots" },
  { title: "Table", to: "/casino", cat: "table" },
  { title: "Live", to: "/live" },
  { title: "Crash", to: "/casino", cat: "crash" },
];

export type SportNav = {
  title: string;
  sport: "all" | "football" | "basketball" | "tennis" | "mma" | "esports";
};

/** Sportsbook rails — never mixed into casino. */
export const SPORT_SECTIONS: SportNav[] = [
  { title: "All sports", sport: "all" },
  { title: "Football", sport: "football" },
  { title: "Basketball", sport: "basketball" },
  { title: "Tennis", sport: "tennis" },
  { title: "MMA", sport: "mma" },
  { title: "Esports", sport: "esports" },
];

export type AffiliateTab = "overview" | "users" | "campaigns" | "earnings" | "info" | "pro";

export type AffiliateNav = {
  title: string;
  tab: AffiliateTab;
};

/** Left-rail Affiliates section — full program, not only the account link. */
export const AFFILIATE_SECTIONS: AffiliateNav[] = [
  { title: "Overview", tab: "overview" },
  { title: "Referred Users", tab: "users" },
  { title: "Campaigns", tab: "campaigns" },
  { title: "Earnings", tab: "earnings" },
  { title: "Info", tab: "info" },
  { title: "Professional", tab: "pro" },
];

/** Avatar menu — account. One source so it never drifts from the dock. */
export const ACCOUNT_NAV: NavLink[] = [
  { title: "Wallet", to: "/profile", icon: "wallet" },
  { title: "VIP", to: "/vip", icon: "vip" },
  { title: "Vault", to: "/vault", icon: "vault" },
  { title: "Token", to: "/token", icon: "token" },
  { title: "Affiliate program", to: "/affiliate", icon: "affiliate" },
  { title: "Notifications", to: "/alerts", icon: "alerts" },
  { title: "Transactions", to: "/profile", icon: "tx" },
  { title: "Redeem code", to: "/redeem", icon: "redeem" },
  { title: "Settings", to: "/profile", icon: "settings" },
  { title: "Responsible play", to: "/responsible", icon: "responsible" },
  { title: "Live support", to: "/help", icon: "help" },
];
