'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Collapse,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import ChatIcon from '@mui/icons-material/Chat';
import InfoIcon from '@mui/icons-material/Info';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BlockIcon from '@mui/icons-material/Block';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface UnifiedTimelineProps {
  events: any[];
  weddingSlug?: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  template_sent: <SendIcon sx={{ fontSize: 14, color: COLORS.accent.info }} />,
  message_received: <ReplyIcon sx={{ fontSize: 14, color: COLORS.accent.success }} />,
  conversation_started: <ChatIcon sx={{ fontSize: 14, color: COLORS.side.both }} />,
  info_collected: <InfoIcon sx={{ fontSize: 14, color: '#06b6d4' }} />,
  escalated: <ErrorOutlineIcon sx={{ fontSize: 14, color: COLORS.accent.danger }} />,
  opted_out: <BlockIcon sx={{ fontSize: 14, color: COLORS.text.faint }} />,
  status_changed: <SyncAltIcon sx={{ fontSize: 14, color: COLORS.accent.warning }} />,
  issue_created: <WarningAmberIcon sx={{ fontSize: 14, color: COLORS.accent.danger }} />,
  rsvp_received: <CheckCircleIcon sx={{ fontSize: 14, color: COLORS.accent.success }} />,
};

const EVENT_LABELS: Record<string, string> = {
  template_sent: 'sent a message',
  message_received: 'replied',
  conversation_started: 'started a conversation',
  info_collected: 'provided info',
  escalated: 'was escalated',
  opted_out: 'opted out',
  status_changed: 'status changed',
  issue_created: 'issue created',
  rsvp_received: 'RSVPed',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  template_sent: COLORS.accent.info,
  message_received: COLORS.accent.success,
  conversation_started: COLORS.side.both,
  info_collected: '#06b6d4',
  escalated: COLORS.accent.danger,
  opted_out: COLORS.text.faint,
  status_changed: COLORS.accent.warning,
  issue_created: COLORS.accent.danger,
  rsvp_received: COLORS.accent.success,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF5350',
  high: COLORS.accent.warning,
  medium: COLORS.accent.info,
  low: COLORS.text.faint,
};

function formatRelativeTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 0) {
    // Future event
    const absDiff = Math.abs(diffMs);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    if (days < 30) return `In ${Math.ceil(days / 7)} weeks`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullTimestamp(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

type FilterMode = 'all' | 'sent' | 'received' | 'escalations';

const MAX_ITEMS = 40;

export default function UnifiedTimeline({ events, weddingSlug }: UnifiedTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');

  const sorted = [...events]
    .sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      const now = Date.now();
      // Future events first (ascending), then past events (descending)
      const aIsFuture = aTime > now;
      const bIsFuture = bTime > now;
      if (aIsFuture && !bIsFuture) return -1;
      if (!aIsFuture && bIsFuture) return 1;
      if (aIsFuture && bIsFuture) return aTime - bTime;
      return bTime - aTime;
    });

  const filtered = sorted.filter((e) => {
    if (filter === 'sent') return ['template_sent', 'status_changed'].includes(e.event_type);
    if (filter === 'received') return ['message_received', 'rsvp_received', 'info_collected', 'conversation_started'].includes(e.event_type);
    if (filter === 'escalations') return ['escalated', 'issue_created'].includes(e.event_type);
    return true;
  }).slice(0, MAX_ITEMS);

  return (
    <Paper elevation={0} sx={{ borderRadius: RADII.md, border: '1px solid rgba(0,0,0,0.07)', p: 2.5, bgcolor: COLORS.bg.white }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14, color: COLORS.text.strong }}>
          Activity Timeline ({filtered.length})
        </Typography>
      </Box>

      {/* Filters */}
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, v) => { if (v) setFilter(v); }}
        size="small"
        sx={{ mb: 2, '& .MuiToggleButton-root': { textTransform: 'none', fontSize: 14, px: 1.5, py: 0.25, borderRadius: '8px !important', border: '1px solid rgba(0,0,0,0.1)', '&.Mui-selected': { bgcolor: COLORS.text.strong, color: COLORS.text.inverse, '&:hover': { bgcolor: COLORS.text.strong } } } }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="sent">Sent</ToggleButton>
        <ToggleButton value="received">Received</ToggleButton>
        <ToggleButton value="escalations">Escalations</ToggleButton>
      </ToggleButtonGroup>

      {filtered.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 14, color: COLORS.text.faint }}>
            No activity yet. Start by sending save-the-dates.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', maxHeight: 500, overflow: 'auto' }}>
          {/* Vertical line */}
          <Box sx={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 2, bgcolor: 'rgba(0,0,0,0.06)', zIndex: 0 }} />

          {filtered.map((event, index) => {
            const eventType = event.event_type || 'status_changed';
            const isFuture = new Date(event.created_at).getTime() > Date.now();
            const isExpanded = expandedId === event.id;
            const dotColor = EVENT_TYPE_COLORS[eventType] || COLORS.text.faint;
            const details = event.details || {};

            let displayName = details.guest_name || details.title || 'Guest';
            let displayLabel = EVENT_LABELS[eventType] || eventType.replace(/_/g, ' ');

            if (eventType === 'rsvp_received') {
              displayLabel = details.attending === 'yes' ? 'RSVPed yes'
                : details.attending === 'no' ? 'RSVPed no'
                : details.attending === 'maybe' ? 'RSVPed maybe'
                : 'RSVPed';
            }
            if (eventType === 'issue_created') {
              displayName = details.category || 'Issue';
              displayLabel = details.title || 'issue created';
            }

            return (
              <Box key={event.id}>
                <Box
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, pl: 0, pr: 1,
                    cursor: 'pointer', borderRadius: 1, opacity: isFuture ? 0.6 : 1,
                    '&:hover': { bgcolor: COLORS.bg.muted },
                  }}
                >
                  {/* Timeline dot */}
                  <Box sx={{ position: 'relative', zIndex: 1, width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    <Box sx={{
                      width: 10, height: 10, borderRadius: '50%', bgcolor: dotColor,
                      border: isFuture ? `2px dashed ${dotColor}` : 'none',
                      boxShadow: isFuture ? 'none' : `0 0 0 3px ${dotColor}20`,
                    }} />
                  </Box>

                  {/* Icon + text */}
                  <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: COLORS.bg.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isFuture
                      ? <ScheduleIcon sx={{ fontSize: 14, color: COLORS.text.faint }} />
                      : (EVENT_ICONS[eventType] || <SyncAltIcon sx={{ fontSize: 14, color: COLORS.text.faint }} />)
                    }
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, color: COLORS.text.strong, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      <Typography component="span" sx={{ fontSize: 14, fontWeight: 600 }}>{displayName}</Typography>{' '}
                      {displayLabel}
                    </Typography>
                    {event.template_name && (
                      <Typography sx={{ fontSize: 14, color: COLORS.text.subtle }}>{event.template_name}</Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                    {isFuture && (
                      <Chip label="SCHEDULED" size="small" sx={{ height: 16, fontSize: 8, fontWeight: 700, bgcolor: COLORS.bg.subtle, color: COLORS.text.subtle }} />
                    )}
                    <Typography sx={{ fontSize: 14, color: COLORS.text.faint, whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(event.created_at)}
                    </Typography>
                    {isExpanded
                      ? <ExpandLessIcon sx={{ fontSize: 14, color: COLORS.text.faint }} />
                      : <ExpandMoreIcon sx={{ fontSize: 14, color: COLORS.text.faint }} />
                    }
                  </Stack>
                </Box>

                {/* Expanded details */}
                <Collapse in={isExpanded}>
                  <Box sx={{ pl: 7.5, pr: 1, pb: 1.5, pt: 0.5 }}>
                    <Typography sx={{ fontSize: 14, color: COLORS.text.subtle, mb: 1 }}>
                      {formatFullTimestamp(event.created_at)}
                    </Typography>

                    {eventType === 'issue_created' && (
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75, flexWrap: 'wrap' }}>
                          {details.priority && (
                            <Chip label={details.priority} size="small" sx={{ height: 20, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', bgcolor: PRIORITY_COLORS[details.priority] || COLORS.text.faint, color: COLORS.text.inverse }} />
                          )}
                          {details.category && (
                            <Chip label={details.category} size="small" variant="outlined" sx={{ height: 20, fontSize: 14, color: COLORS.text.muted, borderColor: 'rgba(0,0,0,0.2)' }} />
                          )}
                        </Box>
                        {details.description && (
                          <Typography sx={{ fontSize: 14, color: COLORS.text.muted, lineHeight: 1.5 }}>{details.description}</Typography>
                        )}
                      </Box>
                    )}

                    {eventType === 'rsvp_received' && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                        <Chip
                          label={details.attending === 'yes' ? 'Attending' : details.attending === 'no' ? 'Not Attending' : 'Maybe'}
                          size="small"
                          sx={{ height: 20, fontSize: 14, fontWeight: 600,
                            bgcolor: details.attending === 'yes' ? '#E8F5E9' : details.attending === 'no' ? '#FFEBEE' : '#FFF3E0',
                            color: details.attending === 'yes' ? '#2E7D32' : details.attending === 'no' ? '#C62828' : '#E65100',
                          }}
                        />
                        {details.guest_count > 1 && (
                          <Chip label={`${details.guest_count} guests`} size="small" sx={{ height: 20, fontSize: 14, bgcolor: COLORS.bg.subtle, color: COLORS.text.muted }} />
                        )}
                      </Box>
                    )}

                    {eventType === 'escalated' && details.reason && (
                      <Typography sx={{ fontSize: 14, color: COLORS.text.muted, lineHeight: 1.5 }}>{details.reason}</Typography>
                    )}

                    {!['issue_created', 'rsvp_received', 'escalated'].includes(eventType) && details.template && (
                      <Typography sx={{ fontSize: 14, color: COLORS.text.subtle }}>Template: {details.template}</Typography>
                    )}

                    {event.channel && (
                      <Typography sx={{ fontSize: 14, color: COLORS.text.faint, mt: 0.5 }}>Channel: {event.channel}</Typography>
                    )}

                    {weddingSlug && event.guest_id && (
                      <Typography
                        component="a"
                        href={`/admin/${weddingSlug}/guests`}
                        sx={{ fontSize: 14, color: COLORS.brand.primary, textDecoration: 'none', mt: 0.5, display: 'inline-block', '&:hover': { textDecoration: 'underline' } }}
                      >
                        View guest
                      </Typography>
                    )}
                  </Box>
                </Collapse>

                {index < filtered.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(0,0,0,0.04)', ml: 3 }} />
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
