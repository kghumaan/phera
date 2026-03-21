'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import OutreachStatusTracker from '@/components/admin/control-tower/OutreachStatusTracker';
import ActionQueue from '@/components/admin/control-tower/ActionQueue';
import OutreachTimeline from '@/components/admin/control-tower/OutreachTimeline';
import RecentActivity from '@/components/admin/control-tower/RecentActivity';
import type {
  OutreachSummary,
  OutreachEvent,
  OutreachSequence,
} from '@/lib/types/outreach';

const EMPTY_SUMMARY: OutreachSummary = {
  total_guests: 0,
  not_contacted: 0,
  save_the_date_sent: 0,
  rsvp_requested: 0,
  rsvp_confirmed: 0,
  travel_collected: 0,
  logistics_complete: 0,
  unresponsive: 0,
  escalations_open: 0,
  next_scheduled_action: null,
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.07)',
        p: 2.5,
        bgcolor: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          bgcolor: `${color}12`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: '#6a6a6a', fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

function EmptyState() {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.07)',
        p: 6,
        bgcolor: 'white',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '16px',
          bgcolor: '#F8F8F8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <PeopleAltIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
        No guests yet
      </Typography>
      <Typography variant="body2" sx={{ color: '#6a6a6a', maxWidth: 400, mx: 'auto' }}>
        Add guests to your wedding to start tracking outreach progress. Once guests are added, the
        Control Tower will show their outreach status, upcoming actions, and activity timeline.
      </Typography>
    </Paper>
  );
}

export default function ControlTowerPage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;

  const [summary, setSummary] = useState<OutreachSummary>(EMPTY_SUMMARY);
  const [events, setEvents] = useState<OutreachEvent[]>([]);
  const [pendingSequences, setPendingSequences] = useState<OutreachSequence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, eventsRes, sequencesRes] = await Promise.all([
          fetch(`/api/outreach/${weddingSlug}/summary`),
          fetch(`/api/outreach/${weddingSlug}/events`),
          fetch(`/api/outreach/${weddingSlug}/sequences?status=pending,scheduled`),
        ]);

        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setSummary(data);
        }
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents(data.events || []);
        }
        if (sequencesRes.ok) {
          const data = await sequencesRes.json();
          setPendingSequences(data.sequences || []);
        }
      } catch {
        // API routes may not exist yet — show empty state
      } finally {
        setLoading(false);
      }
    }

    if (weddingSlug) {
      fetchData();
    }
  }, [weddingSlug]);

  const isEmptyWedding = summary.total_guests === 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
        <CircularProgress size={32} sx={{ color: '#DE3F5E' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          Control Tower
        </Typography>
        <Typography variant="body2" sx={{ color: '#6a6a6a', mt: 0.5 }}>
          Track guest outreach progress, upcoming actions, and recent activity.
        </Typography>
      </Box>

      {isEmptyWedding ? (
        <EmptyState />
      ) : (
        <>
          {/* Quick stats row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                icon={<PeopleAltIcon sx={{ fontSize: 22, color: '#3b82f6' }} />}
                label="Total Guests"
                value={summary.total_guests}
                color="#3b82f6"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                icon={<CheckCircleIcon sx={{ fontSize: 22, color: '#22c55e' }} />}
                label="RSVPs Confirmed"
                value={summary.rsvp_confirmed}
                color="#22c55e"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                icon={<WarningAmberIcon sx={{ fontSize: 22, color: '#ef4444' }} />}
                label="Open Escalations"
                value={summary.escalations_open}
                color="#ef4444"
              />
            </Grid>
          </Grid>

          {/* Outreach status tracker - full width */}
          <Box sx={{ mb: 3 }}>
            <OutreachStatusTracker summary={summary} />
          </Box>

          {/* Two-column layout: Action Queue + Recent Activity */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <ActionQueue
                pendingSequences={pendingSequences}
                escalationsCount={summary.escalations_open}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RecentActivity events={events} />
            </Grid>
          </Grid>

          {/* Timeline - full width */}
          <OutreachTimeline events={events} />
        </>
      )}
    </Box>
  );
}
