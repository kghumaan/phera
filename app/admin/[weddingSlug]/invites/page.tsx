'use client';

/**
 * Invites — couple-facing outreach hub. Pick a template, customize, choose
 * audience, generate per-guest WhatsApp deep links. No Meta API yet —
 * everything goes through the couple's personal WhatsApp via wa.me.
 *
 * Template rows expand inline (no modal takeover) so the admin pattern
 * matches the schedule page. Only one template is expanded at a time.
 */

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { History } from '@mui/icons-material';
import { PageHeading, SectionHeading } from '@/components/shared/PageHeading';
import { COLORS } from '@/lib/theme/tokens';
import { supabase } from '@/lib/supabase/client';
import { weddingService } from '@/lib/supabase/wedding-service';
import { outreachService } from '@/lib/supabase/outreach-service';
import { INVITE_TEMPLATES, type InviteTemplate } from '@/lib/invites/templates';
import {
  TemplateCard,
  type TemplateCardSubmit,
} from '@/components/admin/invites/TemplateCard';
import { SendLinksDialog } from '@/components/admin/invites/SendLinksDialog';
import {
  CampaignHistory,
  type CampaignHistoryRow,
} from '@/components/admin/invites/CampaignHistory';
import type { AudienceGuest } from '@/components/admin/invites/AudiencePicker';

interface GuestRow {
  id: string;
  name: string;
  phone: string | null;
  logistics_data: { tag?: string; tags?: string[] } | null;
  outreach_status: string | null;
}

interface OutreachEventRow {
  id: string;
  template_name: string | null;
  guest_id: string;
  created_at: string;
}

function tagsFor(g: GuestRow): string[] {
  const ld = g.logistics_data;
  if (!ld) return [];
  if (Array.isArray(ld.tags)) return ld.tags.filter((t): t is string => typeof t === 'string');
  if (typeof ld.tag === 'string' && ld.tag.trim()) return [ld.tag.trim()];
  return [];
}

function bucketEvents(events: OutreachEventRow[]): CampaignHistoryRow[] {
  // Group by template_id + creation date (yyyy-mm-dd).
  const buckets = new Map<string, { templateId: string; sentAt: string; ids: Set<string> }>();
  for (const e of events) {
    if (!e.template_name) continue;
    const day = (e.created_at || '').slice(0, 10);
    const key = `${e.template_name}__${day}`;
    if (!buckets.has(key)) {
      buckets.set(key, { templateId: e.template_name, sentAt: e.created_at, ids: new Set() });
    }
    buckets.get(key)!.ids.add(e.guest_id);
  }

  return Array.from(buckets.entries())
    .map(([key, b]) => {
      const tmpl = INVITE_TEMPLATES.find((t) => t.id === b.templateId);
      return {
        bucketKey: key,
        templateId: b.templateId,
        templateTitle: tmpl?.title || b.templateId,
        sentAt: b.sentAt,
        recipientCount: b.ids.size,
      };
    })
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

function defaultVarsFromWedding(w: {
  couple_name?: string | null;
  wedding_date_display?: string | null;
  wedding_date?: string | null;
  venue_location?: string | null;
}): Record<string, string> {
  const date = w.wedding_date_display || w.wedding_date || '';
  const city = (w.venue_location || '').split(',').slice(-2).join(',').trim();
  return {
    couple_names: w.couple_name || '',
    wedding_date: date,
    wedding_city: city,
  };
}

export default function InvitesPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  const [defaultVars, setDefaultVars] = useState<Record<string, string>>({});
  const [guests, setGuests] = useState<AudienceGuest[]>([]);
  const [history, setHistory] = useState<CampaignHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Only one template card may be expanded at a time. Matches the
  // schedule-page "edit inline" pattern — click to open, click again to close.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendDraft, setSendDraft] = useState<TemplateCardSubmit | null>(null);

  const loadGuests = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated supabase types omit outreach columns
    const { data, error } = await (supabase as any)
      .from('guests')
      .select('id, name, phone, logistics_data, outreach_status')
      .eq('wedding_id', weddingSlug);
    if (error) console.error('invites: guests load error:', error);
    const rows = (data || []) as GuestRow[];
    setGuests(
      rows.map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        tags: tagsFor(g),
        outreach_status: g.outreach_status,
      })),
    );
  }, [weddingSlug]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated supabase types may omit outreach_events
    const { data, error } = await (supabase as any)
      .from('outreach_events')
      .select('id, template_name, guest_id, created_at')
      .eq('wedding_id', weddingSlug)
      .eq('event_type', 'template_sent')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) console.error('invites: history load error:', error);
    setHistory(bucketEvents((data || []) as OutreachEventRow[]));
    setLoadingHistory(false);
  }, [weddingSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (cancelled) return;
      if (wedding) setDefaultVars(defaultVarsFromWedding(wedding));
    })();
    loadGuests();
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [weddingSlug, loadGuests, loadHistory]);

  const toggleExpanded = (id: string) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

  const handleCardSubmit = (draft: TemplateCardSubmit) => {
    setSendDraft(draft);
  };

  // Per-guest "Send" click → log event + bump status. We log first so the
  // history bucket reflects the action even if the status update fails.
  const handleMarkSent = useCallback(
    async (guestId: string) => {
      if (!sendDraft) return;
      const tmpl = sendDraft.template;
      try {
        await outreachService.logEvent({
          wedding_id: weddingSlug,
          guest_id: guestId,
          event_type: 'template_sent',
          template_name: tmpl.id,
          channel: 'whatsapp',
          details: { sent_via: 'wa_me_personal', template_title: tmpl.title },
        });
        if (tmpl.nextStatus) {
          await outreachService.updateGuestStatus(guestId, tmpl.nextStatus, {
            template_id: tmpl.id,
          });
        }
      } catch (e) {
        console.error('invites: mark sent failed:', e);
      }
    },
    [sendDraft, weddingSlug],
  );

  const closeSend = () => {
    setSendDraft(null);
    // Refresh history + guests so the dashboard reflects the just-sent batch.
    loadHistory();
    loadGuests();
  };

  const groupedTemplates = useMemo(() => {
    // Keep categories in the order they first appear in the list so rendering
    // is stable + matches how templates.ts is authored.
    const order: string[] = [];
    const byCat = new Map<string, InviteTemplate[]>();
    for (const t of INVITE_TEMPLATES) {
      if (!byCat.has(t.category)) {
        byCat.set(t.category, []);
        order.push(t.category);
      }
      byCat.get(t.category)!.push(t);
    }
    return order.map((c) => ({ category: c, items: byCat.get(c)! }));
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeading
        title="Invites"
        subtitle="Send Save-the-Dates, RSVP requests, and reminders to your guests on WhatsApp. Pick a template, write the message once, and we'll generate a personalized link for each guest."
      />

      <Box sx={{ mt: 3 }}>
        <SectionHeading title="Templates" />
        {/* Responsive grid. Each tile capped to a comfortable width so the
            preview + composer sit at a consistent size regardless of
            container width. */}
        <Box
          sx={{
            mt: 1.5,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 400px))',
              md: 'repeat(3, minmax(0, 400px))',
            },
            gap: 1.5,
            alignItems: 'stretch',
            justifyContent: 'start',
          }}
        >
          {groupedTemplates.flatMap((g) =>
            g.items.map((t) => {
              const isOpen = expandedId === t.id;
              // Expanded card spans the full row — preview + composer get
              // breathing room instead of getting squashed into a single
              // narrow column.
              return (
                <Box
                  key={t.id}
                  sx={{
                    gridColumn: isOpen ? '1 / -1' : 'auto',
                    display: 'flex',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <TemplateCard
                      template={t}
                      expanded={isOpen}
                      onToggle={() => toggleExpanded(t.id)}
                      guests={guests}
                      defaultVars={defaultVars}
                      onSubmit={handleCardSubmit}
                    />
                  </Box>
                </Box>
              );
            }),
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <SectionHeading
          title="Recent campaigns"
          actions={
            <Stack direction="row" alignItems="center" spacing={1}>
              <History sx={{ fontSize: 18, color: COLORS.text.faint }} />
              <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
                Last 500 sends
              </Typography>
            </Stack>
          }
        />
        <Box sx={{ mt: 1.5 }}>
          <CampaignHistory rows={history} loading={loadingHistory} />
        </Box>
      </Box>

      <SendLinksDialog
        open={!!sendDraft}
        onClose={closeSend}
        weddingSlug={weddingSlug}
        template={sendDraft?.template ?? null}
        sharedVars={sendDraft?.sharedVars ?? {}}
        recipients={sendDraft?.recipients ?? []}
        onMarkSent={handleMarkSent}
      />
    </Box>
  );
}
