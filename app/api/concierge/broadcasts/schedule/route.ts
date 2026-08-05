import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { BroadcastDataField, BroadcastTargetType } from '@/lib/supabase/broadcasts-service';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';
import { resolveWeddingAccess } from '@/lib/utils/verify-wedding-access';

/**
 * Scheduled broadcasts: create, update (enable/disable/edit), cancel.
 *
 * Nothing here sends a message. Rows are created with status='scheduled'
 * and picked up by /api/cron/scheduled-messages when due. Every mutation
 * is stamped with the acting admin (approved_by/approved_at) and recorded
 * in broadcast_audit_log — that is the approval trail.
 */

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function audit(
  admin: NonNullable<ReturnType<typeof serviceClient>>,
  row: {
    wedding_id: string;
    broadcast_id: string | null;
    actor_user_id: string | null;
    actor: 'admin' | 'system';
    action: 'scheduled' | 'enabled' | 'disabled' | 'updated' | 'cancelled' | 'sent' | 'send_failed';
    details?: Record<string, unknown>;
  },
) {
  const { error } = await admin.from('broadcast_audit_log').insert({ details: {}, ...row });
  if (error) console.error('broadcast audit insert failed:', error);
}

interface AuthedContext {
  admin: NonNullable<ReturnType<typeof serviceClient>>;
  userId: string;
  weddingSlug: string;
}

async function authorize(weddingId: string | undefined): Promise<AuthedContext | NextResponse> {
  const { supabase: userClient, user } = await getAuthenticatedClient();
  if (!userClient || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!weddingId) {
    return NextResponse.json({ error: 'weddingId required' }, { status: 400 });
  }
  const wedding = await resolveWeddingAccess(userClient, user.id, weddingId);
  if (!wedding) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase service credentials not configured' }, { status: 500 });
  }
  return { admin, userId: user.id, weddingSlug: wedding.slug };
}

