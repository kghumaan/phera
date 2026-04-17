'use client';

import {
  Box,
  Typography,
  Stack,
  Paper,
  IconButton,
  CircularProgress,
  Tooltip,
  Chip,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Hotel,
  CloudUpload,
  Add,
  Delete,
  Edit,
  Close,
  AutoAwesome,
  PictureAsPdf,
  Image as ImageIcon,
  Description,
  LockOutlined,
  People,
  KingBed,
  GroupAdd,
} from '@mui/icons-material';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { roomsService, type WeddingRoom, type RoomDraft } from '@/lib/supabase/rooms-service';
import { weddingService } from '@/lib/supabase/wedding-service';
import { supabase } from '@/lib/supabase/client';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraMenu, PheraMenuItem } from '@/components/shared/Menu';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { PrimaryActionButton, SecondaryActionButton, IconActionButton } from '@/components/admin/ActionButton';
import { ErrorAlert, SuccessAlert } from '@/components/shared/Alert';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { COLORS, RADII } from '@/lib/theme/tokens';

const MIN_GUESTS_FOR_ROOMS = 5;

interface ParsedRoom {
  room_number: string;
  floor: string | null;
  hotel_name: string | null;
  bed_type: string | null;
  capacity: number | null;
  notes: string | null;
}

interface GuestLite {
  id: string;
  name: string | null;
  wedding_side: 'bride' | 'groom' | 'both' | null;
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
  const [guests, setGuests] = useState<GuestLite[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignStatus, setAssignStatus] = useState<string | null>(null);
  const [editRoomId, setEditRoomId] = useState<string | null>(null);

  // Drag-and-drop state for slot-to-slot guest moves/swaps.
  // Stored in a ref so re-renders during drag don't stutter; the draggedKey
  // piece of state just drives the subtle ghost styling on the source slot.
  const dragRef = useRef<{ roomId: string; index: number; guestId: string } | null>(null);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  // Add-guest menu anchor + room context.
  const [addGuestAnchor, setAddGuestAnchor] = useState<HTMLElement | null>(null);
  const [addGuestRoomId, setAddGuestRoomId] = useState<string | null>(null);

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
      const { data } = await (supabase as any)
        .from('guests')
        .select('id, name, wedding_side')
        .eq('wedding_id', weddingSlug)
        .order('created_at', { ascending: true });
      setGuests(((data ?? []) as GuestLite[]));
      setGuestCount(data?.length ?? 0);
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

  // ─── Auto-assignment ─────────────────────────────────────────
  const handleAutoAssign = async () => {
    setAssigning(true);
    setAssignError(null);
    setAssignStatus(null);
    try {
      const res = await fetch('/api/rooms/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAssignError(data.error || 'Auto-assign failed');
        return;
      }
      setAssignStatus(`Placed ${data.assignedCount} of ${data.totalGuests} guests into ${data.roomsUpdated} rooms.`);
      await loadRooms();
      setTimeout(() => setAssignStatus(null), 4500);
    } catch (err: any) {
      setAssignError(err?.message || 'Auto-assign failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleClearAssignments = async () => {
    if (!confirm('Clear all current guest-to-room placements?')) return;
    const ok = await roomsService.clearAllAssignments(weddingSlug);
    if (ok) await loadRooms();
  };

  // Add a still-unplaced guest into a room. Bumps capacity by 1 automatically
  // so the new slot is counted — the user implicitly said "this room can fit
  // one more" by clicking Add Guest.
  const handleAddGuestToRoom = async (roomId: string, guestId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const newAssigned = [...(room.assigned_guest_ids ?? []), guestId];
    const newCapacity = Math.max((room.capacity ?? 0), newAssigned.length);

    // Optimistic state update.
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, assigned_guest_ids: newAssigned, capacity: newCapacity }
          : r,
      ),
    );
    setAddGuestAnchor(null);
    setAddGuestRoomId(null);

