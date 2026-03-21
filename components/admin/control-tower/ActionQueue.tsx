'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { OutreachSequence } from '@/lib/types/outreach';

interface ActionQueueProps {
  pendingSequences: OutreachSequence[];
  escalationsCount: number;
}

function formatRelativeDate(date: Date | undefined): string {
  if (!date) return 'Not scheduled';
  const now = new Date();
  const d = new Date(date);
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === -1) return 'Yesterday (overdue)';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

function isOverdue(date: Date | undefined): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

function formatSequenceType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ActionQueue({ pendingSequences, escalationsCount }: ActionQueueProps) {
  const sorted = [...pendingSequences].sort((a, b) => {
    const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
    const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
    return aTime - bTime;
  });

  const hasActions = sorted.length > 0 || escalationsCount > 0;

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Action Queue
        </Typography>
        {escalationsCount > 0 && (
          <Chip
            size="small"
            icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
            label={`${escalationsCount} escalation${escalationsCount !== 1 ? 's' : ''}`}
            sx={{
              bgcolor: '#ef444414',
              color: '#ef4444',
              fontWeight: 500,
              fontSize: '0.75rem',
              border: '1px solid #ef444430',
            }}
          />
        )}
      </Box>

      {!hasActions ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            No pending actions. Everything is on track.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sorted.map((seq) => {
            const overdue = isOverdue(seq.scheduled_at);
            return (
              <Box
                key={seq.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 1,
                  bgcolor: overdue ? '#fef2f214' : '#F8F8F8',
                  border: overdue ? '1px solid #ef444430' : '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                  <ScheduleSendIcon
                    sx={{ fontSize: 20, color: overdue ? '#ef4444' : '#6a6a6a', flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {formatSequenceType(seq.sequence_type)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: overdue ? '#ef4444' : '#6a6a6a' }}>
                      {formatRelativeDate(seq.scheduled_at)}
                      {seq.target_statuses.length > 0 &&
                        ` \u00B7 ${seq.target_statuses.length} target status${seq.target_statuses.length !== 1 ? 'es' : ''}`}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  disableElevation
                  sx={{
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    px: 2,
                    flexShrink: 0,
                    '&:hover': { bgcolor: '#c4354f' },
                  }}
                >
                  {overdue ? 'Send Now' : 'Review'}
                </Button>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
