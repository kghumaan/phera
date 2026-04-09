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
interface OutreachTimelineProps {
  events: any[];
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  template_sent: { label: 'Message Sent', color: '#3b82f6' },
  message_received: { label: 'Reply Received', color: '#22c55e' },
  conversation_started: { label: 'Conversation', color: '#8b5cf6' },
  info_collected: { label: 'Info Collected', color: '#06b6d4' },
  escalated: { label: 'Escalated', color: '#ef4444' },
  opted_out: { label: 'Opted Out', color: '#94a3b8' },
  status_changed: { label: 'Status Changed', color: '#f59e0b' },
  issue_created: { label: 'Issue Created', color: '#ef4444' },
  rsvp_received: { label: 'RSVP Received', color: '#22c55e' },
};

const FALLBACK_CONFIG = { label: 'Event', color: '#94a3b8' };

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
        bgcolor: 'white',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2 }}>
        Outreach Timeline
      </Typography>

      {sorted.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
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
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                        {config.label}
                      </Typography>
                      {future && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#6a6a6a',
                            bgcolor: '#F8F8F8',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                          }}
                        >
                          SCHEDULED
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                      <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                        {formatTimestamp(event.created_at)}
                      </Typography>
                      {event.template_name && (
                        <Typography variant="caption" sx={{ color: '#4a4a4a' }}>
                          &middot; {event.template_name}
                        </Typography>
                      )}
                      {event.channel && (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          &middot; {event.channel}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
}
