'use client';

import React from 'react';
import { Box, Typography, Chip, Paper, Tooltip } from '@mui/material';
import type { OutreachSummary, OutreachStatus } from '@/lib/types/outreach';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface OutreachStatusTrackerProps {
  summary: OutreachSummary;
}

const STATUS_CONFIG: {
  key: OutreachStatus;
  label: string;
  color: string;
}[] = [
  { key: 'not_contacted', label: 'Not Contacted', color: COLORS.text.faint },
  { key: 'save_the_date_sent', label: 'Save the Date', color: COLORS.accent.warning },
  { key: 'rsvp_requested', label: 'RSVP Requested', color: COLORS.accent.info },
  { key: 'rsvp_confirmed', label: 'RSVP Confirmed', color: COLORS.accent.success },
  { key: 'travel_collected', label: 'Travel Collected', color: COLORS.side.both },
  { key: 'logistics_complete', label: 'Logistics Complete', color: '#06b6d4' },
  { key: 'unresponsive', label: 'Unresponsive', color: COLORS.accent.danger },
];

export default function OutreachStatusTracker({ summary }: OutreachStatusTrackerProps) {
  const total = summary.total_guests;

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
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
          Outreach Progress
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
          {total}
          <Typography component="span" variant="body2" sx={{ color: COLORS.text.subtle, ml: 0.5 }}>
            guests
          </Typography>
        </Typography>
      </Box>

      {/* Segmented progress bar */}
      <Box
        sx={{
          display: 'flex',
          height: 12,
          borderRadius: '6px',
          overflow: 'hidden',
          bgcolor: COLORS.bg.subtle,
          mb: 2,
        }}
      >
        {total > 0 &&
          STATUS_CONFIG.map(({ key, label, color }) => {
            const count = summary[key];
            if (count === 0) return null;
            const pct = (count / total) * 100;
            return (
              <Tooltip key={key} title={`${label}: ${count} (${Math.round(pct)}%)`} arrow>
                <Box
                  sx={{
                    width: `${pct}%`,
                    bgcolor: color,
                    minWidth: count > 0 ? 4 : 0,
                    transition: 'width 0.4s ease',
                  }}
                />
              </Tooltip>
            );
          })}
      </Box>

      {/* Status chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {STATUS_CONFIG.map(({ key, label, color }) => {
          const count = summary[key];
          return (
            <Chip
              key={key}
              size="small"
              label={`${label}: ${count}`}
              sx={{
                bgcolor: `${color}14`,
                color: color,
                fontWeight: 500,
                fontSize: '0.75rem',
                border: `1px solid ${color}30`,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
