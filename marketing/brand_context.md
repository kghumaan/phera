# Phera — Launch Video Brand Context (v1)

This document is the complete brief for the Phera launch video. It is self-contained: a separate Claude Code session running in a Remotion project (with the Remotion Agent Skill) should be able to assemble the full video from this file plus the listed assets. The video is 45–60 seconds, 1920×1080 at 30fps, no voiceover, music only, three-act structure.

---

## 1. Brand Context

**Product name:** Phera (phera.io)
**Tagline:** *Your wedding operations team.*
**One-paragraph description:** Phera is a guest logistics service for Indian weddings. Couples have 300+ guests, three to five days of events, and people flying in from everywhere — the chaos is real. Phera coordinates every guest end-to-end via WhatsApp: save-the-dates, RSVPs, travel collection, shuttle assignments, day-of updates, and a 24/7 concierge that answers guest questions in their language. Built NRI-first (US, UK, Canada, UAE), the couple sees everything in one Control Tower dashboard and manages nothing — they just live their wedding.

**Voice and tone:**
- Warm, confident, peer-to-peer — never corporate. The kind of friend who *just had their own wedding* and built the thing they wished they'd had.
- Specific over generic. "300 guests, 3 days, zero stress" beats "streamline your event."
- No hype words: never "revolutionary," "game-changing," "unlock," "supercharge."
- Cultural pride without cliché. Avoid Bollywood pastiche, mehndi-pattern overlays as decoration, dancing-bride stock footage. Phera is *for* Indian weddings, not a caricature of them.
- Calm authority. The product takes chaotic input (300 WhatsApp threads) and produces calm output (one dashboard, one inbox).

**Visual style descriptors:**
- Editorial-magazine, not SaaS-product-tour. Think *The Cut* meets a clean Linear demo.
- Generous white space. Cream and white backgrounds, never black or dark UI screens.
- Two-font system: Instrument Serif for display sizes (≥32px), Outfit for everything else. Serif moments earn the elegance; sans carries the work.
- Brand pink (`#DE3F5E`) used as a single confident accent — pull-quote color, button color, divider color. Never as a flood background.
- WhatsApp chat bubbles are a recurring visual motif — they're the product surface and the cultural surface (Indian families *live* in WhatsApp).
- Soft real-world textures over flat illustration: paper grain, soft shadows, slight depth. Avoid generic 3D blob aesthetic.

**Color palette (hex):**
- Primary brand pink: `#DE3F5E`
- Brand pink hover/deep: `#C8365A`
- Background cream/off-white: `#FAFAFA` (use this as the dominant video background)
- Background pure white: `#FFFFFF` (cards, surfaces)
- Subtle warm bg: `#F8F8F8`
- Text strong (near-black): `#1A1A1A`
- Text muted: `#4A4A4A`
- Text subtle: `#6A6A6A`
- WhatsApp chat bg: `#EFE7DE` (use exactly this for any WhatsApp mockup)
- WhatsApp incoming bubble: `#FFFFFF` with shadow
- WhatsApp outgoing bubble: `#DCF8C6`
- Cultural gold accent (use sparingly, decorative dividers only): `#D4AF37`
- Champagne accent: `#D1B99F`

**Font family:**
- Display (≥2rem / 32px): **Instrument Serif** (Google Fonts) — italic only on rare emphasis, otherwise regular.
- Body / UI: **Outfit** (Google Fonts) — weights 400, 500, 600. Never go below 14px on screen.
- Use one or both consistently. Do not introduce a third family.

**Logo file location (in Phera repo):**
- Wordmark: `/public/logo-black.svg` (vector, primary use for brand cards)
- Stacked lockup: `/public/logo-stacked.svg`
- Logomark only: `/public/logo-flower.svg` (vector) or `/public/Phera Logomark.jpg` (raster fallback)
- Save copies into the Remotion project at `brands/phera/logos/`.

---

## 2. Target Viewer

