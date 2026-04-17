'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface RsvpDonutChartProps {
  breakdown: {
    yes: number;
    no: number;
    maybe: number;
    pending: number;
  };
  totalGuests: number;
}

const SEGMENTS = [
  { key: 'yes', label: 'Attending', color: '#22c55e' },
  { key: 'no', label: 'Declined', color: '#ef4444' },
  { key: 'maybe', label: 'Maybe', color: '#f59e0b' },
  { key: 'pending', label: 'No RSVP', color: '#e2e8f0' },
];

export default function RsvpDonutChart({ breakdown, totalGuests }: RsvpDonutChartProps) {
  const data = SEGMENTS.map((s) => ({
    name: s.label,
    value: (breakdown as any)[s.key] || 0,
    color: s.color,
  })).filter((d) => d.value > 0);

  const responded = breakdown.yes + breakdown.no + breakdown.maybe;

  return (
    <Paper elevation={0} sx={{ borderRadius: RADII.md, border: '1px solid rgba(0,0,0,0.07)', p: 2.5, bgcolor: COLORS.bg.white, height: '100%' }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14, color: COLORS.text.strong, mb: 1 }}>
        RSVP Status
      </Typography>
      {totalGuests === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 13, color: COLORS.text.faint }}>No guests yet</Typography>
        </Box>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={((value: number, name: string) => [`${value} guests`, name]) as any}
                contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: COLORS.text.strong, lineHeight: 1 }}>
              {responded}
            </Typography>
            <Typography sx={{ fontSize: 10, color: COLORS.text.faint }}>
              of {totalGuests}
            </Typography>
          </Box>
          {/* Legend */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 0.5 }}>
            {SEGMENTS.map((s) => {
              const val = (breakdown as any)[s.key] || 0;
              if (val === 0 && s.key === 'pending') return null;
              return (
                <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                  <Typography sx={{ fontSize: 11, color: COLORS.text.muted }}>
                    {s.label} ({val})
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
