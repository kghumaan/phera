# Phera Pivot — Development Roadmap

**Purpose:** Step-by-step engineering tasks for the service pivot. Pass this to Claude Code and work through sequentially.
**Branch:** All changes go to `develop` branch. Create it from `main` if it doesn't exist.
**Testing:** Every task includes test requirements. Use Vitest (already configured). Update existing tests if changes break them.
**Reference:** See `PIVOT-PLAN.md` for full strategic context.

---

## Research-Backed Context (Read This First)

Seven research papers inform this roadmap. Key constraints and findings that affect every task:

**WhatsApp API Constraints (Critical):**
- Marketing messages deliver at ~50% for cold blasts due to Meta's per-user frequency cap (~2 marketing templates/day from ALL businesses combined). Well-targeted opt-in audiences still hit 70-90%.
- Error 131049 = frequency cap hit. Do NOT retry immediately — wait 24+ hours. Our scheduler must handle partial delivery gracefully.
- Error 131050 = user opted out. NEVER retry. Mark guest as opted out immediately.
- Quality rating is existential: a single bad campaign can trigger a downgrade taking weeks to recover. Warm up new campaigns gradually.
- Utility messages deliver at 95-99%. Maximize utility categorization for post-interaction messages.
- Optimal India send window: 9-11 AM for awareness/informational, 5-7 PM for action-oriented. Tue-Thu are highest engagement days. Avoid Mondays and post-9 PM.
- A 200 OK from Meta only confirms acceptance, NOT delivery. Track actual delivery via webhooks.
- Default throughput: 80 messages/second (scalable to 1,000 MPS at higher tiers).
- Phone number tiers: 250 (unverified) → 1K → 10K → 100K → Unlimited. Tier upgrade checked every 6 hours. Requires sustained 50%+ capacity usage + high quality.
- Template approval rejects ~47% of first-time submissions. Plan for iteration.

**CRITICAL: Template Language Rules:**
- **Hinglish templates WILL BE REJECTED by Meta.** Meta explicitly prohibits mixed-language templates. Hinglish is not a recognized language code. Bilingual templates (English + Hindi in one message) are also rejected.
- Create SEPARATE pure-language versions: English (en) and Hindi (hi) at minimum.
- Hindi transliteration in Roman script (e.g., "Aapka order dispatch ho gaya hai" submitted as English) is a gray area — some pass, some don't. Don't rely on it.
- Within the free 24-hour service window (after a guest replies), you CAN use Hinglish freely in conversational messages. The constraint is only on outbound templates.
- Performance data: Hindi templates see +20-40% engagement vs English in Tier 2/3 cities. Tamil/Telugu/Kannada see +30-40% in South India.

**Template Design Best Practices (Engagement Hierarchy):**
- Carousel templates (2-10 swipeable cards): ~2.5x CTR vs standard. Perfect for multi-event weddings (show Mehendi, Sangeet, Wedding, Reception in one message). Marketing category only (₹0.86/msg).
- Image + CTA button: Highest measurable conversions. Tappable image headers link to first CTA button URL.
- Quick Reply buttons (up to 3): 2-3x CTR vs plain text. Ideal for RSVP Yes/No/Maybe.
- Text + button: Strong baseline, far outperforms plain text alone.
- Plain text: ~15% CTR — lowest performing. Never send plain text templates.
- Image header specs: JPEG/PNG, max 5MB (2MB recommended), 1125×600px or 1024×512px (~2:1 ratio).
- Video headers: MP4/3GPP, max 16MB (keep under 10MB for Tier 2/3 networks). Auto-play muted.
- **Reply-first design is critical:** A marketing template that prompts a reply (e.g., "Reply 💍 to confirm!") opens a FREE 24-hour service window. All follow-up messages within that window are free. This transforms the cost model.
- Realistic CTR benchmarks: 12-25% for marketing (not the 45-60% BSP marketing claims). Tata CLiQ verified: 57% CTR with personalized product images + CTA buttons.

**WhatsApp Flows (Major Differentiator — No Competitor Uses This):**
- Interactive, multi-screen form experiences built directly inside WhatsApp chats — native mobile forms without leaving the app.
- Perfect for RSVP: collect attendance, dietary preferences, plus-ones, event selection across multiple screens.
- Triggered via CTA buttons in template messages. Data flows to Phera backend in real time.
- No app installation required by guests. Zero friction.
- No Indian wedding platform currently offers WhatsApp Flows for RSVP.

**Unofficial WhatsApp API / QR Linking — DO NOT BUILD:**
- Sending from a couple's personal WhatsApp number via QR linking (like ZeroPaper) violates Meta ToS.
- Meta bans ~10 million Indian accounts per month. Ban appeal success rate: 2.6%.
- WhatsApp v. NSO Group ruling (Dec 2024) established CFAA precedent for unauthorized access.
- DPDPA 2023 penalties up to ₹250 crore for unauthorized data processing.
- ZeroPaper's model has no path to legitimacy and no recourse when Meta shuts it down.
- **Our approach:** Official Business API with wedding-branded number ("Priya & Rahul Wedding") + wa.me deep links for the couple to send the initial personal-touch save-the-date from their own number manually.

**DPDPA 2023 Compliance (Build In From Day 1):**
- Full enforcement May 2027, but build consent properly now.
- Every first WhatsApp message needs explicit opt-in after clear notice (what data, what purpose, privacy link).
- Consent must be offered in English + any of 22 scheduled languages (Hindi at minimum).
- Data retention: erase guest data when wedding purpose is fulfilled or consent withdrawn.
- Breach notification: 72 hours to Data Protection Board + affected individuals.
- Children's data (<18): requires verifiable parental consent.
- India's new Telecom Cybersecurity Amendment Rules (Nov 2025): SIM-binding and 6-hour web session logout requirements — reinforces building on official API only.

**Target Market — NRI-First Strategy:**
- 40,000-55,000 NRI weddings happen in India annually. Less than 1% of volume but 3-5% of total spend ($4-6 billion).
- NRI wedding budgets: $60K-$200K average. US Indian Americans: $225K-$285K. 4-20x domestic.
- At $349-$599, Phera is 0.1-0.6% of NRI wedding budget — less than a single shuttle bus rental.
- Lead with US-based Indian Americans (highest budgets, most distance from India logistics, most non-Indian guests). Then UK, Canada, UAE.
- 40-60% of NRI weddings use planners vs 20-30% domestic — planner referral is the #1 go-to-market channel.
- No platform offers WhatsApp-native B2C guest logistics for NRIs. Wedflow (closest) is B2B/planner-only.
- "Reverse destination" guests (Western friends attending Indian weddings) = most defensible feature. Visa guides, cultural briefings, dress code help, airport coordination.
- Multi-currency pricing from day one: $349/$599 USD (NRI) + ₹9,999/₹17,999 INR (domestic).

**Pricing Validation:**
- NRI market: $349 base / $599 premium is a non-decision at NRI budget levels (0.1-0.6% of spend).
- Domestic India: ₹9,999 base / ₹17,999 premium. Still 1-3% of budget for middle market.
- VivaHit proves couples pay ₹2,500-₹10,000 for just digital tools (3,000-4,000 weddings served, $530K raised at $4M valuation).
- Per-wedding model validated by Meragi (₹48 crore GMV) and The Wedding Company (profitable at 4% of budget).
- Consider $799-$999 tier for 400+ guest weddings.
- WhatsApp messaging cost per wedding: ~₹2,070 for 300 guests over full 8-message sequence ($25). Negligible.

**Competitive Landscape:**
- No dominant player exists. VivaHit leads (~4,000 weddings, $530K raised) but is app-first, not WhatsApp-native.
- Wedflow (wedflow.in): Closest feature-set — WhatsApp RSVP, AI travel ticket reading, hotel dashboards, logistics. Serves 100+ planners. BUT: B2B only (sells to planners, not couples). Backend is Google Sheets.
- Jubilyn (jubilyn.com): WhatsApp-native invitations with RSVP. Founded by NRI couple who planned 450-guest Tamil wedding in Singapore. Early stage, free tier, RSVP-focused only.
- Wedd.AI: Claims AI-powered wedding planning + WhatsApp RSVPs. First 100 users. Early stage vaporware.
- SecondTick: Bangalore-based, dedicated wedding RSVP chatbots on WhatsApp Business API, ₹1,499/month. Claims 99% RSVP rate for 250-guest Goa wedding.
- ZeroPaper: 85% RSVP via unofficial personal-number sending. Operationally indefensible (see above). No path to legitimacy.
- Nobody does: B2C WhatsApp-native logistics coordination (not just RSVP) + family liaison support + destination knowledge + WhatsApp Flows RSVP.

**Indian Wedding Guest Behavior:**
- 57.6% of guests respond within 5 weeks; Week 3 is the biggest response week.
- 20-40% of guests ghost entirely. Two follow-ups (10 days + 48 hours before deadline) yield 31% higher confirmation.
- "RSVP culture doesn't exist in India" — frame outreach as "help us prepare for you" not "please confirm."
- Family liaison system is universal: tech-savvy relative coordinates for 5-15 family members. Design for this.
- "+1 becomes +5" — uninvited extras showing up is common. Build headcount flexibility.
- 57% of Indian couples use WhatsApp to announce weddings — it's the default channel.

**Destination-Specific Knowledge:**
- Thailand: 60-day visa-free for Indians. TDAC required 72 hours before arrival.
- Bali: VoA IDR 500K + tourism levy IDR 150K. Money changers DON'T accept INR — guests must convert to USD first.
- Sri Lanka: Free ETA for Indians. Best value destination.
- Goa: NO Ola/Uber — taxi union monopoly. Shuttle coordination is mandatory.
- Udaipur: Only ~20 daily flights, prices spike 2-3x in wedding season. Many NRI guests fly to Ahmedabad and drive.
- Jaipur: Best connectivity (74 flights/day). Vande Bharat from Delhi in 3hr 37min.
- "Reverse destination" (NRI wedding in India with international guests): Non-Indian guests need e-Visa guidance, vaccination info, SIM card setup, cultural briefings (ceremony etiquette, dress code per event, tipping, gift customs), ground transport help, food safety tips. This is Phera's most defensible feature.

---

## Setup

```bash
# Create develop branch if it doesn't exist
git checkout -b develop || git checkout develop
git pull origin develop 2>/dev/null || true
```

---

## Task 1: Database Schema — Guest Outreach Status Tracking

**Goal:** Add outreach status tracking to guests so we can track where each guest is in the communication lifecycle.

