# Phera Design System

The complete reference for everything visual in Phera — logo, colors, typography, radii, spacing, shadows, and the shared component primitives that compose every screen. Tokens live in `lib/theme/tokens.ts`; the MUI theme that consumes them lives in `lib/theme/m3-theme.ts`. New UI must always pull from these — never inline a hex, raw rgba, or magic number.

---

## 1. Brand Identity

### Logo

| Asset | Path | When to use |
|---|---|---|
| Wordmark (default) | `/public/logo.svg` | Primary header logo. Rendered with `filter: brightness(0)` so it sits as solid black against light backgrounds. |
| Wordmark (black, raster) | `/public/logo-black.png`, `/public/logo-black.svg` | Email signatures, exports, anywhere SVG can't ride. |
| Stacked wordmark | `/public/logo-stacked.svg` | Vertical layouts (favicon-adjacent placements, square share cards). |
| Lotus flame mark | `/public/logo-lotus-flame.svg` | Standalone glyph — favicon, app icon, tight square crops. |
| Flower mark | `/public/logo-flower.svg` | Decorative accent — landing-page ornaments, loading states. |
| Logomark (raster) | `/public/Phera Logomark.jpg` | Press kit / external decks where SVG isn't accepted. |

**Header sizing (responsive):** width `100/120/128px`, height `40/48/48px` at xs / sm / md+. The wedding-name typography pairs with Instrument Serif italic at hero scale.

**Default color:** Logo always renders solid black (`#1a1a1a` or pure `#000` via `brightness(0)`) on light surfaces. There is no light-on-dark variant — Phera does not ship a dark mode, and no component should lean on a black/dark background.

### Brand voice (visual)

- **Aesthetic intent:** premium but playful, Gen-Z / Partiful energy, expressive serif against clean sans, generous whitespace, occasional cultural color accents (gold, saffron, maroon) used as ornament — never as backgrounds for content.
- **What we are not:** corporate SaaS, dark dashboards, dense data grids, neon, glassmorphism overload.

---

## 2. Color Tokens

All colors are exported from `lib/theme/tokens.ts` as `COLORS`. Inline hex literals are forbidden — if a value isn't here, add it.

### Brand

| Token | Value | Use |
|---|---|---|
| `COLORS.brand.primary` | `#DE3F5E` | Primary CTAs, focused inputs, active links, brand chips, Switch on-state. |
| `COLORS.brand.primaryHover` | `#C8365A` | Hover state on primary CTAs. |
| `COLORS.brand.primaryDisabled` | `rgba(222, 63, 94, 0.35)` | Disabled primary buttons. |
| `COLORS.brand.primarySubtle` | `rgba(222, 63, 94, 0.08)` | Selected/active rows, soft brand fills. |
| `COLORS.brand.primaryWash` | `rgba(222, 63, 94, 0.04)` | Hover wash on menu items, table rows. |
| `COLORS.brand.primaryBorder` | `rgba(222, 63, 94, 0.18)` | Soft brand borders on hero cards. |

### Text

| Token | Value | Use |
|---|---|---|
| `COLORS.text.strong` | `#1a1a1a` | Headings, body copy, primary text. **Default text color.** |
| `COLORS.text.muted` | `#4a4a4a` | Body/secondary text, form labels. |
| `COLORS.text.subtle` | `#6a6a6a` | Captions, helper text, table descriptions. |
| `COLORS.text.faint` | `#9a9a9a` | Disabled labels, low-priority metadata. |
| `COLORS.text.placeholder` | `#C2C2C2` | Input placeholders. |
| `COLORS.text.inverse` | `#ffffff` | Text on dark surfaces (only used on the black login/header buttons). |

### Backgrounds

| Token | Value | Use |
|---|---|---|
| `COLORS.bg.white` | `#ffffff` | Default surface. Modals, cards, forms. |
| `COLORS.bg.muted` | `#FAFAFA` | Slight separation from white — `PheraCard variant="muted"`. |
| `COLORS.bg.subtle` | `#F8F8F8` | Page-level grey, sidebar washes. |
| `COLORS.bg.wash` | `rgba(0, 0, 0, 0.03)` | Hover wash on neutral surfaces. |

**Rule:** never use a black or dark background on new components. Always white or a `bg.*` token, with dark text on top.

### Borders

