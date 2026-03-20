# Phera Pivot — Claude Code Genesis Prompt

## Standard Prompt (paste into Claude Code first, optionally in Plan Mode)

```
Read CLAUDE.md, DEV-ROADMAP.md, and PIVOT-PLAN.md in the project root — in that order — before writing any code.

CLAUDE.md contains the full project context: tech stack, database schema, file map, WhatsApp API rules, target market, and development rules. DEV-ROADMAP.md is your 24-task engineering spec. PIVOT-PLAN.md explains the strategic "why" behind every decision.

KEY FACTS:
- Task 1 (DB migration) is ALREADY DONE. All new columns and tables exist in Supabase. Skip Task 1. Start from Task 2.
- All work goes on the `develop` branch (create from main if it doesn't exist).
- Do NOT modify these files: lib/whatsapp/client.ts, lib/whatsapp/templates.ts, lib/whatsapp/opt-ins.ts, lib/supabase/client.ts
- New outreach templates go in lib/whatsapp/outreach-templates.ts (separate file from existing templates.ts).
- wedding_id is always TEXT (a slug), never UUID. There is no weddings table.
- Hinglish templates WILL BE REJECTED by Meta. Always create separate en + hi versions.
- Tests must pass after every task. Run `npx vitest run` to verify.
- Commit after each completed task.

ERROR REPORTING: If you hit any blocker — schema mismatches, missing env vars, existing test failures not caused by your changes, type errors in existing code, or anything requiring a DO-NOT-MODIFY file to be changed — STOP and report it in this format:
⚠️ BLOCKER: [short description]
- What happened: [details]
- What I tried: [attempted fixes]
- What I need: [what the user should do]
Do NOT silently work around blockers. The user needs to know.

START: Read all three docs now, confirm your understanding, then begin Task 2.
```

---

## Ralph Wiggum Version (per-phase autonomous loops)

### Phase 1: Foundation (Tasks 2-4)

```
/ralph-loop "Read CLAUDE.md and DEV-ROADMAP.md before doing anything.

Work on `develop` branch. Task 1 SQL migration already applied. DO NOT MODIFY: lib/whatsapp/client.ts, lib/whatsapp/templates.ts, lib/whatsapp/opt-ins.ts, lib/supabase/client.ts. wedding_id is TEXT (slug), not UUID. No weddings table exists.

YOUR TASKS (in order):
- Task 2: Create lib/supabase/outreach-service.ts with all functions specified in DEV-ROADMAP.md. Write tests in tests/outreach-service.test.ts.
- Task 3: Create lib/whatsapp/outreach-templates.ts with ALL templates from DEV-ROADMAP.md (SAVE_THE_DATE, RSVP_REQUEST, RSVP_NUDGE, EVENT_REMINDER, MULTI_EVENT_INVITE carousel, SHUTTLE_INFO, DAY_BEFORE_SUMMARY, THANK_YOU, CULTURAL_GUIDE). Each template needs en + hi versions. NO Hinglish. Write tests in tests/outreach-templates.test.ts.
- Task 4: Create lib/whatsapp/outreach-sender.ts with OutreachSender class. Write tests in tests/outreach-sender.test.ts.

After each task: run `npx vitest run` to verify ALL tests pass (not just new ones). Fix any failures before moving on. Commit after each task with a descriptive message.

ERROR REPORTING: If you hit a blocker (schema mismatch, missing env var, existing test failure not from your changes, need to modify a protected file), STOP and output:
⚠️ BLOCKER: [description]
- What happened: [details]
- What I tried: [fixes attempted]
- What I need: [action needed from user]
Then output <promise>PHASE1-BLOCKED</promise> so the loop stops.

Output <promise>PHASE1-COMPLETE</promise> when ALL three tasks are done, ALL tests pass, and ALL commits are made." --max-iterations 30 --completion-promise "PHASE1-COMPLETE"
```

### Phase 2: AI Layer (Tasks 5-8)

