'use client';

/**
 * Scheduled tab — pre-configured + custom scheduled WhatsApp messages.
 *
 * Three sections:
 *   1. Upcoming strip — at-a-glance chips for everything queued.
 *   2. Suggested messages — presets (48h reminder, welcome, goodbye) the
 *      admin reviews and explicitly enables. Enabling records approval
 *      (who + when) in broadcast_audit_log via the schedule API.
 *   3. Schedule your own — free-form composer with the same
 *      composer-left / phone-preview-right layout as the Messaging tab.
 *
 * Sends happen via /api/cron/scheduled-messages; nothing here sends
 * directly. Times are wall-clock in a chosen timezone (defaulting to the
 * admin's local one) and stored as UTC.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Collapse,
  MenuItem,
} from '@mui/material';
import { Schedule, ExpandMore, ExpandLess } from '@mui/icons-material';
import { supabase } from '@/lib/supabase/client';
import { PheraCard } from '@/components/shared/Card';
import { PheraChip } from '@/components/shared/Chip';
import { PheraSwitch } from '@/components/shared/Switch';
import { PheraTextField } from '@/components/shared/TextField';
import { SectionHeading } from '@/components/shared/PageHeading';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorAlert, SuccessAlert, InfoAlert } from '@/components/shared/Alert';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { AudiencePicker, resolveAudience, type AudienceGuest, type AudienceSelection } from '@/components/admin/invites/AudiencePicker';
import { WhatsAppPreview } from '@/components/admin/invites/WhatsAppPreview';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { guestTags } from '@/lib/utils/guest-tags';
import {
  SCHEDULED_MESSAGE_PRESETS,
  presetDefaultDate,
  type ScheduledMessagePreset,
} from '@/lib/whatsapp/scheduled-message-presets';
import {
  wallTimeToUtcISO,
  utcToWallTime,
  formatInTimeZone,
  timeZoneAbbreviation,
  localTimeZone,
} from '@/lib/utils/wall-time';

interface ScheduledRow {
  id: string;
  message: string;
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled' | 'draft';
  enabled: boolean;
  scheduled_at: string | null;
  send_timezone: string | null;
  template_key: string | null;
  target_type: 'all' | 'tags' | 'specific';
  target_tags: string[] | null;
  target_guest_ids: string[] | null;
  sent_count: number;
  failed_count: number;
  approved_at: string | null;
}

interface WeddingInfo {
  id: string;
  couple_name: string;
  venue_name: string | null;
  venue_location: string | null;
  wedding_date: string | null;
}

const FALLBACK_TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];

function timezoneOptions(current: string): string[] {
  let zones: string[] = FALLBACK_TIMEZONES;
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.(
      'timeZone',
    );
    if (supported?.length) zones = supported;
  } catch {
    /* fall back to the short list */
  }
  return zones.includes(current) ? zones : [current, ...zones];
}

function statusChip(row: ScheduledRow) {
  if (row.status === 'scheduled' && !row.enabled) return <PheraChip size="small" tone="warning" label="Paused" />;
  if (row.status === 'scheduled') return <PheraChip size="small" tone="info" label="Scheduled" />;
  if (row.status === 'sending') return <PheraChip size="small" tone="brand" label="Sending" />;
  if (row.status === 'sent') return <PheraChip size="small" tone="success" label={`Sent · ${row.sent_count}`} />;
  if (row.status === 'failed') return <PheraChip size="small" tone="danger" label="Failed" />;
  return <PheraChip size="small" tone="neutral" label="Cancelled" />;
}

function audienceLabel(row: ScheduledRow): string {
  if (row.target_type === 'tags') return `Tags: ${(row.target_tags ?? []).join(', ')}`;
  if (row.target_type === 'specific') return `${(row.target_guest_ids ?? []).length} selected guests`;
  return 'All guests';
}

