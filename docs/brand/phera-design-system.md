# Phera — Design System One-Pager

> **Brand & UI reference** · phera.io · Updated 2026-06-22
> Single source of truth in code: [`lib/theme/tokens.ts`](../../lib/theme/tokens.ts) + [`lib/theme/m3-theme.ts`](../../lib/theme/m3-theme.ts)
> A print-ready PDF of this document lives alongside it: [`phera-design-system.pdf`](./phera-design-system.pdf)

---

## Brand

**Indian weddings are beautiful chaos. Phera handles the guest logistics so you can focus on the celebration.**

Phera is an Indian-wedding guest-logistics platform. The brand voice is warm, calm, and capable — premium without being stiff, cultural without being kitsch. The visual system pairs an editorial italic serif (**Instrument Serif**) with a clean geometric sans (**Outfit**), anchored by a single confident pink and a warm-paper canvas.

---

## Taglines & Voice

| Use | Copy |
|-----|------|
| **Hero headline** | Your desi wedding, ~~minus the headaches.~~ (the strikethrough on "minus the headaches" is the signature hero treatment) |
| **One-liner pitch** | Indian weddings are beautiful chaos — 300+ guests, 3–5 days of events, people flying in from everywhere. Phera handles the guest logistics so you can focus on the celebration. |
| **Product sub-headline** | One AI wedding planner that runs it all — just talk to it. Guest list, RSVPs, rooms, shuttles, vendors, and the midnight WhatsApps, handled by chat or voice. |
| **SEO title** | Phera \| Indian Wedding Planning Platform |
| **SEO / OG description** | The modern Indian wedding platform. Manage RSVPs, coordinate travel, share events, and create beautiful wedding websites. Start free, add smart AI agents when you need them. |
| **Primary CTA** | Get started — it's free |
| **Secondary CTA** | View Demo |

**Hero marquee** — the work Phera absorbs, set in serif italic, separated by lotus glyphs:

> *Save the dates · RSVPs · Dietary needs · Plus-ones · Flight numbers · Hotel blocks · Shuttle pickups · Dress codes · Visa walkthroughs · Vendor coordination · Cultural briefings · Day-of details*

---

## Logo & Logomark

The mark is a **lotus-flame** glyph — a lotus that reads as a flame, nodding to the sacred fire (*agni*) circled during the *phera* ritual. It locks up to the left of the **Phera** wordmark, set in the display serif. The logomark may stand alone as an app icon or avatar.

**Variants** (all in [`/public`](../../public)):

| File | Use |
|------|-----|
| `logo.svg` | Full wordmark, white fill (for dark/photo backgrounds) |
| `logo-black.svg` | Full wordmark, ink `#1a1a1a` (for light backgrounds) |
| `logo-lotus-flame-black.svg` / `-white.svg` | Standalone logomark (glyph only) |
| `logo-lotus-flame-{black,white}-512.png` / `-1024.png` | Raster logomark @512 / @1024 |
| `logo-stacked.svg` | Vertical lockup |
| `logo-flower.svg` | Decorative floral variant |
| `Phera Logomark.jpg` | Raster logomark |

**Usage rules:** Clear space ≈ glyph height. Only recolor within **ink `#1a1a1a` / white / brand-pink `#DE3F5E`**. Never stretch, rotate, or add effects/shadows to the mark.

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
| `text.inverse` | `#ffffff` | Text on dark/pink |

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

> **Backgrounds are always light** (white, `#FAFAFA`, `#F8F8F8`, or paper). Never use dark/black backgrounds for new components.

Additional landing-only canvas vars: `--cream #F7F1E8`, `--cream-warm #F4EBDB`, `--ink-deep #0E0B12`, `--ink-warm #1F1518`.

### Status / Semantic

