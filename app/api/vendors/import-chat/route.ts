import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseWhatsAppExport } from '@/lib/vendors/chat-parser';
import { extractVendorInsights, saveInsights } from '@/lib/vendors/ai-extractor';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { verifyWeddingAccess } from '@/lib/utils/verify-wedding-access';

// Service role client for storage uploads (bypasses RLS)
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/vendors/import-chat
 * Import a WhatsApp .txt chat export
 * Accepts FormData with: file (.txt), weddingId, vendorId (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const weddingId = formData.get('weddingId') as string | null;
    const vendorId = formData.get('vendorId') as string | null;

    if (!file || !weddingId) {
      return NextResponse.json({ error: 'Missing file or weddingId' }, { status: 400 });
    }

    const hasAccess = await verifyWeddingAccess(supabase, user.id, weddingId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!file.name.endsWith('.txt')) {
      return NextResponse.json({ error: 'File must be a .txt WhatsApp export' }, { status: 400 });
    }

    // 1. Read and parse the file
    const text = await file.text();
    const parsed = await parseWhatsAppExport(text);

    if (parsed.length === 0) {
      return NextResponse.json({ error: 'No messages found in the file' }, { status: 422 });
    }

    // 2. Upload raw file to Supabase Storage
    const fileName = `${weddingId}/vendor-chats/${Date.now()}-${file.name}`;
    const { data: uploadData } = await serviceSupabase.storage
      .from('wedding-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    let rawFileUrl: string | null = null;
    if (uploadData) {
      const { data: { publicUrl } } = serviceSupabase.storage
        .from('wedding-images')
        .getPublicUrl(fileName);
      rawFileUrl = publicUrl;
    }

    // 3. Create conversation record
    const timestamps = parsed.map((m) => m.timestamp.toISOString());
    const { data: conversation, error: convoError } = await serviceSupabase
      .from('vendor_conversations')
      .insert({
        wedding_id: weddingId,
        vendor_id: vendorId || null,
        source: 'chat_export',
        title: file.name.replace('.txt', ''),
        raw_file_url: rawFileUrl,
        message_count: parsed.length,
        first_message_at: timestamps[0],
        last_message_at: timestamps[timestamps.length - 1],
        status: 'processing',
      })
      .select()
      .single();

    if (convoError) throw convoError;

    // 4. Bulk insert messages
    const messageRows = parsed.map((m) => ({
      conversation_id: conversation.id,
      wedding_id: weddingId,
      sender_name: m.sender,
      sender_type: 'unknown' as const,
      content: m.message,
      message_timestamp: m.timestamp.toISOString(),
    }));

    // Insert in batches of 500
    for (let i = 0; i < messageRows.length; i += 500) {
      const batch = messageRows.slice(i, i + 500);
      const { error: insertError } = await serviceSupabase
        .from('vendor_messages')
        .insert(batch);
      if (insertError) {
        console.error('Batch insert error:', insertError);
      }
    }

    // 5. Run AI extraction
    try {
      // Take a sample of messages for extraction (first 200 + last 100 for long chats)
      let sample = parsed;
      if (parsed.length > 300) {
        sample = [...parsed.slice(0, 200), ...parsed.slice(-100)];
      }

      const extractionInput = sample.map((m) => ({
        sender_name: m.sender,
        content: m.message,
        message_timestamp: m.timestamp.toISOString(),
      }));

      const result = await extractVendorInsights(extractionInput);

      // Update vendor info if we detected it and a vendor record exists
      let resolvedVendorId = vendorId;
      if (!resolvedVendorId && result.vendor_name !== 'Unknown Vendor') {
        // Create a vendor record from AI detection
        const { data: newVendor } = await serviceSupabase
          .from('vendors')
          .insert({
            wedding_id: weddingId,
            name: result.vendor_name,
            category: result.vendor_category,
          })
          .select('id')
          .single();
        resolvedVendorId = newVendor?.id || null;
      }

      if (resolvedVendorId) {
        // Link conversation to vendor
        await serviceSupabase
          .from('vendor_conversations')
          .update({ vendor_id: resolvedVendorId })
          .eq('id', conversation.id);
      }

      // Save insights
      await saveInsights({
        conversationId: conversation.id,
        weddingId,
        vendorId: resolvedVendorId || '',
        insights: result.insights,
      });

      // Mark conversation as ready
      await serviceSupabase
        .from('vendor_conversations')
        .update({ status: 'ready' })
        .eq('id', conversation.id);
    } catch (aiError) {
      console.error('AI extraction failed:', aiError);
      // Mark as error but don't fail the whole import
      await serviceSupabase
        .from('vendor_conversations')
        .update({ status: 'error' })
        .eq('id', conversation.id);
    }

    return NextResponse.json({
      conversation_id: conversation.id,
      message_count: parsed.length,
      status: 'processing',
    });
  } catch (error: any) {
    console.error('Chat import error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
