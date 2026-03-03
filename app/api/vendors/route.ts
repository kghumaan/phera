import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null };
  return { supabase, user };
}

/**
 * GET /api/vendors?weddingId=xxx
 * List all vendors for a wedding
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weddingId = request.nextUrl.searchParams.get('weddingId');
    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    const { data: vendors, error } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_conversations (id, title, message_count, last_message_at, status),
        vendor_insights (id, insight_type, content, is_completed, priority, due_date)
      `)
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ vendors: vendors || [] });
  } catch (error: any) {
    console.error('Error listing vendors:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/vendors
 * Create a new vendor
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingId, name, category, phone, email, notes, status, whatsapp_group_id } = body;

    if (!weddingId || !name) {
      return NextResponse.json({ error: 'Missing weddingId or name' }, { status: 400 });
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        wedding_id: weddingId,
        name,
        category: category || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        status: status || 'active',
        whatsapp_group_id: whatsapp_group_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ vendor });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
