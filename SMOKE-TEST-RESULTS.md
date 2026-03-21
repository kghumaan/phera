# Smoke Test Results — Pivot Build (develop-v2)

Date: 2026-03-21
Branch: develop-v2

## Test Suite Summary

| Metric | Count |
|--------|-------|
| Total test files | 65 |
| Passing files | 60 |
| Failing files | 5 (all pre-existing on main) |
| Total tests | 1,177 |
| Passing tests | 1,022 |
| Failing tests | 29 (all pre-existing on main) |
| Skipped tests | 126 |

### Pre-Existing Failures (confirmed on main branch)

| Test File | Failure Count | Reason |
|-----------|--------------|--------|
| tests/rls-integration.test.ts | 12 | Requires TEST_SUPABASE_* env vars |
| tests/workflow-integration.test.ts | 6 | Requires TEST_SUPABASE_* env vars |
| tests/edge-cases-integration.test.ts | 2 | Requires TEST_SUPABASE_* env vars |
| tests/ai-handler.test.ts | 7 | Mock structure issue (pre-existing) |
| tests/concierge-knowledge-entry.test.tsx | 2 | DOM element click test (pre-existing) |

None of these failures are caused by pivot changes.

## Feature Checklist

| Feature | Status | Test File |
|---------|--------|-----------|
| Outreach types and interfaces | PASS | tests/outreach-service.test.ts (14 tests) |
| Outreach service layer | PASS | tests/outreach-service.test.ts |
| WhatsApp outreach templates (12 templates, en+hi) | PASS | tests/outreach-templates.test.ts (16 tests) |
| Outreach sender with batch + rate limiting | PASS | tests/outreach-sender.test.ts (10 tests) |
| AI Guest Coordinator (conversation state machine) | PASS | tests/guest-coordinator.test.ts (19 tests) |
| Template submission helper | PASS | tests/template-submission.test.ts (12 tests) |
| Escalation engine | PASS | tests/escalation-engine.test.ts (10 tests) |
| Webhook handler (HMAC + routing) | PASS | tests/webhook-handler.test.ts (11 tests) |
| Outreach API routes (5 endpoints) | PASS | tests/api/outreach-api.test.ts (9 tests) |
| Outreach scheduling engine + cron | PASS | tests/outreach-scheduler.test.ts (14 tests) |
| WhatsApp Flows RSVP (5 screens) | PASS | tests/whatsapp-flows.test.ts (13 tests) |
| wa.me deep links + personal outreach | PASS | tests/deep-links.test.ts (11 tests) |
| WhatsApp Business profile management | PASS | tests/business-profile.test.ts (5 tests) |
| Reverse-destination cultural guide | PASS | tests/reverse-destination.test.ts (17 tests) |
| Destination knowledge (6 destinations) | PASS | tests/destination-knowledge.test.ts (14 tests) |
| Admin sidebar reorganization (3 groups) | PASS | tests/sidebar-reorganization.test.ts (15 tests) |
| Control Tower dashboard | PASS | tests/control-tower.test.ts (8 tests) |
| Communication log page | PASS | tests/communication-log.test.ts (7 tests) |
| Guest import wizard (CSV, manual, smart paste) | PASS | tests/guest-import.test.ts (14 tests) |
| Admin WhatsApp command parser | PASS | tests/admin-commands.test.ts (14 tests) |
| Onboarding updates | PASS | tests/onboarding-updates.test.ts (9 tests) |
| Landing page content | PASS | tests/landing-page.test.ts (14 tests) |
| Pricing updates | PASS | tests/pricing-updates.test.ts (7 tests) |
| Outreach initialization | PASS | tests/outreach-initialization.test.ts (4 tests) |
| WhatsApp simulator + load testing | PASS | tests/simulator/load-test.test.ts (10 tests) |

## Detailed Smoke Test

### Service Layer
- [x] Outreach sequences generate correctly for all 3 wedding types
- [x] Correct day counts: international (300→-7), domestic (180→-7), local (90→-7)
- [x] Guest status transitions work through full lifecycle
- [x] Escalation triggers after 3 unresponsive attempts
- [x] Duplicate escalation prevention works

### WhatsApp Integration
- [x] All 12 templates defined with both en and hi versions
- [x] CULTURAL_GUIDE correctly English-only
- [x] Every template has interactive buttons (max 3 quick reply)
- [x] Marketing templates include STOP opt-out footer
- [x] Template payload construction valid for Meta API
- [x] Frequency cap (131049) queues for next-day retry
- [x] Opt-out (131050) marks guest and never retries
- [x] HMAC signature verification works (valid + invalid)
- [x] wa.me deep links generate valid URLs with various phone formats

