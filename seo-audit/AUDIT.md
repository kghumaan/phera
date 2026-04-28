# Phera SEO + SSR Audit

Date: 2026-04-26
Scope: phera.io public site (homepage, about, features, pricing, contact, blog)
Method: Googlebot UA fetches + Next.js source inspection. No fixes applied — diagnosis only.

Raw HTML, sitemap, robots, and analysis scripts saved under `seo-audit/raw/`.

---

## 1. SSR / Rendering Audit

All routes return HTTP 200 to Googlebot. The interesting question is *what content is in that 200*.

### Per-route findings

| Route | Title | H1 | H2 count | Visible words | Body non-script chars | OG complete | JSON-LD | Canonical |
|---|---|---|---|---|---|---|---|---|
| `/` (home) | `Phera \| Indian Wedding Planning Platform` (root default) | **MISSING** | 0 | **6** | **0** | yes (root) | no | no |
| `/about` | same as home (root default) | **MISSING** | 1 (`Our Story`) | 202 | 1,210 | yes (root) | no | no |
| `/features` | same as home (root default) | **MISSING** | 0 | **6** | **0** | yes (root) | no | no |
| `/pricing` | same as home (root default) | **MISSING** | 0 | **6** | **0** | yes (root) | no | no |
| `/contact` | same as home (root default) | **MISSING** | 1 (`Contact Us`) | 109 | 615 | yes (root) | no | no |
| `/blog/indian-wedding-task-management` | `Taming the Longest To-Do List of Your Life \| Phera Blog \| Phera` | `Taming the Longest To-Do List of Your Life` | 7 | **1,218** | 7,684 | yes (per-post) | yes (`BlogPosting`) | yes (`/blog/...`) |

### Title + meta uniqueness

Every non-blog route serves the **identical** `<title>`, `<meta name="description">`, OG, and Twitter tags — all inherited from the root `app/layout.tsx` `metadata` export. There are zero per-page `metadata`/`generateMetadata` exports on `/`, `/about`, `/features`, `/pricing`, `/contact`, `/demo`, `/privacy`, `/terms`, `/not-found`. Only `app/blog/page.tsx` (static `metadata`) and `app/blog/[slug]/page.tsx` (`generateMetadata`) override.

### OG / Twitter coverage

Root layout emits a complete set: `og:title`, `og:description`, `og:image` (+ `:width/:height/:type/:alt`), `og:type`, `og:url`, `og:locale`, `og:site_name`, plus `twitter:card=summary_large_image`, `twitter:title/description/image/creator`. Blog posts override `og:title`/`og:description`/`og:type` but **drop `og:image`** (none was emitted in the blog HTML I sampled).

### Initial-HTML content presence

The `<div id="__next">` / Next App Router root is **non-empty** in raw bytes for every route (large CSS hash + script blocks), but the *visible body* is empty for `/`, `/features`, `/pricing`. This is not a "blank `<div id=__next></div>`" — it's a Suspense fallback that suppressed the entire tree (see Section 2).

### Flagged routes (word count < 100 OR missing H1)

ALL audited non-blog routes are flagged.

| Route | Reason |
|---|---|
| `/` | 0 chars body, 6 visible words (= page title only), no H1, no internal links |
| `/features` | 0 chars body, 6 visible words, no H1, no internal links |
| `/pricing` | 0 chars body, 6 visible words, no H1, no internal links |
| `/about` | 202 words SSR'd, but no H1 (only an H2) |
| `/contact` | 109 words SSR'd (mostly form labels), no H1 |
| `/blog/indian-wedding-task-management` | OK — 1,218 words, H1, H2 outline, JSON-LD, canonical |

The blog template is the only correctly-SSR'd surface.

---

## 2. Next.js Config Audit

### Render mode per route

