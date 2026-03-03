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
  // Fallback: top-level body or caption (shouldn't happen per Whapi schema, but just in case)
  if (m.body) return m.body;
  if (m.caption) return m.caption;
  return '';
}

/**
 * GET /api/vendors/sync-groups
 * Discovers WhatsApp groups the Coordinator number is in.
 * Returns the list so the user can pick which to sync.
 */
export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.WHAPI_API_TOKEN) {
      return NextResponse.json({ error: 'Whapi not configured' }, { status: 500 });
    }

    const rawResponse = await whapiClient.getGroups();
    console.log('[sync-groups GET] Raw groups response keys:', Object.keys(rawResponse || {}));

    // Handle flexible response: { groups: [...] } or direct array or { data: [...] }
    let groups: any[] = [];
    if (rawResponse?.groups && Array.isArray(rawResponse.groups)) {
      groups = rawResponse.groups;
    } else if (Array.isArray(rawResponse)) {
      groups = rawResponse;
    } else if (rawResponse?.data && Array.isArray(rawResponse.data)) {
      groups = rawResponse.data;
    } else {
      // Check for error response
      if (rawResponse?.error) {
        console.error('[sync-groups GET] Whapi returned error:', rawResponse.error);
        return NextResponse.json(
          { error: `Whapi error: ${rawResponse.error.message || JSON.stringify(rawResponse.error)}` },
          { status: 502 }
        );
      }
      // Try to find any array in the response
      for (const key of Object.keys(rawResponse || {})) {
        if (Array.isArray(rawResponse[key]) && rawResponse[key].length > 0) {
          console.log(`[sync-groups GET] Found groups array at key "${key}" with ${rawResponse[key].length} items`);
          groups = rawResponse[key];
          break;
        }
      }
    }

    if (!groups || groups.length === 0) {
      return NextResponse.json({ groups: [], _debug: { responseKeys: Object.keys(rawResponse || {}) } });
    }

    // Log first group structure for debugging
    console.log('[sync-groups GET] First group sample:', JSON.stringify(groups[0]).slice(0, 500));

    const groupList = groups.map((g: any) => ({
      id: g.id,
      name: g.name || g.subject || 'Unknown Group',
      participantCount: g.participants?.length || g.size || 0,
    }));

    return NextResponse.json({ groups: groupList });
  } catch (error: any) {
    console.error('[sync-groups GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to discover groups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendors/sync-groups
 * Syncs selected WhatsApp groups — fetches historical messages and runs AI extraction.
 * Body: { weddingId, groupIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weddingId, groupIds } = body;

    if (!weddingId) {
      return NextResponse.json({ error: 'Missing weddingId' }, { status: 400 });
    }

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return NextResponse.json({ error: 'No groups selected' }, { status: 400 });
    }

    if (!process.env.WHAPI_API_TOKEN) {
      return NextResponse.json({ error: 'Whapi not configured' }, { status: 500 });
    }

    // Fetch full group list from Whapi to get names
    const rawGroupsResponse = await whapiClient.getGroups();
    let allGroups: any[] = [];
    if (rawGroupsResponse?.groups && Array.isArray(rawGroupsResponse.groups)) {
      allGroups = rawGroupsResponse.groups;
    } else if (Array.isArray(rawGroupsResponse)) {
      allGroups = rawGroupsResponse;
    } else if (rawGroupsResponse?.data && Array.isArray(rawGroupsResponse.data)) {
      allGroups = rawGroupsResponse.data;
    } else {
      for (const key of Object.keys(rawGroupsResponse || {})) {
        if (Array.isArray(rawGroupsResponse[key])) {
          allGroups = rawGroupsResponse[key];
          break;
        }
      }
    }
    const groupMap = new Map(allGroups.map((g: any) => [g.id, g]));

    const results: Array<{
      groupName: string;
      messagesImported: number;
      vendorName: string;
      isNew: boolean;
      _debug?: any;
    }> = [];
    const errors: Array<{ groupId: string; groupName: string; error: string }> = [];

    for (const groupId of groupIds) {
      const group = groupMap.get(groupId);
      const groupName = group?.name || group?.subject || 'Unknown Group';

      // Check if conversation already exists for this group
      const { data: existingConvo } = await supabase
        .from('vendor_conversations')
        .select('id, message_count')
        .eq('whatsapp_group_id', groupId)
        .eq('wedding_id', weddingId)
        .single();

      // Fetch messages from Whapi
      let messages: any[] = [];
      let debugInfo: any = {};
      try {
        const response = await whapiClient.getGroupMessages(groupId, 500);

        // Detect Whapi error responses (returned with HTTP 200)
        if (response?.error) {
          const errMsg = response.error.message || response.error.details || JSON.stringify(response.error);
          console.error(`[sync-groups] Whapi error for ${groupName}:`, errMsg);
          errors.push({ groupId, groupName, error: `Whapi API error: ${errMsg}` });
          continue;
        }

        const responseKeys = Object.keys(response || {});
        debugInfo.responseKeys = responseKeys;
        debugInfo.responseType = typeof response;
        debugInfo.isArray = Array.isArray(response);

        // Parse the response — try all known shapes
        if (Array.isArray(response)) {
          messages = response;
          debugInfo.source = 'direct_array';
        } else if (response?.messages && Array.isArray(response.messages)) {
          messages = response.messages;
          debugInfo.source = 'messages_key';
          debugInfo.count = response.count;
          debugInfo.total = response.total;
        } else if (response?.data && Array.isArray(response.data)) {
          messages = response.data;
          debugInfo.source = 'data_key';
        } else {
          // Fallback: find any array in the response
          for (const key of responseKeys) {
            if (Array.isArray(response[key]) && response[key].length > 0) {
              console.log(`[sync-groups] Found messages at key "${key}" with ${response[key].length} items`);
              messages = response[key];
              debugInfo.source = `fallback_key_${key}`;
              break;
            }
          }
          if (messages.length === 0) {
            debugInfo.source = 'no_array_found';
            debugInfo.responseSample = JSON.stringify(response).slice(0, 500);
          }
        }

        console.log(`[sync-groups] ${groupName}: parsed ${messages.length} messages (source: ${debugInfo.source})`);
      } catch (err: any) {
        console.error(`[sync-groups] Failed to fetch messages for ${groupName}:`, err);
        errors.push({ groupId, groupName, error: err?.message || 'Failed to fetch messages' });
        continue;
      }

      // Log first message for debugging
      if (messages.length > 0) {
        console.log(`[sync-groups] First message sample for ${groupName}:`, JSON.stringify(messages[0]).slice(0, 800));
      } else {
        console.log(`[sync-groups] ${groupName}: 0 messages returned from Whapi`);
        errors.push({ groupId, groupName, error: 'Whapi returned 0 messages for this group' });
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

        const { data: newConvo, error: convoError } = await supabase
          .from('vendor_conversations')
          .insert({
            wedding_id: weddingId,
            whatsapp_group_id: groupId,
            source: 'whapi_sync',
            title: groupName,
            status: 'processing',
            first_message_at: timestamps.length > 0
              ? new Date(Math.min(...timestamps.map((d: Date) => d.getTime()))).toISOString()
              : new Date().toISOString(),
            last_message_at: timestamps.length > 0
              ? new Date(Math.max(...timestamps.map((d: Date) => d.getTime()))).toISOString()
              : new Date().toISOString(),
          })
          .select()
          .single();

        if (convoError) {
          console.error(`[sync-groups] Failed to create conversation for ${groupName}:`, convoError);
          errors.push({ groupId, groupName, error: `DB error: ${convoError.message}` });
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

      console.log(`[sync-groups] ${groupName}: ${newMessages.length} new messages after dedup (${existingIds.size} existing)`);

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

        // Keep messages with content; count skipped for diagnostics
        const nonEmpty = batch.filter((m: any) => m.content);
        skippedEmpty += batch.length - nonEmpty.length;

        if (nonEmpty.length > 0) {
          const { error: insertError } = await supabase
            .from('vendor_messages')
            .insert(nonEmpty);

          if (insertError) {
            console.error(`[sync-groups] Insert error for ${groupName}:`, insertError);
          } else {
            importedCount += nonEmpty.length;
          }
        }
      }

      if (skippedEmpty > 0) {
        console.log(`[sync-groups] ${groupName}: skipped ${skippedEmpty} messages with no extractable content`);
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

      // Run AI extraction on a sample of messages
      let vendorName = groupName;
      if (importedCount > 0) {
        try {
          const { data: sampleMsgs } = await supabase
            .from('vendor_messages')
            .select('sender_name, content, message_timestamp')
            .eq('conversation_id', conversationId)
            .order('message_timestamp', { ascending: true })
            .limit(200);

          if (sampleMsgs && sampleMsgs.length > 0) {
            const extraction = await extractVendorInsights(sampleMsgs);
            vendorName = extraction.vendor_name || groupName;

            // Create or find vendor record
            let vendorId: string;
            const { data: existingVendor } = await supabase
              .from('vendors')
              .select('id')
              .eq('wedding_id', weddingId)
              .eq('whatsapp_group_id', groupId)
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
                  whatsapp_group_id: groupId,
                  status: 'active',
                })
                .select()
                .single();

              if (vendorError) {
                console.error(`[sync-groups] Failed to create vendor for ${groupName}:`, vendorError);
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
          console.error(`[sync-groups] AI extraction failed for ${groupName}:`, aiError);
        }
      }

      results.push({
        groupName,
        messagesImported: importedCount,
        vendorName,
        isNew,
        _debug: { ...debugInfo, totalFromWhapi: messages.length, newAfterDedup: newMessages.length, skippedEmpty },
      });
    }

    return NextResponse.json({
      synced: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: results.length > 0
        ? `Synced ${results.length} group(s) with ${results.reduce((s, r) => s + r.messagesImported, 0)} new messages`
        : errors.length > 0
          ? `Sync failed: ${errors.map(e => `${e.groupName}: ${e.error}`).join('; ')}`
          : 'No new messages to sync',
    });
  } catch (error: any) {
    console.error('[sync-groups POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync groups' },
      { status: 500 }
    );
  }
}
