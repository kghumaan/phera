import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  PLANNER_PER_WEDDING_AMOUNT_CENTS,
  PLANNER_PER_WEDDING_CURRENCY,
  buildPlannerDraftDefaults,
  buildPlannerWeddingDefaults,
  findUniqueSlug,
  generateWeddingSlug,
} from '@/lib/stripe/planner-wedding';
import { decodeClientReference } from '@/lib/stripe/payment-links';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: '2025-08-27.basil' as any,
  });

  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let sessionId: string;
  let coupleNameFromBody: string;
  try {
    const body = await request.json();
    sessionId = (body?.sessionId ?? '').toString();
    coupleNameFromBody = (body?.coupleName ?? '').toString().trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error('Stripe session retrieve failed:', err);
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }

  // Payment Link sessions identify the customer via client_reference_id;
  // legacy embedded-checkout sessions used metadata.userId. Accept both.
  const refUserId = decodeClientReference(session.client_reference_id ?? null).userId;
  const sessionUserId = session.metadata?.userId || refUserId;
  if (sessionUserId !== user.id) {
    return NextResponse.json({ error: 'Session does not belong to user' }, { status: 403 });
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
  }

  // Record what Stripe actually charged, not the expected constant — the
  // Payment Link's price lives in the Stripe Dashboard and can drift from
  // PLANNER_PER_WEDDING_AMOUNT_CENTS without a code change catching it.
  const chargedAmount = session.amount_total ?? PLANNER_PER_WEDDING_AMOUNT_CENTS;
  const chargedCurrency = (session.currency ?? PLANNER_PER_WEDDING_CURRENCY).toLowerCase();
  if (chargedAmount !== PLANNER_PER_WEDDING_AMOUNT_CENTS || chargedCurrency !== PLANNER_PER_WEDDING_CURRENCY) {
    console.error(
      `[finalize-planner-wedding] Stripe Payment Link charged ${chargedAmount} ${chargedCurrency}, expected ${PLANNER_PER_WEDDING_AMOUNT_CENTS} ${PLANNER_PER_WEDDING_CURRENCY} (sessionId=${sessionId}). Check the Payment Link price in the Stripe Dashboard.`,
    );
  }

  // coupleName is optional: when absent we create a nameless draft — the agent
  // asks for the couple's name as onboarding step 1 in the Planner chat.
  const coupleName = coupleNameFromBody || (session.metadata?.coupleName ?? '').trim();

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;
  if (!paymentIntentId) {
    return NextResponse.json({ error: 'No payment intent on session' }, { status: 400 });
  }

  // Idempotency: if we've already finalized this PI, return its existing wedding.
  const { data: existing } = await admin
    .from('wedding_payments')
    .select('wedding_slug')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (existing?.wedding_slug) {
    return NextResponse.json({ success: true, slug: existing.wedding_slug, idempotent: true });
  }

  let slug: string;
  let defaults: Record<string, unknown>;
  if (coupleName) {
    const baseSlug = generateWeddingSlug(coupleName);
    if (!baseSlug) {
      return NextResponse.json({ error: 'Invalid couple name' }, { status: 400 });
    }
    slug = await findUniqueSlug(baseSlug, async (candidate) => {
      const { data, error } = await admin
        .from('weddings')
        .select('slug')
        .eq('slug', candidate)
        .maybeSingle();
      if (error) throw error;
      return !data;
    });
    defaults = buildPlannerWeddingDefaults(slug, coupleName, user.id) as unknown as Record<string, unknown>;
  } else {
    slug = globalThis.crypto?.randomUUID?.() ?? `w-${Date.now()}`;
    defaults = buildPlannerDraftDefaults(slug, user.id) as unknown as Record<string, unknown>;
  }

  const { error: weddingError } = await admin
    .from('weddings')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(defaults as any);

  if (weddingError) {
    console.error('Failed to insert wedding after planner checkout:', weddingError);
    return NextResponse.json({ error: 'wedding_create_failed' }, { status: 500 });
  }

  const { error: paymentError } = await admin.from('wedding_payments').insert({
    user_id: user.id,
    wedding_slug: slug,
    stripe_payment_intent_id: paymentIntentId,
    stripe_checkout_session_id: sessionId,
    amount: chargedAmount,
    currency: chargedCurrency,
    status: 'succeeded',
    tier: 'planner_perwedding',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  if (paymentError) {
    console.error('Failed to insert wedding_payments (wedding still created):', paymentError);
  }

  return NextResponse.json({ success: true, slug });
}
