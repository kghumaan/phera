import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { whapiClient } from '@/lib/vendors/whapi-client';
import { extractVendorInsights, saveInsights, predictMemberRoles } from '@/lib/vendors/ai-extractor';

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
 * Extract readable content from a Whapi message object.
 * Handles text, image captions, video captions, document captions, etc.
 */
function extractMessageContent(m: any): string {
  // Text messages
  if (m.text?.body) return m.text.body;
  // Image / video / gif / short / document captions
  if (m.image?.caption) return m.image.caption;
  if (m.video?.caption) return m.video.caption;
  if (m.gif?.caption) return m.gif.caption;
  if (m.short?.caption) return m.short.caption;
  if (m.document?.caption) return m.document.caption;
  // Link preview
  if (m.link_preview?.body) return m.link_preview.body;
  // Interactive messages
  if (m.interactive?.body?.text) return m.interactive.body.text;
  // System messages
  if (m.system?.body) return m.system.body;
  // List messages
  if (m.list?.body) return m.list.body;
  // Buttons messages
  if (m.buttons?.text) return m.buttons.text;
  // HSM (template) messages
  if (m.hsm?.body) return m.hsm.body;
  // Fallback: top-level body or caption
  if (m.body) return m.body;
  if (m.caption) return m.caption;
  return '';
}

/**
 * Parse raw Whapi chats response into an array
 */
function parseChatsResponse(rawResponse: any): any[] {
  if (rawResponse?.chats && Array.isArray(rawResponse.chats)) return rawResponse.chats;
  if (rawResponse?.groups && Array.isArray(rawResponse.groups)) return rawResponse.groups;
  if (Array.isArray(rawResponse)) return rawResponse;
  if (rawResponse?.data && Array.isArray(rawResponse.data)) return rawResponse.data;
  // Fallback: find any array in the response
  for (const key of Object.keys(rawResponse || {})) {
    if (Array.isArray(rawResponse[key]) && rawResponse[key].length > 0) {
      return rawResponse[key];
    }
  }
  return [];
}

/**
 * Parse raw Whapi messages response into an array
 */
function parseMessagesResponse(response: any): { messages: any[]; debugInfo: any } {
  const debugInfo: any = {};
  let messages: any[] = [];

  if (response?.error) {
    return { messages: [], debugInfo: { error: response.error } };
  }

  const responseKeys = Object.keys(response || {});
  debugInfo.responseKeys = responseKeys;

  if (Array.isArray(response)) {
    messages = response;
    debugInfo.source = 'direct_array';
  } else if (response?.messages && Array.isArray(response.messages)) {
    messages = response.messages;
    debugInfo.source = 'messages_key';
  } else if (response?.data && Array.isArray(response.data)) {
    messages = response.data;
    debugInfo.source = 'data_key';
  } else {
    for (const key of responseKeys) {
      if (Array.isArray(response[key]) && response[key].length > 0) {
        messages = response[key];
        debugInfo.source = `fallback_key_${key}`;
        break;
      }
    }
    if (messages.length === 0) {
      debugInfo.source = 'no_array_found';
    }
  }

  return { messages, debugInfo };
}