| Token | Value | Use |
|---|---|---|
| `COLORS.border.faint` | `rgba(0, 0, 0, 0.06)` | Table dividers, subtle card outlines. |
| `COLORS.border.light` | `rgba(0, 0, 0, 0.08)` | Standard card border. |
| `COLORS.border.default` | `rgba(0, 0, 0, 0.15)` | Default input border (resting). |
| `COLORS.border.strong` | `rgba(0, 0, 0, 0.23)` | Hover input border, emphasis dividers. |

### Status (semantic accents)

| Tone | Token | Hex | Use |
|---|---|---|---|
| Success | `COLORS.accent.success` / `successBg` / `successText` | `#10B981` / `#E8F5E9` / `#2E7D32` | RSVP "Attending", confirmation alerts. |
| Warning | `COLORS.accent.warning` / `warningBg` / `warningText` | `#F59E0B` / `#FFF3E0` / `#E65100` | Pending, "Maybe", non-blocking heads-ups. |
| Danger | `COLORS.accent.danger` / `dangerBg` / `dangerText` | `#EF4444` / `#FFEBEE` / `#C62828` | "Not Attending" status dots, error alerts. **Never on buttons** — destructive actions still use brand pink. |
| Info | `COLORS.accent.info` / `infoBg` / `infoText` | `#3B82F6` / `rgba(59,130,246,0.08)` / `#1d4ed8` | Informational alerts, neutral callouts. |

### Cultural accents (decorative only)

`COLORS.cultural.{gold #D4AF37, champagne #D1B99F, maroon #800020, saffron #FF9933, coral #FF6B6B, teal #20C997, purple #6C5CE7}`. Reserved for ornament — dividers, cultural-context illustration, secondary palette accents on guest-portal themes. Not for primary CTAs or text.

### Wedding sides

| Token | Value | Use |
|---|---|---|
| `COLORS.side.bride` | `#DE3F5E` (brand pink) | Bride's side guests/chips. |
| `COLORS.side.groom` | `#3b82f6` (blue) | Groom's side guests/chips. |
| `COLORS.side.both` | `#8b5cf6` (purple) | Joint / shared. |

### WhatsApp palette (mockups only)

`COLORS.whatsapp.*` (`bg #EFE7DE, bubble #DCF8C6, header #075E54, headerDark #202C33, headerSubtext #8696a0, bubbleText #0b141a, timestampText #667781, dateText #54656F, verifiedBlue #2979FF, readCheck #53bdeb`). Used **only** in the WhatsApp message-preview component on the landing page so the mockup looks true to what guests see. Never used on real chrome.

---

## 3. Typography

### Fonts (only two)

| Token | Family | Use |
|---|---|---|
| `FONTS.body` | Outfit | Everything below 2rem — body, labels, buttons, h4–h6. |
| `FONTS.display` | Instrument Serif (italic) | Anything ≥ 2rem — h1, h2, h3, hero numerals, decorative display. |

The 2rem threshold is canonical: `DISPLAY_SIZE_THRESHOLD_REM = 2`. Work Sans was previously in the system and is dead — never re-introduce.

#### Decorative couple-name fonts (guest portal only)

For couple-name display on guest-facing wedding pages, six fonts are exposed via `lib/constants/fonts.ts` (`COUPLE_NAME_FONTS`):

- Instrument Serif (default, italic)
- Ballet
- Tenor Sans
- Petit Formal Script
- Forum
- Cormorant Semi Bold

These are user-selectable per wedding — they are *not* part of the admin/marketing system.

### Type scale (`TEXT`)

14px (0.875rem) is the absolute minimum for any readable text. Numeric ornaments (badges, dots) may go smaller; treat as exception.

| Token | Value | Pixels | Use |
|---|---|---|---|
| `TEXT.sm` | `0.875rem` | 14 | Floor for body, labels, captions. |
| `TEXT.base` | `1rem` | 16 | Default body. |
| `TEXT.lg` | `1.125rem` | 18 | Emphasised body. |
| `TEXT.xl` | `1.25rem` | 20 | Small headings. |
| `TEXT.2xl` | `1.5rem` | 24 | Medium headings (still Outfit). |
| `TEXT.3xl` | `2rem` | 32 | **Switches to Instrument Serif at this size and above.** |
| `TEXT.4xl` | `2.5rem` | 40 | Display. |
| `TEXT.5xl` | `3rem` | 48 | Hero display. |

