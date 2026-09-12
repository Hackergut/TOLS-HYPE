# TOLS palette

Official inks. CSS: `src/styles.css`. JS: `src/lib/palette.ts`.

| Name | Hex | RGB | HSL | Token | Role |
|---|---|---|---|---|---|
| **Purple** | `#6f1cb6` | 111, 28, 182 | 272°, 73%, 41% | `--purple` `--color-purple` | Brand, black-pocket, selected chrome |
| **Uva** | `#1c0529` | 28, 5, 41 | 278°, 78%, 9% | `--uva` `--color-uva` `--purple-deep` | Hub, deep panel, card wash |
| **Lime** | `#bfe328` | 191, 227, 40 | 72°, 77%, 52% | `--lime-300` `--color-lime` | Go, win, red-pocket, ball, wordmark |
| **Anthracite** | `#504756` | 80, 71, 86 | 276°, 10%, 31% | `--anthracite` `--color-anthracite` `--wheel` | Unpainted wheel, muted metal |
| **Orange** | `#ff8904` | 255, 137, 4 | 32°, 100%, 51% | `--orange` `--color-orange` | Hot, fire, pulse — not lose |
| **Lime fluo** | `#7caf10` | 124, 175, 16 | 79°, 83%, 37% | `--lime-400` `--color-lime-400` | Hover / pressed lime |
| **Black** | `#09090c` | 9, 9, 12 | 240°, 14%, 4% | `--background` (dark) | Canvas |

## Pairing

```
black canvas
  uva panel / hub
    anthracite body (no paint)
      ONE track: lime | purple | lime | purple
    lime ball
    lime ring (outer stroke)
  lime CTA  (ink black)
  purple fill CTA  (ink lime)
  orange hot pip
```

## Game paint

| Surface | Fill | Ink |
|---|---|---|
| Roulette red / 0 | `#c1ff72` | black |
| Roulette black | purple | lime |
| Roulette disc | `#545454` / rim `#2d2d2d` (CAELIA) | — |
| Roulette lime ring / 8-star | `#c1ff72` | black stroke |
| Roulette hub asterisk | `#2d2d2d` | — |
| Keno hit | lime | black |
| Keno miss / drawn | purple | lime |
| Keno pick | transparent + purple stroke | purple-bright |
| Bet / go | lime | black |
| Widget win / pill | lime fill | black |
| Widget lose / pill | purple fill | lime |
| Felt number (idle) | `#2d2d2d` + lime/purple stroke | lime |
| Felt number (on) | lime or purple fill | black / lime |
| Dozen / outside idle | `#3a3a3a` | zinc |
| Hot badge | orange | black |

## Type

- Wordmark / section titles: `font-bluescreens` (TT Bluescreen, elongated O).
- UI / numbers: Source Sans 3, `tabular-nums` on money and multipliers.

## Contrast notes

- Lime `#bfe328` on black `#09090c` → AA.
- Lime on purple `#6f1cb6` → AA.
- Purple on black → fail for text; stroke-only or lime ink.
- Anthracite on black → fail; use for large fills, not small type.