```
/ralph-loop "Read CLAUDE.md and DEV-ROADMAP.md before doing anything.

Work on `develop` branch. Phase 1 (Tasks 2-4) is already complete. DO NOT MODIFY: lib/whatsapp/client.ts, lib/whatsapp/templates.ts, lib/whatsapp/opt-ins.ts, lib/supabase/client.ts.

YOUR TASKS (in order):
- Task 5: Create lib/ai/guest-coordinator.ts — AI guest coordination agent with conversation state machine. Tests in tests/guest-coordinator.test.ts.
- Task 6: Create lib/whatsapp/template-submission.ts — Meta template submission helper with all templates from Task 3. Tests in tests/template-submission.test.ts. Remember: ~47% first-time rejection rate, plan for iteration.
- Task 7: Create lib/ai/escalation-engine.ts — Escalation detection and routing. Tests in tests/escalation-engine.test.ts.
- Task 8: Create lib/whatsapp/webhook-handler.ts — Incoming webhook processor. Tests in tests/webhook-handler.test.ts.

Run `npx vitest run` after each task. Fix failures before proceeding. Commit after each task.

ERROR REPORTING: If you hit a blocker, STOP and output:
⚠️ BLOCKER: [description]
- What happened: [details]
- What I tried: [fixes attempted]
- What I need: [action needed from user]
Then output <promise>PHASE2-BLOCKED</promise> so the loop stops.

Output <promise>PHASE2-COMPLETE</promise> when ALL four tasks are done and ALL tests pass." --max-iterations 40 --completion-promise "PHASE2-COMPLETE"
```

### Phase 3: Backend APIs (Tasks 9-10)

```
/ralph-loop "Read CLAUDE.md and DEV-ROADMAP.md before doing anything.

Work on `develop` branch. Phases 1-2 (Tasks 2-8) are complete.

YOUR TASKS:
- Task 9: Create app/api/webhooks/whatsapp/route.ts — WhatsApp webhook API route with signature verification. Tests in tests/api/whatsapp-webhook.test.ts.
- Task 10: Create app/api/outreach/ routes — Dashboard API endpoints (status, send, sequence, events, escalations). Tests in tests/api/outreach-api.test.ts.

Run `npx vitest run` after each task. Fix failures. Commit after each.

ERROR REPORTING: If you hit a blocker, STOP and output:
⚠️ BLOCKER: [description]
- What happened: [details]
- What I tried: [fixes attempted]
- What I need: [action needed from user]
Then output <promise>PHASE3-BLOCKED</promise> so the loop stops.

Output <promise>PHASE3-COMPLETE</promise> when both tasks pass all tests." --max-iterations 25 --completion-promise "PHASE3-COMPLETE"
```

### Phase 4: Frontend — Dashboard (Tasks 11-14)

```
/ralph-loop "Read CLAUDE.md and DEV-ROADMAP.md before doing anything.

Work on `develop` branch. Phases 1-3 (Tasks 2-10) are complete. UI uses MUI v7 + Tailwind v4. Admin pages go under app/admin/[weddingSlug]/.

YOUR TASKS:
- Task 11: Create enhanced wedding setup wizard page. Tests in tests/components/setup-wizard.test.tsx. Include fields: "Where do you currently live?", "Where are most guests from?", "Will you have non-Indian guests?"
- Task 12: Create outreach command center page. Tests in tests/components/outreach-dashboard.test.tsx. Include "reverse destination" hero feature. Multi-currency pricing context.
- Task 13: Create or integrate multi-currency pricing with Stripe. Tests in tests/components/pricing.test.tsx. USD ($349/$599/$799-999) + INR (₹9,999/₹17,999/₹29,999).
- Task 14: Create guest logistics tracker page. Tests in tests/components/logistics-dashboard.test.tsx.

Run `npx vitest run` after each task. Fix failures. Commit after each.

ERROR REPORTING: If you hit a blocker, STOP and output:
⚠️ BLOCKER: [description]
- What happened: [details]
- What I tried: [fixes attempted]
- What I need: [action needed from user]
Then output <promise>PHASE4-BLOCKED</promise> so the loop stops.

Output <promise>PHASE4-COMPLETE</promise> when all four tasks pass tests." --max-iterations 40 --completion-promise "PHASE4-COMPLETE"
```

### Phase 5: Frontend — Guest Experience (Tasks 15-18)

```
/ralph-loop "Read CLAUDE.md and DEV-ROADMAP.md before doing anything.

Work on `develop` branch. Phases 1-4 (Tasks 2-14) are complete. Guest pages go under app/(guest)/[weddingId]/.

YOUR TASKS:
- Task 15: Create guest RSVP page with WhatsApp opt-in. Tests in tests/components/guest-rsvp.test.tsx.
- Task 16: Create travel info collection page. Tests in tests/components/travel-form.test.tsx.
- Task 17: Create event schedule view page. Tests in tests/components/schedule-view.test.tsx.
- Task 18: Create shuttle assignment display page. Tests in tests/components/shuttle-view.test.tsx.

Run `npx vitest run` after each task. Fix failures. Commit after each.

ERROR REPORTING: If you hit a blocker, STOP and output:
⚠️ BLOCKER: [description]
- What happened: [details]
- What I tried: [fixes attempted]
- What I need: [action needed from user]
Then output <promise>PHASE5-BLOCKED</promise> so the loop stops.

Output <promise>PHASE5-COMPLETE</promise> when all four tasks pass tests." --max-iterations 40 --completion-promise "PHASE5-COMPLETE"
```