### MUI variants (the canonical way to apply type)

Always use `<Typography variant="…">`. Never inline `fontSize`. The variants below are responsive — sizes shown are at the largest breakpoint.

| Variant | Family | Weight | Style | Size (lg) | Intended use |
|---|---|---|---|---|---|
| `h1` | Instrument Serif | 400 | italic | 4.5rem | Hero couple-name display. |
| `h2` | Instrument Serif | 400 | italic | 3.75rem | Section openers, ceremony headers. |
| `h3` | Instrument Serif | 400 | italic | 2.75rem | Sub-section openers. |
| `h4` | Outfit | 600 | — | 1.5rem | Card titles, stat numbers. |
| `h5` | Outfit | 600 | — | 1.25rem | List headers. |
| `h6` | Outfit | 600 | — | 1.1rem | **Page title** (paired with `body2` subtitle via `PageHeading`). |
| `body1` | Outfit | 400 | — | 1.1rem | Default body copy. |
| `body2` | Outfit | 400 | — | 1rem | Secondary body, page subtitles, helper text. |
| `body3` (custom) | Outfit | 400 | — | 0.95rem | Tighter body. |
| `body4` (custom) | Outfit | 400 | — | 0.925rem | Footnote-tier body. |
| `subtitle1` | Outfit | 600 | — | 1rem | Bold lead text. |
| `subtitle2` | Outfit | 600 | — | 0.925rem | Bold secondary lead. |
| `subtitleCaps` (custom) | Outfit | 600 | uppercase, 0.08em tracking | 0.925rem | **Section headers** inside admin pages. Used by `SectionHeading`. |
| `caption` | Outfit | 400 | — | 0.9rem | Helper/footnote. |
| `overline` | Outfit | 500 | uppercase, 0.083em tracking | 0.9rem | Eyebrow labels above headings. |
| `button` | Outfit | 500 | none-cased | 0.95rem | Button label (theme handles). |

---

## 4. Radii

From `RADII`. Three tiers, plus dialog/CTA/pill specials.

| Token | Value | Use |
|---|---|---|
| `RADII.sm` | `8px` | Tiny chips, inline tags. |
| `RADII.md` | `12px` | **Buttons, inputs, small cards** — the admin default. |
| `RADII.lg` | `16px` | Feature cards, stat cards. |
| `RADII.xl` | `20px` | Hero / highlight cards. |
| `RADII.cta` | `24px` | Pronounced guest-facing CTAs (mobile "View Details", "RSVP"). |
| `RADII.dialog` | `24px` | Modals, popovers. |
| `RADII.pill` | `999px` | Avatar buttons, pill chips, switch tracks. |

The MUI base `shape.borderRadius` is `16` (M3 large). MUI's default `MuiButton` ships with `borderRadius: 24` and `MuiDialog` paper with `24` — both via theme overrides.

---

## 5. Shadows

| Token | Value | Use |
|---|---|---|
| `SHADOWS.none` | `none` | Default. Most cards have no shadow. |
| `SHADOWS.card` | `0 1px 2px rgba(0, 0, 0, 0.04)` | `PheraCard variant="feature"`, stat cards. |
| `SHADOWS.popover` | `0 8px 24px rgba(0, 0, 0, 0.08)` | `PheraMenu`, dropdowns. |
| `SHADOWS.dialog` | `0 8px 32px rgba(0, 0, 0, 0.08)` | `PheraDialog`, modal scrim. |

---

## 6. Transitions

| Token | Value | Use |
|---|---|---|
| `TRANSITIONS.fast` | `0.15s ease` | Tiny hover states. |
| `TRANSITIONS.default` | `0.2s ease` | Default — buttons, inputs. |
| `TRANSITIONS.slow` | `0.3s ease` | Card hovers, drawer slides. |

---

## 7. Spacing & Layout

- **Admin page max width:** `1000px` (`ADMIN_PAGE_MAX_WIDTH`).
- **Admin inner spacing:** `2.5` MUI units (`ADMIN_INNER_SPACING`).
- **Section vertical rhythm:** `3` MUI units (`ENHANCED_SECTION_SPACING`).
- **Container max width (forms):** MUI `xl` (`ENHANCED_CONTAINER_MAX_WIDTH`).
- **Page padding:** `px: { xs: 2, md: 4 }`, `pt: { xs: 2, md: 4 }`.