| Token | Hex | Token | Hex |
|-------|-----|-------|-----|
| `accent.success` | `#10B981` | `accent.successBg` / `successText` | `#E8F5E9` / `#2E7D32` |
| `accent.warning` | `#F59E0B` | `accent.warningBg` / `warningText` | `#FFF3E0` / `#E65100` |
| `accent.danger` | `#EF4444` | `accent.dangerBg` / `dangerText` | `#FFEBEE` / `#C62828` |
| `accent.info` | `#3B82F6` | `accent.infoBg` / `infoText` | `rgba(59,130,246,0.08)` / `#1d4ed8` |

> **Danger red is for status indicators only** (e.g. "Not Attending" dots) — **never for buttons**. Destructive actions use brand pink.

### Cultural Accents

| Token | Hex | Token | Hex |
|-------|-----|-------|-----|
| `cultural.gold` | `#D4AF37` | `cultural.coral` | `#FF6B6B` |
| `cultural.saffron` | `#FF9933` | `cultural.teal` | `#20C997` |
| `cultural.maroon` | `#800020` | `cultural.purple` | `#6C5CE7` |
| `cultural.champagne` | `#D1B99F` | | |

### Wedding-Side Coding

| Side | Hex |
|------|-----|
| Bride | `#DE3F5E` (brand pink) |
| Groom | `#3b82f6` (blue) |
| Both | `#8b5cf6` (purple) |

### WhatsApp Preview Palette

Used **only** in the WhatsApp message-preview mockup so it looks true to what guests see: `whatsapp.bg #EFE7DE`, `bubble #DCF8C6`, `headerDark #202C33`, `bubbleText #0b141a`, `timestampText #667781`, `verifiedBlue #2979FF`, `readCheck #53bdeb`.

---

## Typography

Only **two** font families. Work Sans is dead — do not reintroduce.

| Family | Token | Where | Weights |
|--------|-------|-------|---------|
| **Instrument Serif** | `FONTS.display` (`var(--font-instrument-serif)`) | Everything **≥ 2rem** (h1–h3), usually *italic* | 400 |
| **Outfit** | `FONTS.body` (`var(--font-outfit)`) | Everything **< 2rem** — body, labels, buttons | 200, 300, 400, 500, 600 |

**Rule:** any size ≥ `2rem` (`DISPLAY_SIZE_THRESHOLD_REM`) uses the display serif; below that, Outfit. **14px (0.875rem) is the absolute minimum** for readable text.

### Type Scale (`TEXT`)

| Token | rem | px | Role |
|-------|-----|----|------|
| `sm` | 0.875 | 14 | Floor — body, labels, captions |
| `base` | 1 | 16 | Default body |
| `lg` | 1.125 | 18 | Emphasised body |
| `xl` | 1.25 | 20 | Small headings (Outfit) |
| `2xl` | 1.5 | 24 | Medium headings (Outfit) |
| `3xl` | 2.0 | 32 | **Switch to Instrument Serif** |
| `4xl` | 2.5 | 40 | Display |
| `5xl` | 3.0 | 48 | Display |

### MUI Variants (`lib/theme/m3-theme.ts`)

- **h1 / h2 / h3** — Instrument Serif, weight 400, *italic*, responsive (h1 up to 4.5rem).
- **h4 / h5 / h6** — Outfit, weight 600.
- **body1** (16→18px) / **body2** (14→16px) — Outfit 400. `body2` is the 14px floor.
- **body3 / body4** — Outfit 400, dense body variants (14px floor).
- **subtitle1 / subtitle2** — Outfit 600.
- **subtitleCaps** — Outfit 600, uppercase, `letter-spacing 0.08em` (eyebrow labels).
- **caption / overline** — Outfit, 14px floor.
- **button** — Outfit 500, `textTransform: none`.

> Use **variants, not inline `fontSize`**. Inline `fontSize`/`fontWeight` overrides on a Typography variant are a code smell.

---

## Radii (`RADII`)

