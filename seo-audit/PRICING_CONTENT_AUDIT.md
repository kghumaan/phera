# `/pricing` Content Audit (read-only)

Date: 2026-04-28
Source: `app/pricing/page.tsx` (live deploy `https://www.phera.io/pricing`)
Method: verbatim extraction from rendered DOM and source. Zero invention or rewrite.

---

## Page-level copy

| Element | Text |
|---|---|
| H1 (page title, was H2 pre-3b) | "Simple, Transparent Pricing" |
| Subheading | "Start free, upgrade for power features." |
| H1 styling | Display serif italic, `fontSize: { xs: '1.5rem', md: '3rem' }`, color `COLORS.text.strong` |
| Subhead styling | `variant="h6"`, color `COLORS.text.muted`, `fontSize: { xs: '0.75rem', md: '1.25rem' }` |

There is **no** hero section, **no** FAQ section, **no** features section, and **no** WhatsApp Concierge / iPhone showcase rendered on `/pricing`. The page goes: AppHeader → "Simple, Transparent Pricing" heading + subhead → 3-tier grid → "For Wedding Planners" strip → AppFooter.

There is a `FeaturesSection` component definition copy-pasted from `/features` (~620 lines starting at the top of the file) but it is **never rendered**. Marked for deletion in Part 4.

---

## Couple-facing tiers (3-card grid)

Tiers are defined in the `pricingTiers` array at `app/pricing/page.tsx:129`.

### Tier 1 — PHERA FREE

| Field | Value |
|---|---|
| Display name | "PHERA FREE" |
| Price | "$0" |
| Price suffix | (empty) |
| Description / tagline | (empty) |
| CTA button text | "Get Started" |
| CTA destination | `/auth/signup` (direct link, not auth-gated) |
| Highlight badge | none (`highlight: false`) |
| Card visual chrome | white bg, `1px solid #E0E0E0` border |

Features (verbatim):
1. "Custom wedding website"
2. "Guest list & RSVP collection"
3. "PIN-gated event access"
4. "Design it yourself or with AI"

### Tier 2 — PHERA BASE

| Field | Value |
|---|---|
| Display name | "PHERA BASE" |
| Price | "$349" |
| Price suffix | (empty) |
| Description / tagline | (empty) |
| CTA button text | "Get Started" |
| CTA destination | auth-gated → `handleBaseAction` (logged in opens UpgradeModal, logged out redirects to `/auth/login?redirect=/?tier=base`) |
| Highlight badge | "POPULAR" chip (`highlight: true`) |
| Card visual chrome | white bg, `2px solid #DE3F5E` (brand pink) border, `elevation={8}` |

Features (verbatim):
1. "Everything in Free"
2. "Proactive WhatsApp outreach"
3. "Travel, rooms & shuttle coordination"
4. "24/7 WhatsApp Concierge for guests"
5. "Vendor Coordinator Agent"
6. "Broadcasts & structured data collection"

Note: feature 4 is auto-replaced at render time via `feature.replace('WhatsApp Concierge Agent', 'WhatsApp Agent')`. Source feature literal contains "WhatsApp Concierge for guests"; that doesn't match the replace pattern, so the rendered text is identical to the source.

### Tier 3 — PHERA WHITE GLOVE

| Field | Value |
|---|---|
| Display name | "PHERA WHITE GLOVE" |
| Price | "$599" |
| Price suffix | (empty) |
| Description / tagline | "We work with you 1-on-1 to gather every detail we need, then coordinate the entire guest experience on your behalf." |
| CTA button text | "Talk to Us" |
| CTA destination | auth-gated → `handlePremiumAction` (logged in opens UpgradeModal with `tier='premium'`, logged out redirects to `/auth/login?redirect=/?tier=premium`) |
| Highlight badge | none (`highlight: false`) |
| Card visual chrome | white bg, `1px solid #E0E0E0` border |

Features (verbatim):
1. "Everything in Base"
2. "Dedicated wedding coordinator"
3. "1-on-1 onboarding calls to capture guest list, events & preferences"
4. "We personally WhatsApp + call every guest"
5. "We chase RSVPs, travel, dietary & special requests"
6. "We assign rooms, shuttles & event access"
7. "Weekly status updates so you stay informed"
8. "Priority on-call support through the wedding"

---

## Mobile tab toggle (xs only)

Above the grid on mobile viewports, three pill buttons (`PHERA FREE`, `PHERA BASE`, `PHERA WHITE GLOVE`) toggle which single card is visible. Default selection: **index 1 = PHERA BASE** (`useState(1)`). Only one tier card displays at a time on mobile; on `md+` all three are visible side-by-side.

---

## Planner-facing strip ("For Wedding Planners")

Single white Paper card with a left column (sales copy + CTA) and a right column (two sub-tier price stats).

