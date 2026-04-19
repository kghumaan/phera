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
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
} from '@mui/material';
import { Add, People, Upload, Delete, LocalOffer } from '@mui/icons-material';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { weddingService } from '@/lib/supabase/wedding-service';
import GuestImportWizard from '@/components/admin/guests/GuestImportWizard';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { getTagColor } from '@/lib/utils/tag-color';

type SideValue = 'bride' | 'groom' | 'both' | null;

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  wedding_side: SideValue;
  logistics_data: any;
  initials: string | null;
  avatar_color: string | null;
  created_at: string;
}

type EditableField = 'name' | 'email' | 'phone' | 'side' | 'tag';

interface CellEdit {
  guestId: string;
  field: EditableField;
}

export default function GuestListPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  // Which single cell is currently being edited. null when nothing is edited.
  const [editing, setEditing] = useState<CellEdit | null>(null);
  // Working value for the active cell; kept in local state so blur commits
  // the latest value without extra round-trips.
  const [draft, setDraft] = useState<string>('');
  // Prevent double-save if both blur + Enter fire.
  const committingRef = useRef(false);

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

  // ─── Cell editing ────────────────────────────────────────────

  const beginEdit = (guest: Guest, field: EditableField) => {
    if (editing) return; // one cell at a time
    let initial = '';
    if (field === 'name') initial = guest.name || '';
    else if (field === 'email') initial = guest.email && !guest.email.includes('@phera.io') ? guest.email : '';
    else if (field === 'phone') initial = guest.phone || '';
    else if (field === 'side') initial = guest.wedding_side || '';
    else if (field === 'tag') initial = guest.logistics_data?.tag || '';
    setDraft(initial);
    setEditing({ guestId: guest.id, field });
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft('');
    committingRef.current = false;
  };

  const commitEdit = async (overrideValue?: string) => {
    if (!editing || committingRef.current) return;
    committingRef.current = true;

    const guest = guests.find((g) => g.id === editing.guestId);
    if (!guest) {
      cancelEdit();
      return;
    }

    const value = overrideValue !== undefined ? overrideValue : draft;
    const field = editing.field;

    // No-op detection so we don't write on every blur of an unchanged cell.
    let unchanged = false;
    if (field === 'name') unchanged = (value || '').trim() === (guest.name || '').trim();
    else if (field === 'email') {
      const current = guest.email && !guest.email.includes('@phera.io') ? guest.email : '';
      unchanged = (value || '').trim() === current.trim();
    } else if (field === 'phone') unchanged = (value || '').trim() === (guest.phone || '').trim();
    else if (field === 'side') unchanged = (value || '') === (guest.wedding_side || '');
    else if (field === 'tag') unchanged = (value || '').trim() === (guest.logistics_data?.tag || '').trim();

    if (unchanged) {
      cancelEdit();
      return;
    }

    // Build the update payload scoped to this field only
    const updates: Record<string, any> = {};
    const optimistic: Partial<Guest> = {};

    if (field === 'name') {
      const name = (value || '').trim();
      if (!name) {
        // Don't allow empty name — just cancel
        cancelEdit();
        return;
      }
      updates.name = name;
      optimistic.name = name;
    } else if (field === 'email') {
      const email = (value || '').trim().toLowerCase();
      updates.email = email || null;
      optimistic.email = email || null;
    } else if (field === 'phone') {
      const phone = (value || '').trim();
      updates.phone = phone || null;
      optimistic.phone = phone || null;
    } else if (field === 'side') {
      const side = (['bride', 'groom', 'both'] as const).find((s) => s === value) || null;
      updates.wedding_side = side;
      optimistic.wedding_side = side;
    } else if (field === 'tag') {
      const tag = (value || '').trim();
      const nextLogistics = { ...(guest.logistics_data || {}) };
      if (tag) nextLogistics.tag = tag;
      else delete nextLogistics.tag;
      updates.logistics_data = nextLogistics;
      optimistic.logistics_data = nextLogistics;
    }

    const { error } = await (supabase as any).from('guests').update(updates).eq('id', editing.guestId);

    if (error) {
      console.error('guest update error:', error);
      committingRef.current = false;
      return;
    }

    setGuests((prev) => prev.map((g) => (g.id === editing.guestId ? { ...g, ...optimistic } : g)));
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

  // ─── Render helpers ──────────────────────────────────────────

  const sideChipColor = (side: SideValue) => {
    if (side === 'bride') return { bg: 'rgba(222, 63, 94, 0.1)', fg: COLORS.side.bride };
    if (side === 'groom') return { bg: 'rgba(59, 130, 246, 0.1)', fg: COLORS.side.groom };
    if (side === 'both') return { bg: 'rgba(139, 92, 246, 0.1)', fg: COLORS.side.both };
    return { bg: 'rgba(0, 0, 0, 0.05)', fg: COLORS.text.subtle };
  };

  const isEditing = (g: Guest, field: EditableField) =>
    editing?.guestId === g.id && editing.field === field;

  const EDIT_HINT = { cursor: 'pointer', userSelect: 'none' as const };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
            Guest List
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 0.5 }}>
            Import, tag, and manage every guest invited to your wedding. Double-click any field to edit.
          </Typography>
        </Box>
        <PrimaryActionButton
          startIcon={<Upload />}
          onClick={() => setImportOpen(true)}
          sx={{ px: 2.5, py: 1, width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}
        >
          Import Guests
        </PrimaryActionButton>
      </Box>

      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: RADII.md,
          border: `1px solid ${COLORS.brand.primaryBorder}`,
          bgcolor: COLORS.brand.primaryWash,
          p: 2,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
        }}
      >
        <LocalOffer sx={{ fontSize: 18, color: COLORS.brand.primary, mt: 0.25, flexShrink: 0 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, mb: 0.25 }}>
            Tag your guests as you import
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.55 }}>
            Tags (family, bride-side, groom-side, college-friends, etc.) power smarter room assignments, targeted WhatsApp groups, and tailored concierge replies.
          </Typography>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: RADII.md,
          border: `1px solid ${COLORS.border.faint}`,
          bgcolor: COLORS.bg.white,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 2, borderBottom: `1px solid ${COLORS.border.faint}` }}>
          <People sx={{ fontSize: 20, color: COLORS.text.strong }} />
          <Typography variant="subtitle1" sx={{ color: COLORS.text.strong }}>All Guests</Typography>
          <Chip
            label={loading ? '…' : guests.length}
            size="small"
            sx={{ fontSize: '0.875rem', fontWeight: 600, bgcolor: 'rgba(0,0,0,0.05)', color: COLORS.text.muted }}
          />
          {existingTags.length > 0 && (
            <Typography variant="body2" sx={{ color: COLORS.text.faint, ml: 1 }}>
              · {existingTags.length} tag{existingTags.length === 1 ? '' : 's'} in use
            </Typography>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
          </Box>
        ) : guests.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', px: 3 }}>
            <People sx={{ fontSize: 40, color: COLORS.border.default, mb: 1.5 }} />
            <Typography variant="subtitle1" sx={{ color: COLORS.text.strong, mb: 0.5 }}>
              No guests yet
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle, maxWidth: 380, mx: 'auto', mb: 2 }}>
              Import a spreadsheet, vCard, or add guests manually to get started.
            </Typography>
            <SecondaryActionButton
              startIcon={<Add />}
              onClick={() => setImportOpen(true)}
            >
              Import Guests
            </SecondaryActionButton>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
            <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 960 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.bg.muted }}>
                  <TableCell sx={{ ...headerCell, width: 220 }}>Guest</TableCell>
                  <TableCell sx={{ ...headerCell, width: 240 }}>Email</TableCell>
                  <TableCell sx={{ ...headerCell, width: 180 }}>Phone</TableCell>
                  <TableCell sx={{ ...headerCell, width: 110 }}>Side</TableCell>
                  <TableCell sx={{ ...headerCell, width: 'auto' }}>Tag</TableCell>
                  <TableCell sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {guests.map((g) => {
                  const tag = g.logistics_data?.tag || '';
                  const cleanEmail = g.email && !g.email.includes('@phera.io') ? g.email : '';

                  return (
                    <TableRow key={g.id} hover sx={{ '&:hover .row-actions': { opacity: 1 } }}>
                      {/* Name */}
                      <TableCell
                        onDoubleClick={() => beginEdit(g, 'name')}
                        sx={{ ...EDIT_HINT }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              bgcolor: g.avatar_color || COLORS.brand.primary,
                              color: COLORS.text.inverse,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {g.initials || g.name.slice(0, 2).toUpperCase()}
                          </Box>
                          {isEditing(g, 'name') ? (
                            <TextField
                              autoFocus
                              size="small"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onBlur={() => commitEdit()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              sx={{ ...selectSx, flex: 1, minWidth: 0 }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</Typography>
                          )}
                        </Stack>
                      </TableCell>

                      {/* Email */}
                      <TableCell
                        onDoubleClick={() => beginEdit(g, 'email')}
                        sx={{ ...bodyCell, ...EDIT_HINT }}
                      >
                        {isEditing(g, 'email') ? (
                          <TextField
                            autoFocus
                            size="small"
                            type="email"
                            value={draft}
                            placeholder="email@example.com"
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={() => commitEdit()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            sx={{ ...selectSx, width: '100%' }}
                          />
                        ) : (
                          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cleanEmail || <span style={{ color: COLORS.text.faint }}>—</span>}
                          </Box>
                        )}
                      </TableCell>

                      {/* Phone */}
                      <TableCell
                        onDoubleClick={() => beginEdit(g, 'phone')}
                        sx={{ ...bodyCell, ...EDIT_HINT }}
                      >
                        {isEditing(g, 'phone') ? (
                          <TextField
                            autoFocus
                            size="small"
                            value={draft}
                            placeholder="+1 415 555 1234"
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={() => commitEdit()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            sx={{ ...selectSx, width: '100%' }}
                          />
                        ) : (
                          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {g.phone || <span style={{ color: COLORS.text.faint }}>—</span>}
                          </Box>
                        )}
                      </TableCell>

                      {/* Side */}
                      <TableCell
                        onDoubleClick={() => beginEdit(g, 'side')}
                        sx={{ ...EDIT_HINT }}
                      >
                        {isEditing(g, 'side') ? (
                          <FormControl size="small" sx={{ width: '100%' }}>
                            <Select
                              autoFocus
                              open
                              value={draft}
                              onChange={(e) => {
                                const v = e.target.value as string;
                                setDraft(v);
                                commitEdit(v);
                              }}
                              onBlur={() => commitEdit()}
                              onClose={() => setTimeout(() => commitEdit(), 0)}
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
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              bgcolor: sideChipColor(g.wedding_side).bg,
                              color: sideChipColor(g.wedding_side).fg,
                            }}
                          />
                        ) : (
                          <span style={{ color: COLORS.text.faint }}>—</span>
                        )}
                      </TableCell>

                      {/* Tag */}
                      <TableCell
                        onDoubleClick={() => beginEdit(g, 'tag')}
                        sx={{ ...EDIT_HINT }}
                      >
                        {isEditing(g, 'tag') ? (
                          <Autocomplete
                            freeSolo
                            size="small"
                            options={existingTags}
                            value={draft}
                            onChange={(_, v) => {
                              const s = (v as string) || '';
                              setDraft(s);
                              commitEdit(s);
                            }}
                            onInputChange={(_, v) => setDraft(v || '')}
                            onBlur={() => commitEdit()}
                            sx={{ width: '100%' }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                autoFocus
                                placeholder="e.g. Priya's Friends"
                                size="small"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                sx={selectSx}
                              />
                            )}
                          />
                        ) : tag ? (() => {
                          const c = getTagColor(tag);
                          return (
                            <Chip
                              label={tag}
                              size="small"
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                bgcolor: c.bg,
                                color: c.fg,
                                border: `1px solid ${c.border}`,
                              }}
                            />
                          );
                        })() : (
                          <span style={{ color: COLORS.text.faint }}>—</span>
                        )}
                      </TableCell>

                      {/* Delete */}
                      <TableCell align="right">
                        <Box className="row-actions" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => removeGuest(g.id)}>
                              <Delete sx={{ fontSize: 16, color: COLORS.text.faint }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

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

const headerCell = { fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong, bgcolor: COLORS.bg.muted } as const;
const bodyCell = { fontSize: '0.875rem', color: COLORS.text.muted } as const;
const selectSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.sm,
    bgcolor: COLORS.bg.white,
    fontSize: '0.875rem',
    '& input': { py: 0.75, fontSize: '0.875rem', color: COLORS.text.strong },
    '& fieldset': { borderColor: COLORS.border.default },
    '&:hover fieldset': { borderColor: COLORS.brand.primary },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary, borderWidth: '1.5px' },
  },
};
