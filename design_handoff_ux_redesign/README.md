# Handoff: WarTracker UX Redesign

## Overview

This is a usability-focused redesign of the WarTracker web app
(https://xalgarra.github.io/wartracker — repo `xalgarra/wartracker`,
master branch). The current production app works but is held back by:

- An 8-tab horizontal-scroll navigation that hides half the surface area on mobile
- A dashboard that only surfaces *one* active mini, forcing scroll to triage the rest
- A status switcher that lives behind an unaffordant badge tap
- A 12-field "add mini" modal that fires on the FAB
- A "terminal voice" (mono labels prefixed with `//`, uppercase mono CTAs) that hurts readability without adding value
- An ambiguous FAB whose action depends on which tab is open

The redesign keeps the brand DNA (the OKLCH-based status ramp, the
warm amber accent, the dual light/dark system) and rebuilds the
**navigation, dashboard, add-mini flow, and mini-detail screen**
around clearer user intentions.

**This handoff is for re-implementing those four redesigned surfaces
in the live `xalgarra/wartracker` codebase.**

---

## About the Design Files

The files in `prototype/` are **design references created in HTML**
— interactive React prototypes showing intended look and behavior.
They are **not production code to copy directly**.

The target codebase is:

- **Stack:** Vite + vanilla JavaScript (ES modules, no framework) + Supabase
- **Module structure:** `src/main.js` global listeners, `src/init.js` tab routing, per-tab modules (`home.js`, `minis.js`, `paints.js`, …)
- **State:** a single mutable `state` object in `src/state.js`, no reactivity, manual re-render
- **Events:** delegation via `data-action` attributes on a root container — NO `window.*` globals
- **CSS:** plain CSS variables in `css/base.css` (light + dark theme tokens), per-view files in `css/views/*.css`
- **Comments + code in Spanish** to match the existing repo's conventions

**Recreate the prototype's look and behavior in vanilla JS, following
the codebase's existing patterns.** Don't introduce React, build steps,
or new dependencies. New CSS goes in `css/views/home.css` (or a new
file `css/views/quickadd.css` for the add sheet). New JS goes in
existing modules where it logically belongs.

The CLAUDE.md at the repo root spells out the development rules — minimal
changes, no refactors, no abstractions unless explicitly requested. Follow it.

---

## Fidelity

**High-fidelity.** The prototype uses final colors, typography, spacing,
border radii, and shadows from the existing design system (the same
tokens already in `css/base.css`). Recreate the visual treatment
pixel-by-pixel; only adapt the **DOM structure** to fit how the existing
code mounts/renders views.

The redesign also **softens the dark mode**: body type switches from
Space Grotesk → Inter, mono is reserved for numerics only, and the
`//` / `▸` prefixes are removed from chrome. See the "Voice" section below.

---

## What's changing — the four surfaces

### 1. Navigation: 8 tabs → 4 tabs + central FAB

**Current** (in `index.html`, the `.tabs` strip):

```
Inicio · Colección · Estadísticas · Wishlist · Pinturas · Listas · Recetas · Pareja
```

**After:**

```
Hoy · Colección · [＋] · Pinturas · Más
```

- "Inicio" is renamed **"Hoy"** to reflect its new purpose (action bandeja, not summary)
- **Estadísticas, Wishlist, Listas, Recetas, Pareja** are demoted to a
  **"Más" screen** — a single full-screen list of secondary destinations
- The bottom nav is **fixed** with 4 items + a 56px central **FAB**.
  44px hit targets on the labelled items.
- The bottom nav has a `backdrop-filter: blur(20px)` translucent background

**Implementation notes:**

- Replace the current top `.tabs-outer` markup with a `<nav class="bottom-nav">` rendered as the **last** child of `#app-screen` (so it sits above content but below modals)
- Add CSS `padding-bottom: 88px` to `#app-screen` so content doesn't hide behind it
- The header (`.header`) stays at the top but loses the sticky tab strip below it — Hoy/Colección/Más have their own `<h1>` titles inside the view content area
- Hide the original `.tabs-outer` rather than delete it — useful to compare during testing. Set `style="display:none"` and clean up once shipped.
- `cambiarTab()` in `src/init.js` keeps working with the same string tab IDs (`'hoy'` replaces `'home'`); just add a `'mas'` case that shows the new Más screen

