import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { extractVendorInsights, saveInsights, predictMemberRoles } from '@/lib/vendors/ai-extractor';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
 * POST /api/vendors/conversations/[conversationId]/reanalyze
 * Re-run AI extraction on a conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    // Get conversation
    const { data: conversation, error: convoError } = await serviceSupabase
      .from('vendor_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convoError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Load messages
    const { data: messages } = await serviceSupabase
      .from('vendor_messages')
      .select('sender_name, content, message_timestamp')
      .eq('conversation_id', conversationId)
      .order('message_timestamp', { ascending: true })
      .limit(300);

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages to analyze' }, { status: 422 });
    }

    // Re-predict member roles before extraction
    const { data: members } = await serviceSupabase
      .from('conversation_members')
      .select('id, phone, name, role, role_source')
      .eq('conversation_id', conversationId);

    // Re-predict roles for non-manual members
    const hasNonManual = (members || []).some(
      (m: any) => !m.role_source || m.role_source !== 'manual'
    );
    if (hasNonManual && (members || []).length > 0) {
      try {
        const { data: msgSamples } = await serviceSupabase
          .from('vendor_messages')
          .select('sender_phone, sender_name, content')
          .eq('conversation_id', conversationId)
          .order('message_timestamp', { ascending: true })
          .limit(200);

        if (msgSamples && msgSamples.length > 0) {
          const nonManualMembers = (members || []).filter(
            (m: any) => !m.role_source || m.role_source !== 'manual'
          );
          const predictions = await predictMemberRoles(
            nonManualMembers.map((m: any) => ({ phone: m.phone, name: m.name })),
            msgSamples
          );

          for (const pred of predictions) {
            if (pred.confidence === 'low') continue;
            const member = nonManualMembers.find((m: any) => m.phone === pred.phone);
            if (member) {
              await serviceSupabase
                .from('conversation_members')
                .update({
                  role: pred.predicted_role,
                  role_source: 'ai_predicted',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', member.id);
            }
          }
        }
      } catch (predErr) {
        console.error('Role prediction failed during reanalyze:', predErr);
      }
    }

    // Re-fetch members after prediction for vendor context
    const { data: updatedMembers } = await serviceSupabase
      .from('conversation_members')
      .select('name, phone, role')
      .eq('conversation_id', conversationId);

    const vendorContext = updatedMembers ? {
      vendorMembers: updatedMembers.filter((m: any) => m.role === 'vendor').map((m: any) => m.name || m.phone),
      adminMembers: updatedMembers.filter((m: any) => m.role === 'admin').map((m: any) => m.name || m.phone),
    } : undefined;

    // Run extraction
    const result = await extractVendorInsights(messages, vendorContext);

    // Save insights (replaces old ones)
    await saveInsights({
      conversationId,
      weddingId: conversation.wedding_id,
      vendorId: conversation.vendor_id || '',
      insights: result.insights,
    });

    // Update conversation status
    await serviceSupabase
      .from('vendor_conversations')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Update vendor name/category if detected
    if (conversation.vendor_id && result.vendor_name !== 'Unknown Vendor') {
      await serviceSupabase
        .from('vendors')
        .update({
          name: result.vendor_name,
          category: result.vendor_category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.vendor_id);
    }

    return NextResponse.json({
      insights: result.insights,
      vendor_name: result.vendor_name,
      vendor_category: result.vendor_category,
    });
  } catch (error: any) {
    console.error('Reanalyze error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
