import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { whapiClient } from '@/lib/vendors/whapi-client';
import { extractVendorInsights, saveInsights } from '@/lib/vendors/ai-extractor';

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

function extractMessageContent(m: any): string {
  if (m.text?.body) return m.text.body;
  if (m.image?.caption) return m.image.caption;
  if (m.video?.caption) return m.video.caption;
  if (m.gif?.caption) return m.gif.caption;
  if (m.short?.caption) return m.short.caption;
  if (m.document?.caption) return m.document.caption;
  if (m.link_preview?.body) return m.link_preview.body;
  if (m.interactive?.body?.text) return m.interactive.body.text;
  if (m.system?.body) return m.system.body;
  if (m.list?.body) return m.list.body;
  if (m.buttons?.text) return m.buttons.text;
  if (m.hsm?.body) return m.hsm.body;
  if (m.body) return m.body;
  if (m.caption) return m.caption;
  return '';
}

function parseMessagesResponse(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (response?.messages && Array.isArray(response.messages)) return response.messages;
  if (response?.data && Array.isArray(response.data)) return response.data;
  for (const key of Object.keys(response || {})) {
    if (Array.isArray(response[key]) && response[key].length > 0) return response[key];
  }
  return [];
}

/**
 * POST /api/vendors/sync-all
 * Re-fetches latest messages for all tracked vendor_conversations with a WhatsApp ID.
 * Re-runs AI extraction on conversations with new messages.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingId } = body;

    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    if (!process.env.WHAPI_API_TOKEN) {
      return NextResponse.json({ error: 'Whapi not configured' }, { status: 500 });
    }

    // Get all conversations with a WhatsApp ID
    const { data: conversations } = await supabase
      .from('vendor_conversations')
      .select('id, whatsapp_group_id, whatsapp_chat_id, vendor_id, title, chat_type')
      .eq('wedding_id', weddingId)
      .or('whatsapp_group_id.not.is.null,whatsapp_chat_id.not.is.null');

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ message: 'No tracked conversations to sync', synced: 0 });
    }

    let totalNewMessages = 0;
    let conversationsSynced = 0;
    const errors: string[] = [];

    for (const convo of conversations) {
      const whatsappId = convo.whatsapp_group_id || convo.whatsapp_chat_id;
      if (!whatsappId) continue;

      try {
        const response = await whapiClient.getGroupMessages(whatsappId, 500);
        if (response?.error) {
          errors.push(`${convo.title}: Whapi error`);
          continue;
        }

        const messages = parseMessagesResponse(response);
        if (messages.length === 0) continue;

        // Deduplicate by whapi_message_id
        const { data: existingMsgs } = await supabase
          .from('vendor_messages')
          .select('whapi_message_id')
          .eq('conversation_id', convo.id)
          .not('whapi_message_id', 'is', null);

        const existingIds = new Set((existingMsgs || []).map((m: any) => m.whapi_message_id));
        const newMessages = messages.filter((m: any) => m.id && !existingIds.has(m.id));

        if (newMessages.length === 0) continue;

        // Insert new messages
        let importedCount = 0;
        for (let i = 0; i < newMessages.length; i += 200) {
          const batch = newMessages.slice(i, i + 200)
            .map((m: any) => ({
              conversation_id: convo.id,
              wedding_id: weddingId,
              sender_name: m.from_name || m.from?.replace('@s.whatsapp.net', '') || 'Unknown',
              sender_phone: m.from?.replace('@s.whatsapp.net', '') || '',
              sender_type: m.from_me ? 'couple' : 'unknown',
              content: extractMessageContent(m),
              message_timestamp: m.timestamp
                ? new Date(m.timestamp * 1000).toISOString()
                : new Date().toISOString(),
              has_media: !!(m.image || m.video || m.gif || m.short || m.audio || m.voice || m.document || m.sticker),
              media_type: m.type || null,
              whapi_message_id: m.id,
            }))
            .filter((m: any) => m.content);

          if (batch.length > 0) {
            const { error: insertError } = await supabase.from('vendor_messages').insert(batch);
            if (!insertError) importedCount += batch.length;
          }
        }

        if (importedCount > 0) {
          totalNewMessages += importedCount;
          conversationsSynced++;

          // Update conversation counters
          const { count: totalCount } = await supabase
            .from('vendor_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id);

          await supabase
            .from('vendor_conversations')
            .update({
              message_count: totalCount || 0,
              last_message_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', convo.id);

          // Re-run AI extraction
          if (convo.vendor_id) {
            try {
              const { data: sampleMsgs } = await supabase
                .from('vendor_messages')
                .select('sender_name, content, message_timestamp')
                .eq('conversation_id', convo.id)
                .order('message_timestamp', { ascending: true })
                .limit(200);

              if (sampleMsgs && sampleMsgs.length > 0) {
                const { data: members } = await supabase
                  .from('conversation_members')
                  .select('name, phone, role')
                  .eq('conversation_id', convo.id);

                const vendorContext = members ? {
                  vendorMembers: members.filter(m => m.role === 'vendor').map(m => m.name || m.phone),
                  adminMembers: members.filter(m => m.role === 'admin').map(m => m.name || m.phone),
                } : undefined;

                const extraction = await extractVendorInsights(sampleMsgs, vendorContext);
                await saveInsights({
                  conversationId: convo.id,
                  weddingId,
                  vendorId: convo.vendor_id,
                  insights: extraction.insights,
                });
              }
            } catch (aiErr) {
              console.error(`[sync-all] AI extraction failed for ${convo.title}:`, aiErr);
            }
          }
        }
      } catch (err: any) {
        errors.push(`${convo.title}: ${err?.message || 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      synced: conversationsSynced,
      totalNewMessages,
      totalConversations: conversations.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Synced ${conversationsSynced} conversation(s) with ${totalNewMessages} new messages`,
    });
  } catch (error: any) {
    console.error('[sync-all POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync all' },
      { status: 500 }
    );
  }
}