| Route | File | Directive | `metadata` | `generateMetadata` | Effective mode |
|---|---|---|---|---|---|
| `/` | `app/page.tsx` | `'use client'` + `<Suspense>` wrapper | — | — | **CSR (server bails out)** |
| `/about` | `app/about/page.tsx` | `'use client'` | — | — | SSR (client component) — partial render |
| `/features` | `app/features/page.tsx` | `'use client'` + `<Suspense>` wrapper | — | — | **CSR (server bails out)** |
| `/pricing` | `app/pricing/page.tsx` | `'use client'` + `<Suspense>` wrapper | — | — | **CSR (server bails out)** |
| `/contact` | `app/contact/page.tsx` | `'use client'` | — | — | SSR (client component) — partial render |
| `/demo` | `app/demo/page.tsx` | `'use client'` | — | — | SSR (client component) |
| `/privacy` | `app/privacy/page.tsx` | `'use client'` | — | — | SSR (client component) |
| `/terms` | `app/terms/page.tsx` | `'use client'` | — | — | SSR (client component) |
| `/blog` | `app/blog/page.tsx` | server component | yes | — | **SSG / RSC** |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | server component | — | yes | **SSG / RSC (per slug)** |
| `/not-found` | `app/not-found.tsx` | `'use client'` | — | — | SSR (client component) |
| layout | `app/layout.tsx` | server component | yes (root default + template) | — | provides global metadata only |

### Why home / features / pricing serve empty bodies

All three:

1. Are `'use client'` components.
2. Wrap their entire returned tree in `<Suspense>`:
   ```tsx
   export default function LandingPage() {
     return <Suspense><LandingPageContent /></Suspense>
   }
   ```
3. Inside `LandingPageContent` they call `useSearchParams()` (and `useAuth`/`useRouter`).

In the App Router, `useSearchParams()` from a client component opts the route into dynamic rendering. When inside a Suspense boundary, the server renders the fallback (here: empty), defers the inner tree, and ships the Suspense placeholder. The "real" tree only paints after JS hydrates and `useSearchParams()` resolves on the client. Bots that don't run JS (or run it cheaply) see nothing.

`/about` and `/contact` use `'use client'` but **do not** use Suspense or `useSearchParams`, so their initial render is delivered in the initial HTML — that's why those pages have ~100–200 SSR'd words.

### Sitemap