/** POST — schedule a new message. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    weddingId,
    message,
    targetType,
    targetTags = [],
    targetGuestIds = [],
    scheduledAt,
    sendTimezone,
    templateKey = null,
    collectsData = false,
    dataSchema = [],
  }: {
    weddingId: string;
    message: string;
    targetType: BroadcastTargetType;
    targetTags?: string[];
    targetGuestIds?: string[];
    scheduledAt: string;
    sendTimezone: string;
    templateKey?: string | null;
    collectsData?: boolean;
    dataSchema?: BroadcastDataField[];
  } = body;

  const ctx = await authorize(weddingId);
  if (ctx instanceof NextResponse) return ctx;

  if (!message?.trim() || !targetType || !scheduledAt || !sendTimezone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const sendAt = new Date(scheduledAt);
  if (Number.isNaN(sendAt.getTime())) {
    return NextResponse.json({ error: 'Invalid scheduledAt' }, { status: 400 });
  }
  if (sendAt.getTime() < Date.now() + 60_000) {
    return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
  }
  if (targetType === 'tags' && !targetTags.length) {
    return NextResponse.json({ error: 'No tags selected' }, { status: 400 });
  }
  if (targetType === 'specific' && !targetGuestIds.length) {
    return NextResponse.json({ error: 'No guests selected' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: broadcast, error } = await ctx.admin
    .from('concierge_broadcasts')
    .insert({
      wedding_id: ctx.weddingSlug,
      message: message.trim(),
      target_type: targetType,
      target_tags: targetTags,
      target_guest_ids: targetGuestIds,
      collects_data: collectsData,
      data_schema: dataSchema,
      status: 'scheduled',
      enabled: true,
      scheduled_at: sendAt.toISOString(),
      send_timezone: sendTimezone,
      template_key: templateKey,
      created_by: ctx.userId,
      approved_by: ctx.userId,
      approved_at: now,
    })
    .select()
    .single();

  if (error || !broadcast) {
    // 23505 = the partial unique index: this preset is already scheduled.
    if ((error as { code?: string } | null)?.code === '23505') {
      return NextResponse.json({ error: 'This message is already scheduled' }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message || 'Failed to schedule' }, { status: 500 });
  }

  await audit(ctx.admin, {
    wedding_id: ctx.weddingSlug,
    broadcast_id: broadcast.id,
    actor_user_id: ctx.userId,
    actor: 'admin',
    action: 'scheduled',
    details: {
      scheduled_at: broadcast.scheduled_at,
      send_timezone: sendTimezone,
      template_key: templateKey,
      target_type: targetType,
      target_tags: targetTags,
      target_guest_count: targetGuestIds.length,
    },
  });

  return NextResponse.json({ broadcast });
}

/** PATCH — enable/disable or edit a scheduled message before it sends. */
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const {
    weddingId,
    broadcastId,
    enabled,
    message,
    scheduledAt,
    sendTimezone,
    targetType,
    targetTags,
    targetGuestIds,
  }: {
    weddingId: string;
    broadcastId: string;
    enabled?: boolean;
    message?: string;
    scheduledAt?: string;
    sendTimezone?: string;
    targetType?: BroadcastTargetType;
    targetTags?: string[];
    targetGuestIds?: string[];
  } = body;

  const ctx = await authorize(weddingId);
  if (ctx instanceof NextResponse) return ctx;
  if (!broadcastId) return NextResponse.json({ error: 'broadcastId required' }, { status: 400 });

  const { data: existing } = await ctx.admin
    .from('concierge_broadcasts')
    .select('id, status, wedding_id')
    .eq('id', broadcastId)
    .eq('wedding_id', ctx.weddingSlug)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'scheduled') {
    return NextResponse.json({ error: `Cannot edit a ${existing.status} message` }, { status: 409 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof enabled === 'boolean') updates.enabled = enabled;
  if (typeof message === 'string' && message.trim()) updates.message = message.trim();
  if (scheduledAt) {
    const sendAt = new Date(scheduledAt);
    if (Number.isNaN(sendAt.getTime()) || sendAt.getTime() < Date.now() + 60_000) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
    }
    updates.scheduled_at = sendAt.toISOString();
  }
  if (sendTimezone) updates.send_timezone = sendTimezone;
  if (targetType) {
    updates.target_type = targetType;
    updates.target_tags = targetTags ?? [];
    updates.target_guest_ids = targetGuestIds ?? [];
  }
  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  // Every change re-stamps the approval: the admin is signing off on the
  // message as it now stands.
  updates.approved_by = ctx.userId;
  updates.approved_at = new Date().toISOString();

  const { data: updated, error } = await ctx.admin
    .from('concierge_broadcasts')
    .update(updates)
    .eq('id', broadcastId)
    .eq('status', 'scheduled')
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
  }

  const action = typeof enabled === 'boolean' ? (enabled ? 'enabled' : 'disabled') : 'updated';
  await audit(ctx.admin, {
    wedding_id: ctx.weddingSlug,
    broadcast_id: broadcastId,
    actor_user_id: ctx.userId,
    actor: 'admin',
    action,
    details: { changed: Object.keys(updates).filter((k) => !k.startsWith('approved')) },
  });

  return NextResponse.json({ broadcast: updated });
}

/** DELETE — cancel a scheduled message (kept as a cancelled row for the record). */
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { weddingId, broadcastId }: { weddingId: string; broadcastId: string } = body;

  const ctx = await authorize(weddingId);
  if (ctx instanceof NextResponse) return ctx;
  if (!broadcastId) return NextResponse.json({ error: 'broadcastId required' }, { status: 400 });

  const { data: cancelled, error } = await ctx.admin
    .from('concierge_broadcasts')
    .update({ status: 'cancelled', enabled: false })
    .eq('id', broadcastId)
    .eq('wedding_id', ctx.weddingSlug)
    .eq('status', 'scheduled')
    .select()
    .single();

  if (error || !cancelled) {
    return NextResponse.json({ error: 'Not found or already sent' }, { status: 404 });
  }

  await audit(ctx.admin, {
    wedding_id: ctx.weddingSlug,
    broadcast_id: broadcastId,
    actor_user_id: ctx.userId,
    actor: 'admin',
    action: 'cancelled',
  });

  return NextResponse.json({ broadcast: cancelled });
}
