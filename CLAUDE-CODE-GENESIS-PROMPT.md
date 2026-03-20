# Phera Pivot — Claude Code Genesis Prompt

## Standard Prompt (paste into Claude Code)

```
You are building the Phera wedding guest logistics platform pivot. Your complete engineering roadmap is in DEV-ROADMAP.md in the project root — read it fully before writing any code.

CRITICAL CONTEXT:
- This is a Next.js 15 + Supabase + MUI v7 + Tailwind v4 app
- All work goes on the `develop` branch (create from main if it doesn't exist)
- Task 1 is DONE. The full SQL migration has already been run against Supabase (both test and production). All new columns on `guests` (outreach_status, logistics_data, consent fields, family liaison fields, etc.) and all three new tables (outreach_events, outreach_sequences, outreach_escalations) plus indexes already exist. Do NOT re-run any migration SQL. Skip Task 1 entirely. Start from Task 2.
- Tests use Vitest with happy-dom. Config is in vitest.config.ts, setup in tests/setup.ts
- Every task in the roadmap has explicit test requirements. Write tests BEFORE or alongside implementation.
- Read PIVOT-PLAN.md for strategic context if you need to understand WHY something is designed a certain way.

EXISTING CODE TO PRESERVE:
- lib/whatsapp/client.ts — WhatsApp Business API client (sendMessage, sendTemplate, getMessageStatus). DO NOT modify.
- lib/whatsapp/templates.ts — Existing template utilities (TEMPLATE_PARAMS). DO NOT modify. New outreach templates go in a SEPARATE file: outreach-templates.ts.
- lib/whatsapp/opt-ins.ts — Opt-in management (createOptIn, checkOptInStatus, handleOptOut). DO NOT modify.
- lib/supabase/client.ts — Supabase browser client with PKCE. DO NOT modify.

RULES:
1. Follow the task order in DEV-ROADMAP.md. Don't skip ahead.
2. After completing each task, run its tests and confirm they pass before moving to the next.
3. Commit after each completed task with a descriptive message.
4. If a task's tests fail, fix them before proceeding.
5. Read the "Research-Backed Context" section at the top of DEV-ROADMAP.md — it contains critical WhatsApp API constraints, template rules, and market context that affect implementation decisions.
6. Hinglish templates WILL BE REJECTED by Meta. Always create separate en and hi template versions.
7. No unofficial WhatsApp API usage. Only official Business Cloud API.

START: Read DEV-ROADMAP.md now, then begin with Task 2 (Outreach Service Layer).
```

---

## Ralph Wiggum Version (per-phase autonomous loops)

### Phase 1: Foundation (Tasks 2-4)

```
/ralph-loop "You are building the Phera wedding guest logistics platform. Read DEV-ROADMAP.md fully first.

CONTEXT: Next.js 15 + Supabase + MUI v7 + Tailwind v4. Work on `develop` branch. Task 1 SQL migration already applied to production. Vitest for tests.

EXISTING CODE — DO NOT MODIFY: lib/whatsapp/client.ts, lib/whatsapp/templates.ts, lib/whatsapp/opt-ins.ts, lib/supabase/client.ts

YOUR TASKS (do them in order):
- Task 2: Create lib/supabase/outreach-service.ts with all functions specified in DEV-ROADMAP.md. Write tests in tests/outreach-service.test.ts.
- Task 3: Create lib/whatsapp/outreach-templates.ts with ALL templates from DEV-ROADMAP.md (SAVE_THE_DATE, RSVP_REQUEST, RSVP_NUDGE, EVENT_REMINDER, MULTI_EVENT_INVITE carousel, SHUTTLE_INFO, DAY_BEFORE_SUMMARY, THANK_YOU, CULTURAL_GUIDE). Each template needs en + hi versions. Write tests in tests/outreach-templates.test.ts.
- Task 4: Create lib/whatsapp/outreach-sender.ts with OutreachSender class. Write tests in tests/outreach-sender.test.ts.

After each task: run `npx vitest run` to verify tests pass. Fix any failures.
Commit after each task with a descriptive message.

Output <promise>PHASE1-COMPLETE</promise> when ALL three tasks are done and ALL tests pass." --max-iterations 30 --completion-promise "PHASE1-COMPLETE"
```

### Phase 2: AI Layer (Tasks 5-8)

```
/ralph-loop "You are continuing the Phera pivot build. Read DEV-ROADMAP.md fully first. Work on `develop` branch. All Phase 1 code (Tasks 2-4) is already complete.

EXISTING CODE — DO NOT MODIFY: lib/whatsapp/client.ts, lib/whatsapp/templates.ts, lib/whatsapp/opt-ins.ts, lib/supabase/client.ts

YOUR TASKS (in order):
- Task 5: Create lib/ai/guest-coordinator.ts — AI guest coordination agent with conversation state machine. Tests in tests/guest-coordinator.test.ts.
- Task 6: Create lib/whatsapp/template-submission.ts — Meta template submission helper with all templates from Task 3. Tests in tests/template-submission.test.ts.
- Task 7: Create lib/ai/escalation-engine.ts — Escalation detection and routing. Tests in tests/escalation-engine.test.ts.
- Task 8: Create lib/whatsapp/webhook-handler.ts — Incoming webhook processor. Tests in tests/webhook-handler.test.ts.

Run `npx vitest run` after each task. Fix failures before proceeding. Commit after each task.

Output <promise>PHASE2-COMPLETE</promise> when ALL four tasks are done and ALL tests pass." --max-iterations 40 --completion-promise "PHASE2-COMPLETE"
```

### Phase 3: Backend APIs (Tasks 9-10)