**Files to modify:**
- Create new migration: `migrations/YYYYMMDD_guest_outreach_status.sql`

**Schema changes:**
```sql
-- Add outreach tracking columns to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS outreach_status TEXT DEFAULT 'not_contacted'
  CHECK (outreach_status IN ('not_contacted', 'save_the_date_sent', 'rsvp_requested', 'rsvp_confirmed', 'travel_collected', 'logistics_complete', 'unresponsive'));
ALTER TABLE guests ADD COLUMN IF NOT EXISTS outreach_last_contacted_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS outreach_attempt_count INTEGER DEFAULT 0;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS outreach_next_action TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS outreach_next_action_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS whatsapp_opted_out BOOLEAN DEFAULT FALSE;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS contact_type TEXT DEFAULT 'guest'
  CHECK (contact_type IN ('guest', 'admin', 'family'));

-- Family liaison system (research-backed: universal pattern in Indian weddings)
-- A tech-savvy family member coordinates for 5-15 relatives
ALTER TABLE guests ADD COLUMN IF NOT EXISTS is_family_liaison BOOLEAN DEFAULT FALSE;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS liaison_for UUID[] DEFAULT '{}';
-- liaison_for contains guest IDs this person reports on behalf of

-- Expanded guest logistics data (research shows planners need far more than RSVP)
-- Using JSONB to keep it flexible without excessive columns
ALTER TABLE guests ADD COLUMN IF NOT EXISTS logistics_data JSONB DEFAULT '{}'::jsonb;
-- logistics_data structure:
-- {
--   passport_name: string,          -- for international destination weddings
--   visa_status: 'not_needed' | 'applied' | 'approved' | 'na',
--   hotel_booking_status: 'not_booked' | 'booked' | 'confirmed',
--   hotel_booking_ref: string,
--   hotel_check_in: date,
--   hotel_check_out: date,
--   arrival_city: string,            -- where they're traveling from
--   departure_city: string,
--   emergency_contact_name: string,
--   emergency_contact_phone: string,
--   needs_airport_transfer: boolean,
--   sim_card_needed: boolean,
--   medical_considerations: string,
--   language_preference: 'en' | 'hi' | 'other',
-- }

-- DPDPA 2023 compliance fields
ALTER TABLE guests ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS consent_language TEXT DEFAULT 'en';
ALTER TABLE guests ADD COLUMN IF NOT EXISTS consent_withdrawn_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ;
-- data_retention_until should default to wedding_date + 90 days

-- Create outreach_events table for logging all outreach activity
CREATE TABLE IF NOT EXISTS outreach_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,  -- text slug, matches guests.wedding_id (no weddings table exists)
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('template_sent', 'message_received', 'conversation_started', 'info_collected', 'escalated', 'opted_out', 'status_changed')),
  template_name TEXT,
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'phone', 'manual')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create outreach_sequences table for per-wedding outreach configuration
CREATE TABLE IF NOT EXISTS outreach_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,  -- text slug, no FK (no weddings table exists)
  sequence_type TEXT NOT NULL CHECK (sequence_type IN ('save_the_date', 'rsvp_request', 'rsvp_nudge', 'travel_collection', 'shuttle_assignment', 'schedule_reminder', 'day_before', 'day_of', 'thank_you')),
  template_name TEXT NOT NULL,
  days_before_wedding INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'completed', 'skipped')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  target_statuses TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create escalations table
CREATE TABLE IF NOT EXISTS outreach_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL,  -- text slug, no FK (no weddings table exists)
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  context JSONB,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_outreach_events_wedding ON outreach_events(wedding_id);
CREATE INDEX idx_outreach_events_guest ON outreach_events(guest_id);
CREATE INDEX idx_outreach_sequences_wedding ON outreach_sequences(wedding_id);
CREATE INDEX idx_outreach_escalations_wedding ON outreach_escalations(wedding_id, status);
CREATE INDEX idx_guests_outreach_status ON guests(wedding_id, outreach_status);
```

**Apply migration:** Run against Supabase (check existing migration pattern in `/migrations/` directory).

**Tests to create:** `tests/outreach-schema.test.ts`
- Test that outreach_status enum values are valid
- Test default values on new guest creation
- Test outreach_events insertion
- Test outreach_sequences creation with valid/invalid types

---

## Task 2: Outreach Service Layer

**Goal:** Create the service layer for managing guest outreach — status updates, sequence generation, and event logging.

**Files to create:**
- `lib/supabase/outreach-service.ts`

**Functions to implement:**

```typescript
// Core outreach service
export const outreachService = {
  // Generate outreach sequence for a wedding based on wedding date
  generateSequence(weddingId: string, weddingDate: Date): Promise<OutreachSequence[]>

  // Get all guests with their outreach status for a wedding
  getGuestOutreachStatuses(weddingId: string): Promise<GuestOutreachStatus[]>

  // Update a guest's outreach status
  updateGuestStatus(guestId: string, status: OutreachStatus, details?: object): Promise<void>

  // Log an outreach event
  logEvent(event: OutreachEvent): Promise<void>

  // Get outreach events for a guest (communication history)
  getGuestEvents(guestId: string): Promise<OutreachEvent[]>

  // Get all outreach events for a wedding (communication log)
  getWeddingEvents(weddingId: string, limit?: number): Promise<OutreachEvent[]>

  // Get pending sequences (what needs to be sent today)
  getPendingSequences(weddingId?: string): Promise<OutreachSequence[]>

  // Mark sequence as sent
  markSequenceSent(sequenceId: string): Promise<void>

  // Create escalation
  createEscalation(escalation: EscalationInput): Promise<void>

  // Get open escalations for a wedding
  getEscalations(weddingId: string, status?: string): Promise<Escalation[]>

  // Resolve escalation
  resolveEscalation(escalationId: string, resolvedBy: string): Promise<void>

  // Get outreach summary stats for a wedding (for Control Tower)
  getOutreachSummary(weddingId: string): Promise<OutreachSummary>
}
```

**Types to define** (in `lib/types/outreach.ts` or inline):
```typescript
type OutreachStatus = 'not_contacted' | 'save_the_date_sent' | 'rsvp_requested' | 'rsvp_confirmed' | 'travel_collected' | 'logistics_complete' | 'unresponsive'

interface OutreachSummary {
  total_guests: number
  not_contacted: number
  save_the_date_sent: number
  rsvp_requested: number
  rsvp_confirmed: number
  travel_collected: number
  logistics_complete: number
  unresponsive: number
  escalations_open: number
  next_scheduled_action: { type: string; date: Date; target_count: number } | null
}
```

**Tests to create:** `tests/outreach-service.test.ts`
- Test sequence generation based on wedding date (correct dates, correct types)
- Test status transitions (valid and invalid)
- Test event logging
- Test summary stats calculation
- Test escalation creation and resolution
- Mock Supabase client calls

---

## Task 3: WhatsApp Template Message Sending

**Goal:** Add the ability to send WhatsApp template messages (marketing + utility) to guests, alongside the existing free-form message capability. Includes carousel templates, reply-first design, and WhatsApp Flows RSVP integration.

**Files to modify:**
- `lib/whatsapp/` — add template sending functions

**Files to create:**
- `lib/whatsapp/outreach-templates.ts` (rename from templates.ts to avoid conflict with existing templates.ts)

**Implementation:**

```typescript
// lib/whatsapp/outreach-templates.ts

// IMPORTANT: Each template needs BOTH English (en) and Hindi (hi) versions.
// Hinglish is NOT allowed in templates — Meta will reject mixed-language content.
// Hinglish is fine in free-form messages within 24-hour service windows.

// Template definitions (these match what's submitted to Meta)
// Every template MUST include interactive buttons — 2-3x engagement vs plain text.
export const OUTREACH_TEMPLATES = {
  // Marketing templates (for first-touch outreach)
  // DESIGN PRINCIPLE: Prompt a reply to open free 24hr service window.
  SAVE_THE_DATE: {
    name: 'save_the_date_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],  // Submit BOTH to Meta
    components: ['header_image', 'body', 'footer', 'quick_reply_buttons'],
    // Image header: 1125×600px JPEG/PNG, max 2MB recommended
    // Quick Reply: "I'll be there! 💍" / "Tell me more" — BOTH trigger service window
  },
  RSVP_REQUEST: {
    name: 'rsvp_request_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    components: ['header_image', 'body', 'quick_reply_buttons', 'cta_url_button'],
    // Quick Reply: "Yes, attending! 🎉" / "Can't make it 😢" / CTA: "View Details & RSVP"
  },
  // Carousel template: Multi-event invitation (swipeable cards)
  // Each card = one event (Mehendi, Sangeet, Wedding, Reception) with own image + CTA
  // Marketing only. Up to 10 cards. ~2.5x CTR vs standard templates.
  MULTI_EVENT_INVITE: {
    name: 'multi_event_invite_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    components: ['carousel_cards'],  // 2-10 cards, each with image + body + CTA button
    // All cards must use same button type
  },
  LOGISTICS_INTRO: {
    name: 'logistics_intro_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    components: ['body', 'quick_reply_buttons'],
    // Quick Reply: "Let's go! 👍" / "Tell me more" — triggers service window for free follow-up
  },
  NUDGE: {
    name: 'gentle_nudge_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    components: ['body', 'quick_reply_buttons'],
  },
  THANK_YOU: {
    name: 'thank_you_v1',
    category: 'MARKETING',
    languages: ['en', 'hi'],
    components: ['header_image', 'body'],  // Wedding photo header
  },
  // Utility templates (for post-interaction follow-ups — ₹0.14 vs ₹0.86)
  // Exempt from frequency caps. 95-99% delivery rate.
  RSVP_CONFIRMATION: {
    name: 'rsvp_confirmed_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    components: ['body'],
  },
  TRAVEL_REQUEST: {
    name: 'travel_details_request_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    components: ['body', 'cta_url_button'],  // CTA → WhatsApp Flow for travel form
  },
  SHUTTLE_ASSIGNMENT: {
    name: 'shuttle_assignment_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    components: ['body', 'location_header'],  // Location pin for pickup point
  },
  SCHEDULE_REMINDER: {
    name: 'schedule_reminder_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    components: ['body', 'document_header'],  // PDF itinerary attachment
  },
  DAY_BEFORE_SUMMARY: {
    name: 'day_before_summary_v1',
    category: 'UTILITY',
    languages: ['en', 'hi'],
    components: ['body', 'location_header'],
  },
  // Reverse-destination template for international/non-Indian guests
  CULTURAL_GUIDE: {
    name: 'cultural_guide_v1',
    category: 'UTILITY',
    languages: ['en'],  // English only — for non-Indian guests
    components: ['body', 'document_header'],  // PDF cultural guide attachment
  },
} as const

// Send a template message to a guest
export async function sendTemplateMessage(
  phoneNumber: string,
  templateName: string,
  languageCode: string,
  components: TemplateComponent[] // header params, body params, button params
): Promise<SendResult>

// Send a batch of template messages (with rate limiting and frequency cap handling)
export async function sendBatchTemplateMessages(
  messages: TemplateBatchItem[],
  rateLimit?: number // messages per second, default 80 (Meta's limit)
): Promise<BatchSendResult>
// IMPORTANT: BatchSendResult must track per-message status including:
// - delivered: Meta accepted AND webhook confirmed delivery
// - accepted: Meta accepted (200 OK) but delivery not yet confirmed
// - frequency_capped: Error 131049 — retry next day, NOT immediately
// - opted_out: Error 131050 — NEVER retry, mark guest as opted out
// - failed: Other errors — log and investigate

// Check if a guest is within the 24-hour service window
export async function isInServiceWindow(guestPhone: string, weddingId: string): Promise<boolean>

// Track delivery status from webhook callbacks (200 OK ≠ delivered)
export async function handleDeliveryWebhook(
  messageId: string,
  status: 'sent' | 'delivered' | 'read' | 'failed',
  errorCode?: number
): Promise<void>

// Quality monitoring — track block rates and report rates per wedding/template
export async function getQualityMetrics(weddingId?: string): Promise<QualityMetrics>
// QualityMetrics: { sent, delivered, read, blocked, reported, deliveryRate, readRate }
```

