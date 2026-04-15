'use client';

import {
  Box,
  Button,
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
  Alert,
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
} from '@mui/icons-material';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { roomsService, type WeddingRoom, type RoomDraft } from '@/lib/supabase/rooms-service';
import { weddingService } from '@/lib/supabase/wedding-service';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';

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

  const loadRooms = useCallback(async () => {
    setLoading(true);
    const list = await roomsService.list(weddingSlug);
    setRooms(list);
    setLoading(false);
  }, [weddingSlug]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Pull the wedding's primary venue as a hint for hotel_name when none is provided
  useEffect(() => {
    (async () => {
      const w = await weddingService.getWeddingBySlug(weddingSlug);
      if (w?.venue_name) setDefaultHotel(w.venue_name);
    })();
  }, [weddingSlug]);

  // ─── Upload + Parse ──────────────────────────────────────────

  const handleFile = async (file: File) => {
    setParseError(null);
    setParseStatus(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'csv', 'tsv', 'txt', 'xlsx', 'xls'];
    if (!ext || !allowed.includes(ext)) {
      setParseError('Unsupported file. Use PDF, PNG, JPG, WEBP, CSV, or XLSX.');
      return;
    }

    setParsing(true);
    setParseStatus('Reading floorplan…');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/rooms/parse', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const parsed: ParsedRoom[] = data.rooms || [];
      if (parsed.length === 0) {
        setParseError('No rooms detected in this file. Try a clearer floorplan or list.');
        return;
      }

      setParseStatus(`Saving ${parsed.length} room${parsed.length === 1 ? '' : 's'}…`);
      await roomsService.insertMany(weddingSlug, parsed);
      await loadRooms();
      setParseStatus(`Imported ${parsed.length} room${parsed.length === 1 ? '' : 's'}.`);
      setTimeout(() => setParseStatus(null), 3500);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
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
      <PictureAsPdf sx={{ fontSize: 14, color: '#9a9a9a' }} />
      <ImageIcon sx={{ fontSize: 14, color: '#9a9a9a' }} />
      <Description sx={{ fontSize: 14, color: '#9a9a9a' }} />
    </Stack>
  );

  // Non-Pro users see a locked preview (demo weddings bypass the gate).
  if (!isPro && !weddingSlug.startsWith('demo-')) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Room Assignments
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Upload a floorplan and place guests into hotel rooms.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => setUpgradeModalOpen(true)}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Upgrade to Pro
            </Button>
          </Box>

          <Typography variant="body2" sx={{ color: '#6a6a6a', lineHeight: 1.8, maxWidth: 680 }}>
            Assign your guests to hotel rooms by uploading a floorplan or a room list. We parse the document, extract every room, and let you drag-and-drop guests into place. Share a live view with family members so everyone knows who's where.
          </Typography>

          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
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
              <LockOutlined sx={{ fontSize: 32, color: '#DE3F5E' }} />
              <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1rem' }}>
                Upgrade to unlock Room Assignments
              </Typography>
              <Button
                variant="contained"
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#c73552' },
                }}
              >
                Upgrade to Pro
              </Button>
            </Box>

            <Box sx={{ pointerEvents: 'none', userSelect: 'none', p: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: 'rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  bgcolor: 'white',
                }}
              >
                <Hotel sx={{ fontSize: 40, color: '#DE3F5E', mb: 1 }} />
                <Typography sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                  Drop a floorplan or room list
                </Typography>
                <Typography sx={{ color: '#6a6a6a', fontSize: '0.875rem' }}>
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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header — matches other admin pages */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          Room Assignments
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#6a6a6a', mt: 0.5 }}>
          Upload your hotel floorplan or room list and we&apos;ll parse it into a clean table you can edit.
        </Typography>
      </Box>

      {/* Upload zone */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: 'white',
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
            bgcolor: dragOver ? 'rgba(222,63,94,0.04)' : '#FAFAFA',
            border: `2px dashed ${dragOver ? '#DE3F5E' : 'rgba(0,0,0,0.12)'}`,
            borderRadius: '12px',
            m: 2,
            transition: 'all 0.2s',
            '&:hover': !parsing ? { borderColor: '#DE3F5E', bgcolor: 'rgba(222,63,94,0.02)' } : {},
          }}
        >
          {parsing ? (
            <Stack spacing={1.5} alignItems="center">
              <CircularProgress size={28} sx={{ color: '#DE3F5E' }} />
              <Typography sx={{ fontSize: 13, color: '#4a4a4a' }}>{parseStatus}</Typography>
            </Stack>
          ) : (
            <>
              <CloudUpload sx={{ fontSize: 44, color: dragOver ? '#DE3F5E' : '#9a9a9a', mb: 1 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                Drag & drop your floorplan or room list
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6a6a6a', mb: 1.5 }}>
                or click to browse — PDF, PNG, JPG, CSV, or XLSX
              </Typography>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: '#9a9a9a' }}>
                <AutoAwesome sx={{ fontSize: 14, color: '#DE3F5E' }} />
                <Typography sx={{ fontSize: 11, color: '#6a6a6a' }}>
                  AI extracts every room, floor, and hotel into the table below
                </Typography>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.tsv,.txt,.xlsx,.xls"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }}
              />
            </>
          )}
        </Box>
        {parseError && (
          <Alert severity="error" sx={{ mx: 2, mb: 2, borderRadius: '10px' }} onClose={() => setParseError(null)}>
            {parseError}
          </Alert>
        )}
        {!parsing && parseStatus && !parseError && (
          <Alert severity="success" sx={{ mx: 2, mb: 2, borderRadius: '10px' }} onClose={() => setParseStatus(null)}>
            {parseStatus}
          </Alert>
        )}
      </Paper>

      {/* Rooms table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: 'white',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hotel sx={{ fontSize: 20, color: '#1a1a1a' }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>
              Available Rooms
            </Typography>
            <Chip
              label={loading ? '…' : rooms.length}
              size="small"
              sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: 'rgba(0,0,0,0.05)', color: '#4a4a4a' }}
            />
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={startAdd}
            disabled={adding}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'rgba(0,0,0,0.15)',
              color: '#1a1a1a',
              '&:hover': { borderColor: '#DE3F5E', bgcolor: 'rgba(222,63,94,0.04)', color: '#DE3F5E' },
            }}
          >
            Add Room
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: '#DE3F5E' }} />
          </Box>
        ) : rooms.length === 0 && !adding ? (
          <Box sx={{ py: 6, textAlign: 'center', px: 3 }}>
            <Hotel sx={{ fontSize: 40, color: '#cbd5e1', mb: 1.5 }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a', mb: 0.5 }}>
              No rooms yet
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#6a6a6a', maxWidth: 380, mx: 'auto' }}>
              Upload a floorplan or list above, or add rooms manually one at a time.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#1a1a1a' }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#1a1a1a' }}>Floor</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#1a1a1a' }}>Hotel</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#1a1a1a' }}>Capacity</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#1a1a1a' }}>Notes</TableCell>
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
                        <IconButton size="small" onClick={saveAdd} disabled={!addDraft.room_number?.trim()}>
                          <Check sx={{ fontSize: 18, color: '#22c55e' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton size="small" onClick={cancelAdd}>
                          <Close sx={{ fontSize: 18, color: '#9a9a9a' }} />
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
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
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
                          <Typography sx={{ fontSize: 13, color: '#4a4a4a' }}>{room.floor || '—'}</Typography>
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
                          <Typography sx={{ fontSize: 13, color: '#4a4a4a' }}>
                            {room.hotel_name || (defaultHotel ? <span style={{ color: '#9a9a9a' }}>{defaultHotel}</span> : '—')}
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
                          <Typography sx={{ fontSize: 13, color: '#4a4a4a' }}>{room.capacity ?? '—'}</Typography>
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
                          <Typography sx={{ fontSize: 13, color: '#6a6a6a' }}>{room.notes || '—'}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <Stack direction="row" spacing={0} justifyContent="flex-end">
                            <Tooltip title="Save">
                              <IconButton size="small" onClick={saveEdit}>
                                <Check sx={{ fontSize: 18, color: '#22c55e' }} />
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
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => startEdit(room)}>
                                <Edit sx={{ fontSize: 16, color: '#6a6a6a' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <IconButton size="small" onClick={() => removeRoom(room.id)}>
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
      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </Box>
  );
}

const inlineFieldSx = {
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
