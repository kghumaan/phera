'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { COLORS, RADII } from '@/lib/theme/tokens';
interface OutreachTimelineProps {
  events: any[];
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  template_sent: { label: 'Message Sent', color: COLORS.accent.info },
  message_received: { label: 'Reply Received', color: COLORS.accent.success },
  conversation_started: { label: 'Conversation', color: COLORS.side.both },
  info_collected: { label: 'Info Collected', color: COLORS.accent.info },
  escalated: { label: 'Escalated', color: COLORS.accent.danger },
  opted_out: { label: 'Opted Out', color: COLORS.text.faint },
  status_changed: { label: 'Status Changed', color: COLORS.accent.warning },
  issue_created: { label: 'Issue Created', color: COLORS.accent.danger },
  rsvp_received: { label: 'RSVP Received', color: COLORS.accent.success },
};

const FALLBACK_CONFIG = { label: 'Event', color: COLORS.text.faint };

function formatTimestamp(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isFutureEvent(date: Date): boolean {
  return new Date(date).getTime() > Date.now();
}

export default function OutreachTimeline({ events }: OutreachTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
        Outreach Timeline
      </Typography>

      {sorted.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            No outreach events yet. Start by sending save-the-dates.
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ position: 'relative' }}>
          {/* Vertical connecting line */}
          <Box
            sx={{
              position: 'absolute',
              left: 15,
              top: 20,
              bottom: 20,
              width: 2,
              bgcolor: 'rgba(0,0,0,0.06)',
              zIndex: 0,
            }}
          />

          {sorted.map((event, index) => {
            const config = EVENT_TYPE_CONFIG[event.event_type] || FALLBACK_CONFIG;
            const future = isFutureEvent(event.created_at);

            return (
              <ListItem
                key={event.id}
                disableGutters
                sx={{
                  alignItems: 'flex-start',
                  py: 1,
                  px: 0,
                  opacity: future ? 0.6 : 1,
                }}
              >
                {/* Timeline marker */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: 32,
                    display: 'flex',
                    justifyContent: 'center',
                    pt: 0.5,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: config.color,
                      border: future ? `2px dashed ${config.color}` : 'none',
                      boxShadow: future ? 'none' : `0 0 0 3px ${config.color}20`,
                    }}
                  />
                </Box>

                <ListItemText
                  sx={{ m: 0 }}
                  slotProps={{ primary: { component: 'span' }, secondary: { component: 'span' } }}
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" component="span" sx={{ fontWeight: 500, color: COLORS.text.strong }}>
                        {config.label}
                      </Typography>
                      {future && (
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{
                            color: COLORS.text.subtle,
                            bgcolor: COLORS.bg.subtle,
                            px: 0.75,
                            py: 0.25,
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                          }}
                        >
                          SCHEDULED
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                      <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                        {formatTimestamp(event.created_at)}
                      </Typography>
                      {event.template_name && (
                        <Typography variant="caption" sx={{ color: COLORS.text.muted }}>
                          &middot; {event.template_name}
                        </Typography>
                      )}
                      {event.channel && (
                        <Typography variant="caption" sx={{ color: COLORS.text.faint }}>
                          &middot; {event.channel}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
}
