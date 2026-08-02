import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
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

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: settings } = await admin
    .from('user_settings')
    .select('account_type, stripe_customer_id, stripe_default_payment_method_id')
    .eq('user_id', user.id)
    .single();

  if (!settings) {
    return NextResponse.json({
      isPlanner: false,
      hasCard: false,
    });
  }

  const isPlanner = settings.account_type === 'planner';

  if (!settings.stripe_customer_id || !settings.stripe_default_payment_method_id) {
    return NextResponse.json({ isPlanner, hasCard: false });
  }

  try {
    const pm = await stripe.paymentMethods.retrieve(settings.stripe_default_payment_method_id);
    return NextResponse.json({
      isPlanner,
      hasCard: true,
      brand: pm.card?.brand ?? null,
      last4: pm.card?.last4 ?? null,
    });
  } catch (err) {
    console.error('Failed to retrieve saved payment method:', err);
    return NextResponse.json({ isPlanner, hasCard: false });
  }
}
