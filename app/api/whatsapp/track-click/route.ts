import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { guest_id, source } = await request.json();

    if (!guest_id) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    // Insert click tracking record
    const { error } = await supabase
      .from('whatsapp_channel_clicks')
      .insert({
        guest_id,
        clicked_at: new Date().toISOString(),
        source: source || 'unknown',
      });

    if (error) {
      console.error('Error tracking WhatsApp click:', error);
      return NextResponse.json(
        { error: 'Failed to track click' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in WhatsApp track-click API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
