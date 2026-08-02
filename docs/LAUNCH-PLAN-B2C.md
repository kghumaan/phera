# Phera — B2C Launch Plan

> A founder-led, 6-month plan to get the **first paying stranger couple** onto Phera's $349 Base tier.
> Built with the launch-strategy (ORB + 5-phase), marketing-ideas, and GTM frameworks, reconciled against `BUSINESS_PLAN.md`, `docs/MONETIZATION.md`, `LANDING-REVISION-TRACKER.md`, the product-state inventory, and the **2026-06-30 GTM council constraints**.
>
> Authored 2026-06-30. Owner: KV.

---

## 0. Reality anchor (the constraints that shape every decision)

This is **not** a big-bang SaaS launch. Phera is a *niche, high-consideration, seasonal, one-time* purchase sold cold to consumers who already have The Knot/Zola/Joy in their heads. Plan accordingly.

| Constraint | Value | Implication |
|---|---|---|
| **Win bar** | First **$1 from a stranger** in 6 months | Optimize for *proof of willingness-to-pay*, not revenue or scale. A founder discount is fine. |
| **Budget** | ~$500/mo | Organic-first. No real paid-ads engine. Spend goes to WhatsApp costs + 1–2 small tests. |
| **Time** | ~10 hrs/week | One channel done well > five half-done. Founder-led, not a campaign machine. |
| **Job search** | Moderate urgency, split focus | The plan must survive weeks where Phera gets 5 hrs, not 10. |
| **Proof you have** | You ran **your own wedding** on Phera (real, photographable) + 2–3 friends' weddings running **free** soon | This is the whole launch's credibility. Lead with it. |
| **Warm distribution** | **One** NRI-specialist planner (20–50 weddings/yr), reachable via a mutual | The single highest-probability first-dollar source. Run it in parallel (see §9). |
| **Cold distribution** | Couples don't know you exist | Borrowed credibility (referrals, the planner, micro-influencers) beats shouting into IG. |

**Honest economics (from `MONETIZATION.md`):** $349 one-time, ~90% margin, single-use (**LTV ≈ one wedding**). The only compounding asset in the whole model is the **referral**. Everything in this plan that looks like "growth" is really "engineer referrals + borrowed audiences," because there is no retention flywheel.

---

## 1. What we are actually launching (ship list)

Grounded in the product-state inventory — what's *live*, not what's on the roadmap.

**LAUNCH WITH (all shippable today):**
- **Free tier** — wedding website + guest list + per-event RSVP + FAQ + schedule + cultural guide. The top of funnel.
- **Base $349 (one-time)** — the thing a stranger pays for: 24/7 **WhatsApp Concierge** (live), **broadcast + collect** (live, `/api/concierge/broadcasts/send`), **flight collection → shuttle assignment** (live), **room assignments** (live), **vendor directory** (~1,259 vendors, live).
- **The hero shareable** — the **reverse-destination cultural guide** for non-Indian guests. This is the moat *and* the marketing asset. No competitor has it.
- **The live demo wedding** — "try it, no signup" sample wedding (already wired).

**HOLD / DON'T SELL ON DAY ONE:**
- **White Glove $599** — needs a human coordinator on standby you cannot staff at 10 hrs/week. Keep as a "talk to us" managed upsell, not a self-serve button.
- **V2 Phera Agent** — unmerged on `feature/phera-agent`, **cannot send guest messages**, no confirmation UI. Do **not** market "an AI that messages your 300 guests." It oversells. Market the *concierge + broadcast*, which are real.
- **Proactive auto-outreach sequences** — the 8-message Meta-template engine is described in the plan but not the live sender. Position save-the-dates as "you send the first one (we generate the wa.me link), we handle the replies."

**The one-sentence launch promise (only claim what ships):**
> *"Phera gives every wedding guest a 24/7 WhatsApp concierge and gives you one dashboard — so you stop answering 'what's the dress code?' at 11pm. Built it for my own wedding."*

