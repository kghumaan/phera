'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ConciergeInsightsPanelProps {
  guestsReached: number;
  messagesHandled: number;
  avgResponseTimeSec: number;
  topicBreakdown: Record<string, number>;
}

const TOPIC_LABELS: Record<string, string> = {
  rsvp: 'RSVP', travel: 'Travel', hotel: 'Hotel', visa: 'Visa',
  logistics: 'Logistics', events: 'Events', general: 'General',
  dietary: 'Dietary', shuttle: 'Shuttle',
};

export default function ConciergeInsightsPanel({ guestsReached, messagesHandled, avgResponseTimeSec, topicBreakdown }: ConciergeInsightsPanelProps) {
  const topicData = Object.entries(topicBreakdown)
    .map(([key, value]) => ({ name: TOPIC_LABELS[key] || key, value }))
    .sort((a, b) => b.value - a.value);

  const hasTopics = topicData.length > 0;

  return (
    <Box sx={{ bgcolor: COLORS.bg.white }}>
      {/* Mini stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: COLORS.text.strong, lineHeight: 1.2 }}>
            {guestsReached}
          </Typography>
          <Typography sx={{ fontSize: 10, color: COLORS.text.subtle }}>Guests Reached</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: COLORS.text.strong, lineHeight: 1.2 }}>
            {messagesHandled}
          </Typography>
          <Typography sx={{ fontSize: 10, color: COLORS.text.subtle }}>Messages</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: avgResponseTimeSec > 30 ? COLORS.accent.warning : COLORS.accent.success, lineHeight: 1.2 }}>
            {avgResponseTimeSec > 0 ? `${avgResponseTimeSec}s` : '—'}
          </Typography>
          <Typography sx={{ fontSize: 10, color: COLORS.text.subtle }}>Avg Response</Typography>
        </Box>
      </Stack>

      {/* Topic breakdown chart */}
      {hasTopics ? (
        <>
          <Typography sx={{ fontSize: 11, color: COLORS.text.subtle, mb: 1 }}>What guests are asking about</Typography>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={topicData} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: COLORS.text.muted }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={((value: number) => [`${value} guests`, '']) as any}
                contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              <Bar dataKey="value" fill="#DE3F5E" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12, color: COLORS.text.faint }}>
            {guestsReached > 0 ? 'Topic data not available yet' : 'No concierge conversations yet'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