**WhatsApp Business API call format** (for the send function):
```
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "to": "{guest_phone}",
  "type": "template",
  "template": {
    "name": "{template_name}",
    "language": { "code": "en" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "{guest_name}" },
          { "type": "text", "text": "{couple_names}" }
        ]
      }
    ]
  }
}
```

**Important:** Use the same WhatsApp phone number ID and token already configured in the existing webhook handler. Check `.env` / `.env.local` for `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, etc.

**Tests to create:** `tests/whatsapp-templates.test.ts`
- Test template message payload construction
- Test batch sending with rate limiting (mock timers)
- Test service window check logic
- Test error handling for invalid phone numbers, failed sends
- Mock the Meta API calls

---

## Task 4: WhatsApp Webhook — Context-Aware Routing

**Goal:** Modify the existing webhook handler to route messages differently based on whether the sender is a guest or an admin/couple. Also update the Concierge AI to handle logistics collection after template replies.

**Files to modify:**
- `app/api/whatsapp/webhook/route.ts`
- `lib/whatsapp/ai-handler.ts`

**Changes to webhook route.ts:**

1. After phone number lookup, check if sender is in `wedding_admins` table (not just `guests`)
2. If admin → route to admin command handler (placeholder for Phase 1.5, for now just log and respond with "Admin commands coming soon")
3. If family liaison (`is_family_liaison = true`) → route to liaison-aware AI handler that can accept multi-guest updates ("Auntie Meena and Uncle Raj are both coming, she's vegetarian, they land Thursday 3pm" → parse and update multiple guest records)
4. If regular guest → continue to existing AI handler BUT with enhanced context
5. Track consent: if this is the guest's first reply, record `consent_given_at` timestamp (their reply = implicit opt-in to the conversation)

**Changes to ai-handler.ts:**

1. Add outreach context to the system prompt:
   - What is this guest's current outreach_status?
   - What information are we still missing from them?
   - What was the last template we sent them?

2. Update system prompt to include logistics collection behavior:
   - If guest's `outreach_status` is `rsvp_confirmed` and travel info is missing → gently collect travel details
   - If guest sends a generic reply ("hi", "yes", "sure") → take the lead and start collecting
   - If guest asks a question → answer it first, then pivot to collection
   - After collecting info → update guest record and outreach_status via outreach service

3. Add structured data extraction from guest responses:
   - Parse flight info, dates, dietary needs from natural conversation
   - Use tool_use / function calling with the LLM to extract structured data
   - Write extracted data back to appropriate tables (guests, rsvps, guest_flights, logistics)

**Tests to update:** `tests/concierge-*.test.ts` (update existing)
**Tests to create:** `tests/whatsapp-routing.test.ts`
- Test admin vs guest routing
- Test outreach status context injection into system prompt
- Test logistics collection conversation flow
- Test structured data extraction from natural language
- Test opt-out handling ("STOP" message → set whatsapp_opted_out = true)

---

## Task 5: Outreach Scheduling Engine (Cron)

**Goal:** Create a cron-based system that checks for pending outreach actions and executes them.

**Files to create:**
- `app/api/cron/outreach/route.ts` — The cron endpoint
- `lib/outreach/scheduler.ts` — Core scheduling logic

**Vercel Cron setup — add to `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/outreach",
      "schedule": "0 */2 * * *"
    }
  ]
}
```
This runs every 2 hours. Adjust frequency based on needs.

**Cron endpoint logic:**
```typescript
// app/api/cron/outreach/route.ts
// Protected with CRON_SECRET env var (Vercel injects this)

export async function GET(request: Request) {
  // 1. Verify cron secret
  // 2. Get all active weddings with upcoming outreach sequences due
  // 3. For each due sequence:
  //    a. Get target guests (filtered by outreach_status matching sequence.target_statuses)
  //    b. Filter out opted-out guests
  //    c. Send batch template messages
  //    d. Update guest outreach_status
  //    e. Log outreach_events
  //    f. Mark sequence as sent
  // 4. Check for escalations (guests with outreach_attempt_count >= 3 and no response)
  //    a. Create escalation records
  // 5. Return summary of actions taken
}
```

**Scheduler logic:**
```typescript
// lib/outreach/scheduler.ts

