# Phera — Design System One-Pager · v2

> **Brand & UI reference** · phera.io · v2 · Updated 2026-06-30
> Single source of truth in code: [`lib/theme/tokens.ts`](../../lib/theme/tokens.ts) + [`lib/theme/m3-theme.ts`](../../lib/theme/m3-theme.ts)
> Print-ready PDF alongside this file: [`phera-design-system.pdf`](./phera-design-system.pdf)

---

## What Phera Is

**Phera is an AI wedding planner for Indian weddings — NRI-first.** One agent runs the whole platform by chat (soon WhatsApp + voice): guest list, RSVPs, rooms, shuttles, vendors, and the midnight WhatsApps. Phera does the work so the couple can focus on the celebration.

**What the brand should portray:** warm, calm, and capable — premium without being stiff, cultural without being kitsch. The visual system pairs an editorial italic serif (**Instrument Serif**) with a clean geometric sans (**Outfit**), anchored by a single confident pink on a warm-paper canvas.

---

## Taglines & Voice

| Use | Copy |
|-----|------|
| **Hero headline** | Your desi wedding, ~~minus the headaches.~~ — the strikethrough on "minus the headaches" is the signature hero treatment |
| **Hero sub-headline** | AI wedding planner that handles it all — guest lists, RSVPs, room assignments, vendors, transportation, and the midnight WhatsApp questions. |
| **One-liner pitch** | Indian weddings are beautiful chaos — 300+ guests, 3–5 days of events, people flying in from everywhere. Phera handles the guest logistics so you can focus on the celebration. |
| **SEO title** | Phera \| Indian Wedding Planning Platform |
| **SEO / OG description** | The modern Indian wedding platform. Manage RSVPs, coordinate travel, share events, and create beautiful wedding websites. Start free, add smart AI agents when you need them. |
| **Primary CTA** | Start free → |
| **Secondary CTA** | Try the live demo |

**Hero marquee** — the work Phera absorbs, set in serif italic, lotus-separated:

> *Save the dates · RSVPs · Dietary needs · Plus-ones · Flight numbers · Hotel blocks · Shuttle pickups · Dress codes · Visa walkthroughs · Vendor coordination · Cultural briefings · Day-of details*

---

## Logo & Logomark

The mark is a **lotus-flame** glyph — a lotus that reads as a flame, nodding to the sacred fire (*agni*) circled during the *phera* ritual. It locks up to the left of the **Phera** wordmark, set in the display serif; the logomark may stand alone as an app icon or avatar.

**Files in [`/public`](../../public):** `logo.svg` (white wordmark, for dark/photo backgrounds) · `logo-black.svg` (ink wordmark, for light) · `logo-lotus-flame-{black,white}.svg` + PNG @512 / @1024 (standalone glyph) · `logo-stacked.svg` (vertical lockup) · `logo-flower.svg` (decorative).

**Usage:** clear space ≈ glyph height; recolor only within ink `#1a1a1a` / white / brand-pink `#DE3F5E`; never stretch, rotate, or add effects/shadows.

---

## Color

All values are tokens in `lib/theme/tokens.ts` (`COLORS`). Never inline hex in app code.

### Brand

| Token | Hex | Use |
|-------|-----|-----|
| `brand.primary` | `#DE3F5E` | Primary actions, accents, **destructive actions** |
| `brand.primaryHover` | `#C8365A` | Hover / pressed pink |
| `brand.primaryDisabled` | `rgba(222,63,94,0.35)` | Disabled pink |
| `brand.primarySubtle` | `rgba(222,63,94,0.08)` | Subtle pink fill |
| `brand.primaryWash` | `rgba(222,63,94,0.04)` | Faintest pink wash |
| `brand.primaryBorder` | `rgba(222,63,94,0.18)` | Pink borders |

### Text

| Token | Hex | Use |
|-------|-----|-----|
| `text.strong` | `#1a1a1a` | Headings, ink |
| `text.muted` | `#4a4a4a` | Body copy |
| `text.subtle` | `#6a6a6a` | Captions, labels |
| `text.faint` | `#9a9a9a` | Hints, meta |
| `text.placeholder` | `#C2C2C2` | Input placeholder |
| `text.inverse` | `#ffffff` | Text on dark / pink |

### Backgrounds & Borders

