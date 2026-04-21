'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { supabase } from '@/lib/supabase/client';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface CollectedDataTabProps {
  weddingSlug: string;
}

interface BroadcastRow {
  id: string;
  message: string;
  data_schema: Array<{ key: string; label: string; type: string }>;
  collects_data: boolean;
  created_at: string;
}

interface RecipientRow {
  id: string;
  broadcast_id: string;
  guest_id: string;
  replied_at: string | null;
  reply_text: string | null;
  collected_data: Record<string, any> | null;
  guests: {
    name: string | null;
    phone: string | null;
    initials: string | null;
    avatar_color: string | null;
  } | null;
}

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|heic|heif)(\?|$)/i;

function isImageUrl(s: string): boolean {
  if (!/^https?:\/\//i.test(s)) return false;
  if (IMAGE_EXT.test(s)) return true;
  // WhatsApp / Whapi media endpoints often omit ext; treat any whapi / media host as image by default.
  return /whapi|whatsapp|media|image/i.test(s);
}

function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

export default function CollectedDataTab({ weddingSlug }: CollectedDataTabProps) {
  const [loading, setLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState<BroadcastRow[]>([]);
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: bs } = await (supabase as any)
        .from('concierge_broadcasts')
        .select('id, message, data_schema, collects_data, created_at')
        .eq('wedding_id', weddingSlug)
        .eq('collects_data', true)
        .order('created_at', { ascending: false });

      const bList = (bs || []) as BroadcastRow[];
      setBroadcasts(bList);

      if (bList.length > 0) {
        const ids = bList.map((b) => b.id);
        const { data: rs } = await (supabase as any)
          .from('concierge_broadcast_recipients')
          .select('id, broadcast_id, guest_id, replied_at, reply_text, collected_data, guests(name, phone, initials, avatar_color)')
          .in('broadcast_id', ids);
        setRecipients((rs || []) as RecipientRow[]);
      } else {
        setRecipients([]);
      }
      setLoading(false);
    })();
  }, [weddingSlug]);

  const activeBroadcasts = useMemo(() => {
    if (selectedBroadcastId === 'all') return broadcasts;
    return broadcasts.filter((b) => b.id === selectedBroadcastId);
  }, [broadcasts, selectedBroadcastId]);

  const visibleRecipients = useMemo(() => {
    const ids = new Set(activeBroadcasts.map((b) => b.id));
    return recipients.filter((r) => ids.has(r.broadcast_id) && (r.replied_at || r.reply_text));
  }, [recipients, activeBroadcasts]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  if (broadcasts.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 1,
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: COLORS.bg.white,
          textAlign: 'center',
          m: 3,
        }}
      >
        <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 0.5 }}>
          No collected data yet
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.muted, maxWidth: 480, mx: 'auto' }}>
          When you send a Concierge broadcast with data collection enabled, replies show up here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Box>
            <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '0.95rem' }}>
              Collected data
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
              Replies to your broadcasts with data collection enabled.
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel sx={{ color: COLORS.text.muted, fontWeight: 500, '&.Mui-focused': { color: COLORS.brand.primary } }}>
              Broadcast
            </InputLabel>
            <Select
              value={selectedBroadcastId}
              onChange={(e) => setSelectedBroadcastId(e.target.value as string)}
              label="Broadcast"
              sx={{
                bgcolor: COLORS.bg.white,
                borderRadius: RADII.md,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.23)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand.primary },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand.primary },
              }}
            >
              <MenuItem value="all">All broadcasts</MenuItem>
              {broadcasts.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.message.slice(0, 60)}
                  {b.message.length > 60 ? '…' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {activeBroadcasts.map((b) => {
          const rows = visibleRecipients.filter((r) => r.broadcast_id === b.id);
          return (
            <Paper
              key={b.id}
              elevation={0}
              sx={{
                borderRadius: 1,
                border: '1px solid rgba(0,0,0,0.07)',
                bgcolor: COLORS.bg.white,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid rgba(0,0,0,0.06)', bgcolor: COLORS.bg.muted }}>
                <Typography sx={{ fontSize: '0.88rem', color: COLORS.text.strong, fontWeight: 600, mb: 0.5 }}>
                  {b.message.slice(0, 120)}
                  {b.message.length > 120 ? '…' : ''}
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  {b.data_schema.map((f) => (
                    <Chip
                      key={f.key}
                      label={f.label}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(222,63,94,0.08)',
                        color: COLORS.brand.primary,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        height: 20,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
              {rows.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                    No replies yet for this broadcast.
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: COLORS.bg.muted }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>Guest</TableCell>
                      {b.data_schema.map((f) => {
                        const filled = rows.filter((r) => {
                          const v = r.collected_data?.[f.key];
                          return v != null && String(v).trim() !== '';
                        }).length;
                        return (
                          <TableCell key={f.key} sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <span>{f.label}</span>
                              <Chip
                                label={`${filled}/${rows.length}`}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.875rem',
                                  fontWeight: 700,
                                  bgcolor: filled === rows.length ? 'rgba(16,185,129,0.1)' : 'rgba(222,63,94,0.08)',
                                  color: filled === rows.length ? COLORS.accent.success : COLORS.brand.primary,
                                  '& .MuiChip-label': { px: 0.75 },
                                }}
                              />
                            </Stack>
                          </TableCell>
                        );
                      })}
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>Exact Reply</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r) => {
                      const guestName = r.guests?.name || 'Unnamed';
                      const initials =
                        r.guests?.initials ||
                        guestName
                          .split(' ')
                          .map((p) => p[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();
                      return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                bgcolor: r.guests?.avatar_color || COLORS.brand.primary,
                                color: COLORS.text.inverse,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.strong, fontWeight: 600 }}>
                                {guestName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: COLORS.text.faint }}>
                                {r.guests?.phone || '—'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        {b.data_schema.map((f) => {
                          const val = r.collected_data?.[f.key];
                          const isUrl = typeof val === 'string' && /^https?:\/\//.test(val);
                          const fieldHint = `${f.key} ${f.label} ${f.type}`.toLowerCase();
                          const expectsImage = /image|photo|picture|passport|scan|id|visa|ticket/.test(fieldHint);
                          return (
                            <TableCell key={f.key}>
                              {val == null || val === '' ? (
                                <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.faint }}>—</Typography>
                              ) : isUrl && expectsImage ? (
                                <Box
                                  component="a"
                                  href={val}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{
                                    display: 'inline-block',
                                    width: 56,
                                    height: 56,
                                    borderRadius: 0,
                                    overflow: 'hidden',
                                    bgcolor: COLORS.bg.muted,
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={val}
                                    alt={f.label}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </Box>
                              ) : isUrl ? (
                                <Typography
                                  component="a"
                                  href={val}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ fontSize: '0.875rem', color: COLORS.brand.primary, fontWeight: 500, textDecoration: 'underline' }}
                                >
                                  Open
                                </Typography>
                              ) : (
                                <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.strong, fontWeight: 500 }}>
                                  {String(val)}
                                </Typography>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          {r.reply_text ? (
                            <Stack spacing={0.75} sx={{ maxWidth: 260 }}>
                              {r.reply_text.split('\n').map((line, i) => {
                                const s = line.trim();
                                if (!s) return null;
                                if (isUrl(s) && isImageUrl(s)) {
                                  return (
                                    <Box
                                      key={i}
                                      component="a"
                                      href={s}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{
                                        display: 'inline-block',
                                        width: 48,
                                        height: 48,
                                        borderRadius: 0,
                                        overflow: 'hidden',
                                        bgcolor: COLORS.bg.muted,
                                      }}
                                    >
                                      <Box
                                        component="img"
                                        src={s}
                                        alt="Guest reply"
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    </Box>
                                  );
                                }
                                if (isUrl(s)) {
                                  return (
                                    <Typography
                                      key={i}
                                      component="a"
                                      href={s}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ fontSize: '0.875rem', color: COLORS.brand.primary, textDecoration: 'underline' }}
                                    >
                                      Open attachment
                                    </Typography>
                                  );
                                }
                                return (
                                  <Typography key={i} sx={{ fontSize: '0.875rem', color: COLORS.text.muted, whiteSpace: 'pre-wrap' }}>
                                    {s}
                                  </Typography>
                                );
                              })}
                            </Stack>
                          ) : (
                            <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.faint }}>—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