---

## 8. Component Primitives

Every common UI element is wrapped. **Never import the raw MUI version in app code** — if a primitive doesn't exist, add one and migrate.

### Buttons — `components/admin/ActionButton.tsx`

| Component | Use |
|---|---|
| `PrimaryActionButton` | Pink filled CTA. Save, Submit, Publish, Confirm. Auto-spinner on async `onClick`. |
| `SecondaryActionButton` | Black-outlined neutral CTA. Cancel, secondary actions. |
| `IconActionButton` | Square icon button with auto-spinner. Inline table actions. |
| `ActionButton` | Base — pass `variant` manually. |

Behavior baked in: `borderRadius: 12px`, `textTransform: none`, `fontWeight: 600`, primary hover → `#C8365A`, async-aware spinner that preserves button width.

**Rule:** destructive actions (delete, remove, withdraw) use **brand pink**, not red. Red is for status indicators only.

### Text inputs — `components/shared/TextField.tsx`

Use `PheraTextField`. Never spread `ENHANCED_TEXT_FIELD_SX` on a raw `<TextField>` in new code.

Specs: white bg, `RADII.md` border radius, default border `COLORS.border.strong`, hover/focus border `COLORS.brand.primary` (2px focus), label color `COLORS.text.muted`, focused label brand pink, input text `COLORS.text.strong`, placeholder `COLORS.text.placeholder`. All inputs vertically center text inside fixed-height fields.

### Cards / surfaces — `components/shared/Card.tsx`

`<PheraCard variant="default | muted | feature | hero">`.

