/**
 * Phera — Planner Outreach Auto-Sender (Google Apps Script)
 * -----------------------------------------------------------------------------
 * Sends the beta-launch outreach to wedding planners FROM kv@phera.io, on a
 * throttled daily schedule, straight from a Google Sheet.
 *
 * WHY THIS WORKS (and hand-sending from Gmail didn't): the Gmail compose editor
 * strips background colors on Send. GmailApp.sendEmail() goes through the Gmail
 * API, which delivers your exact HTML — so the full pink-card design renders.
 *
 * SETUP (one time):
 *  1. In kv@phera.io, create a Google Sheet named e.g. "Planner Outreach".
 *     Row 1 headers (exact, any order):  Planner | Email | FirstName | Variant | Subject | Status | SentAt
 *     - Variant: A | B | C  (rotate for the A/B test)
 *     - Subject: leave blank to use the default for that variant, or set your own
 *     - Status:  leave blank = queued. Script writes "Sent". Put "Skip" to hold a row.
 *  2. Extensions → Apps Script → paste this file → Save.
 *  3. Run `sendTestToSelf` once and approve the OAuth prompt (sends 1 email to yourself).
 *  4. Triggers (clock icon) → Add Trigger → function `sendDailyBatch`,
 *     event source "Time-driven", "Day timer", pick a morning hour. Save.
 *  That's it — it drips PER_RUN emails/day and marks each row Sent.
 *
 * Reply handling stays manual/Notion: when a planner replies, update the tracker.
 * -----------------------------------------------------------------------------
 */

// ----------------------------- CONFIG ---------------------------------------
const CONFIG = {
  SHEET_NAME: 'Planner Outreach',   // tab name to read from
  FROM_NAME: 'KV & Sim',            // display name on the From line
  REPLY_TO: 'kv@phera.io',
  PER_RUN: 20,                      // how many to send each daily run (keep it human)
  DAILY_CAP: 25,                    // hard ceiling per calendar day across runs
  SLEEP_MS: 4000,                   // pause between sends (throttle → deliverability)
  CAL_LINK: 'https://cal.com/simmetry-studios/phera?overlayCalendar=true',
  DRY_RUN: false,                   // true = log only, don't actually send
};

// Default subjects per variant (used when the Subject cell is blank).
const DEFAULT_SUBJECTS = {
  A: 'Phera beta — free for a few planners',
  B: "We just opened Phera's beta",
  C: 'KV from Phera — quick intro',
};

// ----------------------------- ENTRY POINTS ---------------------------------

/** Time-driven trigger target. Sends up to PER_RUN queued rows. */
function sendDailyBatch() {
  const sheet = getSheet_();
  const { rows, colIndex } = readRows_(sheet);

  let sentThisRun = 0;
  const remainingToday = CONFIG.DAILY_CAP - countSentToday_(rows, colIndex);
  const budget = Math.max(0, Math.min(CONFIG.PER_RUN, remainingToday));
  if (budget === 0) {
    Logger.log('Daily cap reached — nothing sent.');
    return;
  }

  const seen = {}; // guard against duplicate emails within one run
  for (let i = 0; i < rows.length && sentThisRun < budget; i++) {
    const row = rows[i];
    const email = String(row[colIndex.Email] || '').trim().toLowerCase();
    const status = String(row[colIndex.Status] || '').trim().toLowerCase();
    if (!email || status === 'sent' || status === 'skip' || seen[email]) continue;
    seen[email] = true;

    const firstName = String(row[colIndex.FirstName] || '').trim();
    const variant = normalizeVariant_(row[colIndex.Variant]);
    const subject =
      String(row[colIndex.Subject] || '').trim() || DEFAULT_SUBJECTS[variant];
    const built = buildEmail_(variant, firstName, subject);

    if (CONFIG.DRY_RUN) {
      Logger.log('DRY_RUN → would send to %s (var %s): %s', email, variant, subject);
    } else {
      GmailApp.sendEmail(email, built.subject, built.text, {
        htmlBody: built.html,
        name: CONFIG.FROM_NAME,
        replyTo: CONFIG.REPLY_TO,
      });
      // Write Status + SentAt back (sheet row is i + 2: header + 0-index).
      const sheetRow = i + 2;
      sheet.getRange(sheetRow, colIndex.Status + 1).setValue('Sent');
      sheet.getRange(sheetRow, colIndex.SentAt + 1).setValue(new Date());
    }
    sentThisRun++;
    if (!CONFIG.DRY_RUN) Utilities.sleep(CONFIG.SLEEP_MS);
  }
  Logger.log('Done. Sent %s email(s) this run.', sentThisRun);
}

