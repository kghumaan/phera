'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  LinearProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { Campaign, Add, Send, Reply, PendingOutlined, OpenInNew } from '@mui/icons-material';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import BroadcastComposer from './BroadcastComposer';
import BroadcastDetailDrawer from './BroadcastDetailDrawer';
import {
  broadcastsService,
  type BroadcastWithProgress,
} from '@/lib/supabase/broadcasts-service';

interface ConciergeBroadcastsProps {
  weddingId: string;
  weddingSlug: string;
  isViewOnly: boolean;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function ConciergeBroadcasts({
  weddingId,
  weddingSlug,
  isViewOnly,
}: ConciergeBroadcastsProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await broadcastsService.list(weddingSlug);
    setBroadcasts(list);
    setLoading(false);
  }, [weddingSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalSent = broadcasts.reduce((s, b) => s + b.sent_count, 0);
    const totalReplies = broadcasts.reduce((s, b) => s + b.replied_count, 0);
    const totalRecipients = broadcasts.reduce((s, b) => s + b.recipient_count, 0);
    return { totalSent, totalReplies, totalRecipients, count: broadcasts.length };
  }, [broadcasts]);

  return (
    <Stack spacing={3}>
      {/* Top row: intro + new broadcast CTA */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1rem' }}>
            Broadcasts
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 0.25 }}>
            Send WhatsApp messages to your guests. Optionally collect structured replies.
          </Typography>
        </Box>
        <PrimaryActionButton
          startIcon={<Add />}
          onClick={() => setComposerOpen(true)}
          disabled={isViewOnly}
          sx={{ px: 2.5, py: 1 }}
        >
          New Broadcast
        </PrimaryActionButton>
      </Box>

      {/* Stats strip */}
      {broadcasts.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[
            { label: 'Broadcasts sent', value: stats.count },
            { label: 'Messages delivered', value: stats.totalSent },
            { label: 'Replies received', value: stats.totalReplies },
          ].map((s) => (
            <Paper
              key={s.label}
              elevation={0}
              sx={{
                flex: '1 1 160px',
                minWidth: 160,
                p: 2,
                borderRadius: 1,
                border: '1px solid rgba(0,0,0,0.07)',
                bgcolor: COLORS.bg.white,
              }}
            >
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.text.strong, lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 0.5 }}>
                {s.label}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
        </Box>
      ) : broadcasts.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.07)',
            bgcolor: COLORS.bg.white,
            textAlign: 'center',
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: RADII.md,
                bgcolor: '#DE3F5E12',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Campaign sx={{ fontSize: 26, color: COLORS.brand.primary }} />
            </Box>
            <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1rem' }}>
              No broadcasts yet
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, maxWidth: 440, lineHeight: 1.55 }}>
              Send your first update, reminder, or data-collection prompt. You can target everyone, specific tags, or hand-picked guests.
            </Typography>
          </Stack>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {broadcasts.map((b) => (
            <Paper
              key={b.id}
              elevation={0}
              onClick={() => setDetailId(b.id)}
              sx={{
                p: 2.5,
                borderRadius: 1,
                border: '1px solid rgba(0,0,0,0.07)',
                bgcolor: COLORS.bg.white,
                cursor: 'pointer',
                transition: 'all 0.18s',
                '&:hover': {
                  borderColor: 'rgba(222,63,94,0.35)',
                  bgcolor: 'rgba(222,63,94,0.02)',
                },
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
                  <Typography
                    sx={{
                      fontSize: '0.95rem',
                      color: COLORS.text.strong,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      flex: 1,
                    }}
                  >
                    {b.message}
                  </Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexShrink={0}>
                    {b.collects_data && (
                      <Tooltip title="Data collection enabled">
                        <Chip
                          icon={<Reply sx={{ fontSize: 14 }} />}
                          label="Collects data"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(222,63,94,0.1)',
                            color: COLORS.brand.primary,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 22,
                            '& .MuiChip-icon': { color: COLORS.brand.primary },
                          }}
                        />
                      </Tooltip>
                    )}
                    <Chip
                      label={
                        b.status === 'sending'
                          ? 'Sending…'
                          : b.status === 'failed'
                          ? 'Failed'
                          : b.sent_at
                          ? formatRelative(b.sent_at)
                          : 'Draft'
                      }
                      size="small"
                      sx={{
                        bgcolor:
                          b.status === 'failed'
                            ? 'rgba(222,63,94,0.1)'
                            : b.status === 'sending'
                            ? 'rgba(0,0,0,0.05)'
                            : COLORS.bg.subtle,
                        color: b.status === 'failed' ? COLORS.brand.primary : COLORS.text.muted,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 22,
                      }}
                    />
                  </Stack>
                </Stack>

                <Divider sx={{ borderColor: 'rgba(0,0,0,0.05)' }} />

                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    <Send sx={{ fontSize: 14, color: COLORS.text.subtle }} />
                    <Typography variant="body2" sx={{ color: COLORS.text.muted, fontSize: '0.8rem' }}>
                      {b.sent_count} / {b.recipient_count} sent
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    <Reply sx={{ fontSize: 14, color: COLORS.text.subtle }} />
                    <Typography variant="body2" sx={{ color: COLORS.text.muted, fontSize: '0.8rem' }}>
                      {b.replied_count} replied
                    </Typography>
                  </Box>
                  {b.recipient_count > b.replied_count && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                      <PendingOutlined sx={{ fontSize: 14, color: COLORS.text.subtle }} />
                      <Typography variant="body2" sx={{ color: COLORS.text.muted, fontSize: '0.8rem' }}>
                        {b.recipient_count - b.replied_count} pending
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ flex: 1 }} />
                  <Typography
                    variant="caption"
                    sx={{ color: COLORS.text.faint, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                  >
                    View details <OpenInNew sx={{ fontSize: 12 }} />
                  </Typography>
                </Stack>

                {b.recipient_count > 0 && (
                  <LinearProgress
                    variant="determinate"
                    value={(b.replied_count / b.recipient_count) * 100}
                    sx={{
                      height: 5,
                      borderRadius: 999,
                      bgcolor: 'rgba(0,0,0,0.05)',
                      '& .MuiLinearProgress-bar': { bgcolor: COLORS.brand.primary, borderRadius: 999 },
                    }}
                  />
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <BroadcastComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        weddingId={weddingId}
        weddingSlug={weddingSlug}
        onSent={() => {
          setComposerOpen(false);
          load();
        }}
      />

      <BroadcastDetailDrawer
        broadcastId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </Stack>
  );
}
