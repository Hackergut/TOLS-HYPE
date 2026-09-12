---
name: tols-design
description: >
  Official TOLS brand design system: palette (purple, uva, lime, anthracite,
  orange, lime fluo, black), type (TT Bluescreen wordmark + Source Sans),
  surfaces, and game-paint rules (roulette track, keno, originals). Use when
  restyling TOLS UI, originals, cards, roulette, keno, lobby chrome, or when
  the user says TOLS colors, palette, brand, lime, purple, uva, anthracite.
  Triggers on "tols", "design system", "palette", "brand colors", "lime",
  "purple", "uva", "anthracite", "originals UI", "roulette colors".
metadata:
  short-description: "TOLS brand tokens: purple/uva/lime/anthracite/orange — CSS + game paint"
user-invocable: true
---

# TOLS design system

Canonical brand for this casino. **Tokens in `src/styles.css` `@theme`.**
**Complete game CSS in `src/tols.css`** (also `references/tokens.css`).
JS helpers: `src/lib/palette.ts`. No new hex in JSX.

Read `references/palette.md` (games) and `references/chrome.md` (lobby/wallet).

Pair with **`design-ui`** for layout/motion. This skill **wins** on color, type
for TOLS wordmarks, and originals game paint.

## Rules

1. **Solana accents on dark chrome** — violet `#904BF9` CTA, mint `#00FFBD` win/bet.
2. **Grey/black body** `#0d0d10` / `#16171b`. Never `#000` page fill.
3. **Ink:** on mint → `#0d0d10`. On violet CTA → white. On VIP magenta → white.
4. **Originals Bet = mint** (`bg-lime`). Wallet Deposit/Claim = `--grad-solana`.
5. **VIP** = `#EA2FD4` / `#9628A1` only on loyalty, not felt.
6. **TT Bluescreen** wordmarks. Body: existing sans. Do not swap to Oswald unless asked.
7. **Focus ring** `#904BF9`. Live pip `#e1514e`.

## Do not

- Recolor the whole roulette pie.
- Swap Bet to orange.
- Use red for a lost round (that's purple).
- Invent a new game accent.

## Finish

- Hex only from `references/palette.md`.
- `bg-lime` / `bg-purple` / `bg-uva` / `bg-anthracite` / `bg-orange` / `text-lime`.
- Contrast: lime on black and lime on purple pass AA; purple on black does not
  (use lime text or `--primary-bright`).
