'use client';

import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { OutreachEvent } from '@/lib/types/outreach';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ConversationThreadProps {
  guestName: string;
  events: OutreachEvent[];
}

export default function ConversationThread({ guestName, events }: ConversationThreadProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2, py: 1.5, bgcolor: COLORS.bg.subtle, borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
          {guestName}
        </Typography>
      </Box>

      <Box sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
        {events.map((event, i) => {
          const isIncoming = event.event_type === 'message_received';
          const time = new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <Box
              key={event.id || i}
              sx={{
                display: 'flex',
                justifyContent: isIncoming ? 'flex-start' : 'flex-end',
                mb: 1,
              }}
            >
              <Box
                sx={{
                  maxWidth: '75%',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: isIncoming ? COLORS.bg.subtle : '#DE3F5E10',
                  border: `1px solid ${isIncoming ? 'rgba(0,0,0,0.07)' : '#DE3F5E30'}`,
                }}
              >
                {event.template_name && (
                  <Chip
                    label={event.template_name}
                    size="small"
                    sx={{ mb: 0.5, height: 20, fontSize: '0.875rem' }}
                  />
                )}
                <Typography variant="body2" sx={{ color: COLORS.text.strong, fontSize: '0.875rem' }}>
                  {(event.details as any)?.message || (event.details as any)?.delivery_status || event.event_type}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.text.faint, mt: 0.5, display: 'block', textAlign: 'right' }}>
                  {time}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