| Token | Hex | Use |
|-------|-----|-----|
| `bg.white` | `#ffffff` | Base surface |
| `bg.muted` | `#FAFAFA` | Subtle fill |
| `bg.subtle` | `#F8F8F8` | Section background |
| `bg.wash` | `rgba(0,0,0,0.03)` | Hover wash |
| `bg.paper` | `#FBF7F1` | Warm "paper" canvas (textured sections) |
| `border.faint` | `rgba(0,0,0,0.06)` | Faintest divider (table rows) |
| `border.light` | `rgba(0,0,0,0.08)` | Light divider / card border |
| `border.default` | `rgba(0,0,0,0.15)` | Default border |
| `border.strong` | `rgba(0,0,0,0.23)` | Input borders |

> **Backgrounds are always light** (white, `#FAFAFA`, `#F8F8F8`, or paper). Never use dark/black backgrounds for new app components. (Landing-only dark canvas vars exist in `app/landing-design.css`: `--cream #F7F1E8`, `--cream-warm #F4EBDB`, `--ink-deep #0E0B12`, `--ink-warm #1F1518`.)

### Status / Semantic

| Token | Hex | Token | Hex |
|-------|-----|-------|-----|
| `accent.success` | `#10B981` | `accent.successBg` / `successText` | `#E8F5E9` / `#2E7D32` |
| `accent.warning` | `#F59E0B` | `accent.warningBg` / `warningText` | `#FFF3E0` / `#E65100` |
| `accent.danger` | `#EF4444` | `accent.dangerBg` / `dangerText` | `#FFEBEE` / `#C62828` |
| `accent.info` | `#3B82F6` | `accent.infoBg` / `infoText` | `rgba(59,130,246,0.08)` / `#1d4ed8` |

> **Danger red is for status indicators only** (e.g. "Not Attending" dots) — **never for buttons**. Destructive actions use brand pink.

### Cultural Accents & Wedding-Side Coding

| Token | Hex | Token | Hex | Side | Hex |
|-------|-----|-------|-----|------|-----|
| `cultural.gold` | `#D4AF37` | `cultural.coral` | `#FF6B6B` | Bride | `#DE3F5E` (pink) |
| `cultural.saffron` | `#FF9933` | `cultural.teal` | `#20C997` | Groom | `#3b82f6` (blue) |
| `cultural.maroon` | `#800020` | `cultural.purple` | `#6C5CE7` | Both | `#8b5cf6` (purple) |
| `cultural.champagne` | `#D1B99F` | | | | |

> A brand-accurate **WhatsApp palette** (`COLORS.whatsapp`) also exists — used *only* in the WhatsApp message-preview mockup so it looks true to what guests see.

---

## Typography

Only **two** font families. Work Sans is dead — do not reintroduce.

| Family | Token | Where | Weights |
|--------|-------|-------|---------|
| **Instrument Serif** | `FONTS.display` | Everything **≥ 2rem** (h1–h3), usually *italic* | 400 |
| **Outfit** | `FONTS.body` | Everything **< 2rem** — body, labels, buttons | 200–600 |

**Rule:** any size ≥ `2rem` (`DISPLAY_SIZE_THRESHOLD_REM`) uses the display serif; below that, Outfit. **14px (0.875rem) is the absolute minimum** for readable text. Use **variants, not inline `fontSize`** — inline `fontSize`/`fontWeight` on a Typography variant is a code smell.

### Type Scale (`TEXT`)

| Token | rem / px | Role | Token | rem / px | Role |
|-------|----------|------|-------|----------|------|
| `sm` | 0.875 / 14 | Floor — body, labels, captions | `2xl` | 1.5 / 24 | Medium headings (Outfit) |
| `base` | 1 / 16 | Default body | `3xl` | 2.0 / 32 | **Switch to Instrument Serif** |
| `lg` | 1.125 / 18 | Emphasised body | `4xl` | 2.5 / 40 | Display |
| `xl` | 1.25 / 20 | Small headings (Outfit) | `5xl` | 3.0 / 48 | Display |

### MUI Variants (`lib/theme/m3-theme.ts`)

