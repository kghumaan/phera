# Phera Platform Pivot: From Wedding Tool → Wedding Operations Service

**Date:** March 20, 2026
**Author:** KV Ghumaan
**Status:** Active — Phase 1 In Progress
**Thesis Source:** [Sequoia Capital — "Services: The New Software"](https://sequoiacap.com/article/services-the-new-software/) by Julien Bek (March 5, 2026)

---

## 1. Why We're Pivoting

### The Sequoia Thesis (TL;DR)

For every $1 spent on software, $6 is spent on services. As AI improves, tool-sellers (copilots) get squeezed — the value migrates to whoever does the work (autopilots). The next massive company will sell outcomes, not seats.

**Two key frameworks:**

**Intelligence vs. Judgment** — Intelligence work is rule-based and codifiable (data collection, outreach, scheduling, follow-ups). Judgment work requires taste and experience (aesthetic vision, family dynamics, crisis management). AI can now handle intelligence work autonomously. Judgment stays human — for now.

**Start with outsourced work as the wedge** — If a task is already outsourced, the buyer has accepted external execution, there's a budget line item, and they're already purchasing an outcome. Outsourced intelligence-heavy tasks are the ideal starting point.

### What This Means for Phera

Phera today is a **tool** — a wedding website builder with RSVP, guest management, and WhatsApp features. This puts us in direct competition with Zola, Joy, The Knot, and WeddingWire — well-funded incumbents in a commoditized space. Every AI model improvement makes our tool features more replicable.

The pivot: **stop selling the tool, start selling the work.** Couples don't want a wedding website — they want their 300 guests coordinated, their travel logistics handled, and their WhatsApp inbox empty. We should deliver that outcome directly.

### The Competitive Gap

We researched the full landscape extensively (7 research papers covering WhatsApp API constraints, pricing, competitors, destination logistics, template design, NRI market, and unofficial API feasibility). Joy has "Smart RSVP." The Knot has vendor matching. Zola has AI task-splitting. WeddingWire has vendor chatbots. Wedflow does WhatsApp logistics but only B2B (sells to planners). Jubilyn does WhatsApp invitations but is RSVP-only. ZeroPaper sends from personal accounts but violates Meta ToS (10M accounts banned/month in India). **None of them are doing the guest logistics work as a B2C WhatsApp-native service.** Nobody uses WhatsApp Flows for in-chat RSVP. Nobody addresses non-Indian guests attending Indian weddings. Nobody charges for outcomes.

This gap is our opportunity.

---

## 2. Where We Are Today (Honest Assessment)

### What We've Built

**Core Platform:**
- Wedding website builder with cultural customization (9+ backgrounds, custom colors)
- Multi-step RSVP form (basic info → account → attendance → plus-one → dietary → team → music)
- PIN-based guest portal with 6 authentication methods
- Multi-event support (Haldi, Mehendi, Sangeet, Vows) with ritual explanations
- Real-time guest wall with Giphy integration

**Guest Logistics (Our Strongest Cards):**
- WhatsApp Concierge agent (reactive — answers guest questions 24/7)
- Transportation/shuttle system with vehicle capacity tracking, pickup coordination, mutual exclusivity
- Flight capture and travel coordination
- Guest management with dietary restrictions, party sizes, wedding side tracking

**Admin Dashboard (15 sections):**
- Overview, Design, Events, Schedule, Travel, FAQ, Details, PIN Entry, Team, Guests, Settings, Registry, Shopping Guide, Coordinator, Task Manager

**AI Features:**
- Build with AI onboarding wizard (Groq/Llama 3.3 70B — 30+ question conversational flow)
- WhatsApp Concierge (OpenAI-powered, knowledge base per wedding)
- Vendor Coordinator (WhatsApp sync, AI conversation summaries)
- Voice-to-Task Manager (Groq transcription + task extraction)

**Pricing (Current — Being Restructured):**
- Free tier: Website, RSVP, guest list, multi-event, PINs, schedule, FAQ, shopping guide
- Pro ($99): Travel coordination, WhatsApp Concierge, voice tasks, registry, premium themes
- Planner ($249/wedding, pay-per-wedding, no subscription): Multi-wedding dashboard, unlimited pro features per wedding

**Tech Stack:**
- Next.js 15 (App Router) + React 19 + TypeScript
- Supabase (Postgres + RLS + Realtime + Auth)
- MUI v7 + Tailwind CSS v4 + Framer Motion
- Meta WhatsApp Business Cloud API (2,000 business-initiated conversations/24hrs)
- Anthropic API, Groq API (Whisper + Llama 3.3 70B), OpenAI API, Gemini API
- Stripe payments, Vercel deployment, Resend email

### What's Strong

The guest logistics infrastructure is genuinely differentiated. The transportation system (vehicle capacity, pickup locations, time ranges, reservations, groups) is more sophisticated than anything competitors offer. The WhatsApp integration is a real asset — no major competitor has direct guest communication at this level. The Build with AI wizard is excellent onboarding UX.

### What's Weak

The product is sprawling — 15 admin sections, 3 pricing tiers, features ranging from shopping guides to voice task managers. It's hard to explain what Phera is in one sentence. We're competing as a tool against companies with 100x our resources. The free tier gives away the core product, making it hard to monetize. The WhatsApp Concierge is reactive (waits for guests to message) when the real value would be proactive (reaches out to guests first).

---

## 3. Where We're Going

### Target Market: NRI-First

Research revealed a critical strategic insight: **NRI (Non-Resident Indian) couples are the primary market, not domestic Indian couples.**

The numbers: 40,000-55,000 NRI weddings happen in India annually. Less than 1% of total volume, but 3-5% of total spend — a $4-6 billion segment. NRI wedding budgets average $60,000-$200,000 (US Indian Americans: $225,000-$285,000). At $349-$599, Phera is 0.1-0.6% of their budget — less than a single shuttle bus rental.

Why NRIs first:
- **Higher willingness to pay.** They earn in USD/GBP/AED, are conditioned to paying for SaaS, and won't flinch at $349-$599. Domestic Indian couples are more price-sensitive.
- **More pain.** NRI couples are 8-12 timezones away from India-side logistics. They can't just call the vendor or visit the venue. Every 15-minute decision becomes a 3-day timezone delay.
- **More non-Indian guests.** NRIs have college friends, work colleagues, and partners from the US/UK who've never been to India. These "reverse destination" guests need cultural bridging that no platform provides — visa guides, ceremony explanations, dress code help, SIM card setup. This is Phera's most defensible feature.
- **Planner referral channel.** 40-60% of NRI weddings use planners (vs 20-30% domestic). Planners are the #1 go-to-market — they want to offload guest logistics. Partner with 15-20 NRI-specialist planners who handle 20-50 weddings/year each.

Key NRI source markets (by priority): US (highest value, $225K-$285K avg), UK, Canada, UAE (high volume but more price-sensitive), Australia, Singapore.

Domestic Indian couples are the secondary market at ₹9,999-₹17,999. We serve everyone, but we lead with NRIs.

### The New Positioning

**Old:** "Destination Wedding, Minus the Chaos" — *Here are tools to plan your wedding yourself.*
**New:** "Your Wedding Operations Team" — *We coordinate your guests so you can focus on the celebration.*

One-sentence pitch: *"Indian weddings are beautiful chaos — 300+ guests, 3-5 days of events, people flying in from everywhere. Phera handles the guest logistics so you can focus on the celebration."*

### Core Philosophy: Don't Take Away The Fun

Wedding planning has fun parts (choosing your vibe, designing the website, curating your aesthetic) and tedious parts (chasing 300 guests on WhatsApp, tracking flights, coordinating shuttles). Phera automates the tedious parts. The fun parts stay with the couple — unless they want us to handle those too.

**Three levels of involvement:**

1. **"I want to do it myself"** — Couple gets full access to customize their website, events, design. Phera handles all guest logistics automation in the background. Perfect for hands-on couples who love the creative process.

2. **"Let AI help me"** — Build with AI (text or voice) creates the website from a conversation. Couple reviews and tweaks. Phera handles everything else. Great for busy couples who want a beautiful result without the hours.

3. **"Work with an expert"** — 1-on-1 session with a Phera team member to nail the couple's vision, translate it into the website and event setup, then Phera handles all coordination. Premium option for couples who want guidance.

This spectrum respects that wedding planning *is* fun for many couples. We don't remove the joy — we remove the chaos.

### What We're Selling

The outcome, not the tool. Specifically:

**Outcome 1: "Every guest is informed and accounted for"**
Phera proactively reaches out to every guest via WhatsApp — from save-the-dates to RSVP requests to logistics collection. Automatic follow-ups for non-responders. RSVPs happen through the couple's beautiful wedding website (the digital invitation for this generation). Everything after RSVP — travel, dietary details, shuttle coordination — happens through WhatsApp.

**Outcome 2: "All travel and transportation is coordinated"**
We track every guest's travel plans, optimize shuttle routes and timing, send reminders, and handle changes — so nobody's stranded and the couple isn't chasing flight info.

**Outcome 3: "Guests are supported 24/7"**
Our WhatsApp Concierge answers guest questions instantly — schedule, venue, dress code, local recommendations — in their language, on their schedule.

**Outcome 4: "Your friends from abroad? We've got them."** *(NEW — Most Defensible Feature)*
Non-Indian guests attending an Indian wedding in India get a WhatsApp-delivered cultural guide: visa info, what to wear to each event (and what NOT to wear), ceremony explanations, airport-to-venue coordination, SIM card setup, food tips, and the reassurance that Indian families will be incredibly welcoming. No competitor addresses this. This is the feature NRI couples will share on Instagram.

**Outcome 5: "The couple sees everything, manages nothing"**
A real-time operations dashboard shows guest response rates, travel status, shuttle capacity, and flags anything that needs attention. The couple has visibility without doing the work. And when something changes — a guest cancels, a time shifts — the couple just messages Phera on WhatsApp and we handle the update.

### What We're NOT Selling (Yet)

- Vendor procurement / sourcing (Phase 2-3, after validation)
- Aesthetic/design services (beyond the 3 tiers above)
- Day-of physical coordination (we recommend local day-of coordinators — see Section 3.1)
- Full wedding planning

We're laser-focused on **guest logistics coordination** — the intelligence-heavy, already-outsourced work that planners spend 40-60 hours on per destination wedding.

### 3.1 The Day-Of Coordination Partnership Model

Day-of coordinators are a well-established category in Indian weddings ($2,500-4,500 typically). They come in 4-6 weeks before the wedding, learn the plan, and manage everything on-site.

This creates a clean split:
- **Phera** handles the intelligence work: guest coordination, travel logistics, communication, timeline management — for weeks/months leading up to the wedding
- **A local day-of coordinator** handles the judgment + physical work: on-site vendor management, crisis handling, ceremony flow, day-of execution

The couple gets planner-quality outcomes at a fraction of the cost. We can eventually build a referral network of vetted day-of coordinators in key cities, but this is a Phase 3+ play.

### 3.2 Complementary Positioning

Not every couple needs a wedding website from us. Some already have one on Zola or Joy. We ask early in onboarding: **"Do you already have a wedding website?"**

- **If yes** → Skip website creation, go straight to guest list import and logistics coordination. Phera complements their existing website.
- **If no** → Build one together (DIY, AI-assisted, or expert-guided). The website becomes the guest-facing invitation and RSVP collection point.

This expands our TAM beyond "couples who need a wedding website" to "any couple who needs guest coordination" — and positions us as additive, not competitive with other platforms.

---

## 4. Specific Platform Changes

### 4.1 Landing Page — Messaging Rewrite

**Design Direction:** Gen Z aesthetic — bold patterns, expressive typography, hyper-personalization. Think Partiful energy, not corporate SaaS. This is a product for the young generation that lives on digital platforms. The landing page should feel like a celebration, not a tool demo.

**Hero Section:**
| Element | Current | Future |
|---------|---------|--------|
| Headline | "Destination Wedding, Minus the Chaos" | "Your Wedding Operations Team" |
| Tagline | "Wedding Planner in your Pocket" | "We coordinate your guests so you can focus on the celebration." |
| Body | "Custom Indian wedding websites, smart RSVPs, 24/7 WhatsApp concierge, and much more — all in one place." | "300+ guests, 3 days of events, people flying in from everywhere. Phera handles the guest logistics — travel coordination, RSVPs, communication, transportation — end to end via WhatsApp." |
| Primary CTA | "Start Planning Free" | "Get Started" |
| Secondary CTA | "Explore Features" | "See How It Works" |

**Features Section — 4 Service Pillars + "And Much More":**

**Pillar 1: "We collect every detail from your guests"**
Proactive WhatsApp outreach collects travel details, flight info, dietary needs, party sizes. Automatic follow-ups for non-responders. Save-the-dates and RSVP requests sent directly to guests on your behalf.
*(Absorbs: RSVP, Multi-Event, Guest Access)*

**Pillar 2: "We coordinate all travel and transportation"**
Track travel plans, optimize shuttles, send reminders, handle changes. Nobody's stranded.
*(Absorbs: Travel Coordination, Transportation)*

**Pillar 3: "We keep every guest informed, 24/7"**
WhatsApp Concierge answers guest questions instantly — schedule, venue, dress code, local recommendations.
*(Absorbs: WhatsApp Concierge, FAQ)*

**Pillar 4: "Your wedding, your vibe"**
We set up a stunning, culturally-aware wedding website as your digital invitation — or let you design it yourself. Three options: do it yourself with full customization, let AI build it from a conversation, or work 1-on-1 with our team.
*(Absorbs: Wedding Website, Build with AI)*

**"And much more" section:**
A single expandable/scrollable section listing additional features:
- Gift registry with Stripe-powered collection
- Vendor coordination with AI chat summaries
- Voice-to-task management
- Shopping guide for guests
- Custom RSVP questions
- Real-time guest wall with GIFs
- Team collaboration with role-based access

**WhatsApp Showcase Section:**
- Show proactive outreach example (Phera messaging a guest first)
- Show the couple sending a voice message to update something ("Hey Phera, Uncle Raj cancelled, take him off the shuttle")
- Shift framing to: "every guest gets a personal concierge — and so do you"

**Three Involvement Levels Section (NEW):**
Showcase the spectrum: DIY → AI-Assisted → Expert-Guided
Make it clear we don't take the fun away — couples choose their level of hands-on involvement.

**FAQ Section — Rewrite for service-oriented questions:**
- "How does the guest coordination work?"
- "What information does Phera collect from my guests?"
- "Do my guests need to download an app?"
- "What if a guest doesn't respond on WhatsApp?"
- "Can I see what Phera is sending to my guests?"
- "I already have a wedding website — can I still use Phera?"
- "Can I customize my wedding website myself?"
- "Do I still need a day-of coordinator?"

**Final CTA:**
"300 guests. 3 days. Zero stress. Let Phera coordinate your guests while you celebrate."

**Footer About Copy:**
"Phera was built by a couple who spent more time coordinating guests than enjoying their own wedding. We built the operations team we wish we'd had."

### 4.2 Pricing — Multi-Currency, Per-Wedding

**Remove the Free tier.** Everything is a paid service. Multi-currency pricing from day one.

**NRI Pricing (USD — primary market):**

| Tier | Price | Guest Count | What's Included |
|------|-------|-------------|-----------------|
| **Phera Base** | $349/wedding | Up to 200 guests | Guest logistics via WhatsApp, proactive outreach, WhatsApp Flows RSVP, 24/7 Concierge, custom wedding website, transportation optimization, Control Tower dashboard |
| **Phera Premium** | $599/wedding | Up to 400 guests | Everything in Base + reverse-destination cultural guides for international guests, WhatsApp concierge during wedding weekend, priority escalation support |
| **Phera Grand** | $799-$999/wedding | 400+ guests | Everything in Premium + dedicated coordination support |

**Domestic India Pricing (INR — secondary market):**

| Tier | Price | Guest Count |
|------|-------|-------------|
| **Phera Base** | ₹9,999/wedding | Up to 200 guests |
| **Phera Premium** | ₹17,999/wedding | Up to 400 guests |
| **Phera Grand** | ₹29,999/wedding | 400+ guests |

**Planner Pricing:**

| Tier | Price | What's Included |
|------|-------|-----------------|
| **Phera for Planners** | TBD (bulk/annual) | Unlimited client weddings, multi-wedding Control Tower, client handoff, white-label option, planner branding, priority support |

Per-wedding pricing aligns with the "selling work" model. At $349-$599, Phera costs less than a single shuttle bus rental ($1K-$5K), less than welcome bags ($1.5K-$5K), and a fraction of day-of coordination ($2.5K-$4.5K). WhatsApp messaging costs per wedding: ~$25 for the full 8-message sequence — negligible.

**For first 5-10 weddings:** Run at introductory/free pricing to validate. Track hours per wedding meticulously.

### 4.3 Onboarding Flow

**Step 1: Role Selection**
- "I'm a Couple" → *"We'll coordinate your guests and handle the logistics"*
- "I'm a Planner" → *"Manage guest logistics across all your client weddings"*

**Step 2: "Do you already have a wedding website?"**
- **Yes** → "Great! We'll complement it by handling all your guest coordination. Let's get your guest list set up."
  - Skip to guest list import
  - Website creation features still accessible if they change their mind
- **No** → "Let's build one! You can design it yourself, let AI create it from a conversation, or work with our team."
  - Continue to wedding setup / Build with AI

**Step 3: Basic Info**
- Keep: couple names, date, venue, location
- Add: **estimated guest count**
- Add: **cultural background / wedding type** (Punjabi-Sikh, South Indian, Gujarati, Hindu, Multi-faith, etc.)

**Step 4: Build with AI → Service Intake (Voice-Enabled)**
The Build with AI wizard stays but gets two key upgrades:

*Voice intake mode:* Instead of typing through questions, the couple can just talk. "We're having a Punjabi-Sikh wedding in Tuscany, 350 guests, mostly coming from Toronto and Delhi, 4-day celebration — Mehendi, Sangeet, Anand Karaj, and reception..." Phera transcribes (Groq Whisper), extracts structured data, and generates a complete starting point — events, schedule, travel sections, cultural context, everything.

*Reframed intro:*
- Current: "Let's build your wedding website!"
- Future: "Tell us everything about your wedding — the more we know, the better we can coordinate."

*Completion message:*
"We've got everything we need. Your guest portal is live and Phera is ready to start reaching out. Let's get your guest list set up."

**Step 5: Guest List Import**

Multiple import paths, presented as options:

1. **Spreadsheet upload** (CSV/XLSX) — "Have a guest list ready? Upload it here." Column mapping UI for name, email, phone, wedding side. *(Already have import infrastructure)*

2. **Manual add / wizard** — "Add guests one by one." Simple form: name, phone number, email (optional), wedding side. Batch-friendly with "Add another" flow. Good for couples building from memory.

3. **Copy-paste from anywhere** — "Paste names, numbers, and emails in any format." AI parses messy text into structured guest data. Handles formats like "Raj Sharma - 9876543210" or "Priya Singh priya@email.com +1-416-555-1234" without requiring a specific template.

4. **Google Contacts integration** (Phase 2) — "Import from your contacts." OAuth to Google Contacts, search/filter, select guests. Stretch goal.

Start with options 1-3. Add Google Contacts when validated.

### 4.4 Admin Dashboard — Sidebar Reorganization

**Current sidebar (15 items, 7 groups):**
Overview, Design, Events, Schedule, Travel, FAQ, Details, PIN Entry, Team, Guests, Settings, Registry, Shopping Guide, Coordinator, Task Manager

**Proposed sidebar (3 groups, operations-first):**

**Group 1: "Operations" (always visible, the hero section)**
| Item | Description | Status |
|------|-------------|--------|
| **Control Tower** | Unified ops dashboard — guest response rates, outreach status, shuttle capacity, escalations, upcoming automated actions | **NEW (replaces Overview)** |
| **Guest List** | Upload/manage guests, view per-guest status and communication history | Existing (enhanced) |
| **Communication Log** | Timeline of all Phera ↔ guest interactions and couple commands across WhatsApp | **NEW** |

**Group 2: "Wedding Setup" (collapsed by default after onboarding)**
| Item | Description | Status |
|------|-------------|--------|
| Wedding Details | Couple info, date, venue | Existing |
| Look & Feel | Colors, backgrounds, theme | Existing (rename from Design) |
| Schedule & Events | Timeline + multi-event config | Existing (merge Schedule + Events) |
| Travel & Stay | Travel cards, accommodation info | Existing |
| PIN Management | Guest access codes | Existing |

**Group 3: "More" (collapsed, power-user features)**
| Item | Description | Status |
|------|-------------|--------|
| FAQ | Guest FAQ management | Existing |
| Registry | Gift collection | Existing |
| Team | Collaborator management | Existing |
| Settings | Advanced config | Existing |

**Removed from sidebar** (code stays, not surfaced):
- Shopping Guide
- Vendor Coordinator (revisit in Phase 2-3)
- Voice-to-Task Manager (concept folded into WhatsApp command channel)

### 4.5 Guest Portal — Minimal Changes

The guest portal needs the **least** change. Guests don't care whether Phera is a tool or a service. Keep PIN entry, home page, schedule, events, travel, transportation, and RSVP flow exactly as built.

**Small copy tweaks only:**
- RSVP form context: guests should feel they're being taken care of by Phera's coordination team
- Add note: "Phera is helping coordinate [Couple Names]'s wedding — reply to this number anytime if you have questions"
- RSVP stays on the website (it's the digital invitation, the couple's personal branding)
- Everything after RSVP (travel, dietary, shuttle, etc.) is handled via WhatsApp

### 4.6 WhatsApp — Two-Way Operations Channel (Key New Capability)

The same WhatsApp business number serves two audiences with different behaviors:

**For guests (outbound coordination):**
- Proactive outreach sequences (save-the-dates, RSVP requests, travel collection, reminders)
- 24/7 Concierge for answering questions
- Utility updates (shuttle assignments, schedule changes, day-of details)

**For the couple / planners / family (inbound command channel):**
- On-demand updates via text or voice: "Uncle Raj cancelled, remove him from the shuttle"
- Real-time changes: "Mehendi artist moved to 2pm, update everyone"
- Information intake: voice messages that Phera transcribes, parses, and incorporates
- Status queries: "How many people have confirmed?" → instant dashboard summary
- Emergency handling: quick changes without needing to open the web app

**Technical approach:** The system identifies whether an incoming message is from a guest (in the `guests` table) or an admin (in the `wedding_admins` table) and routes to different system prompts / capabilities accordingly. Admin messages can trigger data mutations (update guest status, send broadcast, modify schedule). Guest messages are read-only (answer questions, collect information).

---

## 5. What Needs to Be Built (Net New)

### 5.1 Proactive WhatsApp Outreach Engine (Critical — The Core New Capability)

**What it is:** Scheduled WhatsApp template message sends tied to a wedding timeline. Phera initiates contact with guests rather than waiting for them to reach out.

**How WhatsApp outreach works:**
- We have a WhatsApp Business account with **2,000 business-initiated conversations per rolling 24 hours** (confirmed via Meta email, January 2026)
- **Hybrid send model:** Couple sends the initial save-the-date from their personal WhatsApp (via wa.me deep links we generate — high trust, personal touch). All subsequent automated coordination comes from the Phera business number, branded as "Priya & Rahul Wedding" with the couple's photo.
- Initial outreach = **Marketing template** (Meta classifies any first-touch as marketing). Cost: ~₹0.86/message. For 300 guests: ~₹260 total.
- **Reply-first design:** Templates prompt a reply (e.g., "Reply 💍 to confirm!") which opens a **FREE 24-hour service window** for follow-up conversation. This transforms the cost model.
- **WhatsApp Flows** for RSVP: Multi-screen native forms inside WhatsApp. Guest taps "RSVP Now" → fills out attendance, events, dietary, plus-ones — all without leaving WhatsApp. No competitor uses this. Zero friction.
- Follow-up messages = **Utility templates** (₹0.14/message, exempt from frequency caps, 95-99% delivery).
- Total WhatsApp cost per wedding: ~₹2,070 for full 8-message sequence to 300 guests (~$25). Negligible.
- **Unofficial API / QR Linking: We will NOT build this.** ZeroPaper sends from personal accounts but violates Meta ToS. 10M Indian accounts banned/month, 2.6% appeal rate. DPDPA penalties up to ₹250 crore. No path to legitimacy. We build exclusively on the official Business API.
- **Template language: NO Hinglish.** Meta rejects mixed-language templates. We submit separate pure English and pure Hindi versions. Hinglish is fine within free 24hr service windows after a guest replies.

**Template library needed (submit to Meta for approval):**

*Marketing templates (initial outreach):*
- **Save-the-date:** Rich media template with couple's branding/photo + wedding date + location. "Save the date for {couple_names}'s wedding celebration! {date} in {location}. More details coming soon."
- **RSVP request:** "Hi {guest_name}! {couple_names} would love for you to RSVP for their wedding celebration. View the details and respond here: {website_url}"
- **Introduction/logistics:** "Hi {guest_name}, {couple_names} have asked us to help coordinate logistics for their wedding. We'll help with travel details, event schedules, and more. Reply to get started, or say STOP to opt out."
- **Re-engagement nudge:** "Hi {guest_name}, just a reminder — we're coordinating logistics for {couple_names}'s wedding and would love to get your details. Reply anytime."
- **Final deadline reminder:** "Hi {guest_name}, the RSVP deadline for {couple_names}'s wedding is {date}. We'd love to hear from you."

*Utility templates (post-interaction):*
- RSVP confirmation
- Travel detail request (after RSVP confirmed)
- Shuttle/transportation assignment
- Event schedule reminder (week before)
- Day-before logistics summary
- Day-of updates
- Post-wedding thank you

**Outreach sequencing (configurable per wedding):**
- 12-16 weeks → Save-the-date (marketing template, rich media)
- 8-10 weeks → RSVP request with website link (marketing template)
- 7 weeks → RSVP nudge for non-responders
- 6 weeks → Second nudge + escalate persistent non-responders to human
- 5 weeks → Collect travel details from confirmed guests (via WhatsApp conversation)
- 4 weeks → Transportation/shuttle assignment
- 2 weeks → Event schedule reminder
- 3 days → Final logistics summary
- 1 day → Day-of details
- 1 week after → Thank you

**Technical implementation:**
- Vercel Cron Jobs or Supabase Edge Functions with pg_cron for scheduling
- Per-wedding outreach timeline auto-generated from wedding date
- Status tracking per guest: not_contacted → save_the_date_sent → rsvp_requested → rsvp_confirmed → travel_collected → logistics_complete
- Response handling: when guest replies, hand off to existing Concierge AI for natural conversation
- Couple approval gate: before each outreach batch, show the couple what will be sent and let them approve/customize

### 5.2 Control Tower Dashboard (New Admin View)

**Replaces the current Overview page.** The most important screen in the service model.

**Key sections:**
- **Response tracker:** Visual breakdown of guest statuses (not contacted, contacted, responded, confirmed, declined, unresponsive) with progress ring/bar
- **Action queue:** "23 guests haven't responded — next nudge scheduled for tomorrow" / "4 guests need shuttle assignment" / "2 escalations need your attention"
- **Outreach timeline:** Visual timeline showing what's been sent and what's coming up, with dates
- **Travel overview:** Who's booked flights, who hasn't, arrival/departure clustering for shuttle optimization
- **Shuttle capacity:** Current reservations vs. vehicle capacity per event
- **Recent activity feed:** Latest guest interactions and couple commands across WhatsApp

### 5.3 Escalation Queue

**When the AI can't resolve something after N attempts, it surfaces to a human.**

- Guest hasn't responded after 3 WhatsApp attempts → Flag for phone call
- Guest asks a question the Concierge can't answer → Route to couple or Phera team
- Guest has a special request (accessibility, medical, childcare) → Human review
- Simple queue UI in admin dashboard with guest context, conversation history, and suggested action

### 5.4 WhatsApp Admin Command Channel

Allow the couple/planners/family to send commands and information to Phera via WhatsApp:
- Text commands: "Remove Uncle Raj from shuttle" → parse intent, execute, confirm
- Voice messages: transcribe via Groq Whisper → parse intent → execute → confirm
- Status queries: "How many people have confirmed?" → pull from DB → respond with summary
- Route based on sender: guests table → guest Concierge, wedding_admins table → admin command handler

### 5.5 Voice-Enabled Build with AI

Extend the existing Build with AI wizard with voice input:
- Couple taps a microphone button and speaks freely about their wedding
- Groq Whisper transcribes in real-time
- AI extracts structured data: event types, cultural background, location, guest count, dates, travel needs
- System generates a complete starting point: website design, events, schedule, travel sections
- Couple reviews and tweaks rather than building from scratch

### 5.6 Guest List Import Enhancements

**Option 1: Spreadsheet upload** (existing — enhance with column mapping UI)
**Option 2: Manual wizard** ("Add guests one by one" with "Add another" batch flow)
**Option 3: Smart paste** (paste any format, AI parses into structured data)
**Option 4: Google Contacts** (Phase 2 — OAuth integration)

---

## 6. What We're NOT Doing (Deliberate Cuts)

| Idea | Why Not Now |
|------|-------------|
| Generic "projects" data model | Premature abstraction. Build for weddings, prove PMF, then generalize. |
| Cross-vertical expansion (corporate events, film, etc.) | Distraction pre-PMF. File the idea, revisit in 12+ months. |
| Vendor procurement engine | Phase 2-3 at earliest. Skip until guest logistics is validated. |
| Voice AI calling agents | Expensive, complex. Use human phone calls for the 3-5% of unresponsive guests. Automate later. |
| Multi-language AI support | Important but not MVP. Note which languages are needed during first 5-10 weddings, then build. Hindi templates are built from day 1 though. |
| New infrastructure (Inngest, Helicone, Amadeus, Railway) | Use existing stack (Supabase, Vercel Cron, WhatsApp API). Add tools when specific pain points demand them. |
| Full landing page redesign | Messaging-first rewrite now. Full visual redesign (Gen Z / Partiful aesthetic) after service model is validated. |
| Day-of coordinator marketplace | Interesting but Phase 3+. Start with informal referrals. |
| Google Contacts integration | Phase 2. Start with spreadsheet, manual add, and smart paste. |
| **Unofficial WhatsApp API / QR linking** | **Explicitly rejected.** Violates Meta ToS. 10M accounts banned/month in India, 2.6% appeal rate. WhatsApp v. NSO Group ruling creates CFAA precedent. DPDPA penalties up to ₹250 crore. ZeroPaper uses this — their business has no path to legitimacy. Build exclusively on official Business API. |
| **Hinglish templates** | **Meta will reject them.** Mixed-language templates violate Meta's template policy. Submit separate pure English + pure Hindi versions. Hinglish is fine within free 24hr service windows. |
| INR-only pricing | NRIs are the primary market. Multi-currency from day one: $USD + ₹INR. |

---

## 7. Implementation Sequence

### Phase 0: Validate Demand (This Week — No Code)

**Talk to people before building anything.**
- Reach out to 10-15 wedding planners/coordinators (Instagram DMs, WedMeGood, WeddingWire India)
- Book 3-5 calls. Offer $50-100 for 30 minutes.
- Ask operational questions:
  - How do you currently collect flight details and travel info from 200+ guests?
  - What tools do you use — WhatsApp groups, Google Forms, email chains, phone calls?
  - How many follow-ups does the average guest need?
  - What percentage just never respond until the last minute?
  - What's the most time-consuming part of guest coordination?
  - How do you handle guests who don't speak English or aren't tech-savvy?
  - How far in advance do you start, and what does the week-by-week timeline look like?
- Also talk to 3-5 couples who recently had large Indian weddings
- **Goal:** Document the real guest coordination workflow. This becomes the product spec.

### Phase 1: Messaging Pivot + Core Service Build (2-4 Weeks) ← WE ARE HERE

**Landing page rewrite:**
- New hero copy, 4 service pillars + "and much more", pricing, FAQ, CTAs
- Add "three levels of involvement" section
- Remove free tier, set up service pricing
- Update onboarding copy/framing
- Add "Do you already have a wedding website?" question in onboarding

**Build the outreach engine:**
- WhatsApp marketing + utility templates submitted to Meta for approval
- Outreach sequencing system (Vercel Cron + wedding timeline)
- Per-guest status tracking (not_contacted → save_the_date_sent → rsvp_requested → rsvp_confirmed → travel_collected → logistics_complete)
- Response handling → hand off to existing Concierge AI
- Save-the-date and RSVP request outreach as initial features

**Build the Control Tower:**
- New admin dashboard view replacing Overview
- Guest response tracking, action queue, outreach timeline
- Escalation queue for human handoff

**Admin sidebar reorganization:**
- Three groups: Operations, Wedding Setup, More
- Control Tower as the hero page

**WhatsApp admin command channel:**
- Route incoming messages based on sender (guest vs admin)
- Parse admin text/voice commands and execute changes
- Confirm actions back via WhatsApp

**Guest list import improvements:**
- Enhance spreadsheet upload with column mapping
- Add manual "Add guest" wizard with batch flow
- Add smart paste (AI parses any format)

### Phase 2: First 5-10 Real Weddings (2-3 Months)

- Offer the service to real couples at introductory pricing
- KV personally handles all escalations (human in the loop)
- Run outreach sequences on real guest lists
- Learn what breaks:
  - What do guests actually ask?
  - Where does the AI fail?
  - What information is missing from the knowledge base?
  - How do non-tech-savvy guests react?
  - What's the actual response rate per outreach attempt?
  - Which languages keep coming up?
- Track time spent per wedding → determines unit economics and pricing
- Refine templates and sequences based on real data

### Phase 3: Automate and Expand (After Validation)

Based on learnings from Phase 2:
- Multi-language support (build for the languages that actually came up)
- Voice AI agent for unresponsive guests (if human calls were a significant time sink)
- Google Contacts integration (if couples request it)
- Voice-enabled Build with AI (if the onboarding friction is a barrier)
- Gen Z / Partiful visual redesign of landing page and guest portal
- Day-of coordinator referral network in key cities
- Vendor procurement pilot in 2-3 cities (if couples are asking for it)
- Consider adding infrastructure tools (Inngest, etc.) only if cron jobs become unwieldy

### Phase 4: Scale (6-12 Months Out)

- Formalize Planner tier based on planner interest signals
- Expand to non-destination Indian weddings if the model works
- Pricing optimization based on unit economics data
- Consider whether architecture should generalize (only with strong cross-vertical signal)

---

## 8. Key Decisions Made

- [x] Pivot from tool to service (sell the work, not the tool)
- [x] Focus exclusively on weddings — no cross-vertical work yet
- [x] Build on existing wedding-specific schema — no generic abstraction
- [x] Remove free tier — everything is a paid service
- [x] Keep Planner tier as "Super Pro" for multi-wedding management
- [x] Use existing tech stack — no new infrastructure before PMF
- [x] Marketing templates for initial WhatsApp outreach (stop fighting Meta's utility classification)
- [x] Messaging-first landing page rewrite, not full redesign
- [x] Customer discovery before building (talk to planners + couples this week)
- [x] Manual operations for first 5-10 weddings (KV as human-in-the-loop)
- [x] RSVP stays on the wedding website (digital invitation with personal branding)
- [x] WhatsApp handles everything post-RSVP (travel, logistics, coordination)
- [x] Three levels of couple involvement (DIY, AI-assisted, expert-guided)
- [x] "Do you already have a website?" as a key onboarding question
- [x] WhatsApp as two-way channel (outbound to guests, inbound commands from couple)
- [x] Don't remove the fun parts of wedding planning — automate the tedious parts
- [x] Save-the-dates and RSVP request outreach are features we offer
- [x] "And much more" section on landing page for additional features
- [x] **NRI couples are the primary market** — lead with US Indian Americans, then UK/Canada/UAE. Domestic India is secondary.
- [x] **Multi-currency pricing:** $349/$599 USD (NRI) + ₹9,999/₹17,999 INR (domestic)
- [x] **No unofficial WhatsApp API / QR linking** — build exclusively on official Business API. ZeroPaper's approach violates ToS, 10M bans/month, no path to legitimacy.
- [x] **WhatsApp Flows for RSVP** — native multi-screen forms inside WhatsApp. No competitor uses this. Major differentiator.
- [x] **Hybrid outreach model** — couple sends first save-the-date personally (wa.me deep links), all automation via Business API with wedding-branded profile ("Priya & Rahul Wedding")
- [x] **No Hinglish in templates** — Meta rejects mixed-language. Submit separate pure English + pure Hindi versions.
- [x] **Reply-first template design** — prompt replies to open free 24hr service windows, transforming cost model
- [x] **Reverse-destination guest experience** = most defensible feature. Cultural guides, visa help, dress code for non-Indian guests.
- [x] **Planner referrals** = #1 go-to-market channel. Partner with 15-20 NRI-specialist planners.

## 9. Open Questions

- [ ] Planner tier pricing model (per-wedding bulk discount vs. annual subscription)
- [ ] How to handle weddings where couple wants logistics service but already has a planner? (Likely: Phera handles guest logistics, planner handles vendor/design)
- [ ] What's the right SLA for guest response times via Concierge?
- [ ] When to hire first ops person to handle concurrent weddings?
- [ ] Expert-guided tier pricing and who staffs it initially?
- [ ] Should save-the-dates be an upsell or included in base price?
- [ ] How to provision per-wedding WhatsApp phone numbers at scale? (Meta Embedded Signup for dedicated numbers vs. shared number with context switching)
- [ ] Which 15-20 NRI-specialist planners to approach first for referral partnerships?
- [ ] SEO strategy for "NRI wedding planning" content — who owns this?

---

## 10. The North Star

We're not building a wedding website platform. We're building the operations team that every couple wishes they had. The wedding website, RSVP system, and WhatsApp integration are how we deliver the service — not the product itself.

The test for every feature decision: **"Does this help us coordinate guests better, or is it a distraction?"**

And the design test: **"Would a Gen Z couple planning their dream Indian wedding feel excited to use this, or does it feel like enterprise software?"**

---

*Document reflects strategic discussions as of March 20, 2026, informed by 7 research papers: (1) How wedding planners coordinate 200+ guests, (2) WhatsApp Business API constraints, (3) Pricing & unit economics, (4) Competitive landscape, (5) Destination-specific logistics, (6) WhatsApp template design best practices, (7) NRI wedding market analysis, (8) WhatsApp unofficial API / QR linking feasibility. Phase 0 (customer discovery) and Phase 1 (build) are running in parallel.*
