const PLOTS: Record<string, string> = {
  vs25wolfgold:
    "A desert pack hunts stacked gold. Three wolves, three jackpots — Mini, Major, Mega. Land the money symbol and the pack howls.",
  vs20fruitsw:
    "Candy rains in tumbling clusters. Hold for the bonus and watch the multipliers pile on the pink board.",
  vs20olympgate:
    "Zeus slams the reels. Multipliers drop from the clouds; one more lightning and the gates open.",
  vs20sugarrush:
    "A city of sweets. Cluster pays, cascading wins, and a bonus that paints the grid in sugar.",
  vs20starlight:
    "A princess walks a night sky of tumbling stars. Catch the scatter and the multipliers wake up.",
  vs10bbbonanza:
    "Cast the line. Fish money symbols, bank the catch, and hope the captain calls a free-spin storm.",
  vs20doghouse:
    "Three dogs, one house, sticky wilds. Keep them on the reels and the bone pile grows.",
  vs20fruitparty:
    "Fruit explodes in clusters. Each cascade can retrigger — the party does not stop on a single drop.",
  vs20kraken:
    "The deep wakes. Tentacles lock wilds; free spins turn the ocean floor into a payout grid.",
  playngo-bookofdead:
    "Rich enters the tomb. Expanding symbols on free spins write the book page by page.",
  hacksaw-le-bandit:
    "A masked thief cracks the vault. Collectors steal values off the grid until the last lock pops.",
  hacksaw-wanted-dead-or-a-wild:
    "Dead or a wild — the sheriff does not care. Duel the reels and cash the wanted poster.",
  fortune-ox:
    "The ox stamps gold into the grid. One lucky stamp and the whole board pays.",
  fortune-tiger:
    "A tiger walks the fortune road. Multipliers stack; the roar is the bonus.",
  relax-moneytrain3:
    "Board the train. Persistent extras ride car to car until the conductor stops the line.",
  evo-crazy-time:
    "A live wheel, four bonus games, a studio that never sleeps. Spin, then pick a drop.",
  spaceman:
    "A crash rocket in a live studio. Cash out before the spaceman leaves the frame.",
};

export function slotPlot(slug: string, title?: string): string {
  const key = slug.replace(/^flexrix-/, "");
  if (PLOTS[key]) return PLOTS[key]!;
  const name = title?.trim() || key.replace(/[-_]/g, " ");
  return `${name} is a studio table on TOLS. Official cover, live wallet, same RTP the provider publishes.`;
}
