'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Divider,
  Chip,
  Collapse,
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
import { COLORS, RADII } from '@/lib/theme/tokens';

interface RecentActivityProps {
  events: any[];
  weddingSlug?: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  template_sent: <SendIcon sx={{ fontSize: 16, color: COLORS.accent.info }} />,
  message_received: <ReplyIcon sx={{ fontSize: 16, color: COLORS.accent.success }} />,
  conversation_started: <ChatIcon sx={{ fontSize: 16, color: COLORS.side.both }} />,
  info_collected: <InfoIcon sx={{ fontSize: 16, color: COLORS.accent.info }} />,
  escalated: <ErrorOutlineIcon sx={{ fontSize: 16, color: COLORS.accent.danger }} />,
  opted_out: <BlockIcon sx={{ fontSize: 16, color: COLORS.text.faint }} />,
  status_changed: <SyncAltIcon sx={{ fontSize: 16, color: COLORS.accent.warning }} />,
  issue_created: <WarningAmberIcon sx={{ fontSize: 16, color: COLORS.accent.danger }} />,
  rsvp_received: <CheckCircleIcon sx={{ fontSize: 16, color: COLORS.accent.success }} />,
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

const PRIORITY_COLORS: Record<string, string> = {
  urgent: COLORS.accent.danger,
  high: COLORS.accent.warning,
  medium: COLORS.accent.info,
  low: COLORS.text.faint,
};

function formatRelativeTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
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
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const MAX_ITEMS = 30;

export default function RecentActivity({ events, weddingSlug }: RecentActivityProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...events]
    .filter((e) => new Date(e.created_at).getTime() <= Date.now())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, MAX_ITEMS);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.07)',
        p: 3,
        bgcolor: COLORS.bg.white,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 2 }}>
        Recent Activity ({sorted.length})
      </Typography>

      {sorted.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            No activity yet.
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ maxHeight: 500, overflow: 'auto' }}>
          {sorted.map((event, index) => {
            const details = event.details || {};
            const eventType = event.event_type || 'status_changed';
            const isExpanded = expandedId === event.id;

            // Build collapsed display
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
              <React.Fragment key={event.id}>
                {/* Collapsed row */}
                <ListItem
                  disableGutters
                  onClick={() => toggleExpand(event.id)}
                  sx={{
                    py: 1,
                    px: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': { bgcolor: COLORS.bg.muted },
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: COLORS.bg.subtle,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {EVENT_ICONS[eventType] || <SyncAltIcon sx={{ fontSize: 16, color: COLORS.text.faint }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: COLORS.text.strong,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                      }}
                    >
                      <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                        {displayName}
                      </Typography>{' '}
                      {displayLabel}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: COLORS.text.faint, flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    {formatRelativeTime(event.created_at)}
                  </Typography>
                  {isExpanded
                    ? <ExpandLessIcon sx={{ fontSize: 16, color: COLORS.text.faint, flexShrink: 0 }} />
                    : <ExpandMoreIcon sx={{ fontSize: 16, color: COLORS.text.faint, flexShrink: 0 }} />
                  }
                </ListItem>

                {/* Expanded details */}
                <Collapse in={isExpanded}>
                  <Box sx={{ pl: 5.5, pr: 1, pb: 1.5, pt: 0.5 }}>
                    {/* Full timestamp */}
                    <Typography sx={{ fontSize: 14, color: COLORS.text.subtle, mb: 1 }}>
                      {formatFullTimestamp(event.created_at)}
                    </Typography>

                    {/* Issue details */}
                    {eventType === 'issue_created' && (
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75, flexWrap: 'wrap' }}>
                          {details.priority && (
                            <Chip
                              label={details.priority}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 14,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                bgcolor: PRIORITY_COLORS[details.priority] || COLORS.text.faint,
                                color: COLORS.text.inverse,
                              }}
                            />
                          )}
                          {details.category && (
                            <Chip
                              label={details.category}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 14, color: COLORS.text.muted, borderColor: 'rgba(0,0,0,0.2)' }}
                            />
                          )}
                          {details.status && (
                            <Chip
                              label={details.status}
                              size="small"
                              sx={{ height: 20, fontSize: 14, bgcolor: COLORS.bg.subtle, color: COLORS.text.subtle }}
                            />
                          )}
                        </Box>
                        {details.description && (
                          <Typography sx={{ fontSize: 14, color: COLORS.text.muted, lineHeight: 1.5 }}>
                            {details.description}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* RSVP details */}
                    {eventType === 'rsvp_received' && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                        <Chip
                          label={details.attending === 'yes' ? 'Attending' : details.attending === 'no' ? 'Not Attending' : 'Maybe'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 14,
                            fontWeight: 600,
                            bgcolor: details.attending === 'yes' ? COLORS.accent.successBg : details.attending === 'no' ? COLORS.accent.dangerBg : COLORS.accent.warningBg,
                            color: details.attending === 'yes' ? COLORS.accent.successText : details.attending === 'no' ? COLORS.accent.dangerText : COLORS.accent.warningText,
                          }}
                        />
                        {details.guest_count > 1 && (
                          <Chip label={`${details.guest_count} guests`} size="small" sx={{ height: 20, fontSize: 14, bgcolor: COLORS.bg.subtle, color: COLORS.text.muted }} />
                        )}
                      </Box>
                    )}

                    {/* Escalation details */}
                    {eventType === 'escalated' && details.reason && (
                      <Box sx={{ mb: 0.5 }}>
                        <Typography sx={{ fontSize: 14, color: COLORS.text.muted, lineHeight: 1.5 }}>
                          {details.reason}
                        </Typography>
                        {details.urgency && (
                          <Chip
                            label={details.urgency}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 14,
                              fontWeight: 600,
                              mt: 0.5,
                              bgcolor: details.urgency === 'urgent' ? COLORS.accent.danger : COLORS.accent.warning,
                              color: COLORS.text.inverse,
                            }}
                          />
                        )}
                      </Box>
                    )}

                    {/* Generic details fallback */}
                    {!['issue_created', 'rsvp_received', 'escalated'].includes(eventType) && details.template && (
                      <Typography sx={{ fontSize: 14, color: COLORS.text.subtle }}>
                        Template: {details.template}
                      </Typography>
                    )}

                    {/* Link to guest */}
                    {weddingSlug && event.guest_id && (
                      <Typography
                        component="a"
                        href={`/admin/${weddingSlug}/guests`}
                        sx={{ fontSize: 14, color: COLORS.brand.primary, textDecoration: 'none', mt: 0.5, display: 'inline-block', '&:hover': { textDecoration: 'underline' } }}
                      >
                        View guest in Guest List
                      </Typography>
                    )}
                  </Box>
                </Collapse>

                {index < sorted.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(0,0,0,0.04)' }} />
                )}
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Paper>
  );
}