| Token | Value | Use |
|-------|-------|-----|
| `sm` | 8px | Small elements |
| `md` | **12px** | Buttons, inputs, small cards (admin default) |
| `lg` | 16px | Feature cards |
| `xl` | 20px | Hero / highlight cards |
| `cta` | 24px | Pronounced CTAs (mobile guest "View Details", "RSVP") |
| `dialog` | 24px | Modals / popovers |
| `pill` | 999px | Pills, landing/guest CTA buttons |

---

## Shadows (`SHADOWS`)

| Token | Value |
|-------|-------|
| `none` | `none` |
| `card` | `0 1px 2px rgba(0,0,0,0.04)` |
| `popover` | `0 8px 24px rgba(0,0,0,0.08)` |
| `dialog` | `0 8px 32px rgba(0,0,0,0.08)` |

---

## Layout & Motion

**Section layout (`SECTION`):** vertical padding `80px` (xs) → `140px` (md); container max-width `1280px`; side padding `20px` (xs) → `32px` (md).

**Transitions (`TRANSITIONS`):** `fast 0.15s ease` · `default 0.2s ease` · `slow 0.3s ease`.

**Input focus:** 2px brand-pink ring (`INPUT_FOCUS_BORDER` → `borderColor #DE3F5E`, `borderWidth 2px`).

---

## Components — Shared Primitives

Use the wrappers in `components/shared/` and `components/admin/` over raw MUI. If a primitive doesn't exist for your need, **add it to `components/shared/` first**, then use it.

| Need | Primitive | Notes |
|------|-----------|-------|
| Alerts | `InfoAlert` / `SuccessAlert` / `WarningAlert` / `ErrorAlert` | from `components/shared/Alert`; `onClose` for dismissible |
| Buttons | `PrimaryActionButton` / `SecondaryActionButton` / `IconActionButton` | from `components/admin/ActionButton` |
| Menus | `PheraMenu` / `PheraMenuItem` | white bg, dark text — never raw MUI `Menu` |
| Text inputs | `PheraTextField` | white bg, visible border, dark label/value, 2px pink focus |
| Cards | `PheraCard` | `variant="default" \| "muted" \| "feature" \| "hero"` |
| Headings | `PageHeading` / `SectionHeading` | replaces the repeated `h6 + body2` opener |
| Empty states | `EmptyState` | icon + title + subtitle + action |
| Stat cards | `StatCard` | icon + value + label, clickable + selected |
| Chips | `PheraChip` | `tone="neutral\|brand\|success\|warning\|danger\|info\|side-bride\|side-groom\|side-both"` |
| Dialogs | `PheraDialog` / `PheraDialogTitle` | serif title + optional close button |
| Switches | `PheraSwitch` | off = neutral track, on = brand-pink track |

**Buttons:** admin radius `12px`; landing/guest CTAs `999px` pill; `textTransform: none` always. Destructive actions use brand pink, never red.

**Inputs:** white background, visible border (`border.strong`), dark label (`text.muted`, weight 500), dark value (`text.strong`), 2px pink focus ring. Always vertically center text in fixed-height inputs.

---

## Blocking Rules (for any UI work)

1. **Tokens are the source of truth** — all colors/radii/fonts/shadows from `@/lib/theme/tokens`. Never inline hex, raw rgba, or magic radii/shadows.
2. **Shared primitives over raw MUI** — see the table above.
3. **Typography = variants, not inline `fontSize`.** 14px is the floor.
4. **Only two fonts** — Outfit (< 2rem), Instrument Serif (≥ 2rem).
5. **Button/input radius = 12px**; modals/popovers = 24px; mobile guest CTAs = 24px/pill.
6. **Canonical color names** — brand pink `#DE3F5E`, hover `#C8365A`. Destructive = pink, never red.
7. **Ask when inventing a new pattern** — there's likely an existing example to match.

---

*Reference files: `lib/theme/tokens.ts` (COLORS, RADII, FONTS, TEXT, SHADOWS) · `lib/theme/m3-theme.ts` (MUI theme + typography variants) · `lib/constants/form-styles.ts` (shared SX) · `components/shared/` (primitives) · `app/landing-design.css` (landing CSS vars).*
