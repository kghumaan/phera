'use client';

import {
  Box,
  Typography,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import { Add, People, Upload, Edit, Save, Close, Delete } from '@mui/icons-material';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { weddingService } from '@/lib/supabase/wedding-service';
import GuestImportWizard from '@/components/admin/guests/GuestImportWizard';

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  wedding_side: 'bride' | 'groom' | 'both' | null;
  logistics_data: any;
  initials: string | null;
  avatar_color: string | null;
  created_at: string;
}

export default function GuestListPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTag, setEditTag] = useState('');
  const [editSide, setEditSide] = useState<'bride' | 'groom' | 'both' | ''>('');

  // ─── Load ────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    const wedding = await weddingService.getWeddingBySlug(weddingSlug);
    if (wedding) setWeddingId(wedding.id);

    const { data, error } = await (supabase as any)
      .from('guests')
      .select('id, name, email, phone, wedding_side, logistics_data, initials, avatar_color, created_at')
      .eq('wedding_id', weddingSlug)
      .order('created_at', { ascending: false });

    if (error) console.error('guests load error:', error);
    setGuests((data || []) as Guest[]);
    setLoading(false);
  }, [weddingSlug]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Derived: unique tags across this wedding ──────────────

  const existingTags = useMemo(() => {
    const set = new Set<string>();
    for (const g of guests) {
      const t = g.logistics_data?.tag;
      if (typeof t === 'string' && t.trim()) set.add(t.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [guests]);

  // ─── Edit ────────────────────────────────────────────────────

  const startEdit = (g: Guest) => {
    setEditingId(g.id);
    setEditTag(g.logistics_data?.tag || '');
    setEditSide((g.wedding_side as any) || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTag('');
    setEditSide('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const guest = guests.find((x) => x.id === editingId);
    if (!guest) return;

    const nextLogistics = {
      ...(guest.logistics_data || {}),
      tag: editTag.trim() || undefined,
    };
    // Clean undefined keys so we don't store them
    if (!nextLogistics.tag) delete nextLogistics.tag;

    const { error } = await (supabase as any)
      .from('guests')
      .update({
        wedding_side: editSide || null,
        logistics_data: nextLogistics,
      })
      .eq('id', editingId);

    if (error) {
      console.error('guest update error:', error);
      return;
    }

    setGuests((prev) =>
      prev.map((g) =>
        g.id === editingId
          ? { ...g, wedding_side: (editSide || null) as Guest['wedding_side'], logistics_data: nextLogistics }
          : g,
      ),
    );
    cancelEdit();
  };

  const removeGuest = async (id: string) => {
    if (!confirm('Remove this guest?')) return;
    const { error } = await (supabase as any).from('guests').delete().eq('id', id);
    if (error) {
      console.error('guest delete error:', error);
      return;
    }
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  // ─── Render ──────────────────────────────────────────────────

  const sideChipColor = (side: Guest['wedding_side']) => {
    if (side === 'bride') return { bg: 'rgba(222, 63, 94, 0.1)', fg: '#DE3F5E' };
    if (side === 'groom') return { bg: 'rgba(59, 130, 246, 0.1)', fg: '#3b82f6' };
    if (side === 'both') return { bg: 'rgba(139, 92, 246, 0.1)', fg: '#8b5cf6' };
    return { bg: 'rgba(0, 0, 0, 0.05)', fg: '#6a6a6a' };
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            Guest List
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6a6a6a', mt: 0.5 }}>
            Import, tag, and manage every guest invited to your wedding.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Upload />}
          onClick={() => setImportOpen(true)}
          sx={{
            bgcolor: '#DE3F5E',
            color: 'white',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 2.5,
            py: 1,
            '&:hover': { bgcolor: '#C8365A' },
          }}
        >
          Import Guests
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: 'white',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <People sx={{ fontSize: 20, color: '#1a1a1a' }} />
          <Typography sx={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>All Guests</Typography>
          <Chip
            label={loading ? '…' : guests.length}
            size="small"
            sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: 'rgba(0,0,0,0.05)', color: '#4a4a4a' }}
          />
          {existingTags.length > 0 && (
            <Typography sx={{ fontSize: 11, color: '#9a9a9a', ml: 1 }}>
              · {existingTags.length} tag{existingTags.length === 1 ? '' : 's'} in use
            </Typography>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: '#DE3F5E' }} />
          </Box>
        ) : guests.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', px: 3 }}>
            <People sx={{ fontSize: 40, color: '#cbd5e1', mb: 1.5 }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a', mb: 0.5 }}>
              No guests yet
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#6a6a6a', maxWidth: 380, mx: 'auto', mb: 2 }}>
              Import a spreadsheet, vCard, or add guests manually to get started.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setImportOpen(true)}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                borderColor: 'rgba(0,0,0,0.15)',
                color: '#1a1a1a',
                '&:hover': { borderColor: '#DE3F5E', bgcolor: 'rgba(222,63,94,0.04)', color: '#DE3F5E' },
              }}
            >
              Import Guests
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                  <TableCell sx={headerCell}>Guest</TableCell>
                  <TableCell sx={headerCell}>Email</TableCell>
                  <TableCell sx={headerCell}>Phone</TableCell>
                  <TableCell sx={headerCell}>Side</TableCell>
                  <TableCell sx={headerCell}>Tag</TableCell>
                  <TableCell sx={{ width: 100 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {guests.map((g) => {
                  const isEditing = editingId === g.id;
                  const tag = g.logistics_data?.tag || '';
                  return (
                    <TableRow key={g.id} hover sx={{ '&:hover .row-actions': { opacity: 1 } }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              bgcolor: g.avatar_color || '#DE3F5E',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {g.initials || g.name.slice(0, 2).toUpperCase()}
                          </Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{g.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={bodyCell}>{g.email && !g.email.includes('@phera.io') ? g.email : '—'}</TableCell>
                      <TableCell sx={bodyCell}>{g.phone || '—'}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <FormControl size="small" sx={{ minWidth: 110 }}>
                            <Select
                              value={editSide}
                              onChange={(e) => setEditSide(e.target.value as any)}
                              sx={selectSx}
                            >
                              <MenuItem value="">—</MenuItem>
                              <MenuItem value="bride">Bride</MenuItem>
                              <MenuItem value="groom">Groom</MenuItem>
                              <MenuItem value="both">Both</MenuItem>
                            </Select>
                          </FormControl>
                        ) : g.wedding_side ? (
                          <Chip
                            label={g.wedding_side[0].toUpperCase() + g.wedding_side.slice(1)}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: sideChipColor(g.wedding_side).bg,
                              color: sideChipColor(g.wedding_side).fg,
                            }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: 12, color: '#9a9a9a' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Autocomplete
                            freeSolo
                            size="small"
                            options={existingTags}
                            value={editTag}
                            onChange={(_, v) => setEditTag((v as string) || '')}
                            onInputChange={(_, v) => setEditTag(v || '')}
                            sx={{ minWidth: 200 }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="e.g. Priya's Friends"
                                size="small"
                                sx={selectSx}
                              />
                            )}
                          />
                        ) : tag ? (
                          <Chip
                            label={tag}
                            size="small"
                            sx={{ height: 20, fontSize: 11, fontWeight: 500, bgcolor: 'rgba(0, 0, 0, 0.05)', color: '#1a1a1a' }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: 12, color: '#9a9a9a' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <Stack direction="row" justifyContent="flex-end">
                            <Tooltip title="Save">
                              <IconButton size="small" onClick={saveEdit}>
                                <Save sx={{ fontSize: 18, color: '#22c55e' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" onClick={cancelEdit}>
                                <Close sx={{ fontSize: 18, color: '#9a9a9a' }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Box className="row-actions" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                            <Tooltip title="Edit tag / side">
                              <IconButton size="small" onClick={() => startEdit(g)}>
                                <Edit sx={{ fontSize: 16, color: '#6a6a6a' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <IconButton size="small" onClick={() => removeGuest(g.id)}>
                                <Delete sx={{ fontSize: 16, color: '#9a9a9a' }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Import wizard */}
      {weddingId && (
        <GuestImportWizard
          open={importOpen}
          onClose={() => setImportOpen(false)}
          weddingId={weddingId}
          weddingSlug={weddingSlug}
          onImportComplete={load}
        />
      )}
    </Box>
  );
}

const headerCell = { fontWeight: 600, fontSize: 12, color: '#1a1a1a', bgcolor: '#FAFAFA' } as const;
const bodyCell = { fontSize: 12, color: '#4a4a4a' } as const;
const selectSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    bgcolor: 'white',
    fontSize: '0.85rem',
    '& input': { py: 0.75, fontSize: '0.85rem', color: '#1a1a1a' },
    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
    '&:hover fieldset': { borderColor: '#DE3F5E' },
    '&.Mui-focused fieldset': { borderColor: '#DE3F5E', borderWidth: '1.5px' },
  },
};