    const { error } = await (supabase as any)
      .from('wedding_rooms')
      .update({ assigned_guest_ids: newAssigned, capacity: newCapacity })
      .eq('id', roomId);
    if (error) {
      console.error('Error adding guest to room:', error);
      await loadRooms();
    }
  };

  const handleStartOver = async () => {
    if (!confirm('Remove every room and all placements? This cannot be undone.')) return;
    const ok = await roomsService.removeAll(weddingSlug);
    if (ok) {
      setAssignStatus(null);
      setAssignError(null);
      await loadRooms();
    }
  };

  // Drop a dragged guest onto a (room, slot) target. Swaps with the existing
  // guest in that slot, or moves into the empty slot if the target is open.
  // Persists each affected room.
  const handleSlotDrop = async (toRoomId: string, toIndex: number) => {
    const src = dragRef.current;
    dragRef.current = null;
    setDraggedKey(null);
    setDropTargetKey(null);
    if (!src) return;
    if (src.roomId === toRoomId && src.index === toIndex) return;

    const next = rooms.map((r) => ({ ...r, assigned_guest_ids: [...(r.assigned_guest_ids ?? [])] }));
    const srcRoom = next.find((r) => r.id === src.roomId);
    const tgtRoom = next.find((r) => r.id === toRoomId);
    if (!srcRoom || !tgtRoom) return;

    const srcList = srcRoom.assigned_guest_ids;
    const tgtList = tgtRoom.assigned_guest_ids;

    // Guard: someone else may have already moved the source guest.
    if (srcList[src.index] !== src.guestId) return;

    if (src.roomId === toRoomId) {
      // Same-room move/swap.
      if (toIndex < tgtList.length) {
        // Swap two filled positions.
        [tgtList[src.index], tgtList[toIndex]] = [tgtList[toIndex], tgtList[src.index]];
      } else {
        // Move to empty trailing slot — just reorder to the end.
        const [moved] = tgtList.splice(src.index, 1);
        tgtList.push(moved);
      }
    } else {
      // Cross-room.
      if (toIndex < tgtList.length) {
        // Swap with target's existing guest.
        const tgtGuest = tgtList[toIndex];
        tgtList[toIndex] = src.guestId;
        srcList[src.index] = tgtGuest;
      } else {
        // Target slot is empty. Reject if target is already at capacity.
        const cap = tgtRoom.capacity ?? 0;
        if (cap > 0 && tgtList.length >= cap) {
          setAssignError(`Room ${tgtRoom.room_number} is full.`);
          setTimeout(() => setAssignError(null), 2500);
          return;
        }
        srcList.splice(src.index, 1);
        tgtList.push(src.guestId);
      }
    }

    // Optimistic UI.
    setRooms(next);

    // Persist affected rooms. Same room → 1 write; different rooms → 2 parallel.
    const touched = new Set<string>([src.roomId, toRoomId]);
    const results = await Promise.all(
      Array.from(touched).map((rid) => {
        const r = next.find((x) => x.id === rid);
        return r ? roomsService.setAssignments(rid, r.assigned_guest_ids) : null;
      }),
    );
    const failed = results.some((r) => r === null);
    if (failed) {
      // Reload to re-sync with server state.
      setAssignError('Failed to save move — reloading.');
      await loadRooms();
      setTimeout(() => setAssignError(null), 2500);
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

      {/* Rooms grid */}
      {(() => {
        const guestIndexById = new Map<string, number>();
        guests.forEach((g, i) => guestIndexById.set(g.id, i + 1));
        const guestById = new Map<string, GuestLite>();
        guests.forEach((g) => guestById.set(g.id, g));
        const editingRoom = rooms.find((r) => r.id === editRoomId) || null;

        return (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Hotel sx={{ fontSize: 20, color: COLORS.text.strong }} />
                <Typography variant="subtitle1" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                  Available Rooms
                </Typography>
                <Chip
                  label={loading ? '…' : rooms.length}
                  size="small"
                  sx={{ height: 20, fontSize: '0.875rem', fontWeight: 600, bgcolor: 'rgba(0,0,0,0.05)', color: COLORS.text.muted }}
                />
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {rooms.length > 0 && guests.length > 0 && (
                  <PrimaryActionButton
                    size="small"
                    startIcon={<GroupAdd />}
                    onClick={handleAutoAssign}
                    loading={assigning}
                    sx={{ px: 2, py: 0.75 }}
                  >
                    Place All Guests
                  </PrimaryActionButton>
                )}
                {rooms.some((r) => (r.assigned_guest_ids?.length ?? 0) > 0) && (
                  <SecondaryActionButton size="small" onClick={handleClearAssignments}>
                    Clear Assignments
                  </SecondaryActionButton>
                )}
                <SecondaryActionButton
                  size="small"
                  startIcon={<Add />}
                  onClick={startAdd}
                  disabled={adding}
                >
                  Add Room
                </SecondaryActionButton>
                {rooms.length > 0 && (
                  <SecondaryActionButton
                    size="small"
                    startIcon={<Delete />}
                    onClick={handleStartOver}
                  >
                    Start Over
                  </SecondaryActionButton>
                )}
              </Stack>
            </Box>

            {assignError && (
              <Box sx={{ mb: 2 }}>
                <ErrorAlert>{assignError}</ErrorAlert>
              </Box>
            )}
            {assignStatus && !assignError && (
              <Box sx={{ mb: 2 }}>
                <SuccessAlert>{assignStatus}</SuccessAlert>
              </Box>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
              </Box>
            ) : rooms.length === 0 && !adding ? (
              <Paper
                elevation={0}
                sx={{
                  py: 6,
                  textAlign: 'center',
                  px: 3,
                  borderRadius: RADII.md,
                  border: '1px solid rgba(0,0,0,0.07)',
                  bgcolor: COLORS.bg.white,
                }}
              >
                <Hotel sx={{ fontSize: 40, color: COLORS.border.default, mb: 1.5 }} />
                <Typography variant="subtitle1" sx={{ color: COLORS.text.strong, mb: 0.5 }}>
                  No rooms yet
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, maxWidth: 380, mx: 'auto' }}>
                  Upload a floorplan or list above, or add rooms manually one at a time.
                </Typography>
              </Paper>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(220px, 1fr))', md: 'repeat(auto-fill, minmax(240px, 1fr))' },
                  gap: 2,
                }}
              >
                {rooms.map((room) => {
                  const cap = room.capacity ?? 0;
                  const assigned = room.assigned_guest_ids ?? [];
                  const slots = Math.max(cap, assigned.length);
                  return (
                    <Paper
                      key={room.id}
                      elevation={0}
                      sx={{
                        position: 'relative',
                        p: 2,
                        borderRadius: RADII.md,
                        border: '1px solid rgba(0,0,0,0.08)',
                        bgcolor: COLORS.bg.white,
                        transition: 'all 0.15s',
                        '&:hover': {
                          borderColor: 'rgba(222,63,94,0.35)',
                          boxShadow: '0 2px 14px rgba(0,0,0,0.04)',
                          '& .card-actions': { opacity: 1 },
                        },
                      }}
                    >
                      {/* Hover actions */}
                      <Box
                        className="card-actions"
                        sx={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 0.25, opacity: 0, transition: 'opacity 0.15s' }}
                      >
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { startEdit(room); setEditRoomId(room.id); }} sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
                            <Edit sx={{ fontSize: 14, color: COLORS.text.subtle }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => removeRoom(room.id)} sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
                            <Delete sx={{ fontSize: 14, color: COLORS.text.faint }} />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Stack spacing={1.25}>
                        {/* Room number + floor */}
                        <Box>
                          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.text.strong, lineHeight: 1.1 }}>
                            {room.room_number}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: COLORS.text.subtle, mt: 0.25 }}>
                            {[room.floor ? `Floor ${room.floor}` : null, room.hotel_name || defaultHotel]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </Typography>
                        </Box>

                        {/* Bed type + capacity summary */}
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                          {room.bed_type && (
                            <Chip
                              size="small"
                              icon={<KingBed sx={{ fontSize: 12 }} />}
                              label={room.bed_type}
                              sx={{
                                height: 22,
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                bgcolor: 'rgba(222,63,94,0.08)',
                                color: COLORS.brand.primary,
                                '& .MuiChip-icon': { color: COLORS.brand.primary, ml: 0.5 },
                              }}
                            />
                          )}
                          {cap > 0 && (
                            <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.subtle }}>
                              {assigned.length}/{cap} placed
                            </Typography>
                          )}
                        </Stack>

                        {/* Capacity slots — full-width rows like outlined buttons */}
                        <Stack spacing={0.75}>
                            {Array.from({ length: slots }).map((_, i) => {
                              const gid = assigned[i];
                              const g = gid ? guestById.get(gid) : null;
                              const num = gid ? guestIndexById.get(gid) : null;
                              const side = g?.wedding_side;
                              const tint =
                                side === 'bride'
                                  ? 'rgba(236,72,153,0.10)'
                                  : side === 'groom'
                                  ? 'rgba(59,130,246,0.10)'
                                  : side === 'both'
                                  ? 'rgba(168,85,247,0.10)'
                                  : 'rgba(0,0,0,0.04)';
                              const borderColor =
                                side === 'bride'
                                  ? 'rgba(236,72,153,0.35)'
                                  : side === 'groom'
                                  ? 'rgba(59,130,246,0.35)'
                                  : side === 'both'
                                  ? 'rgba(168,85,247,0.35)'
                                  : 'rgba(0,0,0,0.12)';
                              const slotKey = `${room.id}:${i}`;
                              const isDragged = draggedKey === slotKey;
                              const isDropTarget = dropTargetKey === slotKey;
                              return (
                                <Box
                                  key={i}
                                  draggable={!!gid}
                                  onDragStart={(e) => {
                                    if (!gid || !g) return;
                                    dragRef.current = { roomId: room.id, index: i, guestId: gid };
                                    setDraggedKey(slotKey);
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', gid);

                                    // Build a styled drag preview that physically
                                    // tracks the cursor — mirrors the slot's tint,
                                    // gets a shadow + slight rotation for lift.
                                    const srcEl = e.currentTarget as HTMLElement;
                                    const rect = srcEl.getBoundingClientRect();
                                    const ghost = document.createElement('div');
                                    ghost.style.cssText = [
                                      'position: fixed',
                                      'top: -9999px',
                                      'left: -9999px',
                                      `width: ${rect.width}px`,
                                      'min-height: 36px',
                                      'padding: 6px 12px',
                                      `border-radius: ${RADII.sm}px`,
                                      `background: ${tint || 'rgba(222,63,94,0.12)'}`,
                                      `border: 1px solid ${borderColor}`,
                                      'box-shadow: 0 14px 28px rgba(0,0,0,0.22), 0 6px 10px rgba(0,0,0,0.12)',
                                      'display: flex',
                                      'align-items: center',
                                      'gap: 8px',
                                      'font-family: inherit',
                                      'font-size: 12.8px',
                                      'font-weight: 600',
                                      `color: ${COLORS.text.strong}`,
                                      'transform: rotate(-1.5deg)',
                                      'white-space: nowrap',
                                      'overflow: hidden',
                                      'pointer-events: none',
                                    ].join(';');
                                    ghost.innerHTML = `<span style="color:${COLORS.brand.primary};font-size:11.2px;font-weight:700;min-width:20px;">#${num}</span><span style="overflow:hidden;text-overflow:ellipsis;">${(g.name || 'Unnamed guest').replace(/</g, '&lt;')}</span>`;
                                    document.body.appendChild(ghost);
                                    const offsetX = Math.min(e.clientX - rect.left, rect.width - 20);
                                    const offsetY = Math.min(e.clientY - rect.top, 30);
                                    e.dataTransfer.setDragImage(ghost, offsetX, offsetY);
                                    // Remove the node after the browser has snapshotted it.
                                    setTimeout(() => ghost.remove(), 0);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedKey(null);
                                    setDropTargetKey(null);
                                  }}
                                  onDragOver={(e) => {
                                    if (!dragRef.current) return;
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                    if (dropTargetKey !== slotKey) setDropTargetKey(slotKey);
                                  }}
                                  onDragLeave={() => {
                                    if (dropTargetKey === slotKey) setDropTargetKey(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleSlotDrop(room.id, i);
                                  }}
                                  sx={{
                                    width: '100%',
                                    minHeight: 36,
                                    px: 1.25,
                                    py: 0.5,
                                    borderRadius: RADII.sm,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    bgcolor: isDragged
                                      ? 'transparent'
                                      : isDropTarget
                                      ? 'rgba(222,63,94,0.12)'
                                      : g
                                      ? tint
                                      : 'transparent',
                                    border: isDragged
                                      ? `1px dashed ${COLORS.border.default}`
                                      : isDropTarget
                                      ? `1px solid ${COLORS.brand.primary}`
                                      : g
                                      ? `1px solid ${borderColor}`
                                      : `1px dashed ${COLORS.border.default}`,
                                    cursor: g ? 'grab' : 'default',
                                    transition: 'background-color 0.12s, border-color 0.12s',
                                    userSelect: 'none',
                                    '&:active': g ? { cursor: 'grabbing' } : {},
                                    '& > *': isDragged ? { visibility: 'hidden' } : {},
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      color: g ? COLORS.brand.primary : COLORS.text.faint,
                                      minWidth: 20,
                                    }}
                                  >
                                    {g ? `#${num}` : `${i + 1}.`}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: '0.8rem',
                                      fontWeight: g ? 600 : 400,
                                      color: g ? COLORS.text.strong : COLORS.text.faint,
                                      fontStyle: g ? 'normal' : 'italic',
                                      flex: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    {g ? g.name || 'Unnamed guest' : 'Empty'}
                                  </Typography>
                                </Box>
                              );
                            })}

                          {/* Add guest button — dashed call-to-action that
                              mirrors the schedule page's "Add Minor Event".
                              Opens a menu of still-unplaced guests. Selecting
                              one auto-bumps the room capacity by 1. */}
                          <Box
                            onClick={(e) => {
                              setAddGuestRoomId(room.id);
                              setAddGuestAnchor(e.currentTarget as HTMLElement);
                            }}
                            sx={{
                              width: '100%',
                              minHeight: 36,
                              px: 1.25,
                              py: 0.5,
                              borderRadius: RADII.sm,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.75,
                              bgcolor: COLORS.border.light,
                              border: '1px dashed #BCBCBC',
                              cursor: 'pointer',
                              transition: 'all 0.12s',
                              '&:hover': {
                                bgcolor: COLORS.border.default,
                                borderColor: COLORS.text.faint,
                              },
                            }}
                          >
                            <Add sx={{ fontSize: 14, color: COLORS.text.muted }} />
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: COLORS.text.muted }}>
                              Add Guest
                            </Typography>
                          </Box>
                        </Stack>

                        {slots === 0 && (
                          <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.faint, fontStyle: 'italic' }}>
                            No capacity set — Add Guest will create the first slot
                          </Typography>
                        )}

                        {room.notes && (
                          <Typography sx={{ fontSize: '0.72rem', color: COLORS.text.subtle }}>{room.notes}</Typography>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            )}

            {/* Add-guest menu — lists still-unplaced guests. Selecting one
                appends the guest to the room and bumps capacity if needed. */}
            <PheraMenu
              anchorEl={addGuestAnchor}
              open={!!addGuestAnchor && !!addGuestRoomId}
              onClose={() => { setAddGuestAnchor(null); setAddGuestRoomId(null); }}
              PaperProps={{ sx: { maxHeight: 360, minWidth: 240 } }}
            >
              {(() => {
                const placed = new Set<string>();
                rooms.forEach((r) => (r.assigned_guest_ids ?? []).forEach((id) => placed.add(id)));
                const available = guests.filter((g) => !placed.has(g.id));
                if (available.length === 0) {
                  return (
                    <Box sx={{ px: 2, py: 1.5, color: COLORS.text.subtle, fontSize: '0.82rem' }}>
                      All guests are already placed.
                    </Box>
                  );
                }
                return available.map((g) => {
                  const idx = guestIndexById.get(g.id);
                  const side = g.wedding_side;
                  const sideColor =
                    side === 'bride'
                      ? 'rgba(236,72,153,0.9)'
                      : side === 'groom'
                      ? 'rgba(59,130,246,0.9)'
                      : side === 'both'
                      ? 'rgba(168,85,247,0.9)'
                      : COLORS.text.faint;
                  return (
                    <PheraMenuItem
                      key={g.id}
                      onClick={() => addGuestRoomId && handleAddGuestToRoom(addGuestRoomId, g.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: COLORS.brand.primary, minWidth: 24 }}>
                          #{idx}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: COLORS.text.strong, flex: 1 }}>
                          {g.name || 'Unnamed guest'}
                        </Typography>
                        {side && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: sideColor,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Box>
                    </PheraMenuItem>
                  );
                });
              })()}
            </PheraMenu>

            {/* Add room dialog */}
            <PheraDialog open={adding} onClose={cancelAdd} maxWidth="xs" fullWidth>
              <PheraDialogTitle onClose={cancelAdd}>Add Room</PheraDialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <PheraTextField
                    autoFocus
                    size="small"
                    label="Room number"
                    placeholder="e.g. 1207"
                    value={addDraft.room_number}
                    onChange={(e) => setAddDraft({ ...addDraft, room_number: e.target.value })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    label="Floor"
                    placeholder="12"
                    value={addDraft.floor || ''}
                    onChange={(e) => setAddDraft({ ...addDraft, floor: e.target.value })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    label="Hotel"
                    placeholder={defaultHotel || 'Optional'}
                    value={addDraft.hotel_name || ''}
                    onChange={(e) => setAddDraft({ ...addDraft, hotel_name: e.target.value })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    label="Bed type"
                    placeholder="e.g. 1 King, 2 Queens"
                    value={addDraft.bed_type || ''}
                    onChange={(e) => setAddDraft({ ...addDraft, bed_type: e.target.value })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    type="number"
                    label="Capacity"
                    placeholder="2"
                    value={addDraft.capacity ?? ''}
                    onChange={(e) => setAddDraft({ ...addDraft, capacity: e.target.value ? Number(e.target.value) : null })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    label="Notes"
                    placeholder="Optional"
                    value={addDraft.notes || ''}
                    onChange={(e) => setAddDraft({ ...addDraft, notes: e.target.value })}
                    fullWidth
                  />
                </Stack>
              </DialogContent>
              <DialogActions>
                <PrimaryActionButton onClick={saveAdd} disabled={!addDraft.room_number?.trim()}>
                  Save
                </PrimaryActionButton>
              </DialogActions>
            </PheraDialog>

            {/* Edit room dialog */}
            <PheraDialog
              open={!!editingRoom}
              onClose={() => { cancelEdit(); setEditRoomId(null); }}
              maxWidth="xs"
              fullWidth
            >
              <PheraDialogTitle onClose={() => { cancelEdit(); setEditRoomId(null); }}>
                Edit Room
              </PheraDialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <PheraTextField
                    autoFocus
                    size="small"
                    label="Room number"
                    value={editDraft.room_number}
                    onChange={(e) => setEditDraft({ ...editDraft, room_number: e.target.value })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    label="Floor"
                    value={editDraft.floor || ''}
                    onChange={(e) => setEditDraft({ ...editDraft, floor: e.target.value })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    label="Hotel"
                    value={editDraft.hotel_name || ''}
                    onChange={(e) => setEditDraft({ ...editDraft, hotel_name: e.target.value })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    label="Bed type"
                    placeholder="e.g. 1 King, 2 Queens"
                    value={editDraft.bed_type || ''}
                    onChange={(e) => setEditDraft({ ...editDraft, bed_type: e.target.value })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    type="number"
                    label="Capacity"
                    value={editDraft.capacity ?? ''}
                    onChange={(e) => setEditDraft({ ...editDraft, capacity: e.target.value ? Number(e.target.value) : null })}
                    fullWidth
                  />
                  <PheraTextField
                    size="small"
                    label="Notes"
                    value={editDraft.notes || ''}
                    onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                    fullWidth
                  />
                </Stack>
              </DialogContent>
              <DialogActions>
                <PrimaryActionButton onClick={async () => { await saveEdit(); setEditRoomId(null); }} disabled={!editDraft.room_number?.trim()}>
                  Save
                </PrimaryActionButton>
              </DialogActions>
            </PheraDialog>
          </>
        );
      })()}

      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </Box>
  );
}