| Field | Value |
|---|---|
| Section overline | "FOR WEDDING PLANNERS" |
| Section H2 / lead | "Wholesale pricing for planners." (display serif italic, no semantic heading element — rendered as plain Typography) |
| CTA button | "Start as a Planner" → `/auth/login?role=planner` |
| Card chrome | white bg, `1px solid` border at 8% black, rounded corners |

Sub-tier 1 — Per-Wedding:

| Field | Value |
|---|---|
| Label (uppercase tracked) | "Per-Wedding" |
| Price | "$199" |
| Price suffix | "/wedding" |
| Body | "Resell to couples at your own rate. No commitment." |

Sub-tier 2 — Studio Plan:

| Field | Value |
|---|---|
| Label (uppercase tracked) | "Studio Plan" |
| Price | "$299" |
| Price suffix | "/month" |
| Body | "Up to 20 active weddings. White-label, team seats." |

There is **no** CTA button on the studio sub-tier separately; the single "Start as a Planner" button at top of the strip applies to both.

---

## Visual elements summary

| Element | Tier(s) | Notes |
|---|---|---|
| "POPULAR" chip | PHERA BASE only | Brand pink bg, white text, top-right corner of card |
| Pink (`#DE3F5E`) accent border | PHERA BASE | 2px solid; other tiers have 1px `#E0E0E0` |
| Higher elevation | PHERA BASE (`elevation={8}`) | Other tiers `elevation={0}` |
| Icon for each feature bullet | All tiers | `<StreamlineIcon name="check-circle">` in brand pink |
| Tier name styling | All tiers | `<Typography variant="overline">`, brand pink, 700 weight, 1.5px letter-spacing |
| Price typography | All tiers | `<Typography variant="h3">`, 700 weight, `fontSize: { xs: '2rem', md: '3rem' }` |

---

## Inconsistencies / observations

1. **Empty `description` on Free + Base.** Only White Glove has a tagline (`"We work with you 1-on-1…"`). Free and Base have empty strings, so their cards skip the description Typography entirely. Could either (a) add Free + Base taglines for consistency, or (b) drop White Glove tagline and use uniform-empty pattern. Currently asymmetric.
2. **CTA button text on Base ≠ visual prominence.** Base is the highlighted "POPULAR" tier but its CTA reads "Get Started" — same as Free. White Glove differentiates with "Talk to Us". A more direct CTA on Base ("Activate Concierge", "Start Coordinating", etc.) would match its emphasis.
3. **Free tier links to `/auth/signup`, Base + White Glove gate behind login.** Free skips auth-gating entirely (direct link), while paid tiers route through the auth flow. This is consistent with self-serve Free vs. checkout-required paid, but worth noting if the auth flow is updated.
4. **"Wholesale pricing for planners" is not a semantic heading.** The display-serif italic Typography that introduces the planner strip has no `component`/`variant` set — renders as `<p>`. If a section H2 makes sense for SEO, promote to `component="h2"`.
5. **No frequency labels on couple tiers.** All three tiers show price as `$0` / `$349` / `$599` with empty `priceSuffix`. Implicit assumption: per-wedding, one-time. Planner sub-tiers explicitly label `/wedding` and `/month`. Couple tier ambiguity ("is $349 per month? per wedding? lifetime?") could harm conversion clarity.
6. **No FAQ section on `/pricing`.** Common pricing-page FAQs (refund policy, what's included, how to upgrade, when am I charged, payment methods) are not present. The homepage `/` has the project's only FAQ block, embedded in HomePageClient, sourced from a `faqs` array with 10 questions — none specifically about pricing/billing. Pricing-specific FAQs would be a content add.
7. **No social proof / testimonials.** No quotes, logos, "trusted by X couples" copy, or comparison table. Given the platform's pivot framing ("0.1–0.6% of wedding budget"), there's no copy on `/pricing` reinforcing that framing.
8. **No comparison logic between tiers.** "Everything in Free", "Everything in Base" are the only inheritance signals. A side-by-side feature matrix is not rendered.
9. **No annual / multi-event discount.** Single-price flat tiers only. If pricing strategy supports it (e.g., "two weddings = X off"), no copy reflects it.
10. **Planner strip wholesale numbers presented without margin context.** "$199/wedding" and "$299/month, up to 20 weddings" lack the implied math (effective $/wedding at studio scale = $14.95 if all 20 slots filled). Buyers in this segment usually want that math surfaced.
11. **DPDPA / data-handling line is in homepage FAQ but not on pricing.** The homepage FAQ has "Is my guests' data safe? — Phera is DPDPA 2023 compliant…" which is relevant to a pricing decision but invisible to anyone landing directly on `/pricing`.

---

## Stop

Read-only inventory. No copy invented, no rewrites suggested for the live page yet. Decisions on which gaps (1–11) to fill are deferred to Part 4 content scoping.
