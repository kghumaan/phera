import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  guestId: string;
  guestName: string;
  guestPhone: string | null;
  messages: ConversationMessage[];
  lastMessageAt: string;
  lastMessagePreview: string;
  messageCount: number;
}

/** Tail-of-phone label used when a chat references a guest_id that no longer
 *  exists in the guests table (e.g. the guest was removed after texting). */
function fallbackLabel(phone: string | null, idStub: string): string {
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 4) return `Unrecognized · …${digits.slice(-4)}`;
  }
  return `Unrecognized · ${idStub}`;
}

/**
 * GET /api/concierge/conversations?weddingId=xxx
 *
 * Returns conversations grouped by guest. Once the caller is verified as
 * an owner/admin of the wedding via `verifyWeddingAccess`, the actual
 * data fetch uses a service-role client so neither the chat read nor
 * the guest-name join can be silently truncated by RLS edge cases.
 *
 * Display rules:
 *   - When a chat row's guest_id resolves to a `guests` row with a name,
 *     use that name + phone.
 *   - When the guest was deleted after chatting (stale guest_id), fall
 *     back to "Unrecognized · …1234" using the last-4 of any phone we
 *     can recover, or the guest_id stub if we cannot.
 *   - Never emit "Unknown Guest" — that string was load-bearing in the
 *     earlier UI and obscured the fact that a real WhatsApp number had
 *     interacted with the bot.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase: userSupabase, user } = await getAuthenticatedClient();
    if (!userSupabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weddingId = request.nextUrl.searchParams.get('weddingId');
    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(userSupabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Service-role client — caller is already verified, and using the
    // service role keeps the guest-id join from getting clipped by RLS.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- chat history table not in generated types
    const { data: messages, error } = await (supabase as any)
      .from('whatsapp_chat_history')
      .select('id, guest_id, role, content, created_at')
      .eq('wedding_id', weddingId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    interface ChatRow {
      id: string;
      guest_id: string | null;
      role: string;
      content: string | null;
      created_at: string;
    }
    const chatRows = (messages || []) as ChatRow[];

    // Drop rows with a null guest_id — they can't be grouped meaningfully.
    const validRows = chatRows.filter((m) => !!m.guest_id);
    const guestIds = Array.from(new Set(validRows.map((m) => m.guest_id as string)));

    interface GuestRow {
      id: string;
      name: string | null;
      phone: string | null;
    }
    const guestMap = new Map<string, GuestRow>();
    if (guestIds.length > 0) {
      const { data: guests } = await supabase
        .from('guests')
        .select('id, name, phone')
        .in('id', guestIds);
      for (const g of (guests || []) as GuestRow[]) {
        guestMap.set(g.id, g);
      }
    }

    // Group messages by guest, attaching a real name when we have one and
    // a phone-derived stub when we don't.
    const conversationMap = new Map<string, Conversation>();
    for (const msg of validRows) {
      const gid = msg.guest_id as string;
      let conv = conversationMap.get(gid);
      if (!conv) {
        const guest = guestMap.get(gid);
        const guestName = guest?.name?.trim()
          ? guest.name
          : fallbackLabel(guest?.phone ?? null, gid.slice(0, 8));
        conv = {
          guestId: gid,
          guestName,
          guestPhone: guest?.phone ?? null,
          messages: [],
          lastMessageAt: msg.created_at,
          lastMessagePreview: '',
          messageCount: 0,
        };
        conversationMap.set(gid, conv);
      }
      conv.messages.push({
        id: msg.id,
        role: msg.role,
        content: msg.content || '',
        created_at: msg.created_at,
      });
      conv.lastMessageAt = msg.created_at;
      conv.lastMessagePreview = (msg.content || '').slice(0, 80);
      conv.messageCount++;
    }

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );

    return NextResponse.json({ conversations });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error fetching concierge conversations:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
