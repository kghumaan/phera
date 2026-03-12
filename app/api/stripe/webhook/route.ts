import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil' as any,
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === 'paid') {
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier || 'pro';

      if (userId) {
        const upsertData: Record<string, string> = {
          user_id: userId,
          subscription_tier: tier,
          updated_at: new Date().toISOString(),
        };
        if (tier === 'planner') {
          upsertData.account_type = 'planner';
        }

        const { error } = await supabase
          .from('user_settings')
          .upsert(upsertData, { onConflict: 'user_id' });

        if (error) {
          console.error(`Error upgrading user to ${tier}:`, error);
          return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
        }

        console.log(`User ${userId} upgraded to ${tier} via webhook`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
