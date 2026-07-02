import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  PLANNER_PER_WEDDING_AMOUNT_CENTS,
  PLANNER_PER_WEDDING_CURRENCY,
  buildPlannerWeddingDefaults,
  findUniqueSlug,
  generateWeddingSlug,
} from '@/lib/stripe/planner-wedding';

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

  let coupleName: string;
  let idempotencyKey: string | undefined;
  try {
    const body = await request.json();
    coupleName = (body?.coupleName ?? '').toString().trim();
    const rawKey = (body?.idempotencyKey ?? '').toString().trim();
    idempotencyKey = rawKey || undefined;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!coupleName) {
    return NextResponse.json({ error: 'Couple name is required' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: settings, error: settingsError } = await admin
    .from('user_settings')
    .select('account_type, stripe_customer_id, stripe_default_payment_method_id')
    .eq('user_id', user.id)
    .single();

  if (settingsError || !settings) {
    return NextResponse.json(
      { error: 'Planner profile not found. Complete your first wedding checkout.' },
      { status: 400 },
    );
  }

  if (settings.account_type !== 'planner') {
    return NextResponse.json({ error: 'Planner account required' }, { status: 403 });
  }

  // A planner's FIRST wedding is free — only charge from the 2nd onward. If they
  // have none yet, create it directly (no card required) and skip payment.
  const { count: existingWeddingCount } = await admin
    .from('weddings')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id);

  if ((existingWeddingCount ?? 0) === 0) {
    const baseSlugFree = generateWeddingSlug(coupleName);
    if (!baseSlugFree) {
      return NextResponse.json({ error: 'Invalid couple name' }, { status: 400 });
    }
    const freeSlug = await findUniqueSlug(baseSlugFree, async (candidate) => {
      const { data, error } = await admin.from('weddings').select('slug').eq('slug', candidate).maybeSingle();
      if (error) throw error;
      return !data;
    });
    const { error: freeWeddingError } = await admin
      .from('weddings')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(buildPlannerWeddingDefaults(freeSlug, coupleName, user.id) as any);
    if (freeWeddingError) {
      console.error('Failed to insert free first planner wedding:', freeWeddingError);
      return NextResponse.json({ error: 'wedding_create_failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true, slug: freeSlug, free: true });
  }

  if (!settings.stripe_customer_id || !settings.stripe_default_payment_method_id) {
    return NextResponse.json(
      { error: 'no_saved_card', message: 'No saved card on file' },
      { status: 400 },
    );
  }

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(
      {
        amount: PLANNER_PER_WEDDING_AMOUNT_CENTS,
        currency: PLANNER_PER_WEDDING_CURRENCY,
        customer: settings.stripe_customer_id,
        payment_method: settings.stripe_default_payment_method_id,
        off_session: true,
        confirm: true,
        metadata: {
          userId: user.id,
          tier: 'planner_perwedding',
          coupleName,
        },
      },
      // Idempotency key (sent from the client per charge attempt) ensures a
      // retried/double-submitted request reuses the same PaymentIntent instead
      // of charging the planner twice for one wedding.
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  } catch (err) {
    const stripeErr = err as Stripe.errors.StripeError;
    const code = stripeErr.code ?? 'charge_failed';
    if (code === 'authentication_required') {
      return NextResponse.json(
        { error: 'authentication_required', message: 'Card requires re-authentication. Please update your card.' },
        { status: 402 },
      );
    }
    return NextResponse.json(
      { error: code, message: stripeErr.message ?? 'Charge failed' },
      { status: 402 },
    );
  }

  if (paymentIntent.status !== 'succeeded') {
    return NextResponse.json(
      { error: paymentIntent.status, message: 'Payment did not complete' },
      { status: 402 },
    );
  }

  // Idempotency: if this PaymentIntent already produced a wedding (e.g. a
  // retried request after a lost response), return the existing wedding instead
  // of creating a duplicate.
  const { data: existingPayment } = await admin
    .from('wedding_payments')
    .select('wedding_slug')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (existingPayment?.wedding_slug) {
    return NextResponse.json({
      success: true,
      slug: existingPayment.wedding_slug,
      paymentIntentId: paymentIntent.id,
    });
  }

  const baseSlug = generateWeddingSlug(coupleName);
  if (!baseSlug) {
    return NextResponse.json({ error: 'Invalid couple name' }, { status: 400 });
  }

  const slug = await findUniqueSlug(baseSlug, async (candidate) => {
    const { data, error } = await admin
      .from('weddings')
      .select('slug')
      .eq('slug', candidate)
      .maybeSingle();
    if (error) throw error;
    return !data;
  });

  const defaults = buildPlannerWeddingDefaults(slug, coupleName, user.id);

  const { error: weddingError } = await admin
    .from('weddings')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(defaults as any);

  if (weddingError) {
    console.error('Failed to insert wedding after planner charge:', weddingError);
    return NextResponse.json(
      { error: 'wedding_create_failed', paymentIntentId: paymentIntent.id },
      { status: 500 },
    );
  }

  const { error: paymentError } = await admin.from('wedding_payments').insert({
    user_id: user.id,
    wedding_slug: slug,
    stripe_payment_intent_id: paymentIntent.id,
    amount: PLANNER_PER_WEDDING_AMOUNT_CENTS,
    currency: PLANNER_PER_WEDDING_CURRENCY,
    status: 'succeeded',
    tier: 'planner_perwedding',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  if (paymentError) {
    // A unique-constraint violation on stripe_payment_intent_id means another
    // (concurrent or replayed) request already recorded a payment for this
    // PaymentIntent and created its wedding. The one we just inserted is a
    // duplicate — remove it and return the original wedding so a single charge
    // maps to exactly one wedding.
    if ((paymentError as { code?: string }).code === '23505') {
      await admin.from('weddings').delete().eq('slug', slug);
      const { data: priorPayment } = await admin
        .from('wedding_payments')
        .select('wedding_slug')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .maybeSingle();
      if (priorPayment?.wedding_slug) {
        return NextResponse.json({
          success: true,
          slug: priorPayment.wedding_slug,
          paymentIntentId: paymentIntent.id,
        });
      }
    }
    console.error('Failed to insert wedding_payments row (wedding still created):', paymentError);
  }

  return NextResponse.json({ success: true, slug, paymentIntentId: paymentIntent.id });
}