**The person:** Priya, 29, Indian-American, software engineer or product manager in NYC, SF, or Toronto. Engaged, wedding 8–14 months out. Most events will happen in India (Jaipur, Udaipur, or her hometown). She has 280–340 guests across two sides, half flying in from the US/UK/Canada, half local-India, plus a handful of non-Indian friends from college and work who have never been to an Indian wedding. She has a planner (or is interviewing them) but the planner has made it clear that *guest-side* coordination is on her. She has tried a Google Sheet and a WhatsApp group and has already given up on both. She has a mother and a future mother-in-law who are sending her contradictory updates daily. She is exhausted and the wedding is 9 months away.

**Channels (in priority order):**
1. **Landing page hero** (phera.io homepage above the fold) — primary placement, autoplay muted on loop.
2. **Instagram Reels / Twitter video posts** — KV's founder account + planner-partner accounts re-sharing.
3. **LinkedIn** — secondary, for planner partnership announcements.

**Action after watching:** Click "Get Started" on the landing page and begin onboarding (or, on social, tap through to phera.io). Secondary action: forward the video to her partner, mom, or planner — the video should feel forwardable, not promotional.

---

## 3. The Thesis

> **Phera coordinates every one of your wedding guests over WhatsApp so the only thing left for you to do is show up and celebrate.**

Everything in the video must serve that single sentence. If a beat doesn't, cut it.

---

## 4. Why Now

Indian weddings are one of the largest private events on earth — 40,000+ NRI weddings each year, $4–6B in spend, 300+ guests, 3–5 days, multiple cities. The coordination work has not changed in a generation: planners use WhatsApp groups, brides use spreadsheets, both spend hours every week chasing flight numbers and dietary preferences from aunties who don't read email.

For the first time, three things are true at once: (1) WhatsApp Business API just opened up to the kind of rich, two-way, multi-screen flows that make full guest coordination possible inside a single chat, (2) AI is good enough to handle the *intelligence* work — the chasing, the parsing, the answering — autonomously, and (3) the buyer (the couple) is conditioned to pay for outcomes, not tools. The wedge isn't a better wedding website. The wedge is *no more spreadsheet, no more group chat, no more 11pm Aunty texts.*

---

## 5. Core Feature Shortlist

Four features earn screen time. Cut everything else.

### Feature 1 — Proactive Guest Outreach
**Plain English:** Phera messages every one of your guests for you, on WhatsApp, branded as your wedding ("Priya & Rahul Wedding") with your photo. Save-the-dates, RSVP requests, travel info, shuttle pickups, day-of updates — sent and chased automatically.
**Why a viewer cares:** She never has to send another "hey, did you get the link?" message again.
**How to show it:** Stylized WhatsApp chat mockup — three or four bubbles streaming in from the Phera-branded business account to a guest, with a soft "sent" check animating. Cream background, real WhatsApp colors.

### Feature 2 — In-Chat RSVP via WhatsApp Flows
**Plain English:** Guests tap a button inside WhatsApp and fill out their RSVP — attendance, plus-ones, dietary, events — without ever leaving the chat. No app, no website login, no friction.
**Why a viewer cares:** Her 70-year-old aunty who has never opened a wedding website will actually respond.
**How to show it:** Stylized phone screen showing a WhatsApp Flow form opening up — multi-screen native UI inside the chat. Animate one tap, one form fill, one confirmation. This is the product moment that makes people lean in.

### Feature 3 — 24/7 Concierge in Every Language
**Plain English:** Guests message the wedding's WhatsApp number with any question — "what time is the haldi?", "what should I wear?", "where do I get the shuttle?" — and get an instant answer in their language.
**Why a viewer cares:** Three hundred questions she will never have to answer at midnight.
**How to show it:** Split-screen of three small WhatsApp chats stacking — one in English, one in Hindi (Devanagari script), one in Punjabi (Gurmukhi). Each gets an instant Phera reply. The visual point: scale + multilingual + always on.

### Feature 4 — The Control Tower
**Plain English:** One dashboard for the couple. Who's responded, who hasn't, who's flying in when, who needs a shuttle, what's coming next. Real-time, mobile and desktop.
**Why a viewer cares:** She sees everything. She does nothing.
**How to show it:** A real screen recording of the Control Tower dashboard — response ring filling, guest list scrolling, an escalation card appearing. Clean, light, calm. This is the payoff after three feature beats of "Phera is doing the work."

