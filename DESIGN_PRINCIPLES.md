# Number Friends — Design System v2

*Rewritten June 2026 to match the actual code. The single source of truth is
`src/index.css` — if this doc and the CSS disagree, trust the CSS.*

## Visual identity

Dark **nebula + glass** theme: deep navy/indigo gradient background with subtle
film grain, translucent glassmorphism surfaces, and warm "toybox" accent colors.
Playful family-game-night energy — bold but not childish. The immersive 3D board
is the primary play mode; all UI is designed to sit as a HUD over WebGL.

### Color tokens (defined in `@theme` — usable as Tailwind utilities)

| Token | Hex | Tailwind utility | Typical use |
|---|---|---|---|
| `--color-aurora-pink` | `#E84855` | `bg-aurora-pink` | Primary CTAs, player 1, danger |
| `--color-aurora-blue` | `#3185FC` | `bg-aurora-blue` | Player 2, primes, info |
| `--color-aurora-cyan` | `#4ECDC4` | `bg-aurora-cyan` | Twin primes, focus rings |
| `--color-aurora-green` | `#5FAD56` | `bg-aurora-green` | Player 3, Fibonacci, success |
| `--color-aurora-yellow` | `#FFE66D` | `bg-aurora-yellow` | Multiples of 10, gold/victory |
| `--color-aurora-orange` | `#F9A03F` | `bg-aurora-orange` | Player 4, perfect cubes |
| `--color-aurora-purple` | `#9B59B6` | `bg-aurora-purple` | Perfect squares, end-turn |

Each accent has a `-deep` variant (e.g. `--color-aurora-pink-deep`) used as the
"pressed edge" of tactile buttons. Background depths: `--color-void`,
`--color-nebula-deep/mid/light`. Text: `--color-text-primary/secondary/muted`
and `--color-text-on-light` for dark text on yellow surfaces.

Semantic square colors (`--color-prime`, `--color-twin-prime`, etc.) alias the
aurora palette — use these in board/rules contexts.

**Never hardcode palette hexes in components.** Player colors come from
`player.color` data (which is set from the same palette).

### Typography

- `--font-display` (**Bangers**): hero numerals, buttons, big display moments.
  Always add letter-spacing (~0.04em); class helpers do this for you.
- `--font-title` (**Lilita One**): friendly headings, the game title.
- `--font-body` (**Quicksand**): everything else.

Helpers: `.heading-hero`, `.heading-1`, `.heading-2`, `.big-number` (all fluid
via `clamp()`), `.label-caps` (small uppercase eyebrow labels),
`.text-gradient-pink|cyan|gold|rainbow`.

No element should ever fall back to default sans-serif.

## Surfaces

- `.glass-card` — standard panel (24px radius). Add `.glass-card-interactive`
  for hover lift on clickable cards.
- `.glass-strong` — more opaque variant.
- `.glass-inset` — recessed wells (input areas, stat boxes).
- `.modal-card` + `.modal-backdrop` — modal sheets and overlays.
- `.hud-panel` — immersive-mode HUD chips/panels (darker, less blur).
- `.minigame-backdrop` — full-screen minigame overlay.

Banned: white/light card backgrounds (`bg-white`, Tailwind `*-50/*-100` tints).
This is a dark-theme app; light feedback tints are expressed as translucent
token rgba (e.g. `rgba(95,173,86,0.15)` bg + `0.4` border).

## Buttons

`.btn` + a color: `.btn-pink|blue|cyan|green|purple|orange|yellow`.
Sizes: `.btn-sm` (44px), default (48px), `.btn-lg` (56px).
Quiet/secondary: `.btn-ghost`. Icon-only HUD: `.btn-icon` (44×44).

All are tactile "board-game piece" buttons: gradient face, solid deep-color
pressed edge, translateY press. Don't hand-roll button gradients/shadows.
`btn-yellow` automatically uses dark text.

## Layout & responsiveness

- Mobile-first. Cards: `w-full max-w-lg mx-auto p-4 sm:p-6`; tall content gets
  `max-h-[90dvh] overflow-y-auto`. Use `dvh`, not `vh`.
- Touch targets ≥44px. Grids that cramp at 375px: tighten gaps, never shrink
  buttons below 44px.
- Safe areas: `.hud-safe-top` / `.hud-safe-bottom` on immersive HUD edges.
- Below 640px, `backdrop-filter` is globally disabled (WebGL flicker) and glass
  surfaces switch to solid dark fills — defined once in index.css, don't
  re-implement per component.

## Motion

framer-motion throughout. Entry: fade + scale from 0.92–0.95 (never from 0),
springs ~stiffness 300–400 / damping 22–28. Quick interactions 150–200ms.
Decorative loops must respect `prefers-reduced-motion` (the CSS keyframe
helpers already do). Animation must never block interaction.

## Iconography

Inline stroke-based SVGs (24×24 viewBox) colored via `currentColor` or tokens.
Decorative emoji in chrome are banned; **player avatar emoji are data** and
always render as-is. Math symbols (√, ∛, ×) welcome as decoration.

## Accessibility

- `:focus-visible` shows a cyan outline globally — don't suppress it.
- Icon-only buttons need `aria-label` + `title`.
- WCAG AA contrast; don't rely on color alone.
