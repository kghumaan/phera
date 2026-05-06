import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

interface CreateLinkBody {
  weddingId: string;
  fundName: string;
  emoji?: string;
  mode: 'fixed' | 'flexible';
  amountCents?: number;
  suggestedAmountCents?: number;
  minimumAmountCents?: number;
  currency?: string;
}

const MIN_AMOUNT_CENTS = 100; // Stripe minimum charge
const MAX_AMOUNT_CENTS = 1_000_000_00; // sanity cap: $1M

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

  let body: CreateLinkBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const fundName = (body.fundName || '').trim();
  if (!fundName) {
    return NextResponse.json({ error: 'fundName is required' }, { status: 400 });
  }
  if (!body.weddingId) {
    return NextResponse.json({ error: 'weddingId is required' }, { status: 400 });
  }
  if (body.mode !== 'fixed' && body.mode !== 'flexible') {
    return NextResponse.json({ error: 'mode must be "fixed" or "flexible"' }, { status: 400 });
  }

  const currency = (body.currency || 'usd').toLowerCase();

  if (body.mode === 'fixed') {
    if (!body.amountCents || body.amountCents < MIN_AMOUNT_CENTS || body.amountCents > MAX_AMOUNT_CENTS) {
      return NextResponse.json({ error: `amountCents must be between ${MIN_AMOUNT_CENTS} and ${MAX_AMOUNT_CENTS}` }, { status: 400 });
    }
  }

  // Verify the user owns the wedding before creating Stripe resources on their behalf.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: wedding, error: weddingErr } = await admin
    .from('weddings')
    .select('id, slug, created_by, couple_name')
    .eq('id', body.weddingId)
    .maybeSingle();

  if (weddingErr || !wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }
  if (wedding.created_by !== user.id) {
    return NextResponse.json({ error: 'You do not own this wedding' }, { status: 403 });
  }

  // 1. Create Stripe product
  let product: Stripe.Product;
  try {
    product = await stripe.products.create({
      name: `${fundName} — ${wedding.couple_name || wedding.slug}`,
      metadata: {
        source: 'phera_registry',
        weddingId: wedding.id,
        weddingSlug: wedding.slug,
        userId: user.id,
      },
    });
  } catch (err) {
    console.error('[registry/create-link] product create failed:', err);
    return NextResponse.json({ error: 'Stripe product creation failed' }, { status: 502 });
  }

  // 2. Create Stripe price (fixed or pay-what-you-want)
  let price: Stripe.Price;
  try {
    if (body.mode === 'fixed') {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: body.amountCents!,
        currency,
      });
    } else {
      const customUnitAmount: Stripe.PriceCreateParams.CustomUnitAmount = {
        enabled: true,
      };
      if (body.suggestedAmountCents && body.suggestedAmountCents >= MIN_AMOUNT_CENTS) {
        customUnitAmount.preset = body.suggestedAmountCents;
      }
      if (body.minimumAmountCents && body.minimumAmountCents >= MIN_AMOUNT_CENTS) {
        customUnitAmount.minimum = body.minimumAmountCents;
      }
      price = await stripe.prices.create({
        product: product.id,
        currency,
        custom_unit_amount: customUnitAmount,
      });
    }
  } catch (err) {
    console.error('[registry/create-link] price create failed:', err);
    return NextResponse.json({ error: 'Stripe price creation failed' }, { status: 502 });
  }

  // 3. Create Stripe payment link.
  // Donor lands on a Stripe-hosted "thank you" page after paying — no need
  // for a custom return route. Couples can later add a custom redirect.
  let link: Stripe.PaymentLink;
  try {
    link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: `Thank you for contributing to ${fundName}! ${wedding.couple_name || ''} have been notified.`,
        },
      },
      allow_promotion_codes: false,
      metadata: {
        source: 'phera_registry',
        weddingId: wedding.id,
        weddingSlug: wedding.slug,
        fundName,
      },
    });
  } catch (err) {
    console.error('[registry/create-link] payment link create failed:', err);
    return NextResponse.json({ error: 'Stripe payment link creation failed' }, { status: 502 });
  }

  // 4. Insert into wedding_registry, persisting the Stripe product ID so a
  //    later delete can deactivate the link if we ever wire that up.
  const emoji = body.emoji || '🎁';
  const { data: orderRows } = await admin
    .from('wedding_registry')
    .select('order_index')
    .eq('wedding_id', wedding.id)
    .order('order_index', { ascending: false })
    .limit(1);
  const nextOrderIndex = (orderRows?.[0]?.order_index ?? -1) + 1;

  const { data: inserted, error: insertErr } = await admin
    .from('wedding_registry')
    .insert({
      wedding_id: wedding.id,
      fund_name: fundName,
      emoji,
      external_url: link.url,
      stripe_product_id: product.id,
      order_index: nextOrderIndex,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('[registry/create-link] DB insert failed:', insertErr);
    // Clean up the Stripe link to avoid an orphan
    try {
      await stripe.paymentLinks.update(link.id, { active: false });
    } catch (cleanupErr) {
      console.error('[registry/create-link] cleanup deactivate failed:', cleanupErr);
    }
    return NextResponse.json({ error: 'Failed to save registry item' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    item: inserted,
    paymentLinkUrl: link.url,
  });
}