### AI Coordination
- [x] RSVP collection flow (positive and negative)
- [x] Travel info extraction (flight numbers, dates, hotels)
- [x] Dietary preference extraction
- [x] Family liaison multi-guest parsing
- [x] Consent recording on first reply
- [x] Opt-out handling (STOP message)
- [x] Unresponsive guest reactivation

### Cultural Features
- [x] Reverse-destination guide covers all standard events
- [x] International guest detection from phone number
- [x] 6 destination knowledge bases (Thailand, Bali, Sri Lanka, Goa, Udaipur, Jaipur)
- [x] All destinations have required fields (currency, transport, weather)

### Admin Dashboard
- [x] Sidebar reorganized into 3 groups: Operations, Wedding Setup, More
- [x] Control Tower is first item in Operations
- [x] Shopping Guide, Vendor Coordinator, Task Manager removed from sidebar
- [x] Control Tower components created (StatusTracker, ActionQueue, Timeline, Activity)
- [x] Communication log with event filtering and CSV export

### Multi-Currency Pricing
- [x] No free tier in pricing
- [x] 3 tiers: Base ($349/₹9,999), Premium ($599/₹17,999), Grand ($799/₹29,999)
- [x] All features accessible in base tier (no pro gates)
- [x] Planner-specific features remain gated

## New Files Created (Pivot Code)

### Lib Layer (17 files)
- lib/types/outreach.ts
- lib/supabase/outreach-service.ts
- lib/whatsapp/outreach-templates.ts
- lib/whatsapp/outreach-sender.ts
- lib/whatsapp/template-submission.ts
- lib/whatsapp/webhook-handler.ts
- lib/whatsapp/flows.ts
- lib/whatsapp/deep-links.ts
- lib/whatsapp/business-profile.ts
- lib/whatsapp/admin-commands.ts
- lib/ai/guest-coordinator.ts
- lib/ai/escalation-engine.ts
- lib/knowledge/reverse-destination.ts
- lib/knowledge/destination-knowledge.ts
- lib/outreach/scheduler.ts
- lib/utils/guest-parser.ts

### API Routes (10 files)
- app/api/outreach/status/route.ts
- app/api/outreach/send/route.ts
- app/api/outreach/sequences/route.ts
- app/api/outreach/events/route.ts
- app/api/outreach/escalations/route.ts
- app/api/outreach/trigger/route.ts
- app/api/cron/outreach/route.ts
- app/api/webhooks/whatsapp/route.ts
- app/api/whatsapp/flows/route.ts
- app/api/guests/smart-parse/route.ts

### Components (10 files)
- components/admin/control-tower/OutreachStatusTracker.tsx
- components/admin/control-tower/ActionQueue.tsx
- components/admin/control-tower/OutreachTimeline.tsx
- components/admin/control-tower/RecentActivity.tsx
- components/admin/communication/CommunicationTimeline.tsx
- components/admin/communication/ConversationThread.tsx
- components/admin/outreach/PersonalOutreachGenerator.tsx
- components/admin/guests/GuestImportWizard.tsx
- app/admin/[weddingSlug]/control-tower/page.tsx
- app/admin/[weddingSlug]/communication/page.tsx

### Test Files (22 files)
- tests/outreach-service.test.ts
- tests/outreach-templates.test.ts
- tests/outreach-sender.test.ts
- tests/guest-coordinator.test.ts
- tests/template-submission.test.ts
- tests/escalation-engine.test.ts
- tests/webhook-handler.test.ts
- tests/api/outreach-api.test.ts
- tests/outreach-scheduler.test.ts
- tests/whatsapp-flows.test.ts
- tests/deep-links.test.ts
- tests/business-profile.test.ts
- tests/reverse-destination.test.ts
- tests/destination-knowledge.test.ts
- tests/sidebar-reorganization.test.ts
- tests/control-tower.test.ts
- tests/communication-log.test.ts
- tests/guest-import.test.ts
- tests/admin-commands.test.ts
- tests/onboarding-updates.test.ts
- tests/landing-page.test.ts
- tests/pricing-updates.test.ts
- tests/outreach-initialization.test.ts
- tests/simulator/load-test.test.ts
- tests/simulator/whatsapp-simulator.ts
- tests/simulator/guest-behaviors.ts

## Protected Files — NOT Modified
- [x] lib/whatsapp/client.ts
- [x] lib/whatsapp/templates.ts
- [x] lib/whatsapp/opt-ins.ts
- [x] lib/supabase/client.ts
- [x] lib/theme/m3-theme.ts

## Modified Files
- components/admin/OnboardingSidebar.tsx (restructured groups only)