/** One-off: send a single email to yourself to preview + trigger OAuth consent. */
function sendTestToSelf() {
  const me = Session.getActiveUser().getEmail();
  const built = buildEmail_('A', 'there', DEFAULT_SUBJECTS.A);
  GmailApp.sendEmail(me, '[TEST] ' + built.subject, built.text, {
    htmlBody: built.html,
    name: CONFIG.FROM_NAME,
    replyTo: CONFIG.REPLY_TO,
  });
  Logger.log('Test sent to %s', me);
}

// --- CONFIRMATION TEST -------------------------------------------------------
// Safe sandbox: sends ALL THREE variants to ONLY these two inboxes so you can
// eyeball the render + every variant before wiring up the real sheet/trigger.
// No sheet needed. Run `sendConfirmationTest` and approve the OAuth prompt.
const TEST_RECIPIENTS = ['kv.s.ghumaan@gmail.com', 'contact@phera.io'];

function sendConfirmationTest() {
  const variants = ['A', 'B', 'C'];
  let n = 0;
  variants.forEach((v) => {
    const built = buildEmail_(v, 'there', DEFAULT_SUBJECTS[v]);
    TEST_RECIPIENTS.forEach((to) => {
      GmailApp.sendEmail(to, '[TEST ' + v + '] ' + built.subject, built.text, {
        htmlBody: built.html,
        name: CONFIG.FROM_NAME,
        replyTo: CONFIG.REPLY_TO,
      });
      n++;
      Utilities.sleep(1500);
    });
  });
  Logger.log('Confirmation test: sent %s emails (A/B/C) to %s', n, TEST_RECIPIENTS.join(', '));
}

// ----------------------------- EMAIL BUILDER --------------------------------
// Full-color card — safe here because API send preserves backgrounds.

const C = {
  PINK: '#DE3F5E',
  BG: '#FFF7F8',
  STRONG: '#1a1a1a',
  MUTED: '#4a4a4a',
  FAINT: '#9a9a9a',
};

function buildEmail_(variant, firstName, subject) {
  const greeting = firstName ? 'Hi ' + esc_(firstName) + ' —' : 'Hello!';
  const body = variantBody_(variant); // { htmlParas: [...], textParas: [...] }

  const html = [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0"></head>',
    '<body style="margin:0;padding:0;background:' + C.BG + ";font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;\">",
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.BG + ';"><tr>',
    '<td align="center" style="padding:40px 20px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr>',
    '<td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 4px 24px rgba(26,26,26,0.06);border:1px solid rgba(0,0,0,0.04);">',
    '<p style="margin:0 0 16px;font-size:16px;color:' + C.STRONG + ';line-height:1.55;">' + greeting + '</p>',
    body.htmlParas.join(''),
    // CTA button
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 0;"><tr>',
    '<td align="center" style="border-radius:14px;background:' + C.PINK + ';">',
    '<a href="' + CONFIG.CAL_LINK + '" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:14px;background:' + C.PINK + ';">Book a 15-min intro &rarr;</a>',
    '</td></tr></table>',
    '<p style="margin:28px 0 0;font-size:14px;color:' + C.MUTED + ';line-height:1.6;">— KV &amp; Sim<br/>',
    '<span style="color:' + C.FAINT + ';font-size:13px;">Founders, Phera · phera.io</span></p>',
    '</td></tr>',
    // footer
    '<tr><td align="center" style="padding:24px 8px 0;">',
    '<p style="margin:0;font-size:12px;color:' + C.FAINT + ';line-height:1.6;">Reaching out because you plan Indian &amp; destination weddings.<br/>Reply directly — I\'ll see it.</p>',
    '<p style="margin:12px 0 0;font-size:11px;color:#c9c9c9;">© ' + new Date().getFullYear() + ' Phera · Indian wedding logistics, handled</p>',
    '</td></tr></table></td></tr></table></body></html>',
  ].join('');

  const text = [greeting, '']
    .concat(body.textParas)
    .concat(['', 'Book a 15-min intro (via Cal.com): ' + CONFIG.CAL_LINK, '', '— KV & Sim', 'Founders, Phera · phera.io'])
    .join('\n');

  return { subject: subject, html: html, text: text };
}

