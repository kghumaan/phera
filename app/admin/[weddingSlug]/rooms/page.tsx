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
  TextField,
  IconButton,
  CircularProgress,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Hotel,
  CloudUpload,
  Add,
  Delete,
  Edit,
  Check,
  Close,
  AutoAwesome,
  PictureAsPdf,
  Image as ImageIcon,
  Description,
  LockOutlined,
  People,
} from '@mui/icons-material';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { roomsService, type WeddingRoom, type RoomDraft } from '@/lib/supabase/rooms-service';
import { weddingService } from '@/lib/supabase/wedding-service';
import { supabase } from '@/lib/supabase/client';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { PrimaryActionButton, SecondaryActionButton, IconActionButton } from '@/components/admin/ActionButton';
import { ErrorAlert, SuccessAlert } from '@/components/shared/Alert';
import { COLORS, RADII } from '@/lib/theme/tokens';

const MIN_GUESTS_FOR_ROOMS = 5;

interface ParsedRoom {
  room_number: string;
  floor: string | null;
  hotel_name: string | null;
  capacity: number | null;
  notes: string | null;
}

export default function RoomAssignmentsPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  const [rooms, setRooms] = useState<WeddingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultHotel, setDefaultHotel] = useState<string>('');

  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<RoomDraft>({ room_number: '' });
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState<RoomDraft>({ room_number: '' });
  const { isPro } = usePlan();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const router = useRouter();
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [navigatingToGuestList, setNavigatingToGuestList] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    const list = await roomsService.list(weddingSlug);
    setRooms(list);
    setLoading(false);
  }, [weddingSlug]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    (async () => {
      const { count } = await (supabase as any)
        .from('guests')
        .select('id', { count: 'exact', head: true })
        .eq('wedding_id', weddingSlug);
      setGuestCount(count ?? 0);
    })();
  }, [weddingSlug]);

  // Pull the wedding's primary venue as a hint for hotel_name when none is provided
  useEffect(() => {
    (async () => {
      const w = await weddingService.getWeddingBySlug(weddingSlug);
      if (w?.venue_name) setDefaultHotel(w.venue_name);
    })();
  }, [weddingSlug]);

  // ─── Upload + Parse ──────────────────────────────────────────

  const handleFiles = async (files: File[]) => {
    setParseError(null);
    setParseStatus(null);

    const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'csv', 'tsv', 'txt', 'xlsx', 'xls'];
    const valid = files.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext && allowed.includes(ext);
    });
    const skipped = files.length - valid.length;

    if (valid.length === 0) {
      setParseError('Unsupported file(s). Use PDF, PNG, JPG, WEBP, CSV, or XLSX.');
      return;
    }

    setParsing(true);
    let totalImported = 0;
    const failed: string[] = [];

    try {
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        setParseStatus(`Reading ${file.name} (${i + 1}/${valid.length})…`);
        try {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/rooms/parse', { method: 'POST', body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

          const parsed: ParsedRoom[] = data.rooms || [];
          if (parsed.length > 0) {
            setParseStatus(`Saving ${parsed.length} room${parsed.length === 1 ? '' : 's'} from ${file.name}…`);
            await roomsService.insertMany(weddingSlug, parsed);
            totalImported += parsed.length;
          } else {
            failed.push(file.name);
          }
        } catch (err: any) {
          failed.push(file.name);
        }
      }

      await loadRooms();

      if (totalImported === 0) {
        setParseError('No rooms detected in the uploaded file(s). Try clearer floorplans or lists.');
      } else {
        const parts = [
          `Imported ${totalImported} room${totalImported === 1 ? '' : 's'} from ${valid.length - failed.length} file${valid.length - failed.length === 1 ? '' : 's'}.`,
        ];
        if (failed.length) parts.push(`Skipped: ${failed.join(', ')}.`);
        if (skipped) parts.push(`${skipped} unsupported file${skipped === 1 ? '' : 's'} ignored.`);
        setParseStatus(parts.join(' '));
        setTimeout(() => setParseStatus(null), 4500);
      }
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) handleFiles(files);
  };

  // ─── Inline edit ─────────────────────────────────────────────

  const startEdit = (room: WeddingRoom) => {
    setEditingId(room.id);
    setEditDraft({
      room_number: room.room_number,
      floor: room.floor,
      hotel_name: room.hotel_name,
      capacity: room.capacity,
      notes: room.notes,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ room_number: '' });
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft.room_number?.trim()) return;
    const updated = await roomsService.update(editingId, editDraft);
    if (updated) {
      setRooms((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
      cancelEdit();
    }
  };

  const removeRoom = async (id: string) => {
    if (!confirm('Remove this room?')) return;
    const ok = await roomsService.remove(id);
    if (ok) setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  // ─── Manual add ──────────────────────────────────────────────

  const startAdd = () => {
    setAdding(true);
    setAddDraft({ room_number: '', hotel_name: defaultHotel || null });
  };

  const cancelAdd = () => {
    setAdding(false);
    setAddDraft({ room_number: '' });
  };

  const saveAdd = async () => {
    if (!addDraft.room_number?.trim()) return;
    const created = await roomsService.insertOne(weddingSlug, { ...addDraft, source: 'manual' });
    if (created) {
      await loadRooms();
      cancelAdd();
    }
  };

  const fileTypeIcon = (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <PictureAsPdf sx={{ fontSize: 14, color: COLORS.text.faint }} />
      <ImageIcon sx={{ fontSize: 14, color: COLORS.text.faint }} />
      <Description sx={{ fontSize: 14, color: COLORS.text.faint }} />
    </Stack>
  );

  // Non-Pro users see a locked preview (demo weddings bypass the gate).
  if (!isPro && !weddingSlug.startsWith('demo-')) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
                Room Assignments
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                Upload a floorplan and place guests into hotel rooms.
              </Typography>
            </Box>
            <PrimaryActionButton
              onClick={() => setUpgradeModalOpen(true)}
              sx={{ px: 3, py: 1, whiteSpace: 'nowrap' }}
            >
              Upgrade to Pro
            </PrimaryActionButton>
          </Box>

          <Typography variant="body2" sx={{ color: COLORS.text.subtle, lineHeight: 1.8, maxWidth: 680 }}>
            Assign your guests to hotel rooms by uploading a floorplan or a room list. We parse the document, extract every room, and let you drag-and-drop guests into place. Share a live view with family members so everyone knows who's where.
          </Typography>

          <Box sx={{ position: 'relative', borderRadius: RADII.md, overflow: 'hidden' }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                backdropFilter: 'blur(6px)',
                bgcolor: 'rgba(255,255,255,0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <LockOutlined sx={{ fontSize: 32, color: COLORS.brand.primary }} />
              <Typography variant="subtitle1" sx={{ color: COLORS.text.strong }}>
                Upgrade to unlock Room Assignments
              </Typography>
              <PrimaryActionButton
                onClick={() => setUpgradeModalOpen(true)}
                sx={{ px: 3, py: 1 }}
              >
                Upgrade to Pro
              </PrimaryActionButton>
            </Box>

            <Box sx={{ pointerEvents: 'none', userSelect: 'none', p: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: COLORS.border.light,
                  borderRadius: RADII.md,
                  bgcolor: COLORS.bg.white,
                }}
              >
                <Hotel sx={{ fontSize: 40, color: COLORS.brand.primary, mb: 1 }} />
                <Typography variant="subtitle1" sx={{ color: COLORS.text.strong, mb: 0.5 }}>
                  Drop a floorplan or room list
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                  PDF, PNG, JPG, CSV, or XLSX — we'll extract every room for you.
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Stack>

        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Box>
    );
  }

  if (guestCount !== null && guestCount < MIN_GUESTS_FOR_ROOMS) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
            Room Assignments
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, mt: 0.5 }}>
            Upload your hotel floorplan or room list and we&apos;ll parse it into a clean table you can edit.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: RADII.md,
            border: '1px solid rgba(0,0,0,0.07)',
            bgcolor: COLORS.bg.white,
            p: { xs: 4, md: 6 },
            textAlign: 'center',
          }}
        >
          <People sx={{ fontSize: 44, color: COLORS.brand.primary, mb: 1.5 }} />
          <Typography variant="subtitle1" sx={{ color: COLORS.text.strong, mb: 0.75 }}>
            Upload your guest list first
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, maxWidth: 460, mx: 'auto', mb: 2.5 }}>
            Once your guests are in — tagged by family, side, or group — we&apos;ll analyze your floorplan and place everyone thoughtfully.
          </Typography>
          <PrimaryActionButton
            startIcon={<People />}
            loading={navigatingToGuestList}
            onClick={() => {
              setNavigatingToGuestList(true);
              router.push(`/admin/${weddingSlug}/guest-list`);
            }}
            sx={{ px: 2.5, py: 1, minWidth: 180 }}
          >
            Go to Guest List
          </PrimaryActionButton>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header — matches other admin pages */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
          Room Assignments
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, mt: 0.5 }}>
          Upload your hotel floorplan or room list and we&apos;ll parse it into a clean table you can edit.
        </Typography>
      </Box>

      {/* Upload zone */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: RADII.md,
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: COLORS.bg.white,
          p: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !parsing && fileInputRef.current?.click()}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: parsing ? 'default' : 'pointer',
            bgcolor: dragOver ? 'rgba(222,63,94,0.04)' : COLORS.bg.muted,
            border: `2px dashed ${dragOver ? COLORS.brand.primary : 'rgba(0,0,0,0.12)'}`,
            borderRadius: RADII.md,
            m: 2,
            transition: 'all 0.2s',
            '&:hover': !parsing ? { borderColor: COLORS.brand.primary, bgcolor: 'rgba(222,63,94,0.02)' } : {},
          }}
        >
          {parsing ? (
            <Stack spacing={1.5} alignItems="center">
              <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
              <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.muted }}>{parseStatus}</Typography>
            </Stack>
          ) : (
            <>
              <CloudUpload sx={{ fontSize: 44, color: dragOver ? COLORS.brand.primary : COLORS.text.faint, mb: 1 }} />
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.strong, mb: 0.5 }}>
                Drag & drop your floorplans or room lists
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, mb: 1.5 }}>
                or click to browse — multiple files supported (PDF, PNG, JPG, CSV, or XLSX)
              </Typography>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: COLORS.text.faint }}>
                <AutoAwesome sx={{ fontSize: 14, color: COLORS.brand.primary }} />
                <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle }}>
                  AI extracts every room, floor, and hotel into the table below
                </Typography>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.tsv,.txt,.xlsx,.xls"
                onChange={(e) => { const arr = Array.from(e.target.files || []); if (arr.length) { handleFiles(arr); e.target.value = ''; } }}
              />
            </>
          )}
        </Box>
        {parseError && (
          <Box sx={{ mx: 2, mb: 2 }}>
            <ErrorAlert>{parseError}</ErrorAlert>
          </Box>
        )}
        {!parsing && parseStatus && !parseError && (
          <Box sx={{ mx: 2, mb: 2 }}>
            <SuccessAlert>{parseStatus}</SuccessAlert>
          </Box>
        )}
      </Paper>

      {/* Rooms table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: RADII.md,
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: COLORS.bg.white,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hotel sx={{ fontSize: 20, color: COLORS.text.strong }} />
            <Typography variant="subtitle1" sx={{ color: COLORS.text.strong }}>
              Available Rooms
            </Typography>
            <Chip
              label={loading ? '…' : rooms.length}
              size="small"
              sx={{ height: 20, fontSize: '0.875rem', fontWeight: 600, bgcolor: 'rgba(0,0,0,0.05)', color: COLORS.text.muted }}
            />
          </Box>
          <SecondaryActionButton
            size="small"
            startIcon={<Add />}
            onClick={startAdd}
            disabled={adding}
          >
            Add Room
          </SecondaryActionButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
          </Box>
        ) : rooms.length === 0 && !adding ? (
          <Box sx={{ py: 6, textAlign: 'center', px: 3 }}>
            <Hotel sx={{ fontSize: 40, color: COLORS.border.default, mb: 1.5 }} />
            <Typography variant="subtitle1" sx={{ color: COLORS.text.strong, mb: 0.5 }}>
              No rooms yet
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, maxWidth: 380, mx: 'auto' }}>
              Upload a floorplan or list above, or add rooms manually one at a time.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.bg.muted }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>Floor</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>Hotel</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>Capacity</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>Notes</TableCell>
                  <TableCell sx={{ width: 110 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Inline add row */}
                {adding && (
                  <TableRow sx={{ bgcolor: 'rgba(222,63,94,0.03)' }}>
                    <TableCell>
                      <TextField
                        autoFocus
                        size="small"
                        placeholder="e.g. 1207"
                        value={addDraft.room_number}
                        onChange={(e) => setAddDraft({ ...addDraft, room_number: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveAdd(); if (e.key === 'Escape') cancelAdd(); }}
                        sx={inlineFieldSx}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="12"
                        value={addDraft.floor || ''}
                        onChange={(e) => setAddDraft({ ...addDraft, floor: e.target.value })}
                        sx={inlineFieldSx}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder={defaultHotel || 'Optional'}
                        value={addDraft.hotel_name || ''}
                        onChange={(e) => setAddDraft({ ...addDraft, hotel_name: e.target.value })}
                        sx={inlineFieldSx}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="2"
                        value={addDraft.capacity ?? ''}
                        onChange={(e) => setAddDraft({ ...addDraft, capacity: e.target.value ? Number(e.target.value) : null })}
                        sx={inlineFieldSx}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Optional"
                        value={addDraft.notes || ''}
                        onChange={(e) => setAddDraft({ ...addDraft, notes: e.target.value })}
                        sx={inlineFieldSx}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Save">
                        <IconActionButton size="small" onClick={saveAdd} disabled={!addDraft.room_number?.trim()}>
                          <Check sx={{ fontSize: 18, color: COLORS.accent.success }} />
                        </IconActionButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton size="small" onClick={cancelAdd}>
                          <Close sx={{ fontSize: 18, color: COLORS.text.faint }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )}

                {rooms.map((room) => {
                  const isEditing = editingId === room.id;
                  return (
                    <TableRow key={room.id} hover sx={{ '&:hover .row-actions': { opacity: 1 } }}>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editDraft.room_number}
                            onChange={(e) => setEditDraft({ ...editDraft, room_number: e.target.value })}
                            sx={inlineFieldSx}
                          />
                        ) : (
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.strong }}>
                            {room.room_number}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editDraft.floor || ''}
                            onChange={(e) => setEditDraft({ ...editDraft, floor: e.target.value })}
                            sx={inlineFieldSx}
                          />
                        ) : (
                          <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.muted }}>{room.floor || '—'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editDraft.hotel_name || ''}
                            onChange={(e) => setEditDraft({ ...editDraft, hotel_name: e.target.value })}
                            sx={inlineFieldSx}
                          />
                        ) : (
                          <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.muted }}>
                            {room.hotel_name || (defaultHotel ? <span style={{ color: COLORS.text.faint }}>{defaultHotel}</span> : '—')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editDraft.capacity ?? ''}
                            onChange={(e) => setEditDraft({ ...editDraft, capacity: e.target.value ? Number(e.target.value) : null })}
                            sx={inlineFieldSx}
                          />
                        ) : (
                          <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.muted }}>{room.capacity ?? '—'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editDraft.notes || ''}
                            onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                            sx={inlineFieldSx}
                          />
                        ) : (
                          <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle }}>{room.notes || '—'}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <Stack direction="row" spacing={0} justifyContent="flex-end">
                            <Tooltip title="Save">
                              <IconActionButton size="small" onClick={saveEdit}>
                                <Check sx={{ fontSize: 18, color: COLORS.accent.success }} />
                              </IconActionButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" onClick={cancelEdit}>
                                <Close sx={{ fontSize: 18, color: COLORS.text.faint }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Box className="row-actions" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => startEdit(room)}>
                                <Edit sx={{ fontSize: 16, color: COLORS.text.subtle }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <IconActionButton size="small" onClick={() => removeRoom(room.id)} spinnerColor={COLORS.text.faint}>
                                <Delete sx={{ fontSize: 16, color: COLORS.text.faint }} />
                              </IconActionButton>
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
      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </Box>
  );
}

const inlineFieldSx = {
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