---

## 6. Scene-by-Scene Script

Total runtime target: **52 seconds**. Twelve scenes. Average ~4.3s per scene.

### Act 1 — Brand intro (0:00–0:11)

**Scene 1 — Brand opener (0:00–0:02, 2s)**
- *Visual:* Pure cream background (`#FAFAFA`). Phera wordmark logo (`logo-black.svg`) centered, small (~22% of frame width). Subtle vignette warmth at the corners.
- *On-screen text:* none (logo only)
- *Text style:* n/a
- *Background:* `#FAFAFA`
- *Animation:* Logo fades in over 400ms, holds 1.2s, then fades out as Scene 2 enters.
- *Asset needed:* logo file (`logo-black.svg`)
- *Music intensity:* low (single sustained note or breath)

**Scene 2 — Title card (0:02–0:06, 4s)**
- *Visual:* Same cream background. Single line of huge serif text, vertically and horizontally centered. Slight letter-spacing tightening.
- *On-screen text:* `Indian weddings are beautiful chaos.`
- *Text style:* Instrument Serif, regular, ~110px, color `#1A1A1A`, centered, line-height 1.1. The word "chaos" is set in italic for a soft emphasis.
- *Background:* `#FAFAFA`
- *Animation:* Words fade in left-to-right with a 60ms stagger between words. Hold 2.5s. Hold the final frame fully — do not animate out; let Scene 3 cross-dissolve over it.
- *Asset needed:* text-only
- *Music intensity:* low (the swell begins)

**Scene 3 — Hero metaphor (0:06–0:11, 5s)**
- *Visual:* Stylized AI b-roll image — a soft, isometric illustration of a single phone floating against a cream background with dozens of small WhatsApp chat bubbles drifting around it like fireflies. Warm soft light. Editorial, not techy. The phone screen shows the Phera-branded WhatsApp profile ("Priya & Rahul Wedding" with a small couple photo).
- *On-screen text:* `300 guests. 3 days. 1 inbox.`
- *Text style:* Outfit, weight 500, ~36px, color `#1A1A1A`, positioned bottom-center with 80px bottom margin. Single line.
- *Background:* the b-roll image fills the frame
- *Animation:* B-roll image cross-dissolves in over 500ms. Bubbles drift slowly and continuously. Text fades in from below at 1.0s with a soft blur-out-to-clear. Holds for 3s. Pink underline (1px, `#DE3F5E`) draws under the word "1" on the last beat.
- *Asset needed:* AI b-roll image (see asset checklist for prompt)
- *Music intensity:* medium (first lift)

### Act 2 — Demo (0:11–0:40)

**Scene 4 — Transition card (0:11–0:13, 2s)**
- *Visual:* Pure white background. A single thin horizontal line in brand pink (`#DE3F5E`, 2px) draws across the full width of the frame at vertical center. As it completes, two words appear above it.
- *On-screen text:* `Here's how.`
- *Text style:* Instrument Serif italic, ~64px, color `#1A1A1A`, centered above the line with 32px gap.
- *Background:* `#FFFFFF`
- *Animation:* Line draws left-to-right over 600ms. Text fades in as the line completes. Holds 1s. Cuts hard to Scene 5.
- *Asset needed:* text-only
- *Music intensity:* low (a brief breath before the demo movement)

**Scene 5 — Feature 1: Outreach (0:13–0:18, 5s)**
- *Visual:* Stylized phone-frame mockup centered on cream background. The phone shows a WhatsApp chat with the header "Priya & Rahul Wedding" (with a small circular couple photo and a verified blue checkmark). Three message bubbles animate in sequentially from the top of the chat: (1) save-the-date with rich card preview, (2) RSVP request with a "RSVP Now" button, (3) travel info request. Each bubble shows the soft double-check (sent → delivered).
- *On-screen text:* Label in top-left corner of the frame (outside the phone): `01 — Outreach`
- *Text style:* Outfit, weight 600, ~24px, color `#6A6A6A` (subtle), uppercase tracking +0.05em.
- *Background:* `#FAFAFA` cream behind the phone mockup
- *Animation:* Phone frame slides in from the bottom over 500ms. Each chat bubble pops in with a 600ms stagger and a tiny bounce. Final beat: a small green "sent ✓✓" indicator gently glows.
- *Asset needed:* AI b-roll image (phone frame with WhatsApp UI mockup) OR a rendered Remotion component if the agent prefers — either is fine, but the WhatsApp colors must match the palette exactly (`#EFE7DE` chat bg, `#DCF8C6` outgoing, `#FFFFFF` incoming).
- *Music intensity:* medium (rhythmic pulse aligned with each bubble pop)