### 2. Hoy (was Inicio) — Dashboard rebuild

**Current behaviour:** Hero card shows one prioritized mini (status pintando > imprimada > montada > comprada). Below: summary strip + "por juego" + "en cola" list.

**New behaviour:**

1. **Hero card** (top) — same single prioritized mini, but **softened**:
   - Padding 16/18/18, radius 18px, single linear gradient (no radial overlay layered)
   - Title 22px (was 30px) — gives more vertical room to the rest
   - CTA is full-width `Continuar pintando →` button, 13px tall, white bg / dark text
   - Removes the "cambiar a:" status pills underneath (those move to the mini detail page)
2. **"También en curso · N"** — horizontal scroll-snapping carousel
   of all other minis with status pintando/imprimada/montada. Each card:
   - 140px wide × auto height
   - Photo thumbnail (1:1) with status pill in top-right corner
   - Mini name, faction (mono 10px), 3px progress bar
3. **"Plan de la semana"** — a card with 3 rows:
   - **Iniciar sesión de hobby** (ok-green icon) — opens existing session-modal
   - **N minis sin imprimar** (warn-amber icon) — links to Colección filtered by `status=montada`
   - **Te quedan N potes sin stock** (info-blue icon) — links to Pinturas filtered by stock=0
   - Each row: 36px circular tinted icon, title 13/600, desc 11/regular grey, › chevron

Files to edit:
- `src/home.js` — replace `renderHero()` and `renderQueue()` logic with the new carousel
- `css/views/home.css` — replace `.home-hero` block, add `.r-hscroll`, `.r-mini-card`, `.r-plan` selectors (rename to `.home-*` to match codebase convention)
- The summary strip and "por juego" block can stay roughly as-is **but should move below the plan card**, not above it

### 3. Quick Add — FAB opens a 2-step bottom sheet

**Current behaviour:** Tap FAB → full-screen modal with 12 fields all visible at once.

**New behaviour:** Tap FAB → bottom sheet slides up with:

**Step 1: "What are you adding?"** — 3 option rows:
- **Mini** (icon 🛡) — _"Una unidad o caja a tu colección"_
- **Pintura** (icon 🎨) — _"Un pote nuevo al rack"_
- **Sesión de hobby** (icon ⏱) — _"Registra cuánto y qué pintaste"_

**Step 2 (mini path): Search**
- Auto-focused input with placeholder *"Intercessors, Redemptor…"*
- Live results list from `state.unitMap` filtered by name match
- Each result: name, faction · game, points

**Step 3 (mini path): Confirm**
- Title = selected unit name
- Two read-only fields: Facción, Puntos
- One editable: **Cajas** (stepper, default 1)
- **Estado inicial** — horizontal-scroll chip row (comprada / montada / imprimada / pintando / pintada), default `comprada`
- Primary CTA: **Guardar** (dark button or amber in dark mode)
- Secondary: **"Añadir más detalles después"** — saves + opens full mini-modal for the rest

**Implementation notes:**

- Build as a new `<div class="quick-add-sheet">` mounted at the end of `<body>` (sibling to existing modals)
- Use a `data-step` attribute on the sheet (`pick` / `mini-search` / `mini-confirm`) and CSS to swap content; don't tear down/rebuild
- Backdrop: `rgba(0,0,0,0.5)` full-screen
- Sheet itself: `border-radius: 22px 22px 0 0`, `padding: 14px 18px 32px`, slides up from bottom on open (`transform: translateY(100%)` → `translateY(0)`, 200ms ease-out)
- A 36×4 grey "grabber" bar sits centered at top
- Save calls existing `guardarMini()` with reduced field set (game, faction, name from unit, qty, status)
- The full mini-modal (12-field) is **kept** for editing existing minis and for power-users — just stops being the default add UX

### 4. Mini Detail — Status switcher becomes the centerpiece

**Current behaviour:** Opening a card shows the same full edit modal (12 fields). Status changes via a small status-picker popup.