```
/ralph-loop "Continuing Phera pivot build. Read DEV-ROADMAP.md. Work on `develop` branch. Phases 1-2 (Tasks 2-8) complete.

YOUR TASKS:
- Task 9: Create app/api/webhooks/whatsapp/route.ts — WhatsApp webhook API route with signature verification. Tests in tests/api/whatsapp-webhook.test.ts.
- Task 10: Create app/api/outreach/ routes — Dashboard API endpoints (status, send, sequence, events, escalations). Tests in tests/api/outreach-api.test.ts.

Run `npx vitest run` after each task. Fix failures. Commit after each.

Output <promise>PHASE3-COMPLETE</promise> when both tasks pass all tests." --max-iterations 25 --completion-promise "PHASE3-COMPLETE"
```

### Phase 4: Frontend — Dashboard (Tasks 11-14)

```
/ralph-loop "Continuing Phera pivot. Read DEV-ROADMAP.md. `develop` branch. Phases 1-3 done.

YOUR TASKS:
- Task 11: Create app/(dashboard)/[weddingId]/setup/page.tsx — Enhanced wedding setup wizard. Tests in tests/components/setup-wizard.test.tsx.
- Task 12: Create app/(dashboard)/[weddingId]/outreach/page.tsx — Outreach command center. Tests in tests/components/outreach-dashboard.test.tsx.
- Task 13: Create app/(dashboard)/[weddingId]/pricing/page.tsx OR integrate into existing — Multi-currency pricing with Stripe. Tests in tests/components/pricing.test.tsx.
- Task 14: Create app/(dashboard)/[weddingId]/logistics/page.tsx — Guest logistics tracker. Tests in tests/components/logistics-dashboard.test.tsx.

Run `npx vitest run` after each task. Fix failures. Commit after each.

Output <promise>PHASE4-COMPLETE</promise> when all four tasks pass tests." --max-iterations 40 --completion-promise "PHASE4-COMPLETE"
```

### Phase 5: Frontend — Guest Experience (Tasks 15-18)

```
/ralph-loop "Continuing Phera pivot. Read DEV-ROADMAP.md. `develop` branch. Phases 1-4 done.

YOUR TASKS:
- Task 15: Create app/(guest)/[weddingId]/rsvp/page.tsx — Guest RSVP page with WhatsApp opt-in. Tests in tests/components/guest-rsvp.test.tsx.
- Task 16: Create app/(guest)/[weddingId]/travel/page.tsx — Travel info collection. Tests in tests/components/travel-form.test.tsx.
- Task 17: Create app/(guest)/[weddingId]/schedule/page.tsx — Event schedule view. Tests in tests/components/schedule-view.test.tsx.
- Task 18: Create app/(guest)/[weddingId]/shuttle/page.tsx — Shuttle assignment display. Tests in tests/components/shuttle-view.test.tsx.

Run `npx vitest run` after each task. Fix failures. Commit after each.

Output <promise>PHASE5-COMPLETE</promise> when all four tasks pass tests." --max-iterations 40 --completion-promise "PHASE5-COMPLETE"
```

### Phase 6: WhatsApp Experience + NRI Features (Tasks 19-22)

```
/ralph-loop "Continuing Phera pivot. Read DEV-ROADMAP.md. `develop` branch. Phases 1-5 done.

YOUR TASKS:
- Task 19: WhatsApp Flows — Create lib/whatsapp/flows.ts with RSVP flow definition (5 screens). Tests in tests/whatsapp-flows.test.ts.
- Task 20: wa.me Deep Links — Create lib/whatsapp/deep-links.ts with generateWaLink and PersonalOutreachGenerator. Tests in tests/deep-links.test.ts.
- Task 21: Wedding-Branded Business Profile — Create lib/whatsapp/business-profile.ts. Tests in tests/business-profile.test.ts.
- Task 22: Reverse-Destination Guest Experience — Create lib/knowledge/reverse-destination.ts with cultural guide knowledge base. Tests in tests/reverse-destination.test.ts.

Run `npx vitest run` after each task. Fix failures. Commit after each.

Output <promise>PHASE6-COMPLETE</promise> when all four tasks pass tests." --max-iterations 40 --completion-promise "PHASE6-COMPLETE"
```

### Phase 7: Final Validation (Tasks 23-24)

```
/ralph-loop "Final phase of Phera pivot. Read DEV-ROADMAP.md. `develop` branch. All features built (Tasks 2-22).

YOUR TASKS:
- Task 23: Update ALL existing tests that may have been broken by the pivot changes. Run full test suite. Every test must pass.
- Task 24: Smoke test checklist — verify every API route returns expected responses, every page renders without errors, webhook signature verification works, template parameter validation works. Document results.

Run `npx vitest run` — the ENTIRE suite must pass with zero failures.

Output <promise>ALL-COMPLETE</promise> when the full test suite passes and smoke tests are documented." --max-iterations 30 --completion-promise "ALL-COMPLETE"
```

---

## Suggested Workflow

1. Run the Task 1 SQL migration manually against Supabase production
2. Open Claude Code in the Phera project directory
3. Paste the **Standard Prompt** to orient Claude Code on the full context
4. Then use the **Ralph Wiggum phases** one at a time for autonomous execution
5. Review code between phases — each phase commits its work, so you can inspect before proceeding
6. If a phase gets stuck at max iterations, review what failed and adjust

## Notes

- Adjust `--max-iterations` up if a phase is complex (Tasks 5-8 with AI logic may need more)
- The standard prompt assumes Task 1 migration is already applied. If you haven't run it yet, change "Start from Task 2" to "Start from Task 1"
- Each ralph-loop phase is self-contained — you can take breaks between phases
- If you want to run a single task instead of a phase, just extract that one task into its own ralph-loop prompt
