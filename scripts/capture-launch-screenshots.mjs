// Captures admin-portal screenshots for the launch video.
// Run: node scripts/capture-launch-screenshots.mjs
// Requires dev server on localhost:3000 and DEMO seed creds in .env.local.

import { chromium } from 'playwright';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'marketing/launch_v1_screenshots');
const BASE = 'http://localhost:3000';

const VIEWPORT = { width: 1920, height: 1080 };
const SCALE = 2;

async function settle(page, ms = 2000) {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function shot(page, file, opts = {}) {
  const out = path.join(OUT_DIR, file);
  await page.screenshot({ path: out, fullPage: false, ...opts });
  const stat = await fs.stat(out);
  console.log(`  → ${file} (${(stat.size / 1024).toFixed(0)} KB)`);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    colorScheme: 'light',
  });

  // Suppress the DemoTour overlay on every page load. The tour reads from URL
  // (?tour=true) and from sessionStorage('demo-tour-step'); we can't strip the
  // URL param easily, but stubbing the storage key prevents the tour from
  // persisting across navigations and from reappearing on subsequent pages.
  await context.addInitScript(() => {
    const realGet = Storage.prototype.getItem;
    const realSet = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'demo-tour-step') return null;
      // Pretend the schedule "Examples" panel was already dismissed.
      if (key === 'schedule-examples-dismissed' && this === localStorage) return 'true';
      return realGet.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'demo-tour-step') return;
      return realSet.call(this, key, value);
    };
  });

  const page = await context.newPage();
  page.on('pageerror', (e) => console.warn('  [pageerror]', e.message));

  // 1. Visit /demo — clones template, signs in, redirects to /admin/{slug}/details?tour=true
  console.log('1) Cloning demo wedding via /demo...');
  await page.goto(`${BASE}/demo`, { waitUntil: 'load' });
  await page.waitForURL(/\/admin\/[^/]+\/details/, { timeout: 90_000 });
  const slug = new URL(page.url()).pathname.split('/')[2];
  console.log(`   slug = ${slug}`);

  const ADMIN = `${BASE}/admin/${slug}`;

  // 2. Guest list
  console.log('2) Guest list...');
  await page.goto(`${ADMIN}/guest-list`);
  await settle(page, 2500);
  await shot(page, '01-guest-list.png');

  // 3. Guest detail drawer — click on Priya Sharma's row, then switch to RSVPs tab.
  // The list may be sorted/paginated; search for the name and click that row.
  console.log('3) Guest detail drawer (Priya Sharma → RSVPs tab)...');
  const priyaRow = page.locator('table tbody tr').filter({ hasText: 'Priya Sharma' }).first();
  await priyaRow.waitFor({ state: 'visible', timeout: 15_000 });
  await priyaRow.locator('td').nth(1).click();
  await settle(page, 1200);
  // Click the "RSVPs" tab inside the drawer.
  const rsvpsTab = page.getByRole('tab', { name: /^RSVPs$/i });
  await rsvpsTab.first().click();
  await settle(page, 1000);
  await shot(page, '02-guest-detail-drawer.png');

  // 3b. Guest Responses page — Priya's row expanded (richer detail: dietary,
  // food prefs, contact, side, responded date). The drawer's RSVPs tab is
  // intentionally thin (status + plus-one only) — this is where the launch-
  // video pitch info actually lives.
  console.log('3b) Guest Responses (Priya expanded)...');
  await page.goto(`${ADMIN}/guest-responses`);
  await settle(page, 2500);
  // Find Priya's row and click the expand chevron at the right end.
  const respRow = page.locator('table tbody tr').filter({ hasText: 'Priya Sharma' }).first();
  if (await respRow.count()) {
    // Expand button uses ExpandMore icon; click the row's last cell which holds it.
    const expandBtn = respRow.locator('button[aria-label], button:has(svg)').last();
    await expandBtn.click().catch(() => {});
    await settle(page, 1200);
    await shot(page, '02b-guest-responses-priya.png');
  } else {
    console.warn('   ⚠ Priya row not found on guest-responses page');
  }

  // 4. Travel (website-builder editor) — kept as candidate (a)
  console.log('4) Travel (website-builder)...');
  await page.goto(`${ADMIN}/travel`);
  await settle(page, 2500);
  await shot(page, '03-travel-website-builder.png');

  // 5. Transportation — walk through wizard to reach the populated dashboard.
  // Mode-select shown initially; click "Yes, I have vehicles booked" to advance
  // to setup-arrival. Template has 21 vehicles + 10 pickup_locations cloned in,
  // so the form should be pre-populated and Continue should be enabled.
  console.log('5) Transportation (wizard walkthrough)...');
  await page.goto(`${ADMIN}/transportation`);
  await settle(page, 2500);

  // Step 1: click "Yes, I have vehicles booked" card (mode-select)
  const yesCard = page.getByText('Yes, I have vehicles booked').first();
  if (await yesCard.count()) {
    await yesCard.click();
    await settle(page, 2500);
  } else {
    console.warn('   ⚠ "Yes, I have vehicles booked" not visible — skipping wizard steps');
  }

  // Step 2: setup-arrival → click "Continue to Departure"
  const arrivalBtn = page.getByRole('button', { name: /continue to departure/i }).first();
  if (await arrivalBtn.count() && await arrivalBtn.isEnabled()) {
    console.log('   arrival: clicking Continue to Departure');
    await arrivalBtn.click();
    // Wait specifically for the departure step's heading to confirm transition.
    await page.getByText(/Add your departure vehicles/i).waitFor({ timeout: 15_000 }).catch(() => {});
    await settle(page, 2500);
  } else {
    console.warn('   ⚠ arrival continue not ready');
  }

  // Step 3: setup-departure → click "Complete Setup"
  const departureBtn = page.getByRole('button', { name: /complete setup/i }).first();
  if (await departureBtn.count() && await departureBtn.isEnabled()) {
    console.log('   departure: clicking Complete Setup');
    await departureBtn.click();
    await settle(page, 3000);
  } else {
    console.warn('   ⚠ departure complete not ready');
  }

  // Step 4: "All set!" → click "View Reservations" / "View Dashboard" to reach
  // the populated TransportationDashboard.
  const dashBtn = page.getByRole('button', { name: /view (reservations|dashboard|responses)/i }).first();
  if (await dashBtn.count()) {
    console.log('   complete: clicking View Reservations');
    await dashBtn.click();
    await settle(page, 3000);
  } else {
    console.warn('   ⚠ no "View Reservations" button found on success screen');
  }

  await shot(page, '04-transportation-dashboard.png');

  // 6. Schedule (multi-day)
  console.log('6) Schedule...');
  await page.goto(`${ADMIN}/schedule`);
  await settle(page, 2500);
  await shot(page, '05-schedule.png');

  // 7. Concierge — find longest conversation thread
  console.log('7) Concierge conversations...');
  await page.goto(`${ADMIN}/concierge`);
  await settle(page, 3000);

  // Look for tab "Conversations" if not already active
  const convTab = page.getByRole('tab', { name: /conversations/i });
  if (await convTab.count()) {
    await convTab.first().click().catch(() => {});
    await settle(page, 1000);
  }

  // Each conversation list item is a div with a direct-child MuiAvatar AND a
  // direct-child MuiChip (the message-count chip). Cursor is set via MUI's sx
  // prop which compiles to a class — not el.style — so don't filter on inline
  // style. The structural test alone is unique on this page.
  await page.waitForSelector('.MuiAvatar-root', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const convs = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div')).filter((d) => {
      const av = d.querySelector(':scope > .MuiAvatar-root');
      const chip = d.querySelector(':scope > .MuiChip-root');
      return !!av && !!chip;
    });
    return items.map((el, i) => {
      const chip = el.querySelector('.MuiChip-root');
      const count = parseInt(chip?.textContent?.trim() || '0', 10) || 0;
      const name = el.querySelector('.MuiTypography-root')?.textContent?.trim() || '';
      return { index: i, count, name };
    });
  });
  console.log(`   found ${convs.length} conversations`);
  if (convs.length === 0) {
    console.warn('   ⚠ no conversations found — capturing list view as fallback');
    await shot(page, '06-concierge-list-EMPTY.png');
  } else {
    convs.sort((a, b) => b.count - a.count);
    const pick = convs[0];
    console.log(`   longest: "${pick.name}" with ${pick.count} messages (need ≥8)`);
    if (pick.count < 8) {
      console.warn(`   ⚠ longest thread has only ${pick.count} msgs — capturing anyway`);
    }
    // Click the Nth pointer-cursor div (re-query in DOM-order, since sort changed array)
    const nthIndex = pick.index;
    await page.evaluate((idx) => {
      const items = Array.from(document.querySelectorAll('div')).filter((d) => {
        const av = d.querySelector(':scope > .MuiAvatar-root');
        const chip = d.querySelector(':scope > .MuiChip-root');
        return !!av && !!chip;
      });
      items[idx]?.click();
    }, nthIndex);
    await settle(page, 2000);

    // Scroll the chat thread so the most recent messages (the seeded "see you
    // Saturday" exchange) are visible. The conversation detail pane is the
    // closest scrollable ancestor of the message bubbles. Scroll it to bottom.
    await page.evaluate(() => {
      // Find the deepest overflowing container that holds many message rows.
      const candidates = Array.from(document.querySelectorAll('div')).filter((el) => {
        const cs = getComputedStyle(el);
        const ov = cs.overflowY;
        return (ov === 'auto' || ov === 'scroll') && el.scrollHeight > el.clientHeight + 50;
      });
      // Pick the one with the most message-like children to avoid scrolling
      // the whole page or a sidebar list.
      const best = candidates
        .map((el) => ({ el, score: el.querySelectorAll('p, [class*="Typography"]').length }))
        .sort((a, b) => b.score - a.score)[0];
      if (best) best.el.scrollTo({ top: best.el.scrollHeight, behavior: 'instant' });
    });
    await page.waitForTimeout(500);
    await shot(page, '06-concierge-conversation.png');
  }

  await browser.close();
  console.log('\nDone. Outputs in:', OUT_DIR);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
