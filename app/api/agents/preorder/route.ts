import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { email, agent_id, bundle_type, deposit_amount, stripe_payment_intent } = body;

    // Validate required fields
    if (!email || !agent_id) {
      return NextResponse.json(
        { error: 'Email and agent_id are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if pre-order already exists for this email and agent
    const { data: existing, error: checkError } = await supabase
      .from('agent_preorders')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('agent_id', agent_id)
      .single();

    if (existing) {
      // Already pre-ordered, return success anyway
      return NextResponse.json({
        success: true,
        message: 'You have already pre-ordered this agent',
        id: existing.id,
      });
    }

    // Insert pre-order
    const { data, error } = await supabase
      .from('agent_preorders')
      .insert({
        email: email.toLowerCase(),
        agent_id,
        bundle_type: bundle_type || null,
        deposit_amount: deposit_amount || 0,
        stripe_payment_intent: stripe_payment_intent || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting pre-order:', error);
      return NextResponse.json(
        { error: 'Failed to create pre-order' },
        { status: 500 }
      );
    }

    // TODO: Send confirmation email
    // await sendPreOrderConfirmationEmail(email, agent_id);

    return NextResponse.json({
      success: true,
      message: 'Pre-order created successfully',
      id: data.id,
    });
  } catch (error) {
    console.error('Error in preorder API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const agent_id = searchParams.get('agent_id');
    const bundle_type = searchParams.get('bundle_type');

    // Get pre-order count
    let query = supabase
      .from('agent_preorders')
      .select('id', { count: 'exact', head: true });

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (bundle_type) {
      query = query.eq('bundle_type', bundle_type);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching pre-order count:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pre-order count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: count || 0,
      agent_id: agent_id || 'all',
      bundle_type: bundle_type || null,
    });
  } catch (error) {
    console.error('Error in preorder GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

