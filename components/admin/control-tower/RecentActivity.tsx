'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import ChatIcon from '@mui/icons-material/Chat';
import InfoIcon from '@mui/icons-material/Info';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BlockIcon from '@mui/icons-material/Block';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import type { OutreachEvent, OutreachEventType } from '@/lib/types/outreach';

interface RecentActivityProps {
  events: OutreachEvent[];
}

const EVENT_ICONS: Record<OutreachEventType, React.ReactNode> = {
  template_sent: <SendIcon sx={{ fontSize: 16, color: '#3b82f6' }} />,
  message_received: <ReplyIcon sx={{ fontSize: 16, color: '#22c55e' }} />,
  conversation_started: <ChatIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />,
  info_collected: <InfoIcon sx={{ fontSize: 16, color: '#06b6d4' }} />,
  escalated: <ErrorOutlineIcon sx={{ fontSize: 16, color: '#ef4444' }} />,
  opted_out: <BlockIcon sx={{ fontSize: 16, color: '#94a3b8' }} />,
  status_changed: <SyncAltIcon sx={{ fontSize: 16, color: '#f59e0b' }} />,
};

const EVENT_LABELS: Record<OutreachEventType, string> = {
  template_sent: 'sent a message',
  message_received: 'replied',
  conversation_started: 'started a conversation',
  info_collected: 'provided info',
  escalated: 'was escalated',
  opted_out: 'opted out',
  status_changed: 'status changed',
};

function formatTimestamp(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const MAX_ITEMS = 20;

export default function RecentActivity({ events }: RecentActivityProps) {
  const sorted = [...events]
    .filter((e) => new Date(e.created_at).getTime() <= Date.now())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, MAX_ITEMS);

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
        Recent Activity
      </Typography>

      {sorted.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            No activity yet.
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {sorted.map((event, index) => {
            const guestName = event.details?.guest_name || 'Guest';
            return (
              <React.Fragment key={event.id}>
                <ListItem
                  disableGutters
                  sx={{ py: 1, px: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: '#F8F8F8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {EVENT_ICONS[event.event_type]}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#1a1a1a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                        {guestName}
                      </Typography>{' '}
                      {EVENT_LABELS[event.event_type]}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#94a3b8', flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    {formatTimestamp(event.created_at)}
                  </Typography>
                </ListItem>
                {index < sorted.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(0,0,0,0.04)' }} />
                )}
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Paper>
  );
}
