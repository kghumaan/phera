'use client';

import { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import { Close, Reply, Send, PendingOutlined, CheckCircleOutline } from '@mui/icons-material';
import {
  broadcastsService,
  type ConciergeBroadcast,
  type BroadcastRecipient,
} from '@/lib/supabase/broadcasts-service';

interface BroadcastDetailDrawerProps {
  broadcastId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function BroadcastDetailDrawer({ broadcastId, open, onClose }: BroadcastDetailDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [broadcast, setBroadcast] = useState<ConciergeBroadcast | null>(null);
  const [recipients, setRecipients] = useState<
    Array<BroadcastRecipient & { guest_name: string | null; guest_phone: string | null }>
  >([]);

  useEffect(() => {
    if (!open || !broadcastId) return;
    setLoading(true);
    (async () => {
      const [b, r] = await Promise.all([
        broadcastsService.get(broadcastId),
        broadcastsService.getRecipients(broadcastId),
      ]);
      setBroadcast(b);
      setRecipients(r);
      setLoading(false);
    })();
  }, [open, broadcastId]);

  const replied = recipients.filter((r) => !!r.replied_at);
  const pending = recipients.filter((r) => !r.replied_at);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, bgcolor: 'white' } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>Broadcast detail</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#6a6a6a' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={28} sx={{ color: '#DE3F5E' }} />
        </Box>
      ) : broadcast ? (
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          <Stack spacing={2.5}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: '#F8F8F8',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <Typography sx={{ fontSize: '0.95rem', color: '#1a1a1a', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {broadcast.message}
              </Typography>
              <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
                <Chip
                  label={broadcast.target_type === 'all' ? 'All guests' : broadcast.target_type === 'tags' ? `Tags: ${broadcast.target_tags.join(', ')}` : 'Specific guests'}
                  size="small"
                  sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.1)', color: '#4a4a4a', fontWeight: 600, fontSize: '0.72rem' }}
                />
                {broadcast.collects_data && (
                  <Chip
                    icon={<Reply sx={{ fontSize: 14 }} />}
                    label={`Collecting: ${broadcast.data_schema.map((f) => f.label).join(', ')}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(222,63,94,0.1)',
                      color: '#DE3F5E',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      '& .MuiChip-icon': { color: '#DE3F5E' },
                    }}
                  />
                )}
              </Stack>
            </Paper>

            <Stack direction="row" spacing={1.5}>
              <StatChip icon={<Send sx={{ fontSize: 14 }} />} label={`${broadcast.sent_count} sent`} />
              <StatChip icon={<Reply sx={{ fontSize: 14 }} />} label={`${replied.length} replied`} />
              <StatChip icon={<PendingOutlined sx={{ fontSize: 14 }} />} label={`${pending.length} pending`} />
            </Stack>

            <Divider />

            {replied.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a1a', mb: 1.25 }}>
                  Replies
                </Typography>
                <Stack spacing={1}>
                  {replied.map((r) => (
                    <ReplyRow key={r.id} recipient={r} schema={broadcast.data_schema} />
                  ))}
                </Stack>
              </Box>
            )}

            {pending.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a1a', mb: 1.25 }}>
                  Awaiting reply
                </Typography>
                <Stack spacing={0.75}>
                  {pending.map((r) => (
                    <Box
                      key={r.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.25,
                        borderRadius: 1,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: 'white',
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#1a1a1a', fontWeight: 500 }}>
                          {r.guest_name || 'Unnamed guest'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9a9a9a' }}>
                          {r.guest_phone || '—'}
                        </Typography>
                      </Box>
                      <Chip
                        label={r.delivery_status}
                        size="small"
                        sx={{
                          bgcolor:
                            r.delivery_status === 'failed'
                              ? 'rgba(222,63,94,0.1)'
                              : r.delivery_status === 'read' || r.delivery_status === 'delivered'
                              ? 'rgba(16,185,129,0.1)'
                              : '#F8F8F8',
                          color:
                            r.delivery_status === 'failed'
                              ? '#DE3F5E'
                              : r.delivery_status === 'read' || r.delivery_status === 'delivered'
                              ? '#10B981'
                              : '#4a4a4a',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 20,
                          textTransform: 'capitalize',
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      ) : null}
    </Drawer>
  );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        p: 1.25,
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.07)',
        bgcolor: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
      }}
    >
      <Box sx={{ color: '#6a6a6a', display: 'inline-flex' }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.82rem', color: '#1a1a1a', fontWeight: 600 }}>{label}</Typography>
    </Paper>
  );
}

function ReplyRow({
  recipient,
  schema,
}: {
  recipient: BroadcastRecipient & { guest_name: string | null; guest_phone: string | null };
  schema: Array<{ key: string; label: string; type: string }>;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.07)',
        bgcolor: 'white',
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography sx={{ fontSize: '0.88rem', color: '#1a1a1a', fontWeight: 600 }}>
              {recipient.guest_name || 'Unnamed guest'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9a9a9a' }}>
              {recipient.guest_phone || '—'}
            </Typography>
          </Box>
          <CheckCircleOutline sx={{ fontSize: 18, color: '#10B981' }} />
        </Stack>
        <Typography sx={{ fontSize: '0.82rem', color: '#4a4a4a', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {recipient.reply_text}
        </Typography>
        {schema.length > 0 && recipient.collected_data && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {schema.map((f) => (
              <Chip
                key={f.key}
                label={`${f.label}: ${recipient.collected_data?.[f.key] ?? '—'}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(222,63,94,0.08)',
                  color: '#DE3F5E',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