### Phase 6: WhatsApp Experience + NRI Features (Tasks 19-22)

```
/ralph-loop "Read CLAUDE.md and DEV-ROADMAP.md before doing anything.

Work on `develop` branch. Phases 1-5 (Tasks 2-18) are complete.

YOUR TASKS:
- Task 19: WhatsApp Flows — Create lib/whatsapp/flows.ts with RSVP flow definition (5 screens: Welcome → Attendance → Guest Count → Dietary → Confirmation). No competitor uses WhatsApp Flows for RSVP. Tests in tests/whatsapp-flows.test.ts.
- Task 20: wa.me Deep Links — Create lib/whatsapp/deep-links.ts with generateWaLink, generateBulkWaLinks, and PersonalOutreachGenerator UI component. Tests in tests/deep-links.test.ts.
- Task 21: Wedding-Branded Business Profile — Create lib/whatsapp/business-profile.ts with updateBusinessProfile API call. Display name format: 'Priya & Rahul Wedding'. Tests in tests/business-profile.test.ts.
- Task 22: Reverse-Destination Guest Experience — Create lib/knowledge/reverse-destination.ts with REVERSE_DESTINATION_GUIDE knowledge base (visa info, ceremony explanations, dress code per event, etiquette, food tips, SIM card, airport coordination). generateCulturalGuidePDF. Tests in tests/reverse-destination.test.ts.

Run `npx vitest run` after each task. Fix failures. Commit after each.

ERROR REPORTING: If you hit a blocker, STOP and output:
⚠️ BLOCKER: [description]
- What happened: [details]
- What I tried: [fixes attempted]
- What I need: [action needed from user]
Then output <promise>PHASE6-BLOCKED</promise> so the loop stops.

Output <promise>PHASE6-COMPLETE</promise> when all four tasks pass tests." --max-iterations 40 --completion-promise "PHASE6-COMPLETE"
```

### Phase 7: Final Validation (Tasks 23-24)

```
/ralph-loop "Read CLAUDE.md and DEV-ROADMAP.md before doing anything.

Work on `develop` branch. All features built (Tasks 2-22).

YOUR TASKS:
- Task 23: Update ALL existing tests that may have been broken by the pivot changes. Run full test suite (`npx vitest run`). Every single test must pass — both new and pre-existing.
- Task 24: Smoke test checklist — verify every API route returns expected responses, every page renders without errors, webhook signature verification works, template parameter validation works, WhatsApp Flows definition is valid, deep link generation produces correct URLs. Document results in a SMOKE-TEST-RESULTS.md file.

Run `npx vitest run` — the ENTIRE suite must pass with zero failures.

ERROR REPORTING: If you hit a blocker, STOP and output:
⚠️ BLOCKER: [description]
- What happened: [details]
- What I tried: [fixes attempted]
- What I need: [action needed from user]
Then output <promise>FINAL-BLOCKED</promise> so the loop stops.

Output <promise>ALL-COMPLETE</promise> when the full test suite passes with zero failures and smoke test results are documented." --max-iterations 30 --completion-promise "ALL-COMPLETE"
```

---

## Workflow

1. ~~Run Task 1 SQL migration~~ ✅ DONE (already applied to test + production Supabase)
2. Open Claude Code in the Phera project directory
3. Paste the **Standard Prompt** (optionally in Plan Mode to review the plan first)
4. Once oriented, use **Ralph Wiggum phases** one at a time for autonomous execution
5. Review committed code between phases before proceeding
6. If a phase outputs `BLOCKED` instead of `COMPLETE`, check the error report and fix the issue before re-running

## Notes

- Each ralph-loop phase reads CLAUDE.md + DEV-ROADMAP.md fresh, so context is always current
- If a phase hits `--max-iterations` without completing, check the last error and either fix it or increase the limit
- Phases with `BLOCKED` output will stop the loop cleanly — read the ⚠️ BLOCKER report for what needs fixing
- You can run a single task by extracting it from a phase into its own ralph-loop prompt
- Adjust `--max-iterations` up for complex phases (Phase 2 AI layer, Phase 4 dashboard UI)