| Variant | Radius | Bg | Border | Shadow |
|---|---|---|---|---|
| `default` | `md` | white | faint | none |
| `muted` | `md` | `bg.muted` (#FAFAFA) | none | none |
| `feature` | `lg` | white | faint | `card` |
| `hero` | `xl` | brand-tinted gradient | brand soft | none |

### Alerts — `components/shared/Alert.tsx`

`InfoAlert | SuccessAlert | WarningAlert | ErrorAlert` (or `<PheraAlert tone="…">`). Light tinted background, leading icon, optional title, optional `onClose`. Never import MUI's `<Alert>` directly.

### Chips — `components/shared/Chip.tsx`

`<PheraChip tone="…" label="…" />`. Tones: `neutral`, `brand`, `success`, `warning`, `danger`, `info`, `side-bride`, `side-groom`, `side-both`. All render with `bgcolor: alpha(tone, 0.1)` + tone-colored text.

### Dropdown menus — `components/shared/Menu.tsx`

`<PheraMenu>` + `<PheraMenuItem>`. White bg, dark text, `RADII.md`, `SHADOWS.popover`, hover wash uses `brand.primaryWash`, selected uses `brand.primarySubtle`. **Never** a dark dropdown.

### Switches — `components/shared/Switch.tsx`

`<PheraSwitch>`. iOS-style. Off = neutral track (`alpha(#000, 0.18)`) + white thumb. On = brand pink track + white thumb. 42×24 with 2px padding. Don't override.

### Dialogs — `components/shared/Dialog.tsx`

`<PheraDialog>` + `<PheraDialogTitle onClose={…}>`. Always white bg, `RADII.dialog` (24px), `SHADOWS.dialog`. Title is Outfit 700 at 1.125rem (NOT serif — under the 2rem threshold).

### Page headings — `components/shared/PageHeading.tsx`

| Component | Use |
|---|---|
| `<PageHeading title subtitle actions>` | Top of every admin page. `h6` title + `body2` subtitle + optional right-aligned actions. |
| `<SectionHeading title actions>` | Inside-page section header. Renders `subtitleCaps` (uppercase, tracked). |

### Empty states — `components/shared/EmptyState.tsx`

`<EmptyState icon title subtitle action>`. Centered, `py: 6`, faint icon, strong title, subtle subtitle, optional CTA. Replaces every ad-hoc "no items yet" block.

### Stat cards — `components/shared/StatCard.tsx`

`<StatCard icon iconColor value label hint onClick selected>`. Icon avatar at `alpha(iconColor, 0.1)`, big `h4` value, `body2` label, optional caption hint. `selected` adds a 2px brand border (used as clickable tabs on the RSVPs page).

### App chrome

| Component | Path | Use |
|---|---|---|
| `AppHeader` | `components/shared/AppHeader.tsx` | Site-wide header with logo, auth, RSVP status, WhatsApp shortcut. |
| `AppFooter` | `components/shared/AppFooter.tsx` | Site-wide footer. |
| `LoadingSpinner` | `components/shared/LoadingSpinner.tsx` | Full-screen + inline loader. |
| `ErrorBoundary` | `components/shared/ErrorBoundary.tsx` | Top-level error trap. |
| `ThemeProvider` | `components/shared/ThemeProvider.tsx` | Wraps the app with the M3 MUI theme. |

---

## 9. Patterns & Page Conventions

### Admin page skeleton

```
<Container maxWidth="xl">
  <PageHeading title="…" subtitle="…" actions={…} />
  <Box mt={3}>
    <SectionHeading title="…" />
    <PheraCard>…</PheraCard>
  </Box>
</Container>
```

### 3-state gated feature pattern

Coordinator and Concierge both use:
- **State A** — Free/basic teaser with blurred mock + lock overlay (`borderRadius: 3` on the blurred mock).
- **State B** — Pro onboarding flow, no data yet.
- **State C** — Pro dashboard with live data.

Match this when adding a new gated feature.

### Preview iframe (admin → live wedding)

- Mobile preview uses dedicated section pages (`/preview/{slug}/{section}`) — base `/preview/{slug}` must NEVER show `VerticalScrollLayout`.
- Desktop preview uses `NAVIGATE_TO_SECTION` postMessage to jump within `VerticalScrollLayout`.
- Pin entry preview triggers via `SET_PREVIEW_MODE` postMessage from `AdminPreviewPanel`.

### Forms

- Every text input wraps in `PheraTextField` (or `ENHANCED_TEXT_FIELD_SX` only on legacy code).
- For `Select` / `FormControl` (which don't share TextField's child structure) apply input styles directly.
- All inputs: white bg, visible border, dark label (500 weight), dark input value.

---

## 10. Migration Status & Rules

The design system is mid-migration. Existing files may still ship inline hex / raw MUI components. Rules:

1. **Tokens are the source of truth** — `lib/theme/tokens.ts`. Never inline hex, raw rgba, or magic radii/shadows.
2. **Shared primitives over raw MUI.** Always reach for `components/shared/*` or `components/admin/ActionButton`.
3. **Typography = variants, not inline `fontSize`.** 14px is the floor.
4. **Two fonts only.** Outfit for `<2rem`, Instrument Serif for `≥2rem`.
5. **Buttons & inputs = `RADII.md`.** Modals = `RADII.dialog`. Mobile guest CTAs = `RADII.cta`.
6. **Brand pink for destructive.** Red is reserved for status dots/alerts.
7. **Fix the violator, never relax the rule.** No `eslint-disable`, no widened suppressions, no `any` / `@ts-ignore` to silence design-system or type errors.
8. **If you're editing a file with violations, migrate them while you're there.**
9. **If a primitive doesn't exist for your need, ADD IT to `components/shared/` first** — don't inline.

### Reference files

| File | Purpose |
|---|---|
| `lib/theme/tokens.ts` | Source of truth — `COLORS`, `RADII`, `FONTS`, `TEXT`, `SHADOWS`, `TRANSITIONS`. |
| `lib/theme/m3-theme.ts` | MUI theme — typography variants, default component overrides. |
| `lib/constants/form-styles.ts` | Legacy SX constants (`ENHANCED_TEXT_FIELD_SX`, `PRIMARY_BUTTON_SX`, etc.) — token-backed. |
| `lib/constants/button-styles.ts` | Standalone primary/secondary button SX presets. |
| `lib/constants/fonts.ts` | Couple-name decorative fonts for guest portal. |
| `components/shared/` | Shared primitives (Alert, Card, Chip, Dialog, EmptyState, Menu, PageHeading, StatCard, Switch, TextField, etc.). |
| `components/admin/ActionButton.tsx` | Button primitives. |
| `DESIGN_GUIDELINES.md` | Original (pre-token) guidelines — kept for historical context. |

---

*Last updated: 2026-05-02. The tokens, primitives, and rules above are the binding spec. When in doubt, ask before inventing a new pattern — there's almost always an existing example to match.*
