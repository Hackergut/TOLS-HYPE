import type { LinkProps } from "@tanstack/react-router";

export type NavLink = {
  title: string;
  to: LinkProps["to"];
  icon:
    | "home"
    | "dice"
    | "live"
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

/** Left rail / mobile drawer — browse the house. */
export const BROWSE_NAV: NavLink[] = [
  { title: "Lobby", to: "/", icon: "home" },
  { title: "Casino", to: "/casino", icon: "dice" },
  { title: "Live", to: "/live", icon: "live" },
  { title: "Sports", to: "/sports", icon: "sports" },
];

export const BROWSE_FOOT: NavLink[] = [
  { title: "Fairness", to: "/fairness", icon: "fairness" },
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