---

## 2. The B2C wedge & ICP (go narrow to win)

Cold B2C only works if the target is razor-specific and the message is forwardable.

**Beachhead ICP — "Priya":** Indian-American/British/Canadian, 27–32, engaged, wedding **8–14 months out**, most events **in India**, **280–340 guests** across two sides, a **handful of non-Indian friends** who've never been to an Indian wedding, already gave up on a Google Sheet + WhatsApp group, has a planner who told her *guest-side coordination is on her*.

**Why this person and not "Indian couples":**
- She feels the **non-Indian-guest** pain no one else solves → the cultural guide is a *gift she wants to give*, which makes it shareable.
- She's far enough out (8–14 mo) to buy logistics software, not too far to be unfocused.
- She is conditioned to pay $349 for software (it's 0.1–0.3% of her budget).

**The forwardable moment is the cultural guide, not the dashboard.** The dashboard is why *she* buys; the guide is why her *guests* ask "how did you do this?" — which is your only organic acquisition loop.

---

## 3. ORB channel strategy

Everything funnels back to **owned**. With 10 hrs/week, commit to **one rented channel (Instagram) + the referral loop + the one warm planner.** Ignore the rest until those work.

### Owned (build these — they compound)
- **Waitlist / email list** — a "founding couples" capture on the landing page. Your only durable asset.
- **The live demo wedding** — the single best sales tool; every channel points here.
- **The cultural-guide content library** — reverse-destination guides (visa, what-to-wear-per-event, ceremony explainers). Doubles as SEO and as the in-product feature. Reusable, evergreen, on-brand.
- **Your own-wedding story** — photos, the "here's what broke and how I fixed it by building this" narrative. Use everywhere.

### Rented (pick Instagram; it's where Priya is)
- **IG founder account (primary)** — Reels + carousels. Three content lanes:
  1. **Origin / proof:** "I built a guest-logistics tool for my own Indian wedding. Here's what it did." (real screenshots, real chaos).
  2. **The cultural-guide hook:** "What to tell your non-Indian friends before an Indian wedding" carousels — genuinely useful, highly saveable/shareable, soft Phera tie-in.
  3. **Build-in-public:** short clips of the product, the concierge answering an auntie's "what time is the haldi?".
- **Reddit / Facebook groups (value-first, no spam):** r/IndianWedding, r/ABCDesis, NRI-wedding FB groups. Answer logistics questions for free; link only when asked. 1–2 communities, not ten.
- **(Defer:** TikTok, LinkedIn, X — revisit only after IG is working.)

### Borrowed (the fastest path to a cold stranger trusting you)
- **The one warm planner** — highest-leverage relationship you have. See §9.
- **Free-pilot couples' guests** — every guest who experiences the concierge is a future couple. Build a "powered by Phera / get this for your wedding" footer into the guest site + a referral ask after the wedding.
- **Micro-influencer desi-wedding accounts** — send the cultural guide / free Base access to 5–10 small (5–50k) desi-wedding or NRI-lifestyle creators. TRMNL-style: not a paid sponsorship, just "I built this, thought your audience would find it useful."
- **Newsletter/podcast features** — desi/NRI culture newsletters; pitch the founder-built-it-for-my-own-wedding angle.

---

## 4. The five-phase launch (tailored to the 6-month win bar)

| Phase | What it is | Status / action | Exit signal |
|---|---|---|---|
| **1 — Internal** | De-risk the core | **Mostly done** (your wedding ran on it). Final agent-lab + concierge QA on a fresh sample wedding. | Concierge answers 20 common guest Qs correctly; no embarrassing breaks. |
| **2 — Alpha (free pilots)** | 2–3 friends' weddings run **free**, fully live | **Instrument hours/wedding.** Capture testimonials, screenshots, a 30-sec "guest got an instant answer" clip. Fix what breaks. | 1 strong testimonial + 1 referral intro + a real "hours saved" number. |
| **3 — Beta (waitlist + content)** | Public landing + "founding couples" waitlist; content + DM engine on | Ship waitlist capture. Start IG content cadence + DM outreach. Point everything at the live demo. | 50–100 waitlist signups; 3–5 booked demo calls/DMs in flight. |
| **4 — Early access (first paid stranger)** | Convert a cold/warm couple to a paid Base wedding | "Founding couple" intro offer (see §6). White-glove the first one yourself. | **🎯 First $ from a stranger — the win.** |
| **5 — Full** | Self-serve open + seasonal push | Open checkout, optional Product Hunt (secondary, §8), lean into wedding-season timing. | 3–5 paid weddings; repeatable acquisition motion identified. |

---

## 5. The 6-month timeline (10 hrs/week)

Today = 2026-06-30. Indian wedding season peaks **Nov–Feb** and **Apr–May**; couples planning those weddings are buying **now through Q3**. That's a tailwind — lean into it.

**Month 1 (Jul) — Foundation.** Finish concierge QA. Ship the "founding couples" waitlist + sharpen landing copy to only-what-ships claims (§1). Stand up the IG account, post the origin story. Reach out to the warm planner (§9). Get 1–2 free pilots scheduled.
**Month 2 (Aug) — Proof + content engine.** Run free pilots live; capture testimonials/screenshots/clips. Publish 2 cultural-guide carousels/week + 1 Reel/week. Begin value-first posting in 1–2 communities. First micro-influencer gifts.
**Month 3 (Sep) — Outreach + demo calls.** DM outreach to DIY brides + planners (reuse `marketing/dm-templates.md`, 10/day cap). Drive demo-wedding traffic. Book demo calls. Planner: aim for first co-marketed couple.
**Month 4 (Oct) — First paid stranger.** Convert. Founding-couple offer. Hand-hold the first paid wedding end-to-end. **This is the win-bar month — protect it.**
**Month 5 (Nov) — Repeat + referral loop.** Turn the first wins' guests into the referral engine (in-product ask + post-wedding ask). 2nd–3rd paid weddings. Tighten the upgrade trigger.
**Month 6 (Dec) — Decide.** Review: where did the first dollars actually come from — cold IG, referrals, or the planner? Double down on that one. Optional Product Hunt if a clean story + demo exist.

---

## 6. Offer & pricing for launch

The win is the *first dollar*, so **lower the first-dollar barrier without torching the price anchor** (`MONETIZATION.md` says hold the $349 line long-term).

- **"Founding Couples" offer:** first 5–10 paying weddings at **~$199** (or $349 with the cultural-guide + a free custom domain bundled). Framed as *founding*, time-boxed, in exchange for a testimonial + permission to feature. This is consistent with the documented "first 5–10 weddings at introductory pricing."
- **Keep Free truly free** — website, RSVP, guest list, schedule, cultural-guide preview, FAQ. Gating these kills the funnel.
- **The upgrade trigger is the verb SEND** — surface the $349 prompt at the moment of need: *"Your schedule's ready — let Phera answer your guests' questions 24/7 and chase RSVPs across time zones."* Contextual, earned, never a generic paywall.
- **Don't sell White Glove self-serve.** Offer it as "talk to us" only, and only if you have the hours that month.

---

## 7. Conversion path & instrumentation

**Path:** IG/community/referral → landing → **live demo wedding** → "Start free" → onboard (import guest list = activation) → experience concierge/broadcast → **SEND-trigger upgrade → $349.**

**Metrics that matter (lead → lag):**
- **North star:** first paid stranger (binary, by Month 4–5).
- **Acquisition:** waitlist signups, demo-wedding visits, DM reply rate (target ≥15%, per dm-templates), IG saves/shares (saves > likes for this content).
- **Activation:** % of signups that import a guest list (the real "aha" gate).
- **Conversion:** free→Base rate at the SEND trigger (honest target 2–5% self-serve, higher when you hand-hold).
- **Loop:** referral invites sent per completed wedding (your only compounding number).
- Use the analytics already in onboarding (funnel/abandonment); don't build new dashboards.

---

## 8. Product Hunt (secondary, not the strategy)

PH reaches tech early-adopters, **not** engaged Indian couples — so it's a *credibility/backlink* play, not a customer channel. Only do it in Month 5–6 if a clean demo + the founder story are ready. If you launch: optimize the listing (tagline + the 52-sec brand video from `marketing/brand_context.md` + cultural-guide screenshots), line up your pilot couples + planner to comment, and funnel all traffic to the **waitlist**, not a cold checkout. Treat a good result as PR, not pipeline.

---

## 9. The honest hedge — run the warm planner in parallel

Intellectual honesty (this was the A/B/C fork): the **single fastest path to "first dollar from a stranger" is probably the one warm planner, not cold B2C.** A planner who manages 20–50 NRI weddings/year can put a paying couple in front of you in weeks; cold IG takes months.

So this B2C plan is correct, but **don't run it alone.** In Month 1, pitch the warm planner the **$249/wedding pay-per-wedding** reseller deal (already built, `/planners`). If *they* bring the first paying couple, you've cleared the win bar months early and validated the #1 documented GTM channel — and the B2C content engine keeps compounding underneath as the durable, lower-CAC motion. B2C builds the brand; the planner books the first revenue. Do both.

---

## 10. Risks & honest caveats

- **Cold B2C for a one-time purchase is genuinely hard** — no retention, no compounding except referral. Mitigate with the planner hedge (§9) and the referral loop.
- **Seasonality** — if you miss the Nov–Feb planning window, the next cohort is months out. The Jul–Sep timing is a real tailwind; use it.
- **Don't oversell the agent.** It can't send. Marketing "AI messages your guests" against an unmerged, send-less agent is a credibility risk if a couple tries it. Sell the live concierge + broadcast.
- **White Glove is a labor trap** at 10 hrs/week. Keep it "talk to us," staffed only when you have slack.
- **One warm planner is a single point of failure** — pursue, but don't bet the whole quarter on it; the content engine is the diversification.

---

## 11. Launch checklist (tailored from the launch-strategy skill)

**Pre-launch (Month 1):**
- [ ] Landing claims reconciled to only-what-ships (kill "AI messages 300 guests"; lead with concierge + own-wedding proof)
- [ ] "Founding Couples" waitlist + email capture live
- [ ] Live demo wedding polished (the primary sales asset)
- [ ] IG founder account live; origin-story post published
- [ ] Warm-planner intro requested via the mutual
- [ ] Concierge QA on a fresh sample wedding (20 common Qs)
- [ ] Analytics/funnel tracking confirmed working

**Launch (Months 2–4):**
- [ ] 2–3 free pilots running live; testimonials + screenshots + 1 clip captured
- [ ] Content cadence: 2 cultural-guide carousels + 1 Reel/week
- [ ] DM outreach live (DIY brides + planners, 10/day, ≥15% reply target)
- [ ] 5–10 micro-influencer gifts sent
- [ ] Founding-couple offer ready; first paid wedding hand-held end-to-end

**Post-launch (Months 5–6):**
- [ ] In-product + post-wedding referral ask wired (the only flywheel)
- [ ] Comparison/positioning page vs Joy/Jubilyn/SecondTick (the cultural-guide differentiator)
- [ ] Attribution review: where did the first dollars come from → double down
- [ ] Optional Product Hunt if story + demo are clean

---

*Strategic sources: `BUSINESS_PLAN.md`, `PIVOT-PLAN.md`, `docs/MONETIZATION.md`, `LANDING-REVISION-TRACKER.md`, `marketing/dm-templates.md`, `marketing/brand_context.md`, GTM-council constraints (2026-06-30). Frameworks: launch-strategy (ORB + 5-phase), marketing-ideas.*
