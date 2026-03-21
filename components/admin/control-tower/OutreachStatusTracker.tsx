'use client';

import React from 'react';
import { Box, Typography, Chip, Paper, Tooltip } from '@mui/material';
import type { OutreachSummary, OutreachStatus } from '@/lib/types/outreach';

interface OutreachStatusTrackerProps {
  summary: OutreachSummary;
}

const STATUS_CONFIG: {
  key: OutreachStatus;
  label: string;
  color: string;
}[] = [
  { key: 'not_contacted', label: 'Not Contacted', color: '#94a3b8' },
  { key: 'save_the_date_sent', label: 'Save the Date', color: '#f59e0b' },
  { key: 'rsvp_requested', label: 'RSVP Requested', color: '#3b82f6' },
  { key: 'rsvp_confirmed', label: 'RSVP Confirmed', color: '#22c55e' },
  { key: 'travel_collected', label: 'Travel Collected', color: '#8b5cf6' },
  { key: 'logistics_complete', label: 'Logistics Complete', color: '#06b6d4' },
  { key: 'unresponsive', label: 'Unresponsive', color: '#ef4444' },
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
        bgcolor: 'white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Outreach Progress
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          {total}
          <Typography component="span" variant="body2" sx={{ color: '#6a6a6a', ml: 0.5 }}>
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
          bgcolor: '#F8F8F8',
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
