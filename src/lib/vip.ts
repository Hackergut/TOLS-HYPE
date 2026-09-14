/** TOLS VIP — single source for tiers and reward widgets.
 *
 * 1 point = $1 wagered. Tiers auto-upgrade, perks stack.
 * Both the /vip page and the wallet VipPane read from here — never fork the numbers.
 */

export type VipTier = {
  name: string;
  icon: string;
  points: number;
  wager: string;
  rake: string;
  cash: string;
  perk: string;
  reward: string;
};

export const VIP_TIERS: VipTier[] = [
  {
    name: "Member",
    icon: "👋",
    points: 0,
    wager: "$0",
    rake: "5%",
    cash: "—",
    perk: "Welcome bonus",
    reward: "Welcome bonus",
  },
  {
    name: "Gold",
    icon: "🥇",
    points: 1_000,
    wager: "$1,000",
    rake: "10%",
    cash: "—",
    perk: "Faster cashier",
    reward: "$25 level-up bonus",
  },
  {
    name: "Diamond",
    icon: "💎",
    points: 5_000,
    wager: "$5,000",
    rake: "15%",
    cash: "10% monthly",
    perk: "Priority support",
    reward: "$100 level-up bonus",
  },
  {
    name: "Obsidian",
    icon: "🖤",
    points: 25_000,
    wager: "$25,000",
    rake: "20%",
    cash: "10% monthly",
    perk: "VIP host + reloads",
    reward: "$500 level-up bonus",
  },
];

export type VipRewardId = "instant" | "daily" | "weekly" | "monthly";

export const VIP_REWARDS: {
  id: VipRewardId;
  title: string;
  hint: string;
  cta: string;
  ready: boolean;
  icon: string;
}[] = [
  { id: "instant", title: "Instant Rakeback", hint: "Wager to Unlock", cta: "Claim", ready: true, icon: "🧹" },
  { id: "daily", title: "Daily Rakeback", hint: "Claim Soon!", cta: "02h 22m", ready: false, icon: "🎁" },
  { id: "weekly", title: "Weekly Bonus", hint: "Claim Soon!", cta: "05d 13h", ready: false, icon: "📦" },
  { id: "monthly", title: "Monthly Bonus", hint: "Claim Soon!", cta: "20d 02h", ready: false, icon: "🎀" },
];

/** Highest tier index whose threshold `points` has reached. */
export function vipTierIndex(points: number): number {
  return VIP_TIERS.reduce((i, t, n) => (points >= t.points ? n : i), 0);
}