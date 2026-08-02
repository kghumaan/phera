'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Typography, Grid, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SendIcon from '@mui/icons-material/Send';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import OutreachFunnelChart from '@/components/admin/control-tower/OutreachFunnelChart';
import RsvpDonutChart from '@/components/admin/control-tower/RsvpDonutChart';
import EscalationQueue from '@/components/admin/control-tower/EscalationQueue';
import NeedsAttentionPanel from '@/components/admin/control-tower/NeedsAttentionPanel';
import ConciergeInsightsPanel from '@/components/admin/control-tower/ConciergeInsightsPanel';
import ComposePanel from '@/components/admin/control-tower/ComposePanel';
import UnifiedTimeline from '@/components/admin/control-tower/UnifiedTimeline';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraCard } from '@/components/shared/Card';
import { ErrorAlert } from '@/components/shared/Alert';
import { EmptyState } from '@/components/shared/EmptyState';

// ─── Types ──────────────────────────────────────────────────────────

interface DashboardData {
  summary: {
    total_guests: number;
    not_contacted: number;
    save_the_date_sent: number;
    rsvp_requested: number;
    rsvp_confirmed: number;
    travel_collected: number;
    logistics_complete: number;
    unresponsive: number;
    escalations_open: number;
    messages_sent_this_week: number;
    rsvp_breakdown: { yes: number; no: number; maybe: number; pending: number };
  };
  provider: 'whapi' | 'meta';
  weddingDate: string | null;
  partner1Name: string;
  partner2Name: string;
  venue: string;
  escalations: any[];
  needsAttention: any[];
  guestList: { id: string; name: string; phone: string | null }[];
  concierge: {
    guestsReached: number;
    messagesHandled: number;
    avgResponseTimeSec: number;
    topicBreakdown: Record<string, number>;
  };
}

// ─── Stat Card ──────────────────────────────────────────────────────

function StatCard({ icon, label, value, subtitle, color }: {
  icon: React.ReactNode; label: string; value: string | number; subtitle?: string; color: string;
}) {
  return (
    <PheraCard variant="default" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: RADII.sm, bgcolor: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: COLORS.text.strong, lineHeight: 1.1 }}>{value}</Typography>
        <Typography sx={{ fontSize: 14, color: COLORS.text.subtle, fontWeight: 500 }}>{label}</Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: COLORS.text.faint }}>{subtitle}</Typography>
        )}
      </Box>
    </PheraCard>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function daysUntilWedding(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function rsvpPercentage(breakdown: { yes: number; no: number; maybe: number; pending: number }, total: number): string {
  if (total === 0) return '0%';
  const responded = breakdown.yes + breakdown.no + breakdown.maybe;
  return `${Math.round((responded / total) * 100)}%`;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ControlTowerPage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activityEvents, setActivityEvents] = useState<any[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchDashboard = async () => {
    setFetchError(null);
    try {
      const res = await fetch(`/api/control-tower/dashboard?weddingId=${weddingSlug}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body?.error || `Request failed (${res.status})`;
        console.error('[control-tower] dashboard fetch failed:', msg, body);
        setFetchError(msg);
      } else {
        setData(body);
      }
    } catch (err: any) {
      console.error('[control-tower] dashboard fetch threw:', err);
      setFetchError(err?.message || 'Network error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (weddingSlug) fetchDashboard();
  }, [weddingSlug]);

  // Lazy-load activity log on accordion expand
  const loadActivityEvents = async () => {
    if (activityEvents !== null) return;
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/outreach/events?weddingId=${weddingSlug}`);
      if (res.ok) {
        const d = await res.json();
        setActivityEvents(d.events || []);
      }
    } catch {}
    setActivityLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress size={32} sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <PageHeading title="Control Tower" sx={{ mb: 1 }} />
        <ErrorAlert title="Could not load dashboard">
          <Typography variant="body2" sx={{ mb: 1.5 }}>{fetchError}</Typography>
          <Typography variant="body2">
            Common cause in development: <code>SUPABASE_SERVICE_ROLE_KEY</code> is missing from <code>.env.local</code>. Check the server console for details.
          </Typography>
        </ErrorAlert>
      </Box>
    );
  }

  if (!data || data.summary.total_guests === 0) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <PageHeading title="Control Tower" sx={{ mb: 1 }} />
        <PheraCard variant="default" sx={{ p: 6 }}>
          <EmptyState
            icon={<PeopleAltIcon sx={{ fontSize: 48 }} />}
            title="No guests yet"
            subtitle="Add guests to start tracking outreach, RSVPs, and coordination."
            action={
              <Typography variant="body2" sx={{ color: COLORS.text.faint, mt: 2 }}>
                Demo wedding? Make sure the <code>guests</code> table has rows for slug <code>{weddingSlug}</code>. If RSVPs shows data but this is empty, the dashboard API is returning <code>total_guests: 0</code> — check Network tab.
              </Typography>
            }
            sx={{ py: 0 }}
          />
        </PheraCard>
      </Box>
    );
  }

  const { summary, escalations, needsAttention, concierge, provider, weddingDate, partner1Name, partner2Name, venue, guestList } = data;
  const daysLeft = daysUntilWedding(weddingDate);
  const rsvpPct = rsvpPercentage(summary.rsvp_breakdown, summary.total_guests);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PageHeading
          title="Control Tower"
          subtitle="Outreach, RSVPs, escalations, and messaging — all in one place."
        />
      </Box>

      {/* ═══ Row 1: Actionable KPI Cards ════════════════════════ */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<CalendarTodayIcon sx={{ fontSize: 20, color: COLORS.side.both }} />}
            label="Days to Wedding"
            value={daysLeft !== null ? daysLeft : '—'}
            subtitle={weddingDate ? new Date(weddingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined}
            color={COLORS.side.both}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<HowToRegIcon sx={{ fontSize: 20, color: COLORS.accent.success }} />}
            label="RSVPs Complete"
            value={rsvpPct}
            subtitle={`${summary.rsvp_breakdown.yes + summary.rsvp_breakdown.no + summary.rsvp_breakdown.maybe} of ${summary.total_guests} responded`}
            color={COLORS.accent.success}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<PersonOffIcon sx={{ fontSize: 20, color: COLORS.accent.warning }} />}
            label="Not Yet Reached by Concierge"
            value={summary.not_contacted}
            subtitle={summary.total_guests > 0 ? `${Math.round((summary.not_contacted / summary.total_guests) * 100)}% of guests pending first touch` : undefined}
            color={COLORS.accent.warning}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<SendIcon sx={{ fontSize: 20, color: COLORS.accent.info }} />}
            label="Sent This Week"
            value={summary.messages_sent_this_week}
            color={COLORS.accent.info}
          />
        </Grid>
      </Grid>

      {/* ═══ Row 2: Charts ═══════════════════════════════════ */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <OutreachFunnelChart summary={summary} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RsvpDonutChart breakdown={summary.rsvp_breakdown} totalGuests={summary.total_guests} />
        </Grid>
      </Grid>

      {/* ═══ Row 3: Compose & Send + Escalation Queue ═══════ */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ComposePanel
            weddingSlug={weddingSlug}
            guests={guestList}
            partner1Name={partner1Name}
            partner2Name={partner2Name}
            weddingDate={weddingDate || ''}
            venue={venue}
            provider={provider}
            onSent={fetchDashboard}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {escalations.length > 0 ? (
            <EscalationQueue
              escalations={escalations}
              weddingSlug={weddingSlug}
              onResolved={fetchDashboard}
            />
          ) : (
            <NeedsAttentionPanel
              guests={needsAttention}
              totalNeedsAttention={needsAttention.length}
              weddingSlug={weddingSlug}
            />
          )}
        </Grid>
      </Grid>

      {/* ═══ Row 4: Needs Attention (if escalations shown above) ═══ */}
      {escalations.length > 0 && needsAttention.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <NeedsAttentionPanel
            guests={needsAttention}
            totalNeedsAttention={needsAttention.length}
            weddingSlug={weddingSlug}
          />
        </Box>
      )}

      {/* ═══ Row 5: Activity Timeline (collapsed) ═══════════ */}
      <Accordion
        elevation={0}
        onChange={(_, expanded) => { if (expanded) loadActivityEvents(); }}
        sx={{
          borderRadius: '12px !important',
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: COLORS.bg.white,
          mb: 1.5,
          '&::before': { display: 'none' },
          '& .MuiAccordionSummary-root': { minHeight: 48 },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: COLORS.text.subtle }} />}>
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: COLORS.text.strong }}>
            Activity Timeline
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {activityLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: COLORS.brand.primary }} />
            </Box>
          ) : activityEvents ? (
            <UnifiedTimeline events={activityEvents} weddingSlug={weddingSlug} />
          ) : (
            <Typography sx={{ fontSize: 14, color: COLORS.text.faint, py: 2, textAlign: 'center' }}>
              No activity data available.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* ═══ Row 6: Concierge Insights (collapsed secondary) ═══ */}
      <Accordion
        elevation={0}
        sx={{
          borderRadius: '12px !important',
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: COLORS.bg.white,
          '&::before': { display: 'none' },
          '& .MuiAccordionSummary-root': { minHeight: 48 },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: COLORS.text.subtle }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon sx={{ fontSize: 16, color: COLORS.side.both }} />
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: COLORS.text.strong }}>
              Concierge Insights
            </Typography>
            {concierge.guestsReached > 0 && (
              <Typography sx={{ fontSize: 14, color: COLORS.text.subtle, ml: 0.5 }}>
                ({concierge.guestsReached} guests reached, {concierge.messagesHandled} messages)
              </Typography>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <ConciergeInsightsPanel
            guestsReached={concierge.guestsReached}
            messagesHandled={concierge.messagesHandled}
            avgResponseTimeSec={concierge.avgResponseTimeSec}
            topicBreakdown={concierge.topicBreakdown}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
