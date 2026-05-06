import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { autoGenerateForUser } from '@/lib/concierge/generate-knowledge';
import { decodeClientReference } from '@/lib/stripe/payment-links';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: '2025-08-27.basil' as any,
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Payment Link sessions carry the user id in `client_reference_id`
    // because link-level metadata is shared across all checkouts. Fall back
    // to the legacy `metadata.userId` for embedded-checkout sessions.
    const refUserId = decodeClientReference(session.client_reference_id ?? null).userId;
    const userId = session.metadata?.userId || refUserId;
    if (!userId) {
      return NextResponse.json({ error: 'No user ID in session metadata or client_reference_id' }, { status: 400 });
    }

    const tier = session.metadata?.tier || 'base';
    // Any paid non-planner tier grants Pro access; planner tiers grant Planner access.
    const accountType = session.metadata?.accountType || 'pro';

    const upsertData: Record<string, string> = {
      user_id: userId,
      subscription_tier: accountType,
      updated_at: new Date().toISOString(),
    };
    if (accountType === 'planner') {
      upsertData.account_type = 'planner';
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert(upsertData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error upgrading user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fire-and-forget: auto-generate KB if wedding has location data
    autoGenerateForUser(userId, supabase).catch(err =>
      console.error('Auto KB generation failed:', err)
    );

    // Look up onboarding state so the success page can route the user
    // either through onboarding (first wedding) or back to their dashboard.
    const { data: postUpsertSettings } = await supabase
      .from('user_settings')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .single();
    const onboardingCompleted = !!postUpsertSettings?.onboarding_completed;

    return NextResponse.json({ success: true, tier, accountType, onboardingCompleted });
  } catch (err) {
    console.error('Error in activate-pro:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
