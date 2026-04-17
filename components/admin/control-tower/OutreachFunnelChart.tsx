'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface OutreachFunnelChartProps {
  summary: {
    not_contacted: number;
    save_the_date_sent: number;
    rsvp_requested: number;
    rsvp_confirmed: number;
    travel_collected: number;
    logistics_complete: number;
    unresponsive: number;
  };
}

const STAGES = [
  { key: 'not_contacted', label: 'Not Reached by Concierge', color: '#94a3b8' },
  { key: 'save_the_date_sent', label: 'Save the Date', color: '#f59e0b' },
  { key: 'rsvp_requested', label: 'RSVP Requested', color: COLORS.accent.info },
  { key: 'rsvp_confirmed', label: 'RSVP Confirmed', color: '#22c55e' },
  { key: 'travel_collected', label: 'Travel Collected', color: '#8b5cf6' },
  { key: 'logistics_complete', label: 'Complete', color: '#06b6d4' },
  { key: 'unresponsive', label: 'Unresponsive', color: '#ef4444' },
];

export default function OutreachFunnelChart({ summary }: OutreachFunnelChartProps) {
  const data = STAGES.map((s) => ({
    name: s.label,
    value: (summary as any)[s.key] || 0,
    color: s.color,
  })).filter((d) => d.value > 0 || d.name === 'Not Reached by Concierge');

  const total = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <Paper elevation={0} sx={{ borderRadius: RADII.md, border: '1px solid rgba(0,0,0,0.07)', p: 2.5, bgcolor: COLORS.bg.white, height: '100%' }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14, color: COLORS.text.strong, mb: 2 }}>
        Outreach Pipeline
      </Typography>
      {total === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 13, color: COLORS.text.faint }}>No guests yet</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: COLORS.text.muted }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={((value: number) => [`${value} guests`, '']) as any}
              contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}