- **h1 / h2 / h3** — Instrument Serif 400, *italic*, responsive (h1 up to 4.5rem).
- **h4 / h5 / h6** — Outfit 600.
- **body1** (16→18px) / **body2** (14→16px, the floor) — Outfit 400.
- **subtitleCaps** — Outfit 600, uppercase, `letter-spacing 0.08em` (eyebrow labels).
- **button** — Outfit 500, `textTransform: none`.

---

## Radii, Shadows, Layout & Motion

| Radius (`RADII`) | Value | Use | | Shadow (`SHADOWS`) | Value |
|------|-------|-----|---|------|-------|
| `sm` | 8px | Small elements | | `card` | `0 1px 2px rgba(0,0,0,0.04)` |
| `md` | **12px** | Buttons, inputs, small cards (admin default) | | `popover` | `0 8px 24px rgba(0,0,0,0.08)` |
| `lg` | 16px | Feature cards | | `dialog` | `0 8px 32px rgba(0,0,0,0.08)` |
| `xl` | 20px | Hero / highlight cards | | | |
| `cta` / `dialog` | 24px | Mobile guest CTAs · modals / popovers | | | |
| `pill` | 999px | Pills, landing/guest CTA buttons | | | |

**Layout (`SECTION`):** vertical padding `80px` (xs) → `140px` (md); container max-width `1280px`; side padding `20px` → `32px`.
**Motion (`TRANSITIONS`):** `fast 0.15s` · `default 0.2s` · `slow 0.3s`, all `ease`.
**Input focus:** 2px brand-pink ring (`INPUT_FOCUS_BORDER`).

---

## Components — Shared Primitives

Use the wrappers in `components/shared/` and `components/admin/` over raw MUI. If a primitive doesn't exist for your need, **add it to `components/shared/` first**, then use it.

| Need | Primitive | Notes |
|------|-----------|-------|
| Alerts | `InfoAlert` / `SuccessAlert` / `WarningAlert` / `ErrorAlert` | from `components/shared/Alert`; `onClose` for dismissible |
| Buttons | `PrimaryActionButton` / `SecondaryActionButton` / `IconActionButton` | from `components/admin/ActionButton` |
| Menus | `PheraMenu` / `PheraMenuItem` | white bg, dark text — never raw MUI `Menu` |
| Text inputs | `PheraTextField` | white bg, visible border, dark label/value, 2px pink focus |
| Cards | `PheraCard` | `variant="default \| muted \| feature \| hero"` |
| Headings | `PageHeading` / `SectionHeading` | replaces the repeated `h6 + body2` opener |
| Empty / stat | `EmptyState` · `StatCard` | icon + title + subtitle + action · icon + value + label |
| Chips | `PheraChip` | `tone="neutral \| brand \| success \| warning \| danger \| info \| side-bride \| side-groom \| side-both"` |
| Dialogs | `PheraDialog` / `PheraDialogTitle` | serif title + optional close button |
| Switches | `PheraSwitch` | off = neutral track, on = brand-pink track |

**Buttons:** admin radius `12px`; landing/guest CTAs `999px` pill; `textTransform: none` always; destructive = brand pink, never red.
**Inputs:** white bg, visible border (`border.strong`), dark label (`text.muted`, weight 500), dark value (`text.strong`), 2px pink focus ring; always vertically center text in fixed-height inputs.

---

## Golden Rules (for any UI work)

1. **Tokens are the source of truth** — all colors/radii/fonts/shadows from `@/lib/theme/tokens`. Never inline hex, raw rgba, or magic radii/shadows.
2. **Shared primitives over raw MUI** — see the table above; add to `components/shared/` before inlining.
3. **Typography = variants, not inline `fontSize`.** 14px is the floor.
4. **Only two fonts** — Outfit (< 2rem), Instrument Serif (≥ 2rem).
5. **Radii** — buttons/inputs 12px; modals/popovers 24px; mobile guest CTAs 24px/pill.
6. **Canonical colors** — brand pink `#DE3F5E`, hover `#C8365A`. Destructive = pink, never red. Backgrounds always light.
7. **Ask when inventing a new pattern** — there's likely an existing example to match.

---

*Reference: `lib/theme/tokens.ts` (COLORS, RADII, FONTS, TEXT, SHADOWS) · `lib/theme/m3-theme.ts` (MUI theme + variants) · `lib/constants/form-styles.ts` (shared SX) · `components/shared/` (primitives) · `app/landing-design.css` (landing CSS vars).*
