import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2025-08-27.basil' as any,
});

type PricingTier = 'base' | 'premium' | 'planner_perwedding' | 'planner_studio';
type AccountType = 'pro' | 'planner';

interface TierConfig {
  envVar: string;
  mode: 'payment' | 'subscription';
  accountType: AccountType;
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
  },
  planner_studio: {
    envVar: 'STRIPE_PLANNER_STUDIO_PRICE_ID',
    mode: 'subscription',
    accountType: 'planner',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { userId, email, weddingSlug, tier = 'base', returnPath } = await request.json();

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
    if (weddingSlug) {
      returnUrl = `${request.nextUrl.origin}/admin/${weddingSlug}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`;
    } else if (returnPath) {
      returnUrl = `${request.nextUrl.origin}/upgrade-success?session_id={CHECKOUT_SESSION_ID}&return_path=${encodeURIComponent(returnPath)}`;
    } else {
      returnUrl = `${request.nextUrl.origin}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`;
    }

    const session = await stripe.checkout.sessions.create({
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
      },
      customer_email: email || undefined,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