export default function ScheduledTab({ weddingSlug }: { weddingSlug: string }) {
  const [loading, setLoading] = useState(true);
  const [wedding, setWedding] = useState<WeddingInfo | null>(null);
  const [guests, setGuests] = useState<AudienceGuest[]>([]);
  const [rows, setRows] = useState<ScheduledRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const tz = useMemo(() => localTimeZone(), []);

  const load = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- weddings table not in generated types
    const sb = supabase as any;
    const [weddingRes, guestsRes, rowsRes] = await Promise.all([
      sb
        .from('weddings')
        .select('id, couple_name, venue_name, venue_location, wedding_date')
        .eq('slug', weddingSlug)
        .single(),
      sb.from('guests').select('id, name, phone, logistics_data').eq('wedding_id', weddingSlug),
      sb
        .from('concierge_broadcasts')
        .select(
          'id, message, status, enabled, scheduled_at, send_timezone, template_key, target_type, target_tags, target_guest_ids, sent_count, failed_count, approved_at',
        )
        .eq('wedding_id', weddingSlug)
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: true }),
    ]);

    if (weddingRes.data) setWedding(weddingRes.data);
    setGuests(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((guestsRes.data ?? []) as any[]).map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        tags: guestTags(g.logistics_data),
      })),
    );
    setRows((rowsRes.data ?? []) as ScheduledRow[]);
    setLoading(false);
  }, [weddingSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const callScheduleApi = useCallback(
    async (method: 'POST' | 'PATCH' | 'DELETE', body: Record<string, unknown>): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch('/api/concierge/broadcasts/schedule', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weddingId: wedding?.id, ...body }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || 'Something went wrong');
          return false;
        }
        await load();
        return true;
      } catch {
        setError('Network error, please try again');
        return false;
      }
    },
    [wedding?.id, load],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  const upcoming = rows.filter((r) => r.status === 'scheduled');

  return (
    <Stack spacing={4}>
      {error && <ErrorAlert onClose={() => setError(null)}>{error}</ErrorAlert>}
      {notice && <SuccessAlert onClose={() => setNotice(null)}>{notice}</SuccessAlert>}

      {/* 1. Upcoming at a glance */}
      {upcoming.length > 0 && (
        <PheraCard variant="muted" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
            <Schedule sx={{ fontSize: 18, color: COLORS.brand.primary }} />
            <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
              {upcoming.length} message{upcoming.length === 1 ? '' : 's'} in the schedule:
            </Typography>
            {upcoming.map((r) => (
              <PheraChip
                key={r.id}
                size="small"
                tone={r.enabled ? 'info' : 'warning'}
                label={`${presetTitle(r.template_key) ?? 'Custom'} · ${
                  r.scheduled_at ? formatInTimeZone(r.scheduled_at, r.send_timezone || tz) : ''
                }${r.enabled ? '' : ' (paused)'}`}
              />
            ))}
          </Stack>
        </PheraCard>
      )}

      {/* 2. Suggested messages */}
      <Box>
        <SectionHeading title="Suggested messages" />
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
          Ready-made messages timed around your wedding date. Review the text and time, then turn each
          one on — nothing sends without your explicit approval, and every approval is recorded.
        </Typography>
        <Stack spacing={2}>
          {SCHEDULED_MESSAGE_PRESETS.map((preset) => (
            <PresetCard
              key={preset.key}
              preset={preset}
              wedding={wedding}
              guests={guests}
              existing={rows.find((r) => r.template_key === preset.key && ['scheduled', 'sending'].includes(r.status)) ?? null}
              lastSent={rows.find((r) => r.template_key === preset.key && r.status === 'sent') ?? null}
              tz={tz}
              onSchedule={async (body) => {
                const ok = await callScheduleApi('POST', body);
                if (ok) setNotice('Message scheduled. You can pause or cancel it any time.');
                return ok;
              }}
              onToggle={async (broadcastId, enabled) => callScheduleApi('PATCH', { broadcastId, enabled })}
              onCancel={async (broadcastId) => callScheduleApi('DELETE', { broadcastId })}
            />
          ))}
        </Stack>
      </Box>

      {/* 3. Custom scheduled message */}
      <Box>
        <SectionHeading title="Schedule your own" />
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
          Write any message and pick exactly when it goes out.
        </Typography>
        <CustomScheduler
          guests={guests}
          tz={tz}
          onSchedule={async (body) => {
            const ok = await callScheduleApi('POST', body);
            if (ok) setNotice('Message scheduled.');
            return ok;
          }}
        />
      </Box>

      {/* 4. Full history */}
      <Box>
        <SectionHeading title="All scheduled messages" />
        {rows.length === 0 ? (
          <EmptyState
            icon={<Schedule />}
            title="Nothing scheduled yet"
            subtitle="Enable a suggested message above or schedule your own."
          />
        ) : (
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {rows.map((r) => (
              <PheraCard key={r.id} sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap sx={{ gap: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 220 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      {statusChip(r)}
                      <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                        {presetTitle(r.template_key) ?? 'Custom message'}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        color: COLORS.text.muted,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {r.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.text.faint, display: 'block', mt: 0.5 }}>
                      {r.scheduled_at
                        ? `${formatInTimeZone(r.scheduled_at, r.send_timezone || tz)} ${timeZoneAbbreviation(
                            r.scheduled_at,
                            r.send_timezone || tz,
                          )}`
                        : ''}
                      {' · '}
                      {audienceLabel(r)}
                      {r.approved_at ? ` · Approved ${formatInTimeZone(r.approved_at, tz)}` : ''}
                    </Typography>
                  </Box>
                  {r.status === 'scheduled' && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PheraSwitch
                        size="small"
                        checked={r.enabled}
                        onChange={(e) => callScheduleApi('PATCH', { broadcastId: r.id, enabled: e.target.checked })}
                      />
                      <SecondaryActionButton size="small" onClick={() => void callScheduleApi('DELETE', { broadcastId: r.id })}>
                        Cancel
                      </SecondaryActionButton>
                    </Stack>
                  )}
                </Stack>
              </PheraCard>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

function presetTitle(key: string | null): string | null {
  if (!key) return null;
  return SCHEDULED_MESSAGE_PRESETS.find((p) => p.key === key)?.title ?? key;
}

/* ─── Preset card ──────────────────────────────────────────────────────── */

interface PresetCardProps {
  preset: ScheduledMessagePreset;
  wedding: WeddingInfo | null;
  guests: AudienceGuest[];
  existing: ScheduledRow | null;
  lastSent: ScheduledRow | null;
  tz: string;
  onSchedule: (body: Record<string, unknown>) => Promise<boolean>;
  onToggle: (broadcastId: string, enabled: boolean) => Promise<boolean>;
  onCancel: (broadcastId: string) => Promise<boolean>;
}

function PresetCard({ preset, wedding, guests, existing, lastSent, tz, onSchedule, onToggle, onCancel }: PresetCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultDate = presetDefaultDate(preset, wedding?.wedding_date ?? null);
  const defaultBody = wedding
    ? preset.build({
        coupleName: wedding.couple_name,
        venueName: wedding.venue_name,
        venueLocation: wedding.venue_location,
      })
    : '';

  const [message, setMessage] = useState(defaultBody);
  const [date, setDate] = useState(defaultDate ?? '');
  const [time, setTime] = useState(preset.defaultTime);
  const [timezone, setTimezone] = useState(tz);

  // When already scheduled, show the stored values instead of the defaults.
  useEffect(() => {
    if (existing?.scheduled_at) {
      const wall = utcToWallTime(existing.scheduled_at, existing.send_timezone || tz);
      setMessage(existing.message);
      setDate(wall.date);
      setTime(wall.time);
      setTimezone(existing.send_timezone || tz);
    }
  }, [existing, tz]);

  const recipientCount = guests.filter((g) => g.phone).length;
  const dateMissing = !defaultDate && !existing;

  const handleEnable = async () => {
    setSaving(true);
    try {
      let scheduledAt: string;
      try {
        scheduledAt = wallTimeToUtcISO(date, time, timezone);
      } catch {
        return;
      }
      await onSchedule({
        message,
        targetType: 'all',
        scheduledAt,
        sendTimezone: timezone,
        templateKey: preset.key,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PheraCard sx={{ p: 0, overflow: 'hidden' }}>
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 2,
          cursor: 'pointer',
          '&:hover': { bgcolor: COLORS.bg.muted },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body1" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
              {preset.title}
            </Typography>
            {existing ? (
              statusChip(existing)
            ) : lastSent ? (
              <PheraChip size="small" tone="success" label={`Sent · ${lastSent.sent_count}`} />
            ) : (
              <PheraChip size="small" tone="neutral" label="Off" />
            )}
          </Stack>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            {preset.description}
            {existing?.scheduled_at
              ? ` · Goes out ${formatInTimeZone(existing.scheduled_at, existing.send_timezone || tz)} ${timeZoneAbbreviation(existing.scheduled_at, existing.send_timezone || tz)}`
              : ''}
          </Typography>
        </Box>
        {existing && (
          <Box onClick={(e) => e.stopPropagation()}>
            <PheraSwitch
              size="small"
              checked={existing.enabled}
              onChange={(e) => onToggle(existing.id, e.target.checked)}
            />
          </Box>
        )}
        {expanded ? (
          <ExpandLess sx={{ color: COLORS.text.subtle }} />
        ) : (
          <ExpandMore sx={{ color: COLORS.text.subtle }} />
        )}
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            px: 2.5,
            pb: 2.5,
            pt: 0.5,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 392px' },
            gap: 3,
          }}
        >
          <Stack spacing={2}>
            {dateMissing && (
              <InfoAlert>
                Set your wedding date first — the suggested send time is based on it. You can still pick a
                date manually below.
              </InfoAlert>
            )}
            <PheraTextField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              minRows={4}
              fullWidth
              disabled={!!existing}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <PheraTextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={!!existing}
                sx={{ minWidth: 160 }}
              />
              <PheraTextField
                label="Time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={!!existing}
                sx={{ minWidth: 130 }}
              />
              <PheraTextField
                label="Timezone"
                select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={!!existing}
                sx={{ minWidth: 220, flex: 1 }}
              >
                {timezoneOptions(timezone).map((z) => (
                  <MenuItem key={z} value={z}>
                    {z.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </PheraTextField>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                Goes to all {recipientCount} guest{recipientCount === 1 ? '' : 's'} with a phone number
              </Typography>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                {existing ? (
                  <SecondaryActionButton size="small" onClick={() => void onCancel(existing.id)}>
                    Cancel this message
                  </SecondaryActionButton>
                ) : (
                  <PrimaryActionButton
                    size="small"
                    onClick={() => void handleEnable()}
                    disabled={saving || !message.trim() || !date || !time || recipientCount === 0}
                  >
                    {saving ? 'Scheduling…' : 'Approve & schedule'}
                  </PrimaryActionButton>
                )}
              </Box>
            </Stack>
            {existing?.approved_at && (
              <Typography variant="caption" sx={{ color: COLORS.text.faint }}>
                Approved {formatInTimeZone(existing.approved_at, tz)} · recorded in the audit log
              </Typography>
            )}
          </Stack>

          <Box sx={{ bgcolor: COLORS.bg.muted, borderRadius: RADII.lg, p: 2, justifySelf: { md: 'end' } }}>
            <WhatsAppPreview message={message} dense />
          </Box>
        </Box>
      </Collapse>
    </PheraCard>
  );
}

/* ─── Custom scheduler ─────────────────────────────────────────────────── */

interface CustomSchedulerProps {
  guests: AudienceGuest[];
  tz: string;
  onSchedule: (body: Record<string, unknown>) => Promise<boolean>;
}

function CustomScheduler({ guests, tz, onSchedule }: CustomSchedulerProps) {
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<AudienceSelection>({ mode: 'all', tags: [], guestIds: [] });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('17:00');
  const [timezone, setTimezone] = useState(tz);
  const [saving, setSaving] = useState(false);

  const recipients = resolveAudience(guests, audience);

  const handleSchedule = async () => {
    setSaving(true);
    try {
      let scheduledAt: string;
      try {
        scheduledAt = wallTimeToUtcISO(date, time, timezone);
      } catch {
        return;
      }
      const ok = await onSchedule({
        message,
        targetType: audience.mode,
        targetTags: audience.tags,
        targetGuestIds: audience.guestIds,
        scheduledAt,
        sendTimezone: timezone,
      });
      if (ok) {
        setMessage('');
        setDate('');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PheraCard
      sx={{
        p: 2.5,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 392px' },
        gap: 3,
      }}
    >
      <Stack spacing={2}>
        <PheraTextField
          label="Message"
          placeholder="e.g. The baraat leaves at 10 AM sharp tomorrow, don't be late!"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          minRows={4}
          fullWidth
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <PheraTextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <PheraTextField
            label="Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 130 }}
          />
          <PheraTextField
            label="Timezone"
            select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            sx={{ minWidth: 220, flex: 1 }}
          >
            {timezoneOptions(timezone).map((z) => (
              <MenuItem key={z} value={z}>
                {z.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </PheraTextField>
        </Stack>
        <Box>
          <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600, mb: 1 }}>
            Who gets it
          </Typography>
          <AudiencePicker
            guests={guests}
            value={audience}
            onChange={setAudience}
            actions={
              <PrimaryActionButton
                size="small"
                onClick={() => void handleSchedule()}
                disabled={saving || !message.trim() || !date || !time || recipients.length === 0}
              >
                {saving ? 'Scheduling…' : 'Approve & schedule'}
              </PrimaryActionButton>
            }
          />
        </Box>
      </Stack>

      <Box sx={{ bgcolor: COLORS.bg.muted, borderRadius: RADII.lg, p: 2, justifySelf: { md: 'end' }, alignSelf: 'start' }}>
        <WhatsAppPreview message={message} dense />
      </Box>
    </PheraCard>
  );
}
