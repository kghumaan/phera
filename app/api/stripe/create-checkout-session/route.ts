import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any,
});

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
const PLANNER_PRICE_ID = process.env.STRIPE_PLANNER_PRICE_ID!;

export async function POST(request: NextRequest) {
  try {
    const { userId, email, weddingSlug, tier = 'pro', returnPath } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const isPlanner = tier === 'planner';
    const priceId = isPlanner ? PLANNER_PRICE_ID : PRO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json({ error: `Price ID not configured for ${tier} tier` }, { status: 500 });
    }

    // Build return URL
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
      mode: isPlanner ? 'subscription' : 'payment',
      return_url: returnUrl,
      metadata: {
        userId,
        weddingSlug: weddingSlug || '',
        tier,
      },
      customer_email: email || undefined,
    });

    return NextResponse.json({ clientSecret: session.client_secret });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
