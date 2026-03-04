import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { whapiClient } from '@/lib/vendors/whapi-client';

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
 * GET /api/vendors/conversations/[conversationId]/members
 * Fetch members for a conversation. If empty and conversation has a WhatsApp ID,
 * populate from Whapi group info + message senders.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    // Try to fetch existing members
    let { data: members } = await supabase
      .from('conversation_members')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // If no members, try to populate from Whapi + messages
    if (!members || members.length === 0) {
      const { data: convo } = await supabase
        .from('vendor_conversations')
        .select('whatsapp_group_id, whatsapp_chat_id, wedding_id')
        .eq('id', conversationId)
        .single();

      if (convo) {
        const whatsappId = convo.whatsapp_group_id || convo.whatsapp_chat_id;
        const senderMap = new Map<string, string>();

        // Get unique senders from messages (works for all conversation types)
        const { data: msgs } = await supabase
          .from('vendor_messages')
          .select('sender_phone, sender_name')
          .eq('conversation_id', conversationId);

        for (const m of msgs || []) {
          const phone = m.sender_phone?.trim();
          if (phone && !senderMap.has(phone)) {
            senderMap.set(phone, m.sender_name || '');
          }
          // Also use sender_name as key if no phone (e.g. chat exports)
          if (!phone && m.sender_name) {
            const nameKey = `name:${m.sender_name}`;
            if (!senderMap.has(nameKey)) {
              senderMap.set(nameKey, m.sender_name);
            }
          }
        }

        // Try Whapi group info for additional participants
        let groupParticipants: any[] = [];
        if (whatsappId?.endsWith('@g.us') && process.env.WHAPI_API_TOKEN) {
          try {
            const groupInfo = await whapiClient.getGroupInfo(whatsappId);
            groupParticipants = groupInfo.participants || [];
            for (const p of groupParticipants) {
              const phone = p.id?.replace('@s.whatsapp.net', '') || '';
              if (phone && !senderMap.has(phone)) {
                senderMap.set(phone, '');
              }
            }
          } catch {
            // Group info fetch failed, use message senders only
          }
        }

        // Insert members
        const memberRows = Array.from(senderMap.entries()).map(([key, name]) => {
          const isNameOnly = key.startsWith('name:');
          const phone = isNameOnly ? '' : key;
          const displayName = isNameOnly ? key.slice(5) : name;
          return {
            conversation_id: conversationId,
            wedding_id: convo.wedding_id,
            phone: phone || displayName, // use name as phone fallback for uniqueness
            name: displayName || null,
            role: 'member',
            is_whatsapp_admin: groupParticipants.some(
              (p: any) => p.id?.replace('@s.whatsapp.net', '') === phone && p.admin
            ),
          };
        });

        if (memberRows.length > 0) {
          const { error: upsertErr } = await supabase
            .from('conversation_members')
            .upsert(memberRows, { onConflict: 'conversation_id,phone' });

          if (upsertErr) {
            console.error('[members GET] Upsert error:', upsertErr);
          }

          // Re-fetch
          const { data: newMembers } = await supabase
            .from('conversation_members')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          members = newMembers;
        }
      }
    }

    return NextResponse.json({ members: members || [] });
  } catch (error: any) {
    console.error('[members GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendors/conversations/[conversationId]/members
 * Update a member's role. Body: { memberId, role }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await params; // ensure params are resolved

    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json({ error: 'Missing memberId or role' }, { status: 400 });
    }

    if (!['vendor', 'admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { error } = await supabase
      .from('conversation_members')
      .update({ role, role_source: 'manual', updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[members PATCH] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update member' },
      { status: 500 }
    );
  }
}
