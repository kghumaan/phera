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

    const { groups } = await whapiClient.getGroups();

    if (!groups || groups.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const groupList = groups.map((g: any) => ({
      id: g.id,
      name: g.name || 'Unknown Group',
      participantCount: g.participants?.length || 0,
    }));

    return NextResponse.json({ groups: groupList });
  } catch (error: any) {
    console.error('Discover groups error:', error);
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
    const { groups: allGroups } = await whapiClient.getGroups();
    const groupMap = new Map((allGroups || []).map((g: any) => [g.id, g]));

    const results: Array<{
      groupName: string;
      messagesImported: number;
      vendorName: string;
      isNew: boolean;
    }> = [];

    for (const groupId of groupIds) {
      const group = groupMap.get(groupId);
      const groupName = group?.name || 'Unknown Group';

      // Check if conversation already exists for this group
      const { data: existingConvo } = await supabase
        .from('vendor_conversations')
        .select('id, message_count')
        .eq('whatsapp_group_id', groupId)
        .eq('wedding_id', weddingId)
        .single();

      // Fetch messages from Whapi (up to 500)
      let messages: any[] = [];
      try {
        const response = await whapiClient.getGroupMessages(groupId, 500);
        console.log(`📨 Whapi messages response for ${groupName}:`, JSON.stringify(response).slice(0, 1000));

        // Handle both possible response shapes
        if (Array.isArray(response)) {
          messages = response;
        } else if (response?.messages && Array.isArray(response.messages)) {
          messages = response.messages;
        } else if (response?.data && Array.isArray(response.data)) {
          messages = response.data;
        } else {
          // Try to find any array in the response
          const keys = Object.keys(response || {});
          console.log(`📨 Whapi response keys for ${groupName}:`, keys);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              console.log(`📨 Found array at key "${key}" with ${response[key].length} items`);
              messages = response[key];
              break;
            }
          }
        }
      } catch (err) {
        console.error(`Failed to fetch messages for group ${groupName}:`, err);
        continue;
      }

      console.log(`📨 ${groupName}: ${messages.length} messages found`);
      if (messages.length === 0) continue;

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
          console.error(`Failed to create conversation for ${groupName}:`, convoError);
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

      // Log first message structure for debugging
      if (messages.length > 0) {
        console.log(`📨 First message sample for ${groupName}:`, JSON.stringify(messages[0]).slice(0, 500));
      }

      const newMessages = messages.filter(
        (m: any) => m.id && !existingIds.has(m.id)
      );

      console.log(`📨 ${groupName}: ${newMessages.length} new messages after dedup (${existingIds.size} existing)`);

      // Batch insert in chunks of 200
      for (let i = 0; i < newMessages.length; i += 200) {
        const batch = newMessages.slice(i, i + 200).map((m: any) => ({
          conversation_id: conversationId,
          wedding_id: weddingId,
          sender_name: m.from_name || m.from?.replace('@s.whatsapp.net', '') || 'Unknown',
          sender_phone: m.from?.replace('@s.whatsapp.net', '') || '',
          sender_type: m.from_me ? 'couple' : 'unknown',
          content: m.text?.body || m.body || m.caption || '',
          message_timestamp: m.timestamp
            ? new Date(m.timestamp * 1000).toISOString()
            : new Date().toISOString(),
          has_media: !!(m.media || m.image || m.video || m.document),
          media_type: m.media?.type || m.type || null,
          whapi_message_id: m.id,
        })).filter((m: any) => m.content);

        if (batch.length > 0) {
          const { error: insertError } = await supabase
            .from('vendor_messages')
            .insert(batch);

          if (insertError) {
            console.error(`Failed to insert batch for ${groupName}:`, insertError);
          } else {
            importedCount += batch.length;
          }
        }
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
                console.error(`Failed to create vendor for ${groupName}:`, vendorError);
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
          console.error(`AI extraction failed for ${groupName}:`, aiError);
        }
      }

      results.push({
        groupName,
        messagesImported: importedCount,
        vendorName,
        isNew,
      });
    }

    return NextResponse.json({
      synced: results.length,
      results,
      message: results.length > 0
        ? `Synced ${results.length} group(s) with ${results.reduce((s, r) => s + r.messagesImported, 0)} new messages`
        : 'No new messages to sync',
    });
  } catch (error: any) {
    console.error('Sync groups error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync groups' },
      { status: 500 }
    );
  }
}
