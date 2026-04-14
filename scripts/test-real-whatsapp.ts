#!/usr/bin/env npx tsx
/**
 * Test Real WhatsApp Template Send
 *
 * Sends a real WhatsApp template message to a phone number using the Cloud API.
 * Looks up wedding data from Supabase to fill in template variables.
 *
 * Usage:
 *   npx tsx scripts/test-real-whatsapp.ts \
 *     --wedding=demo-v0ylzu6p \
 *     --phone=+14155551234 \
 *     --template=rsvp_request_v1 \
 *     --image=https://example.com/save-the-date.jpg
 *
 * Options:
 *   --wedding   Wedding slug (required)
 *   --phone     Recipient phone number with country code (required)
 *   --template  Template name registered in Meta (default: rsvp_request_v1)
 *   --lang      Language code: en or hi (default: en)
 *   --image     Publicly accessible image URL for header (optional)
 *   --dry-run   Print the payload without sending (optional)
 *
 * Environment:
 *   Reads from .env.local (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, etc.)
 *   and NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for DB lookups.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ─── Parse CLI Args ─────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      args[key] = rest.join('=') || 'true';
    }
  }
  return args;
}

const args = parseArgs();
const weddingSlug = args['wedding'];
const phone = args['phone'];
const templateName = args['template'] || 'rsvp_request_v1';
const languageCode = args['lang'] || 'en';
const imageUrl = args['image'] || '';
const dryRun = args['dry-run'] === 'true';
// Provider: 'whapi' | 'meta' | 'auto' (default auto-detects from env vars)
const providerArg = args['provider'] || 'auto';

if (!weddingSlug || !phone) {
  console.error(`
Usage:
  npx tsx scripts/test-real-whatsapp.ts \\
    --wedding=<slug> \\
    --phone=+<country><number> \\
    [--template=rsvp_request_v1] \\
    [--lang=en] \\
    [--image=https://...] \\
    [--provider=whapi|meta|auto] \\
    [--dry-run]

Example:
  npx tsx scripts/test-real-whatsapp.ts \\
    --wedding=demo-v0ylzu6p \\
    --phone=+14155551234 \\
    --image=https://phera.io/images/couple/save-the-date.jpg
  `);
  process.exit(1);
}

// ─── Validate Environment ───────────────────────────────────────────

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHAPI_API_TOKEN = process.env.WHAPI_API_TOKEN;
const WHAPI_BASE_URL = process.env.WHAPI_API_URL || 'https://gate.whapi.cloud';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Determine provider
const provider: 'whapi' | 'meta' =
  providerArg === 'whapi' ? 'whapi'
  : providerArg === 'meta' ? 'meta'
  : WHAPI_API_TOKEN ? 'whapi' // auto-detect
  : 'meta';

const missing: string[] = [];
if (provider === 'meta') {
  if (!WHATSAPP_PHONE_NUMBER_ID) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!WHATSAPP_ACCESS_TOKEN) missing.push('WHATSAPP_ACCESS_TOKEN');
} else {
  if (!WHAPI_API_TOKEN) missing.push('WHAPI_API_TOKEN');
}
if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

if (missing.length > 0) {
  console.error(`\n❌ Missing environment variables in .env.local:\n  ${missing.join('\n  ')}\n`);
  process.exit(1);
}

// ─── Supabase Client ────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔍 Looking up wedding data...');

  // Fetch wedding
  const { data: wedding, error: wErr } = await supabase
    .from('weddings')
    .select('partner1_name, partner2_name, wedding_date_display, venue_name, venue_location, slug, couple_name')
    .eq('slug', weddingSlug)
    .single();

  if (wErr || !wedding) {
    console.error(`❌ Wedding "${weddingSlug}" not found:`, wErr?.message || 'No data');
    process.exit(1);
  }

  // Derive partner names — fall back to splitting couple_name if partner columns are null
  let partner1 = (wedding as any).partner1_name || '';
  let partner2 = (wedding as any).partner2_name || '';
  if (!partner1 && wedding.couple_name) {
    const parts = wedding.couple_name.split(/\s*[&+]\s*/);
    partner1 = parts[0]?.trim() || '';
    partner2 = parts[1]?.trim() || '';
  }

  const dateDisplay = (wedding as any).wedding_date_display || '';
  const venue = [wedding.venue_name, wedding.venue_location].filter(Boolean).join(', ');
  const websiteUrl = `https://phera.io/${wedding.slug}`;

  console.log(`  Partner 1: ${partner1}`);
  console.log(`  Partner 2: ${partner2}`);
  console.log(`  Date:      ${dateDisplay || 'Not set'}`);
  console.log(`  Venue:     ${venue || 'Not set'}`);
  console.log(`  Slug:      ${wedding.slug}`);
  console.log(`  URL:       ${websiteUrl}`);

  // Clean phone number (keep only digits, allow leading +)
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  console.log(`\n📱 Sending to: +${cleanPhone}`);
  console.log(`  Provider:  ${provider}`);
  console.log(`  Template:  ${templateName}`);
  console.log(`  Language:  ${languageCode}`);
  if (imageUrl) console.log(`  Image:     ${imageUrl}`);

  // ─── Render plain-text message (used by Whapi, shown in preview for Meta) ──

  const couple = `${partner1} & ${partner2}`;
  const plainText = `${couple} would love for you to join their wedding celebration on ${dateDisplay} at ${venue}.\n\nView details & RSVP: ${websiteUrl}`;

  if (provider === 'whapi') {
    // ─── Whapi: send as plain text (or image + caption) ───────────

    console.log('\n📝 Message text:');
    console.log(plainText);
    if (imageUrl) console.log(`\n🖼️  Image: ${imageUrl}`);

    if (dryRun) {
      console.log('\n🏁 Dry run — not sending. Remove --dry-run to send for real.');
      return;
    }

    console.log('\n🚀 Sending via Whapi...');

    const whapiPath = imageUrl ? '/messages/image' : '/messages/text';
    const whapiBody = imageUrl
      ? { to: cleanPhone, media: { url: imageUrl }, caption: plainText }
      : { to: cleanPhone, body: plainText };

    const response = await fetch(`${WHAPI_BASE_URL}${whapiPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whapiBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('\n❌ Whapi API Error:');
      console.error(JSON.stringify(responseData, null, 2));
      console.error(`\nHTTP Status: ${response.status}`);
      process.exit(1);
    }

    console.log('\n✅ Message sent via Whapi!');
    console.log(`  Message ID: ${responseData?.message?.id || responseData?.id || 'N/A'}`);

  } else {
    // ─── Meta: send as template ───────────────────────────────────

    const components: any[] = [];

    if (imageUrl) {
      components.push({
        type: 'header',
        parameters: [{ type: 'image', image: { link: imageUrl } }],
      });
    }

    const bodyParams: { type: string; text: string }[] = [];

    if (templateName === 'rsvp_request_v1' || templateName === 'rsvp_request') {
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: dateDisplay },
        { type: 'text', text: venue },
        { type: 'text', text: websiteUrl },
      );
    } else if (templateName === 'save_the_date_v1' || templateName === 'save_the_date') {
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: dateDisplay },
        { type: 'text', text: venue },
      );
    } else if (templateName === 'logistics_intro_v1' || templateName === 'logistics_intro') {
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: dateDisplay },
      );
    } else if (templateName === 'gentle_nudge_v1' || templateName === 'gentle_nudge') {
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
      );
    } else {
      console.warn(`⚠️  Unknown template "${templateName}" — passing generic params`);
      bodyParams.push(
        { type: 'text', text: partner1 },
        { type: 'text', text: partner2 },
        { type: 'text', text: dateDisplay },
        { type: 'text', text: venue },
        { type: 'text', text: websiteUrl },
      );
    }

    if (bodyParams.length > 0) {
      components.push({ type: 'body', parameters: bodyParams });
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'template',
      template: { name: templateName, language: { code: languageCode }, components },
    };

    console.log('\n📦 Payload:');
    console.log(JSON.stringify(payload, null, 2));

    if (dryRun) {
      console.log('\n🏁 Dry run — not sending. Remove --dry-run to send for real.');
      return;
    }

    console.log('\n🚀 Sending via Meta...');

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('\n❌ Meta API Error:');
      console.error(JSON.stringify(responseData, null, 2));

      const code = responseData?.error?.code;
      if (code === 100) console.error('\n💡 Template not found — check Meta Business Manager.');
      else if (code === 131030) console.error('\n💡 Recipient not on WhatsApp or bad number format.');
      else if (code === 131049) console.error('\n💡 Frequency cap — wait 24+ hours.');
      else if (code === 131050) console.error('\n💡 User opted out — do NOT retry.');
      else if (code === 132001) console.error('\n💡 Parameter count mismatch with template.');
      else if (code === 132015) console.error('\n💡 Template paused or disabled.');

      process.exit(1);
    }

    console.log('\n✅ Message sent via Meta!');
    console.log(`  Message ID: ${responseData.messages?.[0]?.id || 'N/A'}`);
    console.log(`  Contact:    ${responseData.contacts?.[0]?.wa_id || cleanPhone}`);
  }

  console.log(`  Status:     accepted (delivery tracked via webhooks)`);
  console.log('\n📋 Next steps:');
  console.log('  1. Check the recipient\'s WhatsApp for the message');
  console.log('  2. Have them reply — check Vercel logs for webhook processing');
  console.log(`  3. Webhook URL: ${provider === 'whapi' ? 'Configure in Whapi dashboard → /api/whatsapp/whapi-webhook' : 'https://phera.io/api/webhooks/whatsapp'}`);
  console.log('  4. Reply should route to AI concierge (check whatsapp_chat_history table)');
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