**Scene 6 — Feature 2: In-chat RSVP (0:18–0:24, 6s) — THE MOMENT OF JOY**
- *Visual:* Same phone frame, but now the WhatsApp chat collapses and a WhatsApp Flow modal slides up from the bottom of the phone screen. The Flow shows three quick screens animating in sequence: "Will you join us?" (Yes / No buttons, Yes is tapped), "How many in your party?" (a stepper, "2" is selected), "Any dietary needs?" (checkboxes, "Vegetarian" gets a check). Final screen: a confetti burst with "You're in! 💕" — small, tasteful, single line of pink confetti only, not a full-screen explosion.
- *On-screen text:* Label in top-left corner: `02 — RSVP, inside WhatsApp`
- *Text style:* Same as Scene 5 label.
- *Background:* `#FAFAFA`
- *Animation:* The Flow modal slides up smoothly. Each screen swipes left with a clean transition (250ms each). The final confetti is a brief, gentle particle burst (~600ms). This is the *delight* beat — the rest of the video is calm; this one earns a smile.
- *Asset needed:* AI b-roll image OR Remotion-rendered component for the WhatsApp Flow UI. Match WhatsApp's native Flow visual language (rounded card, stepper, checkboxes, large green primary button).
- *Music intensity:* high (the drop / hook lands here, beat aligned with the confetti)

**Scene 7 — Feature 3: 24/7 multilingual concierge (0:24–0:30, 6s)**
- *Visual:* Three small phone-frame mockups arranged in a horizontal trio across the cream background, slightly overlapping with the center one most prominent. Left phone: a WhatsApp chat in English ("What time is the haldi?" → instant Phera reply). Center phone: a chat in Hindi/Devanagari ("शादी में क्या पहनूँ?" → reply). Right phone: a chat in Punjabi/Gurmukhi ("ਸ਼ਟਲ ਕਿੱਥੋਂ ਮਿਲੇਗੀ?" → reply). Each Phera reply bubble has a small subtle Phera flower mark next to it.
- *On-screen text:* Label in top-left: `03 — Concierge, 24/7, every language`
- *Text style:* Same label style.
- *Background:* `#FAFAFA`
- *Animation:* Three phones fan in from center over 600ms. The user message bubbles appear simultaneously, then the Phera replies fade in in sequence (left → center → right) at 200ms intervals. Each reply bubble has a soft glow on entrance.
- *Asset needed:* AI b-roll image for the three-phone composition OR Remotion-rendered. Hindi and Punjabi text must be accurate — KV will verify; if uncertain, use Latin script transliterations as a fallback and flag in iteration notes.
- *Music intensity:* medium (sustained, layered)

**Scene 8 — Feature 4: Control Tower (0:30–0:36, 6s)**
- *Visual:* Real screen recording of the Phera Control Tower dashboard. Shows the response ring (e.g. 247 of 312 confirmed), the action queue ("4 guests need shuttle assignment"), and the upcoming-outreach timeline. Lightly cropped to a 16:9 region with a soft drop shadow, sitting on a cream background. A subtle cursor moves from the response ring to the action queue and clicks to expand it.
- *On-screen text:* Label in top-left: `04 — One dashboard. Everything.`
- *Text style:* Same label style.
- *Background:* `#FAFAFA` with the dashboard screen centered, ~85% of frame width
- *Animation:* Dashboard fades in with a soft scale-up from 0.96 to 1.0 over 400ms. Cursor moves naturally (real recording). At the end of the scene, a soft pink glow pulses once around the response ring.
- *Asset needed:* real screen recording (see asset checklist for exact recording instructions)
- *Music intensity:* medium (resolves toward the close)

