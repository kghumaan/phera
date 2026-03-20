# Phera Pivot — Development Roadmap

**Purpose:** Step-by-step engineering tasks for the service pivot. Pass this to Claude Code and work through sequentially.
**Branch:** All changes go to `develop` branch. Create it from `main` if it doesn't exist.
**Testing:** Every task includes test requirements. Use Vitest (already configured). Update existing tests if changes break them.
**Reference:** See `PIVOT-PLAN.md` for full strategic context.

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

-- Create outreach_events table for logging all outreach activity
CREATE TABLE IF NOT EXISTS outreach_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
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
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
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
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
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

**Goal:** Add the ability to send WhatsApp template messages (marketing + utility) to guests, alongside the existing free-form message capability.

**Files to modify:**
- `lib/whatsapp/` — add template sending functions

**Files to create:**
- `lib/whatsapp/templates.ts`

**Implementation:**

```typescript
// lib/whatsapp/templates.ts

// Template definitions (these match what's submitted to Meta)
export const TEMPLATES = {
  // Marketing templates (for first-touch outreach)
  SAVE_THE_DATE: {
    name: 'save_the_date_v1', // Must match Meta-approved template name
    category: 'MARKETING',
    language: 'en',
    components: ['header_image', 'body', 'footer']
  },
  RSVP_REQUEST: {
    name: 'rsvp_request_v1',
    category: 'MARKETING',
    language: 'en',
    components: ['body', 'button_url']
  },
  LOGISTICS_INTRO: {
    name: 'logistics_intro_v1',
    category: 'MARKETING',
    language: 'en',
    components: ['body']
  },
  NUDGE: {
    name: 'gentle_nudge_v1',
    category: 'MARKETING',
    language: 'en',
    components: ['body']
  },
  // Utility templates (for post-interaction follow-ups)
  RSVP_CONFIRMATION: {
    name: 'rsvp_confirmed_v1',
    category: 'UTILITY',
    language: 'en',
    components: ['body']
  },
  TRAVEL_REQUEST: {
    name: 'travel_details_request_v1',
    category: 'UTILITY',
    language: 'en',
    components: ['body']
  },
  SHUTTLE_ASSIGNMENT: {
    name: 'shuttle_assignment_v1',
    category: 'UTILITY',
    language: 'en',
    components: ['body']
  },
  SCHEDULE_REMINDER: {
    name: 'schedule_reminder_v1',
    category: 'UTILITY',
    language: 'en',
    components: ['body']
  },
} as const

// Send a template message to a guest
export async function sendTemplateMessage(
  phoneNumber: string,
  templateName: string,
  languageCode: string,
  components: TemplateComponent[] // header params, body params, button params
): Promise<SendResult>

// Send a batch of template messages (with rate limiting)
export async function sendBatchTemplateMessages(
  messages: TemplateBatchItem[],
  rateLimit?: number // messages per second, default 80 (Meta's limit)
): Promise<BatchSendResult>

// Check if a guest is within the 24-hour service window
export async function isInServiceWindow(guestPhone: string, weddingId: string): Promise<boolean>
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
3. If guest → continue to existing AI handler BUT with enhanced context

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
export function generateOutreachTimeline(weddingDate: Date): SequenceTemplate[] {
  return [
    { type: 'save_the_date', daysBefore: 84, template: 'SAVE_THE_DATE', targetStatuses: ['not_contacted'] },
    { type: 'rsvp_request', daysBefore: 56, template: 'RSVP_REQUEST', targetStatuses: ['save_the_date_sent'] },
    { type: 'rsvp_nudge', daysBefore: 49, template: 'NUDGE', targetStatuses: ['rsvp_requested'] },
    { type: 'rsvp_nudge_2', daysBefore: 42, template: 'NUDGE', targetStatuses: ['rsvp_requested'] },
    { type: 'travel_collection', daysBefore: 35, template: 'TRAVEL_REQUEST', targetStatuses: ['rsvp_confirmed'] },
    { type: 'shuttle_assignment', daysBefore: 28, template: 'SHUTTLE_ASSIGNMENT', targetStatuses: ['travel_collected'] },
    { type: 'schedule_reminder', daysBefore: 14, template: 'SCHEDULE_REMINDER', targetStatuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
    { type: 'day_before', daysBefore: 1, template: 'DAY_BEFORE_SUMMARY', targetStatuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
    { type: 'thank_you', daysBefore: -7, template: 'THANK_YOU', targetStatuses: ['rsvp_confirmed', 'travel_collected', 'logistics_complete'] },
  ]
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

**Template 1: `rsvp_request_v1` (Marketing)**
- Category: Marketing
- Language: English
- Header: None (or image if you want — can add couple's photo later)
- Body: `Hi {{1}}! 🎉 {{2}} would love for you to RSVP for their wedding celebration. View the details and respond here: {{3}}`
  - {{1}} = guest first name
  - {{2}} = couple names
  - {{3}} = website URL
- Footer: `Reply STOP to opt out`
- Buttons: URL button → `{{1}}` (dynamic URL to wedding website)

**Template 2: `logistics_intro_v1` (Marketing)**
- Category: Marketing
- Language: English
- Body: `Hi {{1}}, {{2}} have asked us to help coordinate logistics for their wedding on {{3}}. We'll help with travel details, event schedules, and transportation. Reply to get started, or say STOP to opt out.`
  - {{1}} = guest first name
  - {{2}} = couple names
  - {{3}} = wedding date
