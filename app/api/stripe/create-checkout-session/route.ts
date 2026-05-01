import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2025-08-27.basil' as any,
});

type PricingTier = 'base' | 'premium' | 'planner_perwedding';
type AccountType = 'pro' | 'planner';

interface TierConfig {
  envVar: string;
  mode: 'payment' | 'subscription';
  accountType: AccountType;
  saveCardForFuture?: boolean;
}

const TIER_MAP: Record<PricingTier, TierConfig> = {
  base: {
    envVar: 'STRIPE_BASE_PRICE_ID',
    mode: 'payment',
    accountType: 'pro',
  },
  premium: {
    envVar: 'STRIPE_PREMIUM_PRICE_ID',
    mode: 'payment',
    accountType: 'pro',
  },
  planner_perwedding: {
    envVar: 'STRIPE_PLANNER_PERWEDDING_PRICE_ID',
    mode: 'payment',
    accountType: 'planner',
    saveCardForFuture: true,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { userId, email, weddingSlug, tier = 'base', returnPath, coupleName } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const config = TIER_MAP[tier as PricingTier];
    if (!config) {
      return NextResponse.json({ error: `Unknown tier: ${tier}` }, { status: 400 });
    }

    const priceId = process.env[config.envVar];
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${tier} tier (missing ${config.envVar})` },
        { status: 500 },
      );
    }

    let returnUrl: string;
    if (tier === 'planner_perwedding' && !weddingSlug) {
      // Planner first-time checkout: land back on /admin/new with the session id
      // so the page can finalize the wedding (create row + record payment).
      returnUrl = `${request.nextUrl.origin}/admin/new?session_id={CHECKOUT_SESSION_ID}`;
    } else if (weddingSlug) {
      returnUrl = `${request.nextUrl.origin}/admin/${weddingSlug}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`;
    } else if (returnPath) {
      returnUrl = `${request.nextUrl.origin}/upgrade-success?session_id={CHECKOUT_SESSION_ID}&return_path=${encodeURIComponent(returnPath)}`;
    } else {
      returnUrl = `${request.nextUrl.origin}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: 'embedded',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: config.mode,
      return_url: returnUrl,
      allow_promotion_codes: true,
      metadata: {
        userId,
        weddingSlug: weddingSlug || '',
        tier,
        accountType: config.accountType,
        ...(coupleName ? { coupleName: String(coupleName).slice(0, 200) } : {}),
      },
      customer_email: email || undefined,
    };

    if (config.mode === 'payment' && config.saveCardForFuture) {
      sessionParams.customer_creation = 'always';
      sessionParams.payment_intent_data = { setup_future_usage: 'off_session' };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
