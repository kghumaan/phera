'use client';

import React from 'react';
import { Box, Typography, Paper, Chip, Stack } from '@mui/material';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface GuestRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  wedding_side: string | null;
  outreach_status: string;
  rsvp_attending: string | null;
  last_contacted: string | null;
}

interface NeedsAttentionPanelProps {
  guests: GuestRow[];
  totalNeedsAttention: number;
  weddingSlug: string;
}

const STATUS_LABELS: Record<string, string> = {
  not_contacted: 'Not Contacted',
  save_the_date_sent: 'Save the Date Sent',
  rsvp_requested: 'RSVP Requested',
  unresponsive: 'Unresponsive',
};

function timeAgo(date: string | null): string {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function NeedsAttentionPanel({ guests, totalNeedsAttention, weddingSlug }: NeedsAttentionPanelProps) {
  return (
    <Paper elevation={0} sx={{ borderRadius: RADII.md, border: '1px solid rgba(0,0,0,0.07)', p: 2.5, bgcolor: COLORS.bg.white, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14, color: COLORS.text.strong }}>
          Not Responding ({totalNeedsAttention})
        </Typography>
        {totalNeedsAttention > guests.length && (
          <Typography
            component="a"
            href={`/admin/${weddingSlug}/guest-responses`}
            sx={{ fontSize: 14, color: COLORS.brand.primary, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            View all
          </Typography>
        )}
      </Box>

      {guests.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 14, color: COLORS.text.faint }}>
            Everyone is responding!
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 280, overflow: 'auto' }}>
          {guests.map((g) => (
            <Box key={g.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, px: 1, borderRadius: RADII.sm, bgcolor: COLORS.bg.muted, border: '1px solid rgba(0,0,0,0.04)' }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.text.strong, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.name}
                </Typography>
                <Typography sx={{ fontSize: 14, color: COLORS.text.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.email}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 1 }}>
                <Chip
                  label={STATUS_LABELS[g.outreach_status] || g.outreach_status}
                  size="small"
                  sx={{
                    height: 18, fontSize: 9,
                    bgcolor: g.outreach_status === 'unresponsive' ? COLORS.accent.dangerBg : COLORS.bg.subtle,
                    color: g.outreach_status === 'unresponsive' ? COLORS.accent.dangerText : COLORS.text.subtle,
                  }}
                />
                <Typography sx={{ fontSize: 9, color: COLORS.text.faint, whiteSpace: 'nowrap', alignSelf: 'center' }}>
                  {timeAgo(g.last_contacted)}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