// Generate the full outreach timeline for a wedding
// RESEARCH-BACKED: Destination weddings need 10-12 month lead time; local weddings 3-4 months
// Research shows: Week 3 after invite is biggest RSVP response week; 2 nudges yield 31% higher confirmation
export function generateOutreachTimeline(weddingDate: Date, weddingType: 'destination_international' | 'destination_domestic' | 'local'): SequenceTemplate[] {
  const timelines = {
    destination_international: [
      { type: 'save_the_date', daysBefore: 300, template: 'SAVE_THE_DATE', targetStatuses: ['not_contacted'] },  // ~10 months
      { type: 'rsvp_request', daysBefore: 180, template: 'RSVP_REQUEST', targetStatuses: ['save_the_date_sent'] }, // ~6 months
      { type: 'rsvp_nudge', daysBefore: 159, template: 'NUDGE', targetStatuses: ['rsvp_requested'] },  // 3 weeks after invite (peak response week)
      { type: 'rsvp_nudge_2', daysBefore: 152, template: 'NUDGE', targetStatuses: ['rsvp_requested'] }, // 48hrs before deadline equivalent
      { type: 'travel_collection', daysBefore: 120, template: 'TRAVEL_REQUEST', targetStatuses: ['rsvp_confirmed'] }, // 4 months
      { type: 'shuttle_assignment', daysBefore: 42, template: 'SHUTTLE_ASSIGNMENT', targetStatuses: ['travel_collected'] },
      { type: 'schedule_reminder', daysBefore: 14, template: 'SCHEDULE_REMINDER', targetStatuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
      { type: 'day_before', daysBefore: 1, template: 'DAY_BEFORE_SUMMARY', targetStatuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
      { type: 'thank_you', daysBefore: -7, template: 'THANK_YOU', targetStatuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
    ],
    destination_domestic: [
      { type: 'save_the_date', daysBefore: 180, template: 'SAVE_THE_DATE', targetStatuses: ['not_contacted'] },  // ~6 months
      { type: 'rsvp_request', daysBefore: 90, template: 'RSVP_REQUEST', targetStatuses: ['save_the_date_sent'] },  // ~3 months
      { type: 'rsvp_nudge', daysBefore: 69, template: 'NUDGE', targetStatuses: ['rsvp_requested'] },  // 3 weeks after
      { type: 'rsvp_nudge_2', daysBefore: 62, template: 'NUDGE', targetStatuses: ['rsvp_requested'] },
      { type: 'travel_collection', daysBefore: 49, template: 'TRAVEL_REQUEST', targetStatuses: ['rsvp_confirmed'] },
      { type: 'shuttle_assignment', daysBefore: 28, template: 'SHUTTLE_ASSIGNMENT', targetStatuses: ['travel_collected'] },
      { type: 'schedule_reminder', daysBefore: 14, template: 'SCHEDULE_REMINDER', targetStatuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
      { type: 'day_before', daysBefore: 1, template: 'DAY_BEFORE_SUMMARY', targetStatuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
      { type: 'thank_you', daysBefore: -7, template: 'THANK_YOU', targetStatuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
    ],
    local: [
      { type: 'save_the_date', daysBefore: 90, template: 'SAVE_THE_DATE', targetStatuses: ['not_contacted'] },  // ~3 months
      { type: 'rsvp_request', daysBefore: 42, template: 'RSVP_REQUEST', targetStatuses: ['save_the_date_sent'] },  // ~6 weeks
      { type: 'rsvp_nudge', daysBefore: 21, template: 'NUDGE', targetStatuses: ['rsvp_requested'] },  // 3 weeks after
      { type: 'rsvp_nudge_2', daysBefore: 14, template: 'NUDGE', targetStatuses: ['rsvp_requested'] },
      { type: 'schedule_reminder', daysBefore: 7, template: 'SCHEDULE_REMINDER', targetStatuses: ['rsvp_confirmed'] },
      { type: 'day_before', daysBefore: 1, template: 'DAY_BEFORE_SUMMARY', targetStatuses: ['rsvp_confirmed'] },
      { type: 'thank_you', daysBefore: -7, template: 'THANK_YOU', targetStatuses: ['rsvp_confirmed'] },
    ],
  }
  return timelines[weddingType]
}

// CRITICAL: Handle partial delivery from frequency caps
// When a batch send returns 131049 (frequency cap) for some recipients,
// queue those recipients for retry 24+ hours later — NOT immediately
export function handlePartialDelivery(results: BatchSendResult): {
  delivered: string[],
  retryTomorrow: string[],  // frequency capped — retry next day
  optedOut: string[],        // 131050 — NEVER retry, mark opted out
  failed: string[],          // other errors — investigate
}

// Check what sequences are due for a wedding right now
export function getDueSequences(sequences: OutreachSequence[], now: Date): OutreachSequence[]

// Initialize sequences for a new wedding (called when guest list is uploaded)
export async function initializeOutreachForWedding(weddingId: string, weddingDate: Date): Promise<void>
```

**Tests to create:** `tests/outreach-scheduler.test.ts`
- Test timeline generation for various wedding dates
- Test getDueSequences with mocked dates
- Test that escalation triggers after 3 failed attempts
- Test opt-out filtering
- Test batch send integration (mocked)
- Test cron endpoint auth verification

---

## Task 6: Meta Business Manager — Submit WhatsApp Templates

**Goal:** Create and submit the initial WhatsApp message templates to Meta for approval. This is a manual process through Meta Business Manager, not code.

**Steps:**

1. Go to https://business.facebook.com → WhatsApp Manager → Message Templates
2. Select the Phera Events business account
3. Create the following templates:

**IMPORTANT RESEARCH NOTES FOR TEMPLATE DESIGN:**
- Interactive Quick Reply buttons give 2-3x engagement over plain text — EVERY template must have buttons
- **Hinglish templates WILL BE REJECTED.** Meta explicitly prohibits mixed-language templates. Submit SEPARATE pure English (en) and pure Hindi (hi) versions. No exceptions.
- Carousel templates (swipeable cards) give ~2.5x CTR — use for multi-event invitations
- Image headers (1125×600px, JPEG/PNG, max 2MB) significantly boost engagement. Use couple's photo or wedding graphic.
- **Reply-first design:** Prompt replies ("Reply 💍 to confirm!") to open free 24hr service windows. This transforms the cost model.
- Frame as "help us prepare for you" NOT "please confirm attendance" (RSVP culture doesn't exist in India)
- Include DPDPA-compliant consent language and privacy link in ALL first-touch messages
- Send timing: 9-11 AM for informational, 5-7 PM for action-oriented. Tue-Thu best. Avoid Mondays and post-9 PM.
- ~47% of first-time template submissions get rejected. Plan for 1-2 revision cycles.
- Submit BOTH English and Hindi versions of every template

**Template 1: `rsvp_request_en_v1` (Marketing, English)**
- Category: Marketing
- Language: English (en)
- Header: Image (couple's photo or wedding graphic — higher engagement)
- Body: `Hi {{1}}! 🎉 {{2}} would love for you to join their wedding celebration. We're helping them coordinate — view the details and let us know you're coming: {{3}}`
  - {{1}} = guest first name
  - {{2}} = couple names
  - {{3}} = website URL
- Footer: `Reply STOP to opt out. Privacy: phera.io/privacy`
- Buttons: Quick Reply → "I'll be there! 🎉" / "Can't make it 😢" / URL button → "View Details"

**Template 1b: `rsvp_request_hi_v1` (Marketing, Hindi)**
- Category: Marketing
- Language: Hindi (hi)
- Header: Image (same as English version)
- Body: `नमस्ते {{1}}! 🎉 {{2}} की शादी में आपको आने का न्योता है। हम उनकी मदद कर रहे हैं — details देखें और बताएं कि आप आ रहे हैं: {{3}}`
- Footer: `STOP लिखें बंद करने के लिए`
- Buttons: Quick Reply → "हाँ, आ रहे हैं! 🎉" / "नहीं आ पाएंगे 😢" / URL → "Details देखें"

**Template 2: `logistics_intro_en_v1` (Marketing, English)**
- Category: Marketing
- Language: English (en)
- Body: `Hi {{1}}, {{2}} have asked us to help coordinate their wedding on {{3}}. We'll make sure you have everything you need — travel info, event schedules, and more. Reply to get started, or say STOP to opt out.`
  - {{1}} = guest first name
  - {{2}} = couple names
  - {{3}} = wedding date
- Footer: `Powered by Phera | phera.io/privacy`
- Buttons: Quick Reply → "Let's go! 👍" / "Tell me more"

**Template 2b: `logistics_intro_hi_v1` (Marketing, Hindi)**
- Same structure in Hindi

**Template 3: `gentle_nudge_en_v1` (Marketing, English)**
- Category: Marketing
- Language: English
- Body: `Hi {{1}}, just checking in — we're helping coordinate {{2}}'s wedding and want to make sure everything's sorted for you. Can you share a few details so we can help with your travel and schedule? 💬`
  - {{1}} = guest first name
  - {{2}} = couple names
- Footer: `Reply STOP to opt out`
- Buttons: Quick Reply → "Sure, let's do it!" / "Remind me later"

**Template 4: `rsvp_confirmed_en_v1` (Utility, English)**
- Category: Utility
- Language: English
- Body: `Thanks {{1}}! We've noted that you'll be joining {{2}}'s wedding ✅ We'll be in touch closer to the date to help with travel details and event schedules. Reply anytime if you have questions!`
  - {{1}} = guest first name
  - {{2}} = couple names

**Template 4b: `rsvp_confirmed_hi_v1` (Utility, Hindi)**
- Same structure in Hindi

**Template 5: `multi_event_invite_en_v1` (Marketing, Carousel)**
- Category: Marketing (carousels are marketing-only, ₹0.86/msg)
- Language: English
- Format: Carousel with 2-5 swipeable cards (one per event)
- Each card: Image (event-specific visual), Body (event name, date, time, venue, dress code), CTA button → "RSVP for this event"
- Example cards: Mehendi | Sangeet | Wedding Ceremony | Reception
- All cards must use the same button type (CTA URL)
- ~2.5x CTR vs standard single-image templates

**Template 5b: `multi_event_invite_hi_v1` (Marketing, Carousel, Hindi)**
- Same structure in Hindi

**Template 6: `cultural_guide_en_v1` (Utility, English)**
- Category: Utility (for confirmed international/non-Indian guests)
- Language: English
- Header: Document (PDF cultural guide for the destination)
- Body: `Hi {{1}}, here's your guide for {{2}}'s wedding in {{3}} — everything you need to know about travel, dress code, ceremonies, and etiquette. Reply anytime if you have questions!`
- No Hindi version needed — this is specifically for non-Indian guests

**Note:** Template approval takes 24-48 hours but ~47% get rejected on first submission. Submit ALL templates (English + Hindi) ASAP. Plan for 1-2 revision cycles. Start with Templates 1 and 2 as minimum — these unlock the core outreach flow. Add the carousel, save-the-date, and utility templates in the next batch.

**Quick Reply button strategy:** When a guest taps a Quick Reply button, it opens the 24-hour service window AND gives us structured signal (attending vs. not). The AI can immediately continue the conversation based on which button they tapped. ALL follow-up messages within the 24hr window are FREE — this is the core cost optimization.

**After approval:** Update the template names in `lib/whatsapp/outreach-templates.ts` to match the exact approved names from Meta (they sometimes append suffixes).

---

## Task 7: Admin Sidebar Reorganization

**Goal:** Restructure the sidebar into 3 groups: Operations, Wedding Setup, More. Move existing Overview into Wedding Setup group.

**Files to modify:**
- `components/admin/OnboardingSidebar.tsx` — The main sidebar config

**Changes to `OnboardingSidebar.tsx`:**

Update the `groups` constant to the new structure:

```typescript
const groups = [
  {
    id: 'operations',
    label: 'Operations',
    defaultOpen: true,
    items: [
      { id: 'control-tower', label: 'Control Tower', path: '/control-tower', icon: RadarIcon, required: true },
      { id: 'guest-list', label: 'Guest List', path: '/guests', icon: PeopleIcon, required: true },
      { id: 'communication', label: 'Communication Log', path: '/communication', icon: ChatIcon },
    ],
  },
  {
    id: 'wedding-setup',
    label: 'Wedding Setup',
    defaultOpen: false, // Collapsed by default
    items: [
      { id: 'overview', label: 'Overview', path: '/overview', icon: DashboardIcon },
      { id: 'details', label: 'Wedding Details', path: '/details', icon: InfoIcon, required: true },
      { id: 'design', label: 'Look & Feel', path: '/design', icon: PaletteIcon, required: true },
      { id: 'rsvp-form', label: 'RSVP Form', path: '/rsvp-form', icon: AssignmentIcon },
      { id: 'schedule', label: 'Schedule & Events', path: '/schedule', icon: EventIcon, required: true },
      { id: 'travel', label: 'Travel & Stay', path: '/travel', icon: FlightIcon },
      { id: 'pins', label: 'PIN Management', path: '/pins', icon: LockIcon, required: true },
    ],
  },
  {
    id: 'more',
    label: 'More',
    defaultOpen: false, // Collapsed
    items: [
      { id: 'faq', label: 'FAQ', path: '/faq', icon: HelpIcon },
      { id: 'registry', label: 'Registry', path: '/registry', icon: CardGiftcardIcon },
      { id: 'concierge', label: 'Concierge', path: '/concierge', icon: SmartToyIcon, isPro: true },
      { id: 'team', label: 'Team', path: '/team', icon: GroupIcon },
      { id: 'settings', label: 'Settings', path: '/settings', icon: SettingsIcon },
    ],
  },
]
```

**Ensure:** The sidebar collapse/expand behavior works for each group. The current sidebar implementation may already support this — check and adapt.

**Redirect:** Change the default admin landing from `/overview` to `/control-tower`.

**Tests to update:** Any existing sidebar/navigation tests
**Tests to create:** `tests/sidebar-reorganization.test.ts`
- Test that all group items render
- Test collapse/expand behavior
- Test default open state per group
- Test that Control Tower is the default route

---

## Task 8: Control Tower Dashboard (New Page)

**Goal:** Build the main operations dashboard that replaces Overview as the landing page.

**Files to create:**
- `app/admin/[weddingSlug]/control-tower/page.tsx`
- `components/admin/control-tower/OutreachStatusTracker.tsx`
- `components/admin/control-tower/ActionQueue.tsx`
- `components/admin/control-tower/OutreachTimeline.tsx`
- `components/admin/control-tower/RecentActivity.tsx`

**Control Tower sections:**

**1. Outreach Status Tracker (top of page)**
- Visual progress bar or ring showing guest statuses
- Segments: Not Contacted | Save the Date Sent | RSVP Requested | RSVP Confirmed | Travel Collected | Logistics Complete | Unresponsive
- Click a segment to filter guest list
- Uses `outreachService.getOutreachSummary()`

**2. Action Queue**
- Cards showing upcoming/overdue actions:
  - "23 guests haven't responded — next nudge scheduled for [date]"
  - "4 guests need shuttle assignment"
  - "2 escalations need your attention" (link to escalation list)
- Each card has a primary action button (e.g., "Send Now", "View Escalations", "Assign Shuttles")
- Uses `outreachService.getPendingSequences()` and `outreachService.getEscalations()`

**3. Outreach Timeline**
- Visual timeline (horizontal or vertical) showing:
  - Past: what was sent and when (with delivery/read stats if available)
  - Future: what's scheduled and when
- Clickable to expand details
- Uses `outreachService` data + `outreach_sequences` table

**4. Quick Stats Row**
- Total guests | RSVPs confirmed | Flights tracked | Shuttles reserved | Open escalations
- Pull from existing services (rsvpService, transportationService) + new outreachService

**5. Recent Activity Feed**
- Latest 10-20 interactions across all guests
- Shows: guest name, action (replied, RSVP'd, opted out, flight shared), timestamp
- Uses `outreachService.getWeddingEvents()` with limit
- Consider Supabase Realtime subscription for live updates

**Tests to create:** `tests/control-tower.test.ts`
- Test that all sections render with mock data
- Test status tracker calculations
- Test action queue with various pending states
- Test empty states (new wedding with no outreach yet)

---

## Task 9: Communication Log Page (New)

**Goal:** Build a timeline view of all Phera ↔ guest communications.

**Files to create:**
- `app/admin/[weddingSlug]/communication/page.tsx`
- `components/admin/communication/CommunicationTimeline.tsx`
- `components/admin/communication/ConversationThread.tsx`

**Features:**
- Chronological feed of all outreach events and conversations
- Filter by: guest name, event type (template_sent, message_received, escalated), date range
- Click a guest to expand their full conversation thread (pull from `whatsapp_chat_history` + `outreach_events`)
- Show template messages sent with their delivery status
- Show AI conversations
- Export capability (CSV) for record keeping

**Data sources:**
- `outreach_events` table (new)
- `whatsapp_chat_history` table (existing)
- `conversations` from Concierge (existing)

**Tests to create:** `tests/communication-log.test.ts`
- Test timeline rendering with mixed event types
- Test filtering logic
- Test conversation thread expansion
- Test empty state

---

## Task 10: Guest List Page Enhancements

**Goal:** Add outreach status column, enhance import functionality with three methods (spreadsheet, manual wizard, smart paste).

**Files to modify:**
- `app/admin/[weddingSlug]/guests/page.tsx` — Add outreach status column and import UI

**Files to create:**
- `components/admin/guests/GuestImportWizard.tsx` — Multi-method import modal
- `components/admin/guests/SpreadsheetUpload.tsx` — Enhanced CSV/XLSX upload with column mapping
- `components/admin/guests/ManualAddWizard.tsx` — Add guests one by one with "Add another" flow
- `components/admin/guests/SmartPaste.tsx` — Paste any format, AI parses it
- `app/api/guests/smart-parse/route.ts` — AI endpoint for parsing pasted text

**Guest list page changes:**
- Add "Outreach Status" column showing current status with color-coded badge
- Add "Last Contacted" column
- Add "Import Guests" button that opens the GuestImportWizard modal
- Add filter by outreach status

**GuestImportWizard — Three tabs:**

**Tab 1: Upload Spreadsheet**
- Drag-and-drop or file picker for CSV/XLSX
- Column mapping step: "Which column is the name? Phone? Email? Wedding side?"
- Preview of parsed data before import
- "Import X guests" button
- Use existing XLSX parsing (already have xlsx dependency)

**Tab 2: Add Manually**
- Simple form: First Name, Last Name, Phone (with country code), Email (optional), Wedding Side
- "Add Another" button that clears form and keeps modal open
- Running count: "5 guests added"
- "Done" button to close

**Tab 3: Smart Paste**
- Large textarea: "Paste names and contact info in any format"
- Examples shown: "Raj Sharma - 9876543210", "Priya Singh priya@email.com +1-416-555-1234"
- "Parse" button → sends to `/api/guests/smart-parse` → LLM extracts structured data
- Preview of parsed results with edit capability before confirming
- Uses Groq or Anthropic to parse

**Smart parse API endpoint:**
```typescript
// app/api/guests/smart-parse/route.ts
// POST: { text: string, weddingId: string }
// Uses LLM to extract: [{ name, phone, email, weddingSide }]
// Returns structured guest data for preview
```

**Tests to create:** `tests/guest-import.test.ts`
- Test spreadsheet parsing and column mapping
- Test manual add flow
- Test smart paste AI parsing (mock LLM response)
- Test that imported guests get outreach_status = 'not_contacted'
- Test duplicate detection (same phone/email)

---

## Task 11: Onboarding Flow Updates

**Goal:** Add "Do you already have a wedding website?" question, estimated guest count, cultural background, and update copy to service framing.

**Files to modify:**
- `app/onboarding/page.tsx`

**Changes:**

1. **Add to Step 1 (or new Step 1.5):** "Do you already have a wedding website?"
   - Option A: "Yes, I have one on [Zola/Joy/The Knot/Other]" → Skip website creation in flow, go straight to guest import
   - Option B: "No, I'd like to create one" → Continue to website setup
   - Option C: "No, and I don't need one" → Skip to guest import (logistics only)

2. **Add to wedding details step:**
   - **Where do you currently live?** (country + city) — determines currency for pricing, timezone for communication, NRI vs domestic classification
   - Estimated guest count (number input or range selector: Under 50, 50-150, 150-300, 300+)
   - **Where are most of your guests coming from?** (multi-select countries/regions: US, UK, Canada, UAE, India-same city, India-other state, Multiple countries) — determines if reverse-destination features are needed
   - **Will you have non-Indian guests?** (yes/no) — triggers cultural guide generation and reverse-destination features
   - Cultural background / wedding type (dropdown or multi-select: Punjabi-Sikh, Hindu, South Indian, Gujarati, Muslim, Jain, Multi-faith, Other)
   - **Wedding location type** (critical for outreach timeline): "International destination" / "Domestic destination (different state)" / "Local (same city)" — this determines which outreach timeline preset to use (see Task 5)
   - **Destination** (if destination): dropdown of key locations (Thailand, Bali, Sri Lanka, Goa, Udaipur, Jaipur, Other) — enables destination-specific Concierge knowledge

3. **Add family liaison designation step (after guest list import):**
   - "Who are your family point people?" — explain: "In most Indian weddings, a few tech-savvy family members help coordinate for their relatives. Designate 3-6 family contacts who can share details on behalf of others."
   - Select from imported guest list, mark as `is_family_liaison = true`
   - For each liaison, assign which guests they coordinate for (`liaison_for` array)
   - Liaisons get a slightly different WhatsApp experience: they can report for multiple people in a single message

4. **Update copy throughout:**
   - "Start Planning" → "Get Started"
   - Feature descriptions should emphasize coordination, not tools
   - Completion message: "We've got everything we need. Let's get your guest list set up so Phera can start coordinating."

4. **After onboarding completion:** Route to guest import (GuestImportWizard) if guest list is empty, then to Control Tower.

**Tests to update:** `tests/onboarding-*.test.ts` (if they exist)
**Tests to create:** `tests/onboarding-flow.test.ts`
- Test website question routing (has website → skip, no website → continue)
- Test guest count and cultural background fields
- Test post-onboarding routing

---

## Task 12: Landing Page Messaging Rewrite

**Goal:** Rewrite landing page copy to service positioning. Keep layout structure, change words and section framing.

**Files to modify:**
- `app/page.tsx` — Main landing page

**Section-by-section changes:**

**Hero:**
- Headline: "Your Wedding Operations Team"
- Tagline: "We coordinate your guests so you can focus on the celebration."
- Body: "300+ guests, 3 days of events, people flying in from everywhere. Phera handles the guest logistics — travel coordination, RSVPs, communication, transportation — end to end via WhatsApp."
- Primary CTA: "Get Started" → links to `/onboarding`
- Secondary CTA: "See How It Works" → scrolls to features

**Features section — Replace 8 tool features with 4 service pillars:**
1. "We collect every detail from your guests" (absorbs RSVP, multi-event, guest access)
2. "We coordinate all travel and transportation" (absorbs travel, transportation)
3. "We keep every guest informed, 24/7" (absorbs Concierge, FAQ)
4. "Your wedding, your vibe" (absorbs website, Build with AI — three involvement tiers: DIY, AI, Expert)

**Add "And much more" section** below the 4 pillars:
- Expandable/collapsible list: gift registry, vendor coordination, voice tasks, shopping guide, custom RSVP questions, guest wall, team collaboration

**WhatsApp showcase:**
- Add proactive outreach example (Phera messages first)
- Update copy: "Every guest gets a personal concierge — and so do you"

**Three Involvement Levels section (NEW):**
- "Do it yourself" / "Let AI help" / "Work with an expert"
- Brief description of each with visual distinction

**Hero feature highlight — "Your guests from abroad? We've got them."**
- Position the reverse-destination experience prominently: "Your college friends from Ohio, your work colleagues from London — we send them visa guides, cultural briefings, dress code advice, and airport-to-venue coordination. All through WhatsApp."
- This is the most shareable, most defensible feature. Make it the hero visual.

**Pricing section:**
- Remove Free tier
- Show multi-currency: "$349" for NRI couples, "₹9,999" for domestic (auto-detect or toggle)
- Show Phera / Phera Premium / Phera Grand tiers by guest count
- Planner tier: "Contact us" for bulk pricing
- Anchor: "Less than a single shuttle bus rental. Less than welcome bags for 100 guests."

**FAQ section — Replace questions:**
- "How does the guest coordination work?"
- "What information does Phera collect from my guests?"
- "Do my guests need to download an app?"
- "What if a guest doesn't respond on WhatsApp?"
- "I already have a wedding website — can I still use Phera?"
- "Do I still need a day-of coordinator?"

**Final CTA:**
- "300 guests. 3 days. Zero stress. Let Phera coordinate your guests while you celebrate."

**Footer about copy:**
- "Phera was built by a couple who spent more time coordinating guests than enjoying their own wedding. We built the operations team we wish we'd had."

**Tests to create:** `tests/landing-page.test.ts`
- Test that new headlines render
- Test that all 4 service pillars render
- Test "And much more" expand/collapse
- Test CTA links point to correct routes
- Test that free tier is not shown in pricing

---

## Task 13: Pricing & Subscription Updates

**Goal:** Remove free tier, update Stripe integration for new pricing model.

**Files to modify:**
- `lib/contexts/PlanContext.tsx` — Update plan types
- `app/features/page.tsx` — Pricing page (if separate from landing)
- `app/onboarding/page.tsx` — Payment integration
- Any feature gating logic that checks `isPro`

**Changes:**

1. **Update PlanContext:** Remove 'basic' plan type. All users are at minimum 'pro' equivalent.
   - `type Plan = 'phera' | 'phera_expert' | 'planner'`
   - Remove `isPro` checks that gate features behind paywall — all paid features are now included in base tier
   - Keep planner-specific checks for multi-wedding features

2. **Update Stripe — Multi-Currency Pricing:**
   - Create new Stripe products/prices with BOTH USD and INR pricing:

   **NRI Tier (USD — primary market):**
   | Plan | Price | Guest Count |
   |------|-------|------------|
   | Phera Base | $349/wedding | Up to 200 guests |
   | Phera Premium | $599/wedding | Up to 400 guests |
   | Phera Grand | $799-$999/wedding | 400+ guests |

   Premium tier includes: reverse-destination cultural guides for international guests, WhatsApp concierge during wedding weekend, priority escalation support.

   **Domestic India Tier (INR — secondary market):**
   | Plan | Price | Guest Count |
   |------|-------|------------|
   | Phera Base | ₹9,999/wedding | Up to 200 guests |
   | Phera Premium | ₹17,999/wedding | Up to 400 guests |
   | Phera Grand | ₹29,999/wedding | 400+ guests |

   - Auto-detect currency from couple's country (set during onboarding)
   - Update checkout integration in onboarding
   - **For the first 5-10 weddings:** Use a placeholder "Get Started" flow that collects info without immediate payment. Run these at introductory/free pricing to validate the service model and learn unit economics. Track your hours per wedding meticulously — this determines sustainable pricing.

3. **Feature gating:**
   - Remove all `isPro` gates for: Travel, Concierge, Transportation, Registry, Voice Tasks
   - These are now included in the base service
   - Keep planner-specific gates for: multi-wedding dashboard, planner branding

**Tests to update:** `tests/plan-context.test.ts` (if exists)
**Tests to create:** `tests/pricing-tiers.test.ts`
- Test that all features are accessible without pro gate
- Test planner-specific features remain gated
- Test plan type definitions

---

## Task 14: Build with AI — Voice Intake Enhancement

**Goal:** Add voice input mode to the Build with AI onboarding wizard.

**Files to modify:**
- Relevant Build with AI components (check `components/admin/build-ai/` or similar)
- `app/api/build-ai/` endpoints

**Changes:**

1. **Add microphone button** to the Build with AI chat interface
2. **Voice recording:** Use browser MediaRecorder API to capture audio
3. **Transcription:** Send audio to Groq Whisper (already have this integration for voice-to-task)
4. **Enhanced parsing:** After transcription, send the full text to the LLM with a system prompt that extracts:
   - Cultural background / wedding type
   - Number of events and their names
   - Location(s)
   - Approximate guest count
   - Where guests are traveling from
   - Wedding date
   - Any mentioned preferences (colors, themes, vibe)
5. **Auto-populate:** Use extracted data to pre-fill multiple wizard questions at once rather than one at a time
6. **Update intro copy:** "Tell us everything about your wedding — the more we know, the better we can coordinate. You can type or just talk to us."

**Tests to create:** `tests/build-ai-voice.test.ts`
- Test that voice button renders
- Test audio transcription flow (mock Groq API)
- Test structured data extraction from natural language
- Test multi-field population from single voice input

---

## Task 15: Outreach Sequence Initialization & Guest Upload Integration

**Goal:** When a guest list is uploaded/added and the couple confirms, automatically initialize the outreach sequence for that wedding.

**Files to modify:**
- Guest import components (from Task 10)
- `lib/outreach/scheduler.ts`

**Flow:**
1. Couple uploads/adds guest list
2. System shows preview: "X guests ready for coordination"
3. Couple confirms: "Start coordinating"
4. System calls `initializeOutreachForWedding(weddingId, weddingDate)`
5. Outreach sequences are generated based on wedding date
6. First due sequence is queued (or sent immediately if already past that date)
7. Control Tower updates to show active outreach
8. Couple can also trigger individual sequence sends from the Control Tower ("Send RSVPs now" button)

**Manual trigger API:**
```typescript
// app/api/outreach/trigger/route.ts
// POST: { weddingId, sequenceType, guestIds? (optional, for targeted sends) }
// Sends the specified template to target guests immediately
```

**Tests to create:** `tests/outreach-initialization.test.ts`
- Test sequence generation on guest upload confirmation
- Test manual trigger API
- Test that guests get correct initial status
- Test edge case: wedding date is less than 8 weeks away (skip early sequences)

---

## Task 16: Escalation Queue UI

**Goal:** Build the escalation management interface within the Control Tower or as a sub-page.

**Files to create:**
- `components/admin/control-tower/EscalationQueue.tsx`
- `app/api/outreach/escalations/route.ts` — API for escalation CRUD

**Features:**
- List of open escalations with: guest name, reason, last contact attempt, conversation context
- Actions: "Call them" (shows phone number), "Send another message", "Mark resolved", "Dismiss"
- Resolved escalations tab for history
- Count badge on Control Tower

**Tests to create:** `tests/escalation-queue.test.ts`
- Test escalation list rendering
- Test resolve/dismiss actions
- Test empty state

---

## Task 17: Destination-Specific Concierge Knowledge Base

**Goal:** Pre-populate the Concierge knowledge base with destination-specific information for the top 6 Indian wedding destinations. This makes the Concierge immediately useful for destination weddings.

**Files to create:**
- `lib/concierge/destination-knowledge.ts`

**Implementation:**
Create a static knowledge base per destination that gets auto-injected into the Concierge context when the wedding's destination matches. This supplements the auto-generated knowledge (which pulls from venue/location).

```typescript
export const DESTINATION_KNOWLEDGE = {
  thailand: {
    visa: "Indian passport holders get 60-day visa-free entry. Complete the Thailand Digital Arrival Card (TDAC) online free at tdac.immigration.go.th within 72 hours before arrival. Carry proof of funds (THB 10,000/person), return ticket, and hotel booking.",
    currency: "Thai Baht (THB). INR can be exchanged at authorized money changers — airport rates are 3-5% worse than city centers like SuperRich. Credit cards widely accepted at resorts.",
    transport: "Grab (ride-hailing) works everywhere except airport terminals. Pre-arranged hotel transfers recommended for groups. Phuket airport to most venues: 25-75 min.",
    connectivity: "Tourist SIM cards at airport: ~₹600 for 8 days. eSIM options: Airalo or Holafly for pre-arrival setup.",
    food: "Fish sauce is in almost everything — true vegetarian food is hard outside Indian restaurants. Inform resort minimum 1 week ahead for Indian vegetarian/Jain menus.",
    weather: "Wedding season: November-March only. Monsoon: May-October.",
    noise_curfew: "Most venues enforce 10-10:30 PM noise curfew.",
  },
  bali: {
    visa: "Visa on Arrival: IDR 500,000 (~₹2,900) + Bali Tourism Levy: IDR 150,000 (~₹850). Apply e-VoA online 48 hours before at evisa.imigrasi.go.id. Love Bali platform supports batch levy payments for up to 500 people.",
    currency: "Indonesian Rupiah (IDR). IMPORTANT: Most money changers do NOT accept Indian Rupees. Convert INR to USD in India, then exchange USD to IDR in Bali.",
    transport: "Grab and Gojek work but traffic in Seminyak/Kuta corridor can mean 15min drives take 2 hours. Pre-arranged transfers essential for wedding groups.",
    connectivity: "Tourist SIM at airport: ~₹1,100. eSIM options available.",
    weather: "Dry season (best): April-October. May-September is peak.",
  },
  sri_lanka: {
    visa: "Free ETA for Indian nationals via eta.gov.lk. Processed in 24-72 hours. 30-day tourist visa.",
    currency: "Sri Lankan Rupee (LKR). INR exchange available at authorized dealers.",
    transport: "Colombo airport to southern venues: 2-3 hour drives. Pre-arranged transport essential.",
    connectivity: "Tourist SIM at airport: ~₹250 for 15GB with calls. Best value of all destinations.",
    food: "Cuisine closely resembles South Indian food — smoothest culinary transition of any international destination.",
    weather: "West coast: December-March. East coast: May-September.",
  },
  goa: {
    visa: "No visa needed (domestic).",
    transport: "CRITICAL: No Ola or Uber in Goa. Local taxi union monopoly. GoaMiles app has ~15,000 rides/day but inconsistent. Budget dedicated guest transport as mandatory.",
    connectivity: "Indian SIM works. Good 4G coverage in tourist areas.",
    airports: "Two airports: Mopa (GOX, newer, north Goa) and Dabolim (GOI, south Goa). Check which is closer to your venue.",
    weather: "Wedding season: November-February. Monsoon: June-September.",
    legal: "Marriage registration requires 15-day 'Edital Period' under Goa's unique civil code.",
  },
  udaipur: {
    visa: "No visa needed (domestic).",
    transport: "Airport to most venues: 20-40 min. Narrow old city roads can be tricky for large vehicles.",
    flights: "Only ~20 daily flights connecting 9 cities. Seats fill fast October-March — book early. No international flights. Many NRI guests fly to Ahmedabad (260 km, 4.5 hrs drive) instead. December-January morning fog frequently delays Delhi flights.",
    connectivity: "Heritage palace properties often have weak indoor signals due to thick stone walls. Ensure backup communication plans.",
    weather: "Season: October-March. November-February is peak.",
    noise: "National Green Tribunal restrictions near Fateh Sagar Lake — no DJ systems, fireworks, or amplified music in eco-sensitive zones.",
  },
  jaipur: {
    visa: "No visa needed (domestic).",
    transport: "Best connectivity: 74 flights/day, 10 airlines, 24 domestic + 5 international destinations. Vande Bharat Express from Delhi: 3hr 37min (₹740). Airport to most venues: 15-75 min.",
    connectivity: "Good coverage. Palace properties may have thick walls affecting indoor signal.",
    weather: "Season: October-March. November-February is peak.",
    legal: "Marriage registration under Hindu Marriage Act (₹100) or Special Marriage Act (₹150 + 30-day notice period).",
  },
}
```

**Integration:** When the wedding's destination is set (during onboarding), auto-inject the relevant destination knowledge entries into the `concierge_knowledge` table with `source = 'destination_preset'`. The existing Concierge AI handler already pulls from this table.

**Tests to create:** `tests/destination-knowledge.test.ts`
- Test that all 6 destinations have required fields
- Test knowledge injection into concierge_knowledge table
- Test that AI handler includes destination context in system prompt

---

## Task 18: Quality Monitoring Dashboard

**Goal:** Build a simple quality metrics view into the Control Tower so you can monitor WhatsApp delivery health and avoid quality rating downgrades.

**Add to Control Tower (Task 8) as a collapsible section:**

**Metrics to show:**
- Delivery rate (delivered / sent) — alert if below 90%
- Read rate (read / delivered) — benchmark: 98% for WhatsApp in India
- Block rate (blocked / delivered) — alert if above 2%
- Report rate (reported / delivered) — alert if above 1%
- Per-template breakdown (which templates perform best/worst)
- Current messaging tier (from Meta: 250 / 1K / 10K / 100K / Unlimited)

**Data source:** `outreach_events` table + webhook delivery status data from Task 3's `handleDeliveryWebhook`.

**Alert logic:**
- If block rate > 2% on any template → pause that template, surface alert
- If delivery rate drops below 70% → surface warning (likely frequency cap issues)
- If any template gets quality status "Flagged" → immediate alert to pause campaigns

**Tests to create:** `tests/quality-monitoring.test.ts`
- Test alert threshold calculations
- Test per-template metric aggregation

---

## Task 19: WhatsApp Flows — Native RSVP Inside WhatsApp

**Goal:** Build a WhatsApp Flows-based RSVP experience so guests can confirm attendance, select events, and provide dietary info without ever leaving WhatsApp. This is a major differentiator — no Indian wedding platform currently uses WhatsApp Flows.

**What are WhatsApp Flows?** Multi-screen interactive forms built natively inside WhatsApp. They look and feel like a mini-app embedded in the chat. Triggered via CTA buttons in template messages. Data flows to our backend in real time.

**Files to create:**
- `lib/whatsapp/flows.ts` — Flow definition and response handling
- `app/api/whatsapp/flows/route.ts` — Endpoint that WhatsApp Flows calls with form responses

**RSVP Flow screens:**

```
Screen 1: Welcome
  "You're invited to {couple_names}'s wedding! 🎉"
  "Let us know your plans so we can coordinate everything for you."
  [Continue →]

Screen 2: Attendance
  "Which events can you attend?" (multi-select checkboxes)
  □ Mehendi — {date}, {venue}
  □ Sangeet — {date}, {venue}
  □ Wedding Ceremony — {date}, {venue}
  □ Reception — {date}, {venue}
  [Next →]

Screen 3: Guest Count
  "How many people in your party?" (number input, default 1)
  "Names of additional guests:" (text input, optional)
  [Next →]

Screen 4: Dietary & Preferences
  "Any dietary requirements?" (multi-select)
  □ Vegetarian □ Vegan □ Jain □ Halal □ Gluten-free □ None
  "Any allergies?" (text input, optional)
  [Next →]

Screen 5: Confirmation
  "Thanks! Here's what we've noted: {summary}"
  "We'll be in touch with travel and logistics details closer to the date."
  [Submit ✅]
```

**Flow response handler:**
```typescript
// app/api/whatsapp/flows/route.ts
// WhatsApp calls this endpoint with the completed flow data
// Parse the response, update guest record, update RSVP records per event,
// update outreach_status to 'rsvp_confirmed', log outreach event
// Trigger RSVP confirmation utility template (free within service window)
```

**Integration with template messages:**
- The RSVP_REQUEST template includes a CTA button → "RSVP Now" that opens the Flow
- Alternatively, when a guest replies to any marketing template, the AI can send the Flow link

**Tests to create:** `tests/whatsapp-flows.test.ts`
- Test flow response parsing
- Test RSVP record creation from flow data
- Test multi-event selection handling
- Test dietary preference mapping
- Test outreach status update on flow completion

---

## Task 20: wa.me Deep Links & Personal-Touch Outreach

**Goal:** Generate pre-filled WhatsApp message links (wa.me deep links) that the couple can share from their personal WhatsApp account for the initial "save the date" touchpoint. This gives the trust signal of a personal message while all subsequent automation runs through the Business API.

**Why:** Research shows messages from known personal contacts get dramatically higher open/trust rates than business numbers. But sending programmatically from personal accounts violates Meta ToS and risks account bans. The hybrid approach: couple sends the first message personally (manual), everything else is automated via Business API.

**Files to create:**
- `lib/whatsapp/deep-links.ts`
- `components/admin/outreach/PersonalOutreachGenerator.tsx`

**Implementation:**

```typescript
// lib/whatsapp/deep-links.ts

// Generate a wa.me deep link with pre-filled message for a specific guest
export function generateWaLink(
  guestPhone: string,
  message: string
): string {
  const cleanPhone = guestPhone.replace(/[^0-9]/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

// Generate bulk deep links for all guests (for the couple to send manually)
export function generateBulkWaLinks(
  guests: { name: string; phone: string }[],
  messageTemplate: string  // Use {{name}} placeholder
): { name: string; phone: string; link: string }[]

// Generate a WhatsApp broadcast-ready message (couple copies this text)
export function generateBroadcastMessage(
  coupleName: string,
  weddingDate: string,
  websiteUrl: string
): string
```

**PersonalOutreachGenerator UI (in Control Tower or Outreach section):**
- "Send your first save-the-date personally" section
- Shows the pre-written message (editable by couple)
- Two options:
  1. "Copy message + Open WhatsApp" — copies text, opens wa.me link
  2. "Download contact list for broadcast" — exports guest phones + names for WhatsApp broadcast list (max 256 contacts per broadcast)
- After couple confirms they've sent, mark those guests as `save_the_date_sent` in outreach status
- All subsequent automated outreach comes from the Phera business number

**Tests to create:** `tests/deep-links.test.ts`
- Test wa.me URL generation with various phone formats
- Test message template variable replacement
- Test bulk link generation
- Test broadcast message generation

---

## Task 21: Wedding-Branded WhatsApp Business Profile

**Goal:** During onboarding, set up the WhatsApp Business profile to display the couple's names and photo so it feels personal, not corporate. This is the key to making the Business API feel like personal messaging.

**Note:** With a single WhatsApp Business number, we customize the profile per active wedding. For v1 with low volume, this can be manual. For scale, we'll need per-wedding phone numbers via WhatsApp Embedded Signup.

**Files to create:**
- `lib/whatsapp/profile.ts`
- Add profile setup step to onboarding flow

**Implementation:**

```typescript
// lib/whatsapp/profile.ts
// Uses WhatsApp Business Management API to update profile

export async function updateBusinessProfile(config: {
  displayName: string    // "Priya & Rahul Wedding" (Meta rejects individual full names)
  about: string          // "Wedding coordination for Priya & Rahul | Dec 15, 2026 | Udaipur"
  profilePhotoUrl: string // Couple's photo
  websiteUrl: string      // Phera-generated wedding website URL
  description: string     // Brief wedding description
}): Promise<void>

// Note: Display name changes require Meta review (~2 days).
// For v1, set up once per active wedding.
// For scale (multiple concurrent weddings), use Meta's Embedded Signup
// to provision dedicated phone numbers per wedding.
```

**Onboarding integration:**
- After couple uploads their photo and enters names, auto-generate the profile config
- Show preview: "This is how your guests will see messages from Phera"
- Trigger profile update API call

**Tests to create:** `tests/whatsapp-profile.test.ts`
- Test profile config generation from wedding data
- Test display name formatting rules (Meta restrictions)

---

## Task 22: Reverse-Destination Guest Experience

**Goal:** Build the cultural bridging features for non-Indian guests attending Indian weddings in India. This is Phera's most defensible feature — no competitor addresses this.

**Files to create:**
- `lib/concierge/cultural-guide-generator.ts`
- `lib/concierge/reverse-destination-knowledge.ts`

**Implementation:**

```typescript
// lib/concierge/reverse-destination-knowledge.ts
// Knowledge base for non-Indian guests visiting India for a wedding

export const REVERSE_DESTINATION_GUIDE = {
  before_trip: {
    visa: "US/UK/Canadian/Australian citizens need an Indian e-Tourist Visa. Apply at indianvisaonline.gov.in 4+ weeks before. Passport must be valid 6+ months.",
    vaccinations: "CDC recommends: Hepatitis A & B, Typhoid, recommended. Consult your doctor 6-8 weeks before travel.",
    packing: "Pack for 3-5 events with different dress codes. Comfortable shoes essential — many venues have uneven surfaces. Sunscreen, mosquito repellent, antacids.",
    flights: "Book 3-4 months ahead during Oct-Mar wedding season. Expect 14-20hr journey from US/UK.",
  },
  dress_code: {
    mehendi: "Casual/festive. Avoid clothes you love — turmeric stains permanently! Bright colors welcome.",
    sangeet: "Party wear. Think cocktail attire with Indian flair. Jewel tones, sequins, embroidery all welcome.",
    ceremony: "Formal traditional or jewel-toned formal. NO black (funeral), NO white (mourning), NO red (reserved for bride). Saree or lehenga available for rent/purchase if desired.",
    reception: "Glamorous. Evening gown or formal suit. This is the most Western-friendly dress code.",
    haldi: "Wear WHITE or yellow. You WILL get covered in turmeric paste. Bring a change of clothes.",
  },
  etiquette: {
    shoes: "Remove shoes before entering ceremony area / sacred spaces.",
    greetings: "Namaste (hands together) or handshake, not hugs — especially with elders.",
    gifts: "Cash gifts in ODD amounts ($51, $101, $201 — even amounts are for funerals). Place in decorative envelope.",
    food: "Eat with right hand if eating by hand. It's polite to try a bit of everything.",
    photos: "Ask before photographing during religious ceremonies. Couple usually has a hired photographer for key moments.",
    time: "Indian Standard Time is... flexible. Events rarely start on published time. Budget extra time.",
  },
  on_ground: {
    sim_card: "Get Jio or Airtel tourist SIM at airport (requires passport + visa). Takes ~30 min. Or use eSIM (Airalo/Holafly) for easier setup.",
    transport: "Uber/Ola work in most cities (NOT Goa). Always use meter/app — never negotiate with airport taxi touts.",
    currency: "Indian Rupee (INR). ATMs widely available. UPI is India's main payment system — you likely won't be able to use it, so carry some cash.",
    water: "Drink only bottled/filtered water. Avoid ice in drinks outside major hotels.",
    emergency: "Tourist helpline: 1363. Police: 100. Ambulance: 108.",
  },
  reassurance: "Indian families are incredibly welcoming to international guests. Don't worry about making cultural mistakes — your effort to participate will be deeply appreciated. Someone will likely help you with your outfit, explain every ritual, and make sure you're well-fed."
}

// Generate a personalized PDF cultural guide for a specific wedding
export async function generateCulturalGuidePDF(
  weddingData: { coupleName: string; destination: string; events: Event[]; dates: string },
  guestName: string
): Promise<Buffer>  // Returns PDF buffer for sending via WhatsApp document template
```

**Integration:**
- During guest import, flag guests with non-Indian phone country codes as `is_international_guest`
- International guests get the CULTURAL_GUIDE utility template 4-6 weeks before the wedding
- The Concierge AI includes reverse-destination knowledge in its context when chatting with international guests
- Cultural guide PDF is auto-generated per wedding (customized with actual event names, dates, venue details)

**Tests to create:** `tests/reverse-destination.test.ts`
- Test international guest detection from phone number
- Test cultural guide PDF generation
- Test that Concierge includes reverse-destination context for international guests

---

## Task 23: Update Existing Tests

**Goal:** Run the full test suite and fix any tests broken by the changes above.

```bash
npx vitest run
```

**Common things that will break:**
- Tests referencing old sidebar structure
- Tests checking for free tier / isPro gates
- Tests with hardcoded plan types ('basic')
- Snapshot tests for modified components
- Tests referencing the Overview as the default admin route

**Fix each broken test** to reflect the new structure. Don't skip or delete tests — update them.

---

## Task 24: End-to-End Smoke Test

**Goal:** Manually verify the full flow works end to end.

**Checklist:**
- [ ] Landing page renders with new copy, 4 pillars, NRI-friendly pricing, no free tier
- [ ] Onboarding asks "Do you have a website?" and routes correctly
- [ ] Onboarding asks couple's current country and wedding location type
- [ ] Guest count and cultural background fields work
- [ ] Build with AI voice intake records and transcribes
- [ ] Admin sidebar shows 3 groups: Operations, Wedding Setup, More
- [ ] Control Tower renders with outreach status tracker (even if empty)
- [ ] Guest import works via spreadsheet upload
- [ ] Guest import works via manual add wizard
- [ ] Guest import works via smart paste
- [ ] Imported guests have outreach_status = 'not_contacted'
- [ ] International guests auto-flagged from phone country code
- [ ] Outreach sequences are generated when guest list is confirmed
- [ ] wa.me deep links generate correctly for personal save-the-date
- [ ] WhatsApp template message sends correctly (test with your own number)
- [ ] WhatsApp Flow RSVP opens and submits correctly
- [ ] Guest reply is routed to Concierge AI with outreach context
- [ ] Concierge collects logistics info in conversation
- [ ] International guest gets cultural guide via WhatsApp
- [ ] Communication log shows outreach events
- [ ] Escalation creates when guest is unresponsive after 3 attempts
- [ ] Escalation queue renders and resolve/dismiss work
- [ ] Pricing shows multi-currency ($USD + ₹INR), no free tier
- [ ] All feature gates removed (everything accessible)
- [ ] Quality monitoring dashboard shows delivery metrics

---

## Suggested Build Order

For maximum momentum, work through tasks in roughly this order (some can be parallelized):

**Immediate (do right now, in parallel with everything else):**
1. **Task 6** (Submit Meta templates) — Do TODAY, approval takes 24-48hrs. Submit English + Hindi. Expect ~47% rejection rate on first try. Include carousel + Flows-compatible templates.

**Foundation (blocks everything else):**
2. **Task 1** (DB schema) — Family liaisons, outreach tracking, DPDPA consent, logistics data
3. **Task 2** (Outreach service) — Core business logic
4. **Task 3** (WhatsApp template sending) — With frequency cap handling, quality tracking, carousel support

**WhatsApp Experience (the core differentiators):**
5. **Task 19** (WhatsApp Flows RSVP) — Native multi-screen RSVP inside WhatsApp. No competitor has this.
6. **Task 20** (wa.me deep links) — Personal-touch save-the-date from couple's own number
7. **Task 21** (Wedding-branded profile) — "Priya & Rahul Wedding" as WhatsApp display name

**UI Quick Wins (changes the feel of the app):**
8. **Task 7** (Sidebar reorg) — Quick win, immediate impact
9. **Task 8** (Control Tower) — The hero page of the service model
10. **Task 18** (Quality monitoring) — Add to Control Tower

**Guest Pipeline (needed to test outreach):**
11. **Task 10** (Guest import — all 3 methods) — Spreadsheet, wizard, smart paste
12. **Task 11** (Onboarding updates) — Website question, destination type, couple's country, family liaisons

**Outreach Engine (the core service):**
13. **Task 4** (Webhook routing) — Admin/liaison/guest routing + consent tracking
14. **Task 5** (Cron scheduler) — Configurable timelines, partial delivery handling
15. **Task 15** (Initialization flow) — Connects guest upload → outreach start

**Visibility & Operations:**
16. **Task 9** (Communication log) — See what's happening
17. **Task 16** (Escalation queue) — Handle failures
18. **Task 17** (Destination knowledge) — Pre-populated Concierge for 6 destinations + reverse-destination guides

**NRI-Specific & Defensible Features:**
19. **Task 22** (Reverse-destination guest experience) — Cultural guides, visa help, dress code for non-Indian guests

**Narrative & Monetization:**
20. **Task 12** (Landing page) — Public-facing service narrative with NRI positioning
21. **Task 13** (Pricing) — Multi-currency: $349/$599 USD + ₹9,999/₹17,999 INR, no free tier
22. **Task 14** (Voice intake) — Enhancement to Build with AI

**Validation:**
23. **Task 23** (Fix tests) — Ongoing, but final sweep here
24. **Task 24** (Smoke test) — Full end-to-end validation

---

## Notes

- **Branch:** All work on `develop`. Merge to `main` only after Task 24 passes.
- **Testing:** Run `npx vitest run` after every 2-3 tasks to catch breakage early.
- **WhatsApp testing:** Use your own phone number as a test guest. Add yourself to a test wedding's guest list. Start with utility messages to warm up quality score.
- **Template approval:** Check Meta Business Manager daily after submitting templates. ~47% get rejected first time. If rejected, read the rejection reason and resubmit with adjustments. NO Hinglish — pure English and pure Hindi only. Submit both languages for every template.
- **Template design:** Every template must have interactive buttons (Quick Reply or CTA). Image headers (1125×600px) significantly boost engagement. Prompt replies to open free 24hr service windows. Carousel templates for multi-event invitations.
- **Warm-up strategy (CRITICAL):** Start with 100-200 messages/day in Week 1 to engaged users. Increase to 500-1,000 in Week 2. Scale 20-30% per week while quality stays Green. Begin with utility messages ONLY. Introduce marketing after establishing baseline. If quality dips to Yellow, immediately pause marketing sends. Phone number tiers: 250 → 1K → 10K → 100K → Unlimited (tier check every 6 hours, requires 50%+ capacity usage).
- **Frequency cap handling:** Marketing templates may not all deliver on day 1 due to Meta's per-user cap (~2 marketing messages/day from all businesses). Error 131049 = frequency capped, retry next day. Error 131050 = opted out, NEVER retry. 200 OK ≠ delivered — track via webhooks.
- **Send timing:** 9-11 AM IST for informational/awareness messages. 5-7 PM IST for action-oriented messages. Tue-Thu best days. Avoid Mondays and post-9 PM.
- **WhatsApp Flows:** The biggest technical differentiator. Native multi-screen forms inside WhatsApp for RSVP. No Indian wedding platform uses this. Triggered via CTA buttons in templates. Data flows to backend in real time. Zero friction for guests.
- **Unofficial API / QR Linking — DO NOT BUILD:** Violates Meta ToS. 10M accounts banned monthly in India, 2.6% appeal rate. CFAA precedent from WhatsApp v. NSO Group. DPDPA penalties up to ₹250 crore. ZeroPaper's approach has no path to legitimacy. Build exclusively on official Business API.
- **Hybrid outreach model:** Couple sends initial save-the-date from personal WhatsApp (via wa.me deep links we generate). All subsequent automated coordination from Phera business number ("Priya & Rahul Wedding"). This gives the personal trust signal for first touch while keeping all automation compliant.
- **NRI-first target market:** Lead with US-based Indian Americans ($225K-$285K avg budget, $349-$599 is a non-decision). Then UK, Canada, UAE. Domestic India is secondary market at ₹9,999-₹17,999.
- **Reverse-destination guests:** Non-Indian friends/colleagues attending Indian weddings in India = Phera's most defensible feature. Visa guides, cultural briefings, dress code per event, airport coordination, SIM card setup, ceremony explanations. No competitor addresses this.
- **Planner referrals:** #1 go-to-market channel. 27% of destination weddings use planners (higher for NRI). Partner with 15-20 NRI-specialist planners who handle 20-50 weddings/year each. They want to offload guest logistics.
- **Concierge context:** The existing AI handler in `lib/whatsapp/ai-handler.ts` already fetches extensive wedding context (events, schedule, travel, FAQs, RSVPs, chat history). The outreach changes ADD to this context — don't replace it. For international guests, also inject reverse-destination knowledge.
- **Family liaisons:** When a liaison sends a message mentioning multiple names, the AI should parse each person's info separately and update the correct guest records. Test this carefully.
- **DPDPA compliance:** Record consent timestamp on first guest reply. Include privacy link in all first-touch templates. Set `data_retention_until` to wedding_date + 90 days. Build a data deletion mechanism (can be manual for now). India's Telecom Cybersecurity Amendment Rules (Nov 2025) add SIM-binding requirements — reinforces building on official API only.
- **Existing schema:** Build on the current `guests`, `rsvps`, `whatsapp_chat_history` tables. Don't migrate to generic schemas.
- **Feature flags:** If you want to ship incrementally, consider a simple feature flag in `wedding_settings` to toggle the outreach engine per wedding.
- **Cost model:** Full 8-message sequence for 300-guest wedding costs ~₹2,070 ($25) in WhatsApp messaging fees. Even with BSP markup (₹999-2,499/month), total WhatsApp cost per wedding lifecycle is under ₹5,000 ($60). Negligible at $349-$599 price point.
- **Competitive edge reminders:** Nobody else has: WhatsApp Flows RSVP + proactive outreach engine + family liaison support + destination-specific knowledge + reverse-destination cultural guides + wa.me personal-touch first message + wedding-branded business profile. Ship this combination and you're ahead of every competitor in the space. Wedflow has the closest features but is B2B only. Jubilyn shares the NRI DNA but is RSVP-only.
