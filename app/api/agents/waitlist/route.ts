import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, agent_id, cta_type } = body;

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

    // Check if email already exists for this agent
    const { data: existing, error: checkError } = await supabase
      .from('agent_waitlist')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('agent_id', agent_id)
      .single();

    if (existing) {
      // Already on waitlist, return success anyway
      return NextResponse.json({
        success: true,
        message: 'You are already on the waitlist for this agent',
        id: existing.id,
      });
    }

    // Insert into waitlist
    const { data, error } = await supabase
      .from('agent_waitlist')
      .insert({
        email: email.toLowerCase(),
        agent_id,
        cta_type: cta_type || 'waitlist',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting into waitlist:', error);
      return NextResponse.json(
        { error: 'Failed to add to waitlist' },
        { status: 500 }
      );
    }

    // TODO: Send confirmation email (optional)
    // await sendWaitlistConfirmationEmail(email, agent_id);

    return NextResponse.json({
      success: true,
      message: 'Successfully added to waitlist',
      id: data.id,
    });
  } catch (error) {
    console.error('Error in waitlist API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agent_id = searchParams.get('agent_id');

    // Get waitlist count
    const query = supabase
      .from('agent_waitlist')
      .select('id', { count: 'exact', head: true });

    if (agent_id) {
      query.eq('agent_id', agent_id);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching waitlist count:', error);
      return NextResponse.json(
        { error: 'Failed to fetch waitlist count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: count || 0,
      agent_id: agent_id || 'all',
    });
  } catch (error) {
    console.error('Error in waitlist GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