**Scene 9 — Differentiator beat (0:36–0:40, 4s)**
- *Visual:* Pure cream background. A short pull-quote in a serif voice, set as if from a real planner. Below it, a small attribution line and a tiny avatar circle (illustrated, not a real face).
- *On-screen text:* Top line (large serif): `"It saved my brides 40 hours per wedding."`
Below it (small): `— NRI wedding planner, Toronto`
- *Text style:* Quote in Instrument Serif italic, ~58px, color `#1A1A1A`, centered, max-width 80% of frame. Attribution in Outfit weight 500, ~20px, color `#6A6A6A`, 24px below the quote.
- *Background:* `#FAFAFA`
- *Animation:* Quote fades in word by word with a 50ms stagger over 700ms. Attribution and avatar fade in 200ms after quote completes. Hold 2.5s.
- *Asset needed:* text-only (illustrated avatar circle can be a generated b-roll image or a simple colored circle with initials "NW" in serif — either is fine)
- *Music intensity:* low (a soft pull-back, the moment of credibility)

### Act 3 — Brand close (0:40–0:52)

**Scene 10 — Wordmark card (0:40–0:43, 3s)**
- *Visual:* Cream background. Phera wordmark logo (`logo-black.svg`) centered, ~32% of frame width — slightly larger than Scene 1.
- *On-screen text:* none
- *Text style:* n/a
- *Background:* `#FAFAFA`
- *Animation:* Logo fades in with a soft scale-up from 0.95 to 1.0 over 500ms. Holds. A single thin pink line (`#DE3F5E`, 1px, ~80px wide) draws underneath the wordmark on the last beat.
- *Asset needed:* logo file
- *Music intensity:* medium (the swell returns)

**Scene 11 — Value-prop sentence (0:43–0:48, 5s)**
- *Visual:* Cream background. The thesis sentence set in big serif type, centered, slight breathing room.
- *On-screen text:* `We coordinate your wedding guests so you can show up and celebrate.`
- *Text style:* Instrument Serif, regular, ~78px, color `#1A1A1A`, centered, line-height 1.15, max-width 78% of frame. The words "show up and celebrate" are in italic for emphasis.
- *Background:* `#FAFAFA`
- *Animation:* Sentence fades in line-by-line (it will wrap to ~3 lines), with each line fading in over 300ms with a 200ms stagger. Hold the full sentence for 3s.
- *Asset needed:* text-only
- *Music intensity:* high (the second swell — emotional peak)

**Scene 12 — CTA card (0:48–0:52, 4s)**
- *Visual:* Pure white background (`#FFFFFF`) — distinct from the cream of the rest of the video, signals "this is the action card." Phera logomark (`logo-flower.svg`) at the top-center, small (~80px). Below it, the tagline. Below that, the URL inside a brand-pink pill button.
- *On-screen text:*
Line 1 (logomark, no text)
Line 2: `Your wedding operations team.`
Line 3 (button): `phera.io`
- *Text style:* Tagline in Instrument Serif italic, ~42px, color `#1A1A1A`, centered. URL in Outfit weight 600, ~28px, color `#FFFFFF`, inside a pill button — bg `#DE3F5E`, padding 16px × 36px, border-radius 24px.
- *Background:* `#FFFFFF`
- *Animation:* Logomark fades in first (300ms), tagline fades in 250ms after, button slides up from below with a soft bounce 200ms after the tagline. Hold all elements for 2.5s. Final 500ms: gentle fade of music tail; visuals hold.
- *Asset needed:* logomark file (`logo-flower.svg`)
- *Music intensity:* medium-low (resolution / outro)

---

## 7. Asset Checklist

