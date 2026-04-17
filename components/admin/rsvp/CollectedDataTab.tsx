'use client';

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
  guests: { name: string | null; phone: string | null } | null;
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
          .select('id, broadcast_id, guest_id, replied_at, reply_text, collected_data, guests(name, phone)')
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
                        fontSize: '0.7rem',
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
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: COLORS.text.strong }}>Guest</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: COLORS.text.strong }}>Reply</TableCell>
                      {b.data_schema.map((f) => (
                        <TableCell key={f.key} sx={{ fontWeight: 600, fontSize: '0.78rem', color: COLORS.text.strong }}>
                          {f.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem', color: COLORS.text.strong, fontWeight: 600 }}>
                            {r.guests?.name || 'Unnamed'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.text.faint }}>
                            {r.guests?.phone || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.82rem', color: COLORS.text.muted, whiteSpace: 'pre-wrap' }}>
                            {r.reply_text || '—'}
                          </Typography>
                        </TableCell>
                        {b.data_schema.map((f) => (
                          <TableCell key={f.key}>
                            <Typography sx={{ fontSize: '0.82rem', color: COLORS.text.strong }}>
                              {r.collected_data?.[f.key] ?? '—'}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
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
