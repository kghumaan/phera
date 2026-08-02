'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { Campaign, Add, Reply, OpenInNew } from '@mui/icons-material';
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

// Compact reply-rate doughnut shown per broadcast row. Total = replies over recipients.
function RepliesDoughnut({ replied, total }: { replied: number; total: number }) {
  const pct = total > 0 ? Math.min(1, replied / total) : 0;
  const size = 44;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={COLORS.brand.primary}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS.text.strong, lineHeight: 1 }}>
          {replied}/{total}
        </Typography>
      </Box>
    </Box>
  );
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

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const list = await broadcastsService.list(weddingSlug);
    setBroadcasts(list);
    if (!opts?.silent) setLoading(false);
  }, [weddingSlug]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll for new replies / delivery updates while admin is on this tab.
  // Pauses when tab is hidden so we don't burn requests in the background.
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (cancelled) return;
      load({ silent: true });
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);


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
            Broadcast Messages
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
                            fontSize: '0.875rem',
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
                        fontSize: '0.875rem',
                        height: 22,
                      }}
                    />
                  </Stack>
                </Stack>

                <Divider sx={{ borderColor: 'rgba(0,0,0,0.05)' }} />

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <RepliesDoughnut replied={b.replied_count} total={b.recipient_count} />
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '0.88rem', lineHeight: 1.2 }}>
                      {b.replied_count} {b.replied_count === 1 ? 'reply' : 'replies'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                      of {b.recipient_count} {b.recipient_count === 1 ? 'guest' : 'guests'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }} />
                  <Typography
                    variant="caption"
                    sx={{ color: COLORS.text.faint, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                  >
                    View details <OpenInNew sx={{ fontSize: 14 }} />
                  </Typography>
                </Stack>
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