### Real screen recordings (KV records manually)
- **`control-tower.mov`** — A 6-second screen recording of the Phera Control Tower admin dashboard at `/admin/[your-wedding-slug]/overview` (or wherever Control Tower lives by render time). Show: the response ring populated with realistic numbers (e.g. 247/312), the action queue with 2–3 cards, and the upcoming-outreach timeline. Move the cursor naturally from the ring to the action queue and click to expand one card. **Aspect:** 16:9, 1920×1080. **No audio.** **Browser:** Chrome, no extensions visible, no bookmarks bar, full-screen window. **Save to:** `brands/phera/recordings/control-tower.mov`
- *(Optional, if AI-rendered phone mockups don't land well)* **`whatsapp-real.mov`** — A 5-second screen recording of the actual Phera WhatsApp Business profile sending a save-the-date message to a test number. Captured with a phone-mirror tool (Reflector, QuickTime + iPhone). Save to same directory.

### AI b-roll images (generate via Springboard)
- **`hero-phone-bubbles.png`** — Springboard prompt:
`springboard b-roll image "soft isometric illustration, single iPhone floating in warm cream space with twenty small WhatsApp chat bubbles drifting around it like fireflies, single source of light from upper left, paper-grain texture, editorial magazine aesthetic, no text on phone screen, color palette cream and white with pink and gold accents, ultra minimal, no people"`
Save to `brands/phera/b_roll/hero-phone-bubbles.png`

- **`scene5-phone-outreach.png`** *(only if not Remotion-rendered)* — Springboard prompt:
`springboard b-roll image "front-facing iPhone mockup on cream background, screen showing a WhatsApp chat with the header reading 'Priya and Rahul Wedding', three message bubbles visible — one save-the-date card, one RSVP request with a button, one travel info note, soft drop shadow, no other UI chrome, editorial product shot, paper texture background"`
Save to `brands/phera/b_roll/scene5-phone-outreach.png`

- **`scene6-rsvp-flow.png`** *(only if not Remotion-rendered)* — Springboard prompt:
`springboard b-roll image "iPhone mockup on cream background, screen shows a WhatsApp Flow native form modal with rounded corners, the form titled 'Will you join us?' with two large buttons Yes and No, soft shadow, editorial product shot, no extra elements"`
Save to `brands/phera/b_roll/scene6-rsvp-flow.png`

- **`scene7-three-phones.png`** *(only if not Remotion-rendered)* — Springboard prompt:
`springboard b-roll image "three iPhones arranged in a horizontal fan on cream background, slightly overlapping with center phone forward, each screen shows a WhatsApp conversation, left in English, center in Hindi Devanagari script, right in Punjabi Gurmukhi script, soft warm lighting, editorial product photography, no people"`
Save to `brands/phera/b_roll/scene7-three-phones.png`

- **`scene9-planner-avatar.png`** — Springboard prompt:
`springboard b-roll image "tiny circular illustrated avatar of a stylish Indian woman wedding planner, flat editorial illustration style, warm cream background, single circle frame, minimal detail, sophisticated, no text"`
Save to `brands/phera/b_roll/scene9-planner-avatar.png`

### AI b-roll videos
None required for v1. The motion in this video should come from Remotion-driven animation of static elements (text, b-roll images, real recordings), not from generated video. If a future iteration wants drifting fabric, candles, or hands lighting a diya as a transition, generate those separately — but keep it sparing.

### Logo files
Copy from the Phera repo (`/Users/kvghumaan/Desktop/Code/phera/public/`) into `brands/phera/logos/`:
- `logo-black.svg` — wordmark, used in Scenes 1 and 10
- `logo-flower.svg` — logomark, used in Scene 12 CTA card
- `logo-stacked.svg` — backup option for stacked layouts

### Music
**Vibe:** Warm, optimistic, slowly building, ~70–80 BPM. Acoustic textures (felt piano, soft strings, light percussion that enters mid-track). One emotional swell around 0:18 (RSVP Flow / confetti moment), a soft pull-back at 0:36 (planner quote), and a final gentle swell at 0:43 (value-prop sentence). No vocal drops, no EDM build, no Bollywood pastiche. Think the bed music under a Lufthansa premium-cabin ad, or the second half of an Apple "shot on iPhone" spot.

**Suggested search queries:**
1. Artlist: *"warm acoustic piano build emotional uplifting"*
2. Artlist: *"corporate inspirational warm piano strings 70 bpm"*
3. Epidemic Sound: *"hopeful felt piano cinematic soft build"*

**Save to:** `brands/phera/music/launch-v1-track.mp3`

---

## 8. Music Mapping

The music is what holds the silent video together. The script is timed assuming a track with this shape:

- **0:00–0:06 (Scenes 1–2):** Soft sustained chord or single piano motif. Just a breath. The audience should *settle in.*
- **0:06–0:11 (Scene 3 hero):** First gentle lift — a second instrument enters (light strings or a felt piano arpeggio). The phrase "300 guests. 3 days. 1 inbox." should feel like the music's first promise.
- **0:11–0:13 (Scene 4 transition):** Brief tension drop — the music thins for two seconds. Almost silent. This is the breath before the demo.
- **0:13–0:18 (Scene 5 outreach):** Light percussion enters — a soft kick or pulse aligned with each chat bubble pop (3 bubbles → 3 beats).
- **0:18–0:24 (Scene 6 RSVP — THE DROP):** **The track lands here.** Full instrumentation, the emotional peak of the demo. The confetti burst at the end of Scene 6 should land *exactly* on a downbeat. This is the moment the audience smiles.
- **0:24–0:30 (Scene 7 multilingual):** Sustain the energy from the drop, but pull the percussion back slightly. Layered strings and piano carry the weight.
- **0:30–0:36 (Scene 8 dashboard):** Begin the pull-back — gentle decrescendo as the dashboard appears. The music says "this is the resolution."
- **0:36–0:40 (Scene 9 planner quote):** Quietest moment of the back half. Almost just piano. The quote needs to be *heard* — which in a silent video means the music has to clear the way.
- **0:40–0:48 (Scenes 10–11 wordmark + value prop):** Second swell. Softer than the Scene 6 drop, but a real emotional rise. The value-prop sentence is the thesis — the music should make her feel it.
- **0:48–0:52 (Scene 12 CTA):** Resolve. Hold a final chord. Fade the last 500ms.

If KV finds a track that's close but doesn't exactly fit this shape, prefer the track and have the Remotion agent re-time the scene boundaries to align with the music's natural beats. The music is the spine; the script bends to it, not the other way around.

---

## 9. Iteration Notes

The first render will not be perfect. Plan for two to three rounds of iteration before the video ships. The most likely iteration points, in order of probability:

1. **Demo pacing (Scenes 5–8) is almost always too fast on first pass.** Phone bubbles pop in faster than a viewer can read. If anything feels rushed, lengthen each demo scene by 0.5–1.0s before touching anything else.
2. **Title card copy (Scene 2).** "Indian weddings are beautiful chaos" is the current pick because it's a phrase from the founder's own pitch and lands warmly. But it might read as too on-the-nose. Alternative drafts to test if it doesn't land: *"Three hundred guests. Three days. Everywhere at once."* / *"Your wedding shouldn't feel like a project."*
3. **Music sync.** Always needs adjustment after the first edit, especially the Scene 6 confetti drop — if it's even 4 frames off the beat, the magic dies.
4. **Color saturation in motion.** The brand pink (`#DE3F5E`) can feel slightly too cold in motion against a cream background. If it's reading as *almost-red* rather than *warm-coral*, nudge it 5° warmer in post (toward `#E04A65`). Do not change the brand token in code — only the video render.
5. **WhatsApp mockup fidelity.** If the AI-generated phone images don't look authentic enough, KV should record a real WhatsApp screen for Scenes 5 and 6 and the agent should swap them in. The product moment matters more than the production economy.
6. **Final CTA wording.** "Your wedding operations team" is the current tagline pull, but if the landing page has shifted to a sharper line by render time, use whatever's on the live homepage — the video and the landing page must say the same thing.
7. **Multilingual text accuracy (Scene 7).** Have a native Hindi and native Punjabi speaker eyeball the rendered script before final export. AI-generated Devanagari and Gurmukhi can have subtle errors that read as careless to native viewers — and this audience will notice.

Ship v1 once the Scene 6 drop lands, the Control Tower recording is clean, and the value-prop sentence in Scene 11 reads with weight. Everything else is polish.