- Footer: `Powered by Phera`

**Template 3: `gentle_nudge_v1` (Marketing)**
- Category: Marketing
- Language: English
- Body: `Hi {{1}}, just a friendly reminder — we're helping coordinate logistics for {{2}}'s wedding and would love to get your details. Reply anytime to get started! 💬`
  - {{1}} = guest first name
  - {{2}} = couple names
- Footer: `Reply STOP to opt out`

**Template 4: `rsvp_confirmed_v1` (Utility)**
- Category: Utility
- Language: English
- Body: `Thanks {{1}}! Your RSVP for {{2}}'s wedding has been confirmed ✅ We'll be in touch closer to the date with travel details and event schedules.`
  - {{1}} = guest first name
  - {{2}} = couple names

**Note:** Template approval takes 24-48 hours. Submit these ASAP so they're ready when the outreach engine is built. You can add more templates later (save-the-date with image, shuttle assignment, schedule reminder, etc.).

**After approval:** Update the template names in `lib/whatsapp/templates.ts` to match the exact approved names from Meta (they sometimes append suffixes).

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
   - Estimated guest count (number input or range selector: Under 50, 50-150, 150-300, 300+)
   - Cultural background / wedding type (dropdown or multi-select: Punjabi-Sikh, Hindu, South Indian, Gujarati, Muslim, Jain, Multi-faith, Other)

3. **Update copy throughout:**
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

**Pricing section:**
- Remove Free tier
- Show Phera per-wedding tier + Planner tier
- Exact prices TBD — use "Starting at $X" or "Get a quote" for now

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

2. **Update Stripe:**
   - Create new Stripe product/price for the per-wedding tier
   - Update checkout integration in onboarding
   - Consider: if pricing is TBD, use a placeholder "Get Started" flow that collects info without immediate payment (for the first 5-10 manual weddings)

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

## Task 17: Update Existing Tests

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

## Task 18: End-to-End Smoke Test

**Goal:** Manually verify the full flow works end to end.

**Checklist:**
- [ ] Landing page renders with new copy, 4 pillars, no free tier
- [ ] Onboarding asks "Do you have a website?" and routes correctly
- [ ] Guest count and cultural background fields work
- [ ] Build with AI voice intake records and transcribes
- [ ] Admin sidebar shows 3 groups: Operations, Wedding Setup, More
- [ ] Control Tower renders with outreach status tracker (even if empty)
- [ ] Guest import works via spreadsheet upload
- [ ] Guest import works via manual add wizard
- [ ] Guest import works via smart paste
- [ ] Imported guests have outreach_status = 'not_contacted'
- [ ] Outreach sequences are generated when guest list is confirmed
- [ ] WhatsApp template message sends correctly (test with your own number)
- [ ] Guest reply is routed to Concierge AI with outreach context
- [ ] Concierge collects logistics info in conversation
- [ ] Communication log shows outreach events
- [ ] Escalation creates when guest is unresponsive after 3 attempts
- [ ] Escalation queue renders and resolve/dismiss work
- [ ] Pricing page shows no free tier
- [ ] All feature gates removed (everything accessible)

---

## Suggested Build Order

For maximum momentum, work through tasks in roughly this order (some can be parallelized):

1. **Task 1** (DB schema) — Everything depends on this
2. **Task 6** (Submit Meta templates) — Do immediately, approval takes 24-48hrs
3. **Task 2** (Outreach service) — Core business logic
4. **Task 3** (WhatsApp template sending) — Core capability
5. **Task 7** (Sidebar reorg) — Quick win, changes the feel of the app immediately
6. **Task 8** (Control Tower) — The hero page
7. **Task 10** (Guest import) — Needed to test outreach
8. **Task 4** (Webhook routing) — Connects outreach to AI
9. **Task 5** (Cron scheduler) — Automates outreach
10. **Task 15** (Initialization flow) — Connects guest upload → outreach start
11. **Task 9** (Communication log) — Visibility into what's happening
12. **Task 16** (Escalation queue) — Handles failures
13. **Task 11** (Onboarding updates) — Narrative change
14. **Task 12** (Landing page) — Public-facing narrative
15. **Task 13** (Pricing) — Remove free tier
16. **Task 14** (Voice intake) — Enhancement to Build with AI
17. **Task 17** (Fix tests) — Ongoing, but final sweep here
18. **Task 18** (Smoke test) — Final validation

---

## Notes

- **Branch:** All work on `develop`. Merge to `main` only after Task 18 passes.
- **Testing:** Run `npx vitest run` after every 2-3 tasks to catch breakage early.
- **WhatsApp testing:** Use your own phone number as a test guest. Add yourself to a test wedding's guest list.
- **Template approval:** Check Meta Business Manager daily after submitting templates. If rejected, read the rejection reason and resubmit with adjustments.
- **Concierge context:** The existing AI handler in `lib/whatsapp/ai-handler.ts` already fetches extensive wedding context (events, schedule, travel, FAQs, RSVPs, chat history). The outreach changes ADD to this context — don't replace it.
- **Existing schema:** Build on the current `guests`, `rsvps`, `whatsapp_chat_history` tables. Don't migrate to generic schemas.
- **Feature flags:** If you want to ship incrementally, consider a simple feature flag in `wedding_settings` to toggle the outreach engine per wedding.
