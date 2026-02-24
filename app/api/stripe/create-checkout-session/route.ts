import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any,
});

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;

export async function POST(request: NextRequest) {
  try {
    const { userId, email, weddingSlug } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [
        {
          price: PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: `${request.nextUrl.origin}/admin/${weddingSlug}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId,
        weddingSlug: weddingSlug || '',
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