function variantBody_(variant) {
  const p = (s) => '<p style="margin:0 0 16px;font-size:16px;color:' + C.MUTED + ';line-height:1.6;">' + s + '</p>';
  const b = (s) => '<strong style="color:' + C.STRONG + ';">' + s + '</strong>';
  const link = 'AI wedding assistant';

  if (variant === 'B') {
    return {
      htmlParas: [
        p('We just opened the ' + b('private beta') + ' for Phera — the ' + link + ' we built to take the guest-logistics load off big Indian &amp; destination weddings: RSVPs, guest travel, room assignments and 24/7 WhatsApp coordination.'),
        p('The guest side is a grind — chasing RSVPs, endless "what\'s the dress code" questions, and coordinating hotels for 200+ guests flying in. Phera handles all of it, and we build custom tools to fit each wedding.'),
        p('We\'re giving the ' + b('first few planners full access, completely free') + ' for their next couple of weddings — ' + b('you keep the client, your couples get a white-glove experience, and it costs you nothing.') + ' All we want is honest feedback from people who do this for a living.'),
      ],
      textParas: [
        "We just opened the private beta for Phera — the AI wedding assistant we built to take the guest-logistics load off big Indian & destination weddings: RSVPs, guest travel, room assignments and 24/7 WhatsApp coordination.",
        'The guest side is a grind — chasing RSVPs, endless "what\'s the dress code" questions, and coordinating hotels for 200+ guests flying in. Phera handles all of it, and we build custom tools to fit each wedding.',
        "We're giving the first few planners full access, completely free for their next couple of weddings — you keep the client, your couples get a white-glove experience, and it costs you nothing. All we want is honest feedback from people who do this for a living.",
      ],
    };
  }
  if (variant === 'C') {
    return {
      htmlParas: [
        p('Quick one — we just launched the ' + b('private beta') + ' of Phera, an ' + link + ' that takes the whole guest-logistics side off a planner\'s plate: RSVPs, guest travel, room blocks, and a WhatsApp agent that answers guests 24/7.'),
        p('We\'re onboarding the ' + b('first few planners for free') + ' — ' + b('you keep the client, it costs you nothing') + ' — in exchange for honest feedback while we get it perfect for real weddings. We\'ll even build custom features to fit how you work.'),
      ],
      textParas: [
        "Quick one — we just launched the private beta of Phera, an AI wedding assistant that takes the whole guest-logistics side off a planner's plate: RSVPs, guest travel, room blocks, and a WhatsApp agent that answers guests 24/7.",
        "We're onboarding the first few planners for free — you keep the client, it costs you nothing — in exchange for honest feedback while we get it perfect for real weddings. We'll even build custom features to fit how you work.",
      ],
    };
  }
  // Variant A (default) — problem-first
  return {
    htmlParas: [
      p('The guest side of a destination wedding is a grind — chasing RSVPs, answering the same WhatsApp questions all day, and coordinating travel and hotels for 200+ guests flying in.'),
      p('We\'re KV &amp; Sim, founders of Phera — the ' + link + ' that takes all of that off a planner\'s plate: RSVPs, guest travel, room assignments and 24/7 WhatsApp coordination. Because every wedding is different, we build custom tools that fit yours.'),
      p('We just opened our ' + b('private beta') + ' and are giving the ' + b('first few planners full access, completely free') + ', for their next couple of weddings — ' + b('you keep the client, it costs you nothing.') + ' We\'d just love honest feedback from people who do this for a living.'),
    ],
    textParas: [
      'The guest side of a destination wedding is a grind — chasing RSVPs, answering the same WhatsApp questions all day, and coordinating travel and hotels for 200+ guests flying in.',
      "We're KV & Sim, founders of Phera — the AI wedding assistant that takes all of that off a planner's plate: RSVPs, guest travel, room assignments and 24/7 WhatsApp coordination. Because every wedding is different, we build custom tools that fit yours.",
      "We just opened our private beta and are giving the first few planners full access, completely free, for their next couple of weddings — you keep the client, it costs you nothing. We'd just love honest feedback from people who do this for a living.",
    ],
  };
}

// ----------------------------- HELPERS --------------------------------------

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  if (!sheet) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" not found.');
  return sheet;
}

function readRows_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map((h) => String(h).trim());
  const need = ['Planner', 'Email', 'FirstName', 'Variant', 'Subject', 'Status', 'SentAt'];
  const colIndex = {};
  need.forEach((key) => {
    const idx = headers.indexOf(key);
    if (idx === -1) throw new Error('Missing column header: "' + key + '"');
    colIndex[key] = idx;
  });
  return { rows: values.slice(1), colIndex };
}

function countSentToday_(rows, colIndex) {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
  let n = 0;
  rows.forEach((r) => {
    const at = r[colIndex.SentAt];
    if (at instanceof Date && at.getFullYear() === y && at.getMonth() === m && at.getDate() === d) n++;
  });
  return n;
}

function normalizeVariant_(v) {
  const s = String(v || 'A').trim().toUpperCase();
  return s === 'B' || s === 'C' ? s : 'A';
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