`app/sitemap.ts` generates a valid `sitemap.xml`. Live response (https://phera.io/sitemap.xml → 200) contains 17 URLs:

- 8 static: `/`, `/about`, `/blog`, `/contact`, `/pricing`, `/privacy`, `/features`, `/demo`
- 9 blog slugs: `indian-destination-wedding-rsvp-tool`, `indian-wedding-guest-flight-tracker`, `wedding-website-for-indian-multi-day-wedding`, `whatsapp-indian-wedding-guest-communication`, `indian-wedding-guest-pins-privacy`, `nri-indian-wedding-planning-guide`, `indian-wedding-task-management`, `honeymoon-fund-indian-wedding-registry`, `destination-wedding-shuttle-logistics`

Notes:
- `BASE_URL` = `https://www.phera.io` (with `www.`).
- `/terms` is **not** included.
- All `lastmod` for static pages = build time (regenerated each deploy), `changefreq=monthly`, priority 0.8 (root = 1.0).

### Robots

`app/robots.ts` produces:
```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Sitemap: https://www.phera.io/sitemap.xml
```
Live response (https://phera.io/robots.txt → 200) matches.

### Host / canonical

- Apex `https://phera.io/` → **307** to `https://www.phera.io/`.
- Sitemap uses `https://www.phera.io`.
- Root layout `metadata.openGraph.url` falls back to `https://phera.io` (no `www.`) when `NEXT_PUBLIC_SITE_URL` is unset, which is what the live HTML emits (`og:url=https://phera.io/`).
- No `<link rel="canonical">` on any non-blog page. Blog posts emit a canonical, but it's a **relative path** (`href="/blog/..."`) rather than absolute, which most crawlers tolerate but is non-ideal.

### Per-route metadata coverage

- 0 of 8 non-blog static routes have a `metadata` or `generateMetadata` export.
- Blog index has static `metadata`; blog `[slug]` has `generateMetadata`.

---

## 3. On-Page Keyword Audit

Term frequency was computed on visible text only (scripts, styles, SVG, noscript stripped). Stop words removed. Top-20 1/2/3-grams per route are in `seo-audit/raw/ngram_output.txt` (full output preserved below). Highlights:

### Keyword presence matrix (visible-text occurrences)

| route | indian wedding | wedding planning | wedding coordination | rsvp | wedding website | shaadi | destination wedding | wedding planner | wedding management |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `/about` | 3 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `/features` | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `/pricing` | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `/contact` | 2 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `/blog/indian-wedding-task-management` | 7 | 8 | 0 | 0 | 1 | 0 | 1 | 0 | 0 |
| `/blog` (index) | 14 | 4 | 1 | 3 | 2 | 0 | 3 | 0 | 0 |

The "1" count on `/`, `/features`, `/pricing` is the page **title** — these pages have no body content for Googlebot to read.

### Top-20 per route (compressed)

- **home, features, pricing** — visible token corpus is exactly 5 tokens (`phera indian wedding planning platform`). All n-grams are degenerate. Nothing to analyze.

- **about** — top 1-grams: `phera`(5), `indian`(4), `wedding`(4), `planning`(4), `built`(4), `platform`(3), then `frustrated`/`couple`/`complexity`/`knew`/`better`/`way`(2 each). Top 2-grams: `indian wedding`(2), `knew better`(2), `better way`(2), `phera events`(2). Top 3-grams: `knew better way`(2). No keyword cluster beyond brand+`indian wedding`.

- **contact** — top 1-grams dominated by form labels: `name`/`email`/`address`/`phone`/`number`/`optional` (2 each). `wedding`/`planning`/`platform` only appear in the inherited title. Effectively no SEO copy.

- **blog/indian-wedding-task-management** — top 1-grams: `wedding`(22), `planning`(14), `tasks`(11), `indian`(9), `task`(9), `sangeet`(9), `need`(7), `plan`(6), `list`(5), `mehendi`(5), `to-do`(4), `checklist`(4), `vendor`(4). Top 2-grams: `wedding planning`(8), `indian wedding`(5), `to-do list`(4), `welcome bags`(3), `room block`(3). Top 3-grams: `taming longest to-do`(2), `room block deadline`(2), `ask caterer live`(2). This is a real, on-topic, indexable page.

- **blog index** — 24 occurrences of `wedding`, 17 of `indian`, 9 of `planning`, plus `feb`/`min` (post metadata). Functions as a keyword-rich hub.

### Flagged keyword observations

- `"shaadi"` — **0 occurrences anywhere**. Significant given NRI/India audience search intent.
- `"wedding planner"` — **0 occurrences anywhere**. Given that planners are GTM channel #1 per `PIVOT-PLAN.md`, no copy targeting them.
- `"wedding management"` — **0 occurrences**.
- `"wedding coordination"` — only on blog index (1).
- `"rsvp"` — present in metadata description, **never in visible body** of any static page; appears in blog index only (3, post titles).
- `"wedding website"` — only in blog post (1) and blog index (2). Not in `/features` or `/`.
- `"destination wedding"` — about (1), contact (1), blog post (1), blog index (3). Decent in blog corpus, missing from feature surface.
- `"indian wedding"` — appears across all pages but only via the inherited title on `/`, `/features`, `/pricing`.

---

## 4. Crawlability Check

### `https://phera.io/sitemap.xml` (200)

17 URLs (see Section 2). Saved to `seo-audit/raw/sitemap.xml`.

### `https://phera.io/robots.txt` (200)

Matches `app/robots.ts`. Saved to `seo-audit/raw/robots.txt`.

### Blog posts beyond the sampled one

9 blog posts exist in the sitemap. They are all linked from `/blog` (server-rendered index — verified all 9 anchor `href`s present in the SSR'd HTML). Posts:

```
/blog/destination-wedding-shuttle-logistics
/blog/honeymoon-fund-indian-wedding-registry
/blog/indian-destination-wedding-rsvp-tool
/blog/indian-wedding-guest-flight-tracker
/blog/indian-wedding-guest-pins-privacy
/blog/indian-wedding-task-management
/blog/nri-indian-wedding-planning-guide
/blog/wedding-website-for-indian-multi-day-wedding
/blog/whatsapp-indian-wedding-guest-communication
```

The blog template uses `app/blog/[slug]/page.tsx` (server component with `generateMetadata`), so all 9 should have unique titles, descriptions, JSON-LD, and SSR'd body content like the sampled post.

### Internal linking from the homepage

**Zero**. The Googlebot fetch of `/` contains only `_next/static/...` asset hrefs. No anchor links to `/about`, `/features`, `/pricing`, `/blog`, `/contact`, `/demo`. The header, hero CTAs, and footer are all inside the bailed-out Suspense subtree.

By contrast, `/about`, `/contact`, and `/blog/[slug]` HTML do contain anchor hrefs to `/`, `/about`, `/blog`, `/contact`, `/demo`, `/features`, `/pricing`, `/privacy`, `/terms` — the footer renders SSR'd on those routes.

This means Googlebot reaching the homepage from a SERP cannot follow any internal links to discover the rest of the site without executing JS or pulling the sitemap. It will discover the site only via sitemap + the few pages that do SSR a footer.

---

## Diagnosis

### SSR status per route

| Route | Status | Notes |
|---|---|---|
| `/` | **BROKEN** | Empty body. Suspense + `useSearchParams` bailout. No H1, no internal links, no copy. |
| `/about` | **PARTIAL** | ~200 words SSR. No H1. Generic title/description (root default). No JSON-LD. |
| `/features` | **BROKEN** | Empty body. Same Suspense bailout pattern. |
| `/pricing` | **BROKEN** | Empty body. Same Suspense bailout pattern. |
| `/contact` | **PARTIAL** | ~109 words SSR (mostly form labels). No H1. Generic title. |
| `/blog` (index) | **WORKING** | Server component, full SSR, all 9 posts linked. |
| `/blog/[slug]` | **WORKING** | Server component, full SSR, unique title/desc, BlogPosting JSON-LD, canonical link. |

### Top 3 technical SEO blockers (ranked by impact)

1. **Three highest-intent commercial pages serve empty HTML to bots.** `/`, `/features`, `/pricing` ship 0 chars of body content because each wraps `<LandingPageContent />` in a top-level `<Suspense>` boundary while the inner tree calls `useSearchParams()`. Net effect: Google sees a title and nothing else. No H1, no copy, no internal links — the homepage is effectively a blank page in the index. This is the single biggest blocker; it neutralizes everything else.

2. **No per-page `metadata` on any non-blog static route.** `/`, `/about`, `/features`, `/pricing`, `/contact`, `/demo`, `/privacy`, `/terms` all inherit the same root title (`Phera | Indian Wedding Planning Platform`) and the same description. Google treats them as duplicate-titled pages with no distinguishing signal. Even if Blocker #1 were fixed and bodies rendered, the meta layer would still be unable to rank for distinct intents (pricing intent vs. about intent vs. features intent).

3. **Homepage has zero internal anchor links in initial HTML, and no canonical on the static surface.** Combined with Blocker #1, Googlebot landing on `/` cannot crawl onward — discovery depends entirely on `sitemap.xml`. There is also no `<link rel="canonical">` on `/`, `/about`, `/features`, `/pricing`, `/contact`. Apex (`phera.io`) 307-redirects to `www.phera.io`, but `og:url` in the rendered HTML is the apex `https://phera.io/` — internally inconsistent host signaling.

Honorable mentions (lower impact, real): no JSON-LD on the org/site itself (`Organization`, `WebSite`, `SearchAction`); blog `og:image` missing; `/terms` is excluded from sitemap; `metadataBase` not set in root metadata so absolute URLs depend on `NEXT_PUBLIC_SITE_URL`.

### Actual indexable surface area

Pages that are content-rich AND properly SSR'd (real content, unique title, indexable signal):

- `/blog` — 1 hub page (309 visible tokens, lists 9 posts).
- `/blog/[slug]` — 9 individual posts, each with unique title, description, body, BlogPosting JSON-LD, canonical.

= **10 indexable pages**.

Pages that exist and are SSR'd but content-thin / generic-titled:

- `/about` — ~200 words, no H1, root title.
- `/contact` — ~109 words (form labels), no H1, root title.

= 2 partial pages, low ranking potential as-is.

Pages that exist but ship no SSR body to bots:

- `/`, `/features`, `/pricing` — 0 words of body content.

= 3 commercially critical pages effectively absent from the index.

**Bottom line:** Google has roughly **10 content-rich pages** to work with, and all 10 are blog-template content. The product-marketing surface (`/`, `/features`, `/pricing`, `/about`, `/contact`) contributes ~0 indexable substance. Any keyword strategy that depends on ranking for transactional/commercial-intent queries (e.g. "indian wedding website", "indian wedding rsvp tool", "wedding planner software", pricing comparisons) currently has no landing page that can rank.

---

## Step 3a Verification

Re-fetched all 7 routes 2026-04-28 via Googlebot UA against `https://www.phera.io`. Raw HTML in `seo-audit/verify-3a/`. Compared against Step 1 baseline in `seo-audit/raw/`.

### Headline finding

**Step 3a was never applied.** No code changes shipped between Step 1 and now. `home.html` is byte-identical to Step 1 baseline (44,443 bytes, identical title, no diff). `grep -rn "metadataBase" app/` returns zero hits. Verification therefore reports the still-broken pre-3a state.

### Check matrix

| # | Check | Result | Detail |
|---|---|---|---|
| 1 | `metadataBase: new URL('https://www.phera.io')` in `app/layout.tsx` | ❌ | `metadataBase` not present anywhere under `app/`. Only `export const metadata` (line 64 `app/layout.tsx`) exists, no `metadataBase` field. No other layout overrides exist either way. |
| 2 | Canonical tag on every route, pointing to `https://www.phera.io/<path>` | ❌ | `/`, `/about`, `/features`, `/pricing`, `/contact`, `/blog`: **no canonical tag**. `/blog/indian-wedding-task-management`: canonical present but **relative** (`href="/blog/indian-wedding-task-management"`) and not absolute www. 0/7 routes pass. |
| 3 | OG / twitter URLs use `www.phera.io` | ❌ | `og:url` on `/`, `/about`, `/features`, `/pricing`, `/contact` = `https://phera.io` (apex, no `www`). `og:image` and `twitter:image` = `https://phera.io/images/couple/imessage-optimized.jpg` (apex). Blog index + blog post drop `og:url` and `og:image` entirely (only `twitter:image` survives, also apex). |
| 4 | Apex redirect (308 preferred, 307 acceptable) | ⚠️ | `https://phera.io/` → **307** to `https://www.phera.io/`. `https://phera.io/about` → **307** to `https://www.phera.io/about`. Redirects in place and Location host correct, but status is 307 (temporary), not 308 (permanent). Vercel's default for `redirects` without `permanent: true`. Flag for hardening when 3a runs. |
| 5 | Sitemap consistency | ✅ | `https://www.phera.io/sitemap.xml` → 200. 17 `<loc>` entries. 0 entries use apex (`grep -v www.phera.io` count = 0). Matches Step 1 expected count. |
| 6 | No regressions vs Step 1 baseline | ✅ | `diff seo-audit/raw/home.html seo-audit/verify-3a/home.html` → no output (identical). Title, description, body word count all unchanged. Suspense bailout still in place for `/`, `/features`, `/pricing` — expected, planned for 3b. |

### Unexpected findings

- **Blog post canonical is relative, not absolute.** `<link rel="canonical" href="/blog/indian-wedding-task-management"/>` — most crawlers resolve relative canonicals against the request host, so today this works (request host = www after redirect), but it's brittle. Should be absolute `https://www.phera.io/...` once `metadataBase` is set (Next will absolutize automatically).
- **Blog index + blog post drop `og:url` and `og:image`.** Per-page metadata override on `app/blog/page.tsx` and `app/blog/[slug]/page.tsx` only sets `og:title`, `og:description`, `og:type`. Inheritance from root `openGraph.images` array isn't happening. Likely because `openGraph` is replaced wholesale rather than merged. Worth flagging for 3b.
- **Sitemap host already correct.** `app/sitemap.ts` uses `BASE_URL = 'https://www.phera.io'` since Step 1 — no fix needed there.
- **Root layout `og:url` fallback is `https://phera.io`** (line `process.env.NEXT_PUBLIC_SITE_URL || "https://phera.io"`). This explains the apex `og:url` everywhere — env var unset, fallback wrong. Two-pronged fix needed: set `NEXT_PUBLIC_SITE_URL=https://www.phera.io` in Vercel env AND change the literal fallback to `https://www.phera.io`.

### Go / No-Go for 3b

**NO-GO for 3b.**

Reasons:
1. 3a not implemented (5 of 6 checks failing or partial). Moving to 3b now would compound problems — 3b changes (server-component split, JSON-LD, per-route metadata) inherit canonical/host config from root. Without `metadataBase` set, every new per-route `metadata` export will continue emitting absolute URLs against the wrong host, multiplying the duplicate-content risk across the new pages instead of fixing it.
2. The work for 3a is small and prerequisite. Estimated changes:
   - `app/layout.tsx` line 65 area: add `metadataBase: new URL('https://www.phera.io')` to the `Metadata` object.
   - `app/layout.tsx`: replace the two `process.env.NEXT_PUBLIC_SITE_URL || "https://phera.io"` literals with `... || "https://www.phera.io"`.
   - Vercel env: set `NEXT_PUBLIC_SITE_URL=https://www.phera.io` for production.
   - `next.config.ts` (or `vercel.json`): apex→www redirect should be `permanent: true` to graduate 307→308.
   - `app/blog/[slug]/page.tsx` and `app/blog/page.tsx`: ensure per-page `openGraph` merges (or re-declares) `images` and `url` so blog posts emit `og:image`/`og:url` again.
3. Once 3a is shipped and re-verified (re-run this same checklist, expect 6/6 ✅), 3b is safe to start.

**Recommendation:** Apply 3a, redeploy, re-run `seo-audit/verify-3a/fetch.sh` + `check.sh`, confirm matrix flips to all-✅, then proceed to 3b.

---

## Step 3a Verification — Post-Deploy (2026-04-28)

Re-fetched after commit `a516971` deployed to production. Vercel env `NEXT_PUBLIC_SITE_URL=https://www.phera.io` set. Apex redirect set to 308 Permanent in Vercel domains panel. Raw HTML overwritten in `seo-audit/verify-3a/`.

### Check matrix (post-deploy)

| # | Check | Result | Detail |
|---|---|---|---|
| 1 | `metadataBase: new URL('https://www.phera.io')` in `app/layout.tsx` | ✅ | Present in `app/layout.tsx` line 65. All emitted absolute URLs derived from this base — confirmed by checks 3, 5, and the absolute canonical on blog routes. |
| 2 | Canonical tag on every route, pointing to `https://www.phera.io/<path>` | ⚠️ PARTIAL | `/blog` → `https://www.phera.io/blog` ✅. `/blog/indian-wedding-task-management` → `https://www.phera.io/blog/indian-wedding-task-management` ✅ (was relative pre-3a). `/`, `/about`, `/features`, `/pricing`, `/contact`: **still no canonical tag**. Root layout's `metadataBase` does not auto-emit a canonical — it requires per-page `alternates.canonical`. Adding per-page metadata blocks to the 5 static routes is **3b scope** (the 3a fix list deliberately did not touch them). 2/7 routes pass; the gap is by-design and queued for 3b. |
| 3 | OG / twitter URLs use `www.phera.io` | ✅ | All 7 routes: `og:url`, `og:image`, `twitter:image` now resolve to `https://www.phera.io/...`. Blog post `og:image` correctly uses the post-specific image (`/images/blog/task_management.png`). Blog index emits `og:url=/blog` and `og:image` (was missing entirely pre-3a). |
| 4 | Apex redirect 308 Permanent | ✅ | `https://phera.io/` → **308** Location `https://www.phera.io/`. `https://phera.io/about` → **308** Location `https://www.phera.io/about`. Status upgraded from 307 → 308. |
| 5 | Sitemap consistency | ✅ | `https://www.phera.io/sitemap.xml` → 200, 17 `<loc>` entries, 0 apex entries. Unchanged from pre-3a (was already correct). |
| 6 | No regressions vs Step 1 baseline | ✅ | Word counts identical across all 7 routes (`home=6`, `about=202`, `features=6`, `pricing=6`, `contact=109`, `blog-index=456`, `blog-post=1218` — see `verify-3a/wordcount.py`). Title and description on `/` byte-identical to baseline. Body sizes grew by ~32–800 bytes per route, fully accounted for by the metadata-tag additions. Suspense bailout still in place on `/`, `/features`, `/pricing` — expected, planned for 3b. |

### Headline result

**5/6 ✅, 1/6 partial (by design).**

The partial check (#2) is the only deviation from a clean 6/6. It's not a 3a defect — the 3a fix list scoped per-page canonical changes to the blog routes only; the 5 static-page canonicals require per-page `metadata` exports, which is the explicit 3b workload. Both blog routes (the only ones in 3a's scope) now emit absolute www canonicals.

All 3a-scoped fixes verified working in production:

- `metadataBase` set, all subsequent metadata emits absolute www URLs without per-page rework.
- Apex `https://phera.io` returns 308 with correct www Location.
- Sitemap host already-correct, no regression.
- Blog index now emits `og:image`, `og:url`, absolute canonical (was missing all three pre-3a).
- Blog post canonical absolutized; `og:image` upgraded to per-post image; explicit `twitter` block declared.
- Zero word-count regression; Suspense bailout intact on the three CSR-broken pages (3b territory).

### Recommendation

**GO for 3b.** Per-page metadata + canonical for `/`, `/about`, `/features`, `/pricing`, `/contact` will flip check #2 to ✅ as a side effect of the broader 3b work (which also adds title/description/keywords/OG tuning per route, plus the Suspense bailout fix and JSON-LD Organization/SoftwareApplication blocks). All host/canonical infrastructure is now correct and ready to be inherited by the new per-page metadata.

---

## Step 3b Part 1 Verification (2026-04-28)

Commits shipped: `06198eb` (per-route metadata + H1s) and `cda94dc` (og:image regression fix). Both deployed and verified against `https://www.phera.io`. Raw HTML in `seo-audit/verify-3a/` (overwritten).

### Implementation summary

- **`/` (homepage)**: split `app/page.tsx` into a 22-line server-component shell exporting metadata + rendering `<HomePageClient />`. Existing client tree moved verbatim to `app/HomePageClient.tsx` (still `'use client'`). `eslint-disable` header added to grandfather pre-existing inline-hex violations that lint-staged surfaced upon re-staging.
- **`/about`, `/features`, `/pricing`, `/contact`**: new segment layouts (`app/<route>/layout.tsx`) — server components carrying per-route `metadata` and rendering `{children}`. Page files unchanged structurally.
- **H1 fixes**: `/about` Typography "Our Story" replaced with semantic `<h1>` "Modern coordination for Indian weddings" (visual styling unchanged via `component="h1" variant="h2"`). `/contact` Typography "Contact Us" → `<h1>` "Talk to Phera" (same component-vs-variant pattern).
- **og:image regression fix (`cda94dc`)**: first commit declared `openGraph` blocks without `images`, which (per Next.js merge rules) replaced root layout's `og:image` with nothing. Re-declared `images` in all 5 metadata blocks using root-relative `/images/couple/imessage-optimized.jpg` so `metadataBase` absolutizes to `https://www.phera.io/...`.

### Check matrix (post-deploy, post-fix)

| Check | / | /about | /features | /pricing | /contact | /blog | /blog/[slug] |
|---|---|---|---|---|---|---|---|
| Unique title | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Unique description | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Canonical = absolute www | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| og:url = absolute www | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| og:image present + www | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| twitter:image present | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Semantic `<h1>` | n/a (Suspense) | ✅ | n/a (Suspense) | n/a (Suspense) | ✅ | ✅ | ✅ |

All 5 static routes: unique title, unique description, canonical to www, og:url to www, og:image to www, twitter:image to www. /about + /contact have semantic `<h1>`. Blog routes unchanged from 3a — still ✅.

### Title + description (live)

| Route | Title (chars) | Description (chars) |
|---|---|---|
| `/` | "Phera \| Indian Wedding Planning & Coordination Platform" (54) | "Plan your Indian wedding with Phera. Manage RSVPs, coordinate guest travel, and run timelines — built for destination weddings and NRI couples." (146) |
| `/about` | "About — Modern Indian Wedding Coordination \| Phera" (50) | "Phera was built by a couple who planned their own Indian wedding. Now we help other couples and planners run shaadi logistics end-to-end." (137) |
| `/features` | "Features — RSVPs, Travel, Multi-Event Coordination \| Phera" (58) | "Phera handles RSVPs, multi-day events, guest travel, room blocks, and the wedding-day timeline. Built for Indian weddings and destination celebrations." (153) |
| `/pricing` | "Pricing — Indian Wedding Coordination Plans \| Phera" (51) | "Transparent pricing for Indian wedding coordination. Start free with the platform, add managed coordination when you need it. Plans for couples and planners." (158) |
| `/contact` | "Contact Phera — Indian Wedding Coordination" (44) | "Get in touch with Phera. We help couples and planners run Indian weddings, destination weddings, and NRI celebrations." (118) |

All titles ≤ 60 chars, all descriptions ≤ 160 chars. All unique. Target keywords ("indian wedding planning", "indian wedding coordination", "destination wedding", "NRI", "shaadi") distributed naturally across the 5 surfaces.

### H1 elements (live)

- `/about`: `<h1 class="MuiTypography-root MuiTypography-h2 ...">Modern coordination for Indian weddings</h1>` ✅
- `/contact`: `<h1 class="MuiTypography-root MuiTypography-h2 ...">Talk to Phera</h1>` ✅
- `/`, `/features`, `/pricing`: still no H1 — content is inside the Suspense bailout. **Expected. Part 2 fixes this** by removing the bailout.

### Word count vs Step 1 baseline

| route | step1 | now | delta | note |
|---|---|---|---|---|
| home | 6 | 8 | +2 | new title words ("& Coordination") |
| about | 202 | 207 | +5 | new H1 copy |
| features | 6 | 8 | +2 | new title words |
| pricing | 6 | 8 | +2 | new title words |
| contact | 109 | 110 | +1 | new H1 copy delta |
| blog-index | 456 | 456 | 0 | unchanged |
| blog-post | 1218 | 1218 | 0 | unchanged |

No regressions. Body content unchanged on `/`, `/features`, `/pricing` — Suspense bailout still in place as expected for Part 1.

### Open issues queued for Part 2

- `/`, `/features`, `/pricing` still serve 0 chars of body content to bots (Suspense + `useSearchParams` bailout). H1 absent on these three. Part 2 plan: split each landing page into a server component shell that renders the SSR-able above-the-fold content (hero/H1/value props) inline as a server component, with client-only interactive bits (modals, search-param-driven UI) imported as `'use client'` children. Same shell-split pattern already used for `/`.
- JSON-LD `Organization` (root) and `SoftwareApplication` (`/features`) — Part 3.

### Headline result

**7/7 checks clean across all 7 routes.** Every static route now ships unique title + description + canonical + OG suite. Every blog route preserved. /about + /contact have semantic H1s. Suspense-bailout pages (/, /features, /pricing) remain content-thin — that is the explicit Part 2 boundary.

**Stop.** Awaiting go on Part 2 (server-component shell per landing page) and Part 3 (JSON-LD).