**New behaviour:** Opening a card opens a **full-screen detail view** (not a modal). The view has:

1. **Header bar**: back ‹ + ⋯ actions (right). Both 36×36px circular ghost buttons.
2. **Hero image**: 16:11 ratio, photo or gradient placeholder, with bottom overlay containing mini name (24/700) + faction · game (13/regular)
3. **🟢 Status switcher** (the redesign's centerpiece): a card containing
   - Label: "Estado"
   - 5-step rail with circles (30px each), connected line behind, line filled green to current step
   - Done steps: green circle with ✓
   - Current step: amber circle (dark mode) / dark circle (light mode), 4px halo
   - Future steps: outlined empty circle with the step number
   - Two CTA buttons below: **← `<prev label>`** and **`<next label>` →** (sized 1fr each)
4. **3-cell stat strip**: cajas · modelos · pts (large mono numerics, small uppercase labels)
5. **"Pinturas en uso"**: horizontal chip row with color dots
6. **"Notas"**: simple card with the freeform text

**Implementation notes:**

- This is **a new view** (`<div id="vista-mini-detail">`) in `index.html`, hidden by default. `cambiarTab()` doesn't manage it — show via `abrirDetalleMini(id)` from `minis.js` instead.
- Status changes call existing `cambiarStatusRapido()` which already handles the DB update + state.minisFull invalidation
- Back button restores `state.tabActual` to whatever was active before

---

## Voice changes — softened, not destroyed

| Surface | Before | After |
|---|---|---|
| Dark body font | Space Grotesk | **Inter** (matches light) |
| Field labels (dark) | `// nombre` | `Nombre` |
| Modal eyebrow (dark) | `▸ nuevo registro` | (removed) |
| Primary CTA (dark) | `▸ GUARDAR` (uppercase mono) | `Guardar` (sentence case, Inter 600) |
| Numerics (counts, pts, %) | Mono | **Stays mono** (this is the only place mono stays) |
| Amber accent on links/CTAs/focus rings | Yes | **Stays** — this is the brand |

The terminal vibe is removed from **language**; the amber + warm-black
surfaces + status ramp **remain** the visual signature.

---

## Design Tokens

All tokens are already in `css/base.css`. Don't add new ones — reuse:

### Colors

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#fafaf8` | `#14110d` |
| `--surface` | `#ffffff` | `#1a160f` |
| `--subtle` | `#f3f2ee` | `#2a251c` |
| `--text` | `#1a1a1c` | `#e8e4dc` |
| `--text-2` | `#555550` | `#c8bfa8` |
| `--text-3` | `#888884` | `#a09684` |
| `--text-4` | `#aaa8a3` | `#7a7060` |
| `--border` | `#ececea` | `#2a251c` |
| `--accent` | `#1a1a1c` | `oklch(0.80 0.17 65)` (amber) |

### Status ramp (drives all lifecycle encoding — pills, dots, progress segments)

| Status | Hue | Light bg/text | Dark bg/text |
|---|---|---|---|
| Comprada | grey | `#f3f2ee` / `#6a6a64` | `#2a251c` / `#a09684` |
| Montada | 60 (warm yellow) | `oklch(0.95 0.04 60)` / `oklch(0.45 0.10 60)` | `oklch(0.32 0.08 60)` / `oklch(0.82 0.13 60)` |
| Imprimada | 240 (cool blue) | `oklch(0.95 0.03 240)` / `oklch(0.45 0.10 240)` | `oklch(0.30 0.08 240)` / `oklch(0.82 0.12 240)` |
| Pintando | 305 (violet) | `oklch(0.94 0.04 305)` / `oklch(0.45 0.12 305)` | `oklch(0.32 0.10 305)` / `oklch(0.84 0.13 305)` |
| Pintada | 145 (green) | `oklch(0.94 0.05 145)` / `oklch(0.40 0.13 145)` | `oklch(0.42 0.15 145)` / `oklch(0.96 0.08 145)` |

Dark-mode Pintada pill keeps its `0 0 10px oklch(0.5 0.15 145 / 0.35)` green glow.

### Spacing scale

`4 · 6 · 8 · 12 · 16 · 20 · 24 · 32` px. Most gaps are 6–12, card padding 12–18, view padding 14–24.

### Radii (post-redesign — dark gets gentler radii to soften the terminal feel)

| Element | Light | Dark |
|---|---|---|
| Tag/badge | 4px or pill (999px for pills) | pill (999px) |
| Input | 10px | **10px** (was 3px) |
| Card | 12-14px | **14px** (was 0) |
| Modal/sheet | 16-22px | **16px** (was 4px) |
| FAB | circle | circle |

### Typography

| Role | Family | Size | Weight | Tracking |
|---|---|---|---|---|
| Display | Inter (both modes) | 24-30px | 700 (light), 600 (dark) | -0.02em to -0.025em |
| H1 / topbar title | Inter | 22-26px | 700 (light) / 600 (dark) | -0.025em |
| H2 / sheet title | Inter | 17-20px | 600 / 700 | -0.01em to -0.02em |
| Body | Inter | 13px | 400 | 0 |
| Caption | Inter | 11px | 400 | 0 |
| Section header | Inter | 11-13px | 600 | uppercase, 0.04em-0.08em |
| Eyebrow | Inter (not Mono anymore) | 11px | 500 | 0 |
| Numerics ONLY | JetBrains Mono | 10-16px | 400-600 | 0 |

Font URLs (Google Fonts, already loaded by `index.html`):
- Inter 400 / 500 / 600 / 700
- JetBrains Mono 400 / 500
- Space Grotesk — can be **removed** from the import after redesign ships

### Animations

- All hover/color transitions: `0.12s ease`
- Press scale: `transform: scale(0.94)` on FAB / `scale(0.97)` on cards / `scale(0.99)` on primary buttons
- Bottom sheet slide-in: `transform: translateY(100%)` → `translateY(0)`, 200ms ease-out
- Status rail line fill: `width` transition 300ms ease

---

## Files

The interactive prototype lives in `prototype/`:

- `prototype/WarTracker Redesign.html` — entry point, open in a browser
- `prototype/styles.css` — all redesign CSS (already imports `../tokens/colors_and_type.css`)
- `prototype/screens.jsx` — `BottomNav`, `HoyScreen`, `MiniDetail`, `QuickAddSheet`
- `prototype/PrototypeApp.jsx` — wires the screens together with shared state
- `prototype/diagnosis.jsx` — the 6 diagnostic tiles + sitemap diagram
- `prototype/App.jsx` — Design Canvas wrapper for presentation
- `prototype/design-canvas.jsx`, `prototype/ios-frame.jsx` — helper components for the presentation frames; **not part of the implementation**

The tokens file is a flat copy of the design system's master tokens:

- `tokens/colors_and_type.css` — light + dark CSS custom properties, identical
  to what's already in the target codebase's `css/base.css`. Provided for
  reference only — don't copy this file in, the target repo already has them.

## Order of implementation (suggested)

1. **Bottom nav** — biggest IA win, smallest blast radius. Hide old tabs, add new nav, test all 4 destinations + Más drawer
2. **Hoy (dashboard) rebuild** — visible win on app launch
3. **Mini detail view** — unblocks the status switcher; this is the most-used action
4. **Quick Add sheet** — replaces the FAB default; the old full modal stays accessible for power use

## Out of scope for this handoff

- Onboarding / empty states
- Colección redesign (filters/sort UX) — needs its own pass
- Pinturas redesign (camera scan / color search flows) — needs its own pass
- Listas / Recetas / Pareja — all live under Más, no UI changes
- Animations beyond the basics listed above
- Offline behavior, error states, list importer modal

## Open questions for the implementer

1. **Hero card behavior when there's nothing in progress** — currently shows a "Sin proyectos activos" empty state with a "Crear proyecto" CTA. Keep that or change it to "Pick a mini from your collection" linking to Colección?
2. **The carousel on Hoy** — should it scroll-snap (current prototype behaviour) or free-scroll? Both have ergonomic tradeoffs on iOS Safari.
3. **The "Más" screen** — current prototype shows it as a list. Should "Ajustes" (theme / export / logout) live there too, replacing the header buttons? Would clean up the header significantly.
