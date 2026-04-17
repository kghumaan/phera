'use client';

import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { OutreachEvent } from '@/lib/types/outreach';
import { COLORS, RADII } from '@/lib/theme/tokens';

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  template_sent: { label: 'Template Sent', color: COLORS.accent.info },
  message_received: { label: 'Message Received', color: '#22c55e' },
  conversation_started: { label: 'Conversation Started', color: '#8b5cf6' },
  info_collected: { label: 'Info Collected', color: '#06b6d4' },
  escalated: { label: 'Escalated', color: '#ef4444' },
  opted_out: { label: 'Opted Out', color: '#94a3b8' },
  status_changed: { label: 'Status Changed', color: '#f59e0b' },
};

interface CommunicationTimelineProps {
  events: OutreachEvent[];
  onGuestClick?: (guestId: string) => void;
}

export default function CommunicationTimeline({ events, onGuestClick }: CommunicationTimelineProps) {
  if (events.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
          No communications yet. Start your outreach to see activity here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {events.map((event, i) => {
        const typeInfo = EVENT_TYPE_LABELS[event.event_type] || { label: event.event_type, color: '#94a3b8' };
        const time = new Date(event.created_at).toLocaleString();

        return (
          <Box
            key={event.id || i}
            sx={{
              display: 'flex',
              gap: 2,
              py: 1.5,
              px: 2,
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
              cursor: onGuestClick ? 'pointer' : 'default',
            }}
            onClick={() => onGuestClick?.(event.guest_id)}
          >
            {/* Timeline dot */}
            <Box sx={{ pt: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: typeInfo.color,
                }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Chip
                  label={typeInfo.label}
                  size="small"
                  sx={{
                    bgcolor: `${typeInfo.color}15`,
                    color: typeInfo.color,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
                {event.template_name && (
                  <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                    {event.template_name}
                  </Typography>
                )}
              </Stack>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {time}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
