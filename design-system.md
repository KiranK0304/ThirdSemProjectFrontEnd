# Hirely — design system reference

For AI coding assistants and contributors implementing the monochrome & amber
theme. Colors live in `theme.css` — this file covers everything else needed
for consistent implementation.

## Typography

- Headings, job titles, hero text: **Fraunces** (serif) — carries the
  premium/editorial feel that amber alone can't.
- Body, UI chrome, buttons, nav: **Inter** — neutral, doesn't compete with
  the serif.
- Two weights only per family, ever: 400 and 500. No bold (700) — it reads
  heavy against this palette.

| Role | Font | Size / line-height | Weight |
|---|---|---|---|
| h1 | Fraunces | 32px / 1.2 | 500 |
| h2 | Fraunces | 24px / 1.3 | 500 |
| h3 | Inter | 18px / 1.4 | 500 |
| Body | Inter | 15px / 1.6 | 400 |
| Caption / meta | Inter | 13px / 1.4 | 400, `--color-text-secondary` |

## Spacing scale

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (px). Component-internal padding uses
the small end (8–16); section and page rhythm uses the large end (32–64).
Don't invent one-off values outside this scale.

## Radius & elevation

- Buttons, inputs, tags → `--radius-sm` (8px)
- Cards, modals → `--radius-md` (12px)
- Shadow → `--shadow-card` only. Flat everywhere else — no shadows on
  buttons or tags.

## Components

### Button

| Variant | Background | Text | Border | Use for |
|---|---|---|---|---|
| Primary | `--color-accent` | white | none | one per screen — apply, submit, save |
| Secondary | transparent | `--color-text-primary` | 1px solid `--color-text-primary` | sign in, cancel |
| Ghost | transparent | `--color-text-secondary` | none | tertiary actions, icon buttons |

States: hover → `--color-accent-hover` (primary) or `--color-surface-muted`
background (secondary/ghost). Active → `scale(0.98)`. Focus → 2px ring,
`--color-accent` at 30% opacity. Disabled → 50% opacity, no pointer events.

### Card

White surface, 0.5px `--color-border`, `--radius-md`, 20px padding,
`--shadow-card`. If clickable, hover → border becomes
`--color-border-strong`.

### Tag / badge

4px 10px padding, `--radius-sm`, 12px text.
- Neutral (remote, full-time): `--color-surface-muted` bg, `--color-text-secondary` text.
- Amber highlight (salary, "new"): `--color-accent-subtle` bg, `--color-accent-subtle-text` text.
- Status (application state): reuse the success/danger/warning subtle pairs from `theme.css`.

### Input

36px height, 1px `--color-border`, `--radius-sm`, 8–12px horizontal padding.
Focus → border becomes `--color-accent`, 2px ring at 20% opacity. Error →
border becomes `--color-danger`, 13px helper text below in the same color.

### Avatar

44px, `--radius-sm` for the square variant (or full circle for people),
`--color-surface-muted` background, initials in `--color-text-primary`
weight 500.

## Icons

Outline-style only (e.g. Tabler outline set), 16–20px inline, inherit
`currentColor`. No filled icon variants — breaks the monochrome discipline.

## Rules an implementing model should not break

1. Amber appears on **at most one** primary action per screen — everything
   else stays neutral gray/black/white.
2. No gradients, no colored shadows, no decorative use of color.
3. Fraunces is for headings only — never body text, never inside buttons.
4. Status colors (success/danger/warning) are reserved for real state, not
   used decoratively.