/**
 * GET /api/vendors/sync-groups
 * Discovers WhatsApp chats (groups + direct) the Coordinator number is in.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.WHAPI_API_TOKEN) {
      return NextResponse.json({ error: 'Whapi not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'groups' | 'direct' | null (both)

    const rawResponse = await whapiClient.getChats();
    const allChats = parseChatsResponse(rawResponse);

    if (!allChats || allChats.length === 0) {
      return NextResponse.json({ groups: [], directChats: [] });
    }

    // Split into groups and direct chats, deduplicate by id
    const seenIds = new Set<string>();
    const groups: any[] = [];
    const directChats: any[] = [];

    for (const chat of allChats) {
      if (!chat.id || seenIds.has(chat.id)) continue;
      seenIds.add(chat.id);

      const entry = {
        id: chat.id,
        name: chat.name || chat.subject || chat.chat_name || 'Unknown',
        participantCount: chat.participants?.length || chat.size || 0,
      };

      if (chat.id.endsWith('@g.us')) {
        groups.push(entry);
      } else if (chat.id.endsWith('@s.whatsapp.net')) {
        directChats.push(entry);
      }
    }

    if (type === 'groups') return NextResponse.json({ groups });
    if (type === 'direct') return NextResponse.json({ directChats });
    return NextResponse.json({ groups, directChats });
  } catch (error: any) {
    console.error('[sync-groups GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to discover chats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendors/sync-groups
 * Syncs selected WhatsApp chats — fetches historical messages and runs AI extraction.
 * Body: { weddingId, groupIds?: string[], chatIds?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingId, groupIds = [], chatIds = [] } = body;

    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    const allIds = [...groupIds, ...chatIds];
    if (allIds.length === 0) {
      return NextResponse.json({ error: 'No chats selected' }, { status: 400 });
    }

    if (!process.env.WHAPI_API_TOKEN) {
      return NextResponse.json({ error: 'Whapi not configured' }, { status: 500 });
    }

    // Fetch full chat list from Whapi to get names
    const rawChatsResponse = await whapiClient.getChats();
    const allChats = parseChatsResponse(rawChatsResponse);
    const chatMap = new Map(allChats.map((c: any) => [c.id, c]));

    const results: Array<{
      chatName: string;
      messagesImported: number;
      vendorName: string;
      isNew: boolean;
      chatType: string;
    }> = [];
    const errors: Array<{ chatId: string; chatName: string; error: string }> = [];

    for (const chatId of allIds) {
      const isDirectChat = chatId.endsWith('@s.whatsapp.net');
      const chatType = isDirectChat ? 'direct' : 'group';
      const chat = chatMap.get(chatId);
      const chatName = chat?.name || chat?.subject || chat?.chat_name || 'Unknown Chat';

      // Check if conversation already exists
      const lookupField = isDirectChat ? 'whatsapp_chat_id' : 'whatsapp_group_id';
      const { data: existingConvo } = await supabase
        .from('vendor_conversations')
        .select('id, message_count')
        .eq(lookupField, chatId)
        .eq('wedding_id', weddingId)
        .single();

      // Fetch messages from Whapi
      let messages: any[] = [];
      let debugInfo: any = {};
      try {
        const response = await whapiClient.getGroupMessages(chatId, 500);

        if (response?.error) {
          const errMsg = response.error.message || response.error.details || JSON.stringify(response.error);
          console.error(`[sync-groups] Whapi error for ${chatName}:`, errMsg);
          errors.push({ chatId, chatName, error: `Whapi API error: ${errMsg}` });
          continue;
        }

        const parsed = parseMessagesResponse(response);
        messages = parsed.messages;
        debugInfo = parsed.debugInfo;
      } catch (err: any) {
        console.error(`[sync-groups] Failed to fetch messages for ${chatName}:`, err);
        errors.push({ chatId, chatName, error: err?.message || 'Failed to fetch messages' });
        continue;
      }

      if (messages.length === 0) {
        errors.push({ chatId, chatName, error: 'No messages returned from Whapi' });
        continue;
      }

      // Create or get conversation
      let conversationId: string;
      let isNew = false;

      if (existingConvo) {
        conversationId = existingConvo.id;
      } else {
        isNew = true;
        const timestamps = messages
          .filter((m: any) => m.timestamp)
          .map((m: any) => new Date(m.timestamp * 1000));

        const insertData: any = {
          wedding_id: weddingId,
          source: isDirectChat ? 'whapi_direct' : 'whapi_webhook',
          chat_type: chatType,
          title: chatName,
          status: 'processing',
          first_message_at: timestamps.length > 0
            ? new Date(Math.min(...timestamps.map((d: Date) => d.getTime()))).toISOString()
            : new Date().toISOString(),
          last_message_at: timestamps.length > 0
            ? new Date(Math.max(...timestamps.map((d: Date) => d.getTime()))).toISOString()
            : new Date().toISOString(),
        };

        if (isDirectChat) {
          insertData.whatsapp_chat_id = chatId;
        } else {
          insertData.whatsapp_group_id = chatId;
        }

        const { data: newConvo, error: convoError } = await supabase
          .from('vendor_conversations')
          .insert(insertData)
          .select()
          .single();

        if (convoError) {
          console.error(`[sync-groups] Failed to create conversation for ${chatName}:`, convoError);
          errors.push({ chatId, chatName, error: `DB error: ${convoError.message}` });
          continue;
        }
        conversationId = newConvo.id;
      }

      // Store messages (deduplicate by whapi_message_id)
      let importedCount = 0;

      const { data: existingMsgs } = await supabase
        .from('vendor_messages')
        .select('whapi_message_id')
        .eq('conversation_id', conversationId)
        .not('whapi_message_id', 'is', null);

      const existingIds = new Set((existingMsgs || []).map((m: any) => m.whapi_message_id));

      const newMessages = messages.filter(
        (m: any) => m.id && !existingIds.has(m.id)
      );

      // Batch insert in chunks of 200
      let skippedEmpty = 0;
      for (let i = 0; i < newMessages.length; i += 200) {
        const batch = newMessages.slice(i, i + 200).map((m: any) => {
          const content = extractMessageContent(m);
          return {
            conversation_id: conversationId,
            wedding_id: weddingId,
            sender_name: m.from_name || m.from?.replace('@s.whatsapp.net', '') || 'Unknown',
            sender_phone: m.from?.replace('@s.whatsapp.net', '') || '',
            sender_type: m.from_me ? 'couple' : 'unknown',
            content,
            message_timestamp: m.timestamp
              ? new Date(m.timestamp * 1000).toISOString()
              : new Date().toISOString(),
            has_media: !!(m.image || m.video || m.gif || m.short || m.audio || m.voice || m.document || m.sticker),
            media_type: m.type || null,
            whapi_message_id: m.id,
          };
        });

        const nonEmpty = batch.filter((m: any) => m.content);
        skippedEmpty += batch.length - nonEmpty.length;

        if (nonEmpty.length > 0) {
          const { error: insertError } = await supabase
            .from('vendor_messages')
            .insert(nonEmpty);

          if (insertError) {
            console.error(`[sync-groups] Insert error for ${chatName}:`, insertError);
          } else {
            importedCount += nonEmpty.length;
          }
        }
      }

      // Populate conversation_members from message sender data
      try {
        const senderMap = new Map<string, string>();
        for (const m of messages) {
          const phone = m.from?.replace('@s.whatsapp.net', '') || '';
          const name = m.from_name || '';
          if (phone && !senderMap.has(phone)) {
            senderMap.set(phone, name);
          }
        }
        // Also add participants from group info if available
        if (chat?.participants) {
          for (const p of chat.participants) {
            const phone = p.id?.replace('@s.whatsapp.net', '') || '';
            if (phone && !senderMap.has(phone)) {
              senderMap.set(phone, '');
            }
          }
        }

        const memberRows = Array.from(senderMap.entries()).map(([phone, name]) => ({
          conversation_id: conversationId,
          wedding_id: weddingId,
          phone,
          name: name || null,
          role: 'member',
          is_whatsapp_admin: chat?.participants?.some((p: any) =>
            p.id?.replace('@s.whatsapp.net', '') === phone && p.admin
          ) || false,
        }));

        if (memberRows.length > 0) {
          await supabase
            .from('conversation_members')
            .upsert(memberRows, { onConflict: 'conversation_id,phone' });
        }
        // Run AI role prediction if all members have default roles
        try {
          const { data: currentMembers } = await supabase
            .from('conversation_members')
            .select('id, phone, name, role, role_source')
            .eq('conversation_id', conversationId);

          const allDefault = (currentMembers || []).every(
            (m: any) => !m.role_source || m.role_source === 'default'
          );

          if (allDefault && (currentMembers || []).length > 0) {
            // Get message samples for prediction
            const { data: msgSamples } = await supabase
              .from('vendor_messages')
              .select('sender_phone, sender_name, content')
              .eq('conversation_id', conversationId)
              .order('message_timestamp', { ascending: true })
              .limit(200);

            if (msgSamples && msgSamples.length > 0) {
              const predictions = await predictMemberRoles(
                (currentMembers || []).map((m: any) => ({ phone: m.phone, name: m.name })),
                msgSamples
              );

              for (const pred of predictions) {
                if (pred.confidence === 'low') continue;
                const member = (currentMembers || []).find((m: any) => m.phone === pred.phone);
                if (member) {
                  await supabase
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
          }
        } catch (predErr) {
          console.error(`[sync-groups] Role prediction failed for ${chatName}:`, predErr);
        }
      } catch (memberErr) {
        console.error(`[sync-groups] Failed to populate members for ${chatName}:`, memberErr);
      }

      // Update conversation counters
      const { count: totalCount } = await supabase
        .from('vendor_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      await supabase
        .from('vendor_conversations')
        .update({
          message_count: totalCount || importedCount,
          status: 'ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Run AI extraction
      let vendorName = chatName;
      if (importedCount > 0) {
        try {
          const { data: sampleMsgs } = await supabase
            .from('vendor_messages')
            .select('sender_name, content, message_timestamp')
            .eq('conversation_id', conversationId)
            .order('message_timestamp', { ascending: true })
            .limit(200);

          if (sampleMsgs && sampleMsgs.length > 0) {
            // Build vendor context from members
            const { data: members } = await supabase
              .from('conversation_members')
              .select('name, phone, role')
              .eq('conversation_id', conversationId);

            const vendorContext = members ? {
              vendorMembers: members.filter(m => m.role === 'vendor').map(m => m.name || m.phone),
              adminMembers: members.filter(m => m.role === 'admin').map(m => m.name || m.phone),
            } : undefined;

            const extraction = await extractVendorInsights(sampleMsgs, vendorContext);
            vendorName = extraction.vendor_name || chatName;

            // Create or find vendor record
            let vendorId: string;
            const vendorLookupField = isDirectChat ? 'whatsapp_group_id' : 'whatsapp_group_id';
            const { data: existingVendor } = await supabase
              .from('vendors')
              .select('id')
              .eq('wedding_id', weddingId)
              .eq('whatsapp_group_id', chatId)
              .single();

            if (existingVendor) {
              vendorId = existingVendor.id;
            } else {
              const { data: newVendor, error: vendorError } = await supabase
                .from('vendors')
                .insert({
                  wedding_id: weddingId,
                  name: vendorName,
                  category: extraction.vendor_category || 'Other',
                  whatsapp_group_id: chatId,
                  status: 'active',
                })
                .select()
                .single();

              if (vendorError) {
                console.error(`[sync-groups] Failed to create vendor for ${chatName}:`, vendorError);
                continue;
              }
              vendorId = newVendor.id;
            }

            // Link conversation to vendor
            await supabase
              .from('vendor_conversations')
              .update({ vendor_id: vendorId })
              .eq('id', conversationId);

            // Save insights
            await saveInsights({
              conversationId,
              weddingId,
              vendorId,
              insights: extraction.insights,
            });
          }
        } catch (aiError) {
          console.error(`[sync-groups] AI extraction failed for ${chatName}:`, aiError);
        }
      }

      results.push({
        chatName,
        messagesImported: importedCount,
        vendorName,
        isNew,
        chatType,
      });
    }

    return NextResponse.json({
      synced: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: results.length > 0
        ? `Synced ${results.length} chat(s) with ${results.reduce((s, r) => s + r.messagesImported, 0)} new messages`
        : errors.length > 0
          ? `Sync failed: ${errors.map(e => `${e.chatName}: ${e.error}`).join('; ')}`
          : 'No new messages to sync',
    });
  } catch (error: any) {
    console.error('[sync-groups POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync chats' },
      { status: 500 }
    );
  }
}
