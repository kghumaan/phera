#!/usr/bin/env node
/**
 * Phera Agent eval runner.
 *
 * Drives the agent lab API with scripted conversations and scores the
 * results: which tools ran, what the reply said, whether confirmations
 * were parked, and whether the data actually mutated.
 *
 * Usage:
 *   node scripts/agent-evals.mjs                 # run every scenario
 *   node scripts/agent-evals.mjs onboarding      # name filter (substring)
 *   node scripts/agent-evals.mjs --keep          # skip teardown (inspect in /agent-lab)
 *   node scripts/agent-evals.mjs --strict        # non-zero exit on any failure
 *
 * Requires a running dev server (default http://localhost:3000) and
 * AGENT_LAB_TOKEN (read from env or .env.local). Each run costs real model
 * tokens — this is a quality scorecard, not a CI suite.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIO_DIR = join(ROOT, 'tests', 'agent-evals', 'scenarios');
const BASE_URL = process.env.AGENT_LAB_BASE_URL || 'http://localhost:3000';

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const strict = args.includes('--strict');
const filters = args.filter((a) => !a.startsWith('--'));

function labToken() {
  if (process.env.AGENT_LAB_TOKEN) return process.env.AGENT_LAB_TOKEN;
  try {
    const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
    const match = env.match(/^AGENT_LAB_TOKEN=(.+)$/m);
    if (match) return match[1].trim();
  } catch {
    /* fall through */
  }
  throw new Error('AGENT_LAB_TOKEN not found (env or .env.local)');
}

const TOKEN = labToken();

async function api(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${body.error ?? 'unknown'}`);
  return body;
}

/** Helpers passed to scenario verify() functions. */
const helpers = {
  guest: (state, name) => state.guests.find((g) => g.name === name) ?? null,
  rsvpFor: (state, guestName) => {
    const guest = helpers.guest(state, guestName);
    if (!guest) return null;
    return state.rsvps.find((r) => r.guest_id === guest.id) ?? null;
  },
  room: (state, number) => state.rooms.find((r) => r.room_number === number) ?? null,
};

function check(checks, label, pass, detail = '') {
  checks.push({ label, pass: !!pass, detail });
}

async function runScenario(scenario) {
  const checks = [];
  const seeded = await api('/api/agent/lab/seed', {
    method: 'POST',
    body: JSON.stringify({ scenario: scenario.seed }),
  });
  const slug = seeded.slug;
  let conversationId;
  let lastPendingActions = [];

  try {
    for (const [index, turn] of scenario.turns.entries()) {
      const tag = `t${index + 1}`;

      let result;
      if (turn.confirm) {
        const pending = lastPendingActions[0];
        check(checks, `${tag} has a pending action to ${turn.confirm}`, !!pending);
        if (!pending) continue;
        result = await api('/api/agent/lab/confirm', {
          method: 'POST',
          body: JSON.stringify({ actionId: pending.actionId, approve: turn.confirm === 'approve' }),
        });
        lastPendingActions = lastPendingActions.slice(1);
      } else {
        result = await api('/api/agent/lab/chat', {
          method: 'POST',
          body: JSON.stringify({ weddingSlug: slug, conversationId, message: turn.message }),
        });
        conversationId = result.conversationId;
        lastPendingActions = (result.events ?? []).filter((e) => e.type === 'confirmation_required');
      }

      const reply = result.reply ?? '';
      const toolsRun = (result.actions ?? []).map((a) => a.tool_name);
      const expect = turn.expect ?? {};

      for (const tool of expect.tools ?? []) {
        check(checks, `${tag} called ${tool}`, toolsRun.includes(tool), `ran: ${toolsRun.join(', ') || 'none'}`);
      }
      for (const tool of expect.notTools ?? []) {
        check(checks, `${tag} did NOT call ${tool}`, !toolsRun.includes(tool));
      }
      for (const pattern of expect.reply ?? []) {
        const re = new RegExp(pattern, 'i');
        check(checks, `${tag} reply matches /${pattern}/i`, re.test(reply), reply.slice(0, 120));
      }
      for (const pattern of expect.replyNot ?? []) {
        const re = new RegExp(pattern, 'i');
        check(checks, `${tag} reply avoids /${pattern}/i`, !re.test(reply));
      }
      if (expect.pending !== undefined) {
        check(
          checks,
          `${tag} ${expect.pending ? 'parks a confirmation' : 'parks no confirmation'}`,
          (lastPendingActions.length > 0) === expect.pending
        );
      }

      if (turn.verify) {
        const state = await api(`/api/agent/lab/state?weddingSlug=${slug}`);
        const results = await turn.verify(state, helpers);
        for (const r of results) check(checks, `${tag} ${r.label}`, r.pass, r.detail ?? '');
      }
    }
  } finally {
    if (!keep) {
      await api(`/api/agent/lab/seed?weddingSlug=${slug}`, { method: 'DELETE' }).catch((e) =>
        console.error(`  teardown failed for ${slug}: ${e.message}`)
      );
    } else {
      console.log(`  (kept: ${slug})`);
    }
  }

  return checks;
}

async function main() {
  const files = readdirSync(SCENARIO_DIR)
    .filter((f) => f.endsWith('.mjs'))
    .sort();
  const report = [];
  let totalPass = 0;
  let totalFail = 0;

  for (const file of files) {
    const { default: scenario } = await import(pathToFileURL(join(SCENARIO_DIR, file)).href);
    if (filters.length && !filters.some((f) => scenario.name.includes(f))) continue;

    process.stdout.write(`\n▶ ${scenario.name} — ${scenario.description}\n`);
    let checks;
    try {
      checks = await runScenario(scenario);
    } catch (error) {
      checks = [{ label: `scenario crashed: ${error.message}`, pass: false }];
    }
    for (const c of checks) {
      const mark = c.pass ? '  ✓' : '  ✗';
      console.log(`${mark} ${c.label}${!c.pass && c.detail ? `  [${c.detail}]` : ''}`);
      c.pass ? totalPass++ : totalFail++;
    }
    report.push({ scenario: scenario.name, checks });
  }

  console.log(`\n══ Scorecard: ${totalPass} pass / ${totalFail} fail ══`);
  const reportPath = join(ROOT, 'agent-evals-report.json');
  writeFileSync(reportPath, JSON.stringify({ ranAt: new Date().toISOString(), report }, null, 2));
  console.log(`Report: ${reportPath}`);
  if (strict && totalFail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
