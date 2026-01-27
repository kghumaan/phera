import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, email, role, plan } = await request.json();

    if (plan !== 'pro') {
      return NextResponse.json({ error: 'Only Pro plan requires a checkout session' }, { status: 400 });
    }

    // Create a checkout session
    // Using ui_mode: 'embedded' as requested for "remain on our site" experience
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Phera Pro Plan',
              description: 'Full coordination suite & AI agent for your wedding',
            },
            unit_amount: 19900, // $199.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: `${request.nextUrl.origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId,
        role,
      },
      customer_email: email,
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
