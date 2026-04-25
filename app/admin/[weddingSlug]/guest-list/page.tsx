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
  Button,
  Chip,
  CircularProgress,
  TextField,
  Tooltip,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import { Add, People, Upload, Delete, LocalOffer, Close, CheckCircle, Cancel, HelpOutline, MailOutline, KeyboardDoubleArrowDown, Undo, Search } from '@mui/icons-material';
import { memo, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { weddingService } from '@/lib/supabase/wedding-service';
import GuestImportWizard from '@/components/admin/guests/GuestImportWizard';
import { TagPicker } from '@/components/admin/guests/TagPicker';
import GuestDetailDrawer, { type GuestDetailRecord } from '@/components/admin/guests/GuestDetailDrawer';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';
import { getTagColor } from '@/lib/utils/tag-color';

interface GuestRsvp {
  attending: 'yes' | 'no' | 'maybe' | '' | null;
  guest_count: number | null;
  plus_one: boolean | null;
  created_at: string | null;
}

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  logistics_data:
    | ({
        tag?: string;
        tags?: string[];
        /** Name the couple plans to invite as a plus one. Pre-RSVP planning. */
        plus_one_name?: string | null;
        /** Optional phone for the plus one — useful for direct RSVP follow-up. */
        plus_one_phone?: string | null;
        /** Extra named companions beyond the plus one. Each surfaces as its
         *  own line in the guest-list Name + Phone columns. */
        additional_guests?: Array<{ name?: string | null; phone?: string | null }>;
        /** Party size = primary guest + expected companions. Defaults to 1. */
        party_size?: number;
      } & Record<string, unknown>)
    | null;
  initials: string | null;
  avatar_color: string | null;
  created_at: string;
  rsvps: GuestRsvp[] | null;
}

function getPlusOneName(g: Pick<Guest, 'logistics_data'>): string | null {
  const ld = g.logistics_data;
  const raw = ld && typeof ld.plus_one_name === 'string' ? ld.plus_one_name.trim() : '';
  return raw || null;
}

function getPlusOnePhone(g: Pick<Guest, 'logistics_data'>): string | null {
  const ld = g.logistics_data;
  const raw = ld && typeof ld.plus_one_phone === 'string' ? ld.plus_one_phone.trim() : '';
  return raw || null;
}

interface AdditionalGuestRow { name: string; phone: string }

function getAdditionalGuests(g: Pick<Guest, 'logistics_data'>): AdditionalGuestRow[] {
  const ld = g.logistics_data;
  if (!ld || !Array.isArray(ld.additional_guests)) return [];
  return ld.additional_guests
    .map((x) => ({
      name: typeof x?.name === 'string' ? x.name.trim() : '',
      phone: typeof x?.phone === 'string' ? x.phone.trim() : '',
    }))
    .filter((x) => x.name.length > 0 || x.phone.length > 0);
}

function getPartySize(g: Pick<Guest, 'logistics_data'>): number {
  const ld = g.logistics_data;
  const n = ld && typeof ld.party_size === 'number' ? ld.party_size : 0;
  return n > 0 ? n : 1;
}

/**
 * Split a full name into first-part + last-part. Multi-word last names (e.g.
 * "de Souza") are kept together as the last-part. Single-word names fall back
 * to the whole name as the last-part so the bold emphasis still reads correctly.
 */
function splitNameForEmphasis(name: string): { first: string; last: string } {
  const trimmed = (name || '').trim();
  if (!trimmed) return { first: '', last: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: '', last: parts[0] };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

type RsvpStatus = 'attending' | 'not_attending' | 'maybe' | 'no_response';

function getRsvpStatus(g: Pick<Guest, 'rsvps'>): RsvpStatus {
  const rsvps = g.rsvps ?? [];
  if (rsvps.length === 0) return 'no_response';
  // Use the most-recent rsvp record as the source of truth.
  const latest = [...rsvps].sort((a, b) =>
    (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  )[0];
  const a = latest?.attending;
  if (a === 'yes') return 'attending';
  if (a === 'no') return 'not_attending';
  if (a === 'maybe') return 'maybe';
  return 'no_response';
}

const RSVP_STATUS_META: Record<RsvpStatus, { label: string; fg: string; bg: string; Icon: typeof CheckCircle }> = {
  attending: { label: 'Attending', fg: COLORS.accent.successText, bg: COLORS.accent.successBg, Icon: CheckCircle },
  not_attending: { label: 'Not attending', fg: COLORS.accent.dangerText, bg: COLORS.accent.dangerBg, Icon: Cancel },
  maybe: { label: 'Maybe', fg: COLORS.accent.warningText, bg: COLORS.accent.warningBg, Icon: HelpOutline },
  no_response: { label: 'No response', fg: COLORS.text.subtle, bg: COLORS.bg.subtle, Icon: MailOutline },
};

function getTags(g: { logistics_data: Guest['logistics_data'] }): string[] {
  const ld = g.logistics_data;
  if (!ld) return [];
  if (Array.isArray(ld.tags)) {
    return ld.tags
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim());
  }
  if (typeof ld.tag === 'string' && ld.tag.trim()) return [ld.tag.trim()];
  return [];
}

function buildLogisticsWithTags(current: Guest['logistics_data'], tags: string[]): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(current || {}) };
  if (tags.length > 0) {
    next.tags = tags;
    // Mirror primary tag into legacy `tag` so downstream consumers (rooms,
    // broadcasts, auto-assign) that still read a single tag keep working.
    next.tag = tags[0];
  } else {
    delete next.tags;
    delete next.tag;
  }
  return next;
}

type EditableField = 'name' | 'email' | 'phone' | 'tag';

interface CellEdit {
  guestId: string;
  field: EditableField;
}

// ─── Draggable tag chip ──────────────────────────────────────

const DragTagChip = memo(function DragTagChip({
  rowId,
  tag,
  onDelete,
}: {
  rowId: string;
  tag: string;
  onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `chip-${rowId}-${tag}`,
    data: { tag, sourceRowId: rowId },
  });
  const c = getTagColor(tag);
  // Source chip stays fully visible during drag (unlike the default "move" UX)
  // — DragOverlay renders the floating clone, and the stationary source makes
  // it obvious the tag is being COPIED, not moved.
  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        display: 'inline-flex',
        cursor: 'grab',
        touchAction: 'none',
        '&:active': { cursor: 'grabbing' },
        ...(isDragging && {
          outline: `1px dashed ${COLORS.brand.primaryBorder}`,
          outlineOffset: 2,
          borderRadius: RADII.pill,
        }),
      }}
    >
      <Chip
        label={tag}
        size="small"
        onDelete={onDelete}
        deleteIcon={
          onDelete ? (
            <Close
              sx={{ fontSize: 14 }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : undefined
        }
        sx={{
          fontSize: '0.875rem',
          fontWeight: 600,
          bgcolor: c.bg,
          color: c.fg,
          border: `1px solid ${c.border}`,
          cursor: 'inherit',
          '& .MuiChip-deleteIcon': {
            color: c.fg,
            opacity: 0.6,
            '&:hover': { opacity: 1, color: c.fg },
          },
        }}
      />
    </Box>
  );
});

// ─── Memoized guest row ──────────────────────────────────────
// Full row extracted + React.memo'd so a drag event against one row doesn't
// trigger a render of every other row. Props are narrowed to primitives so the
// shallow compare can skip unaffected rows.

const EDIT_HINT = { cursor: 'pointer', userSelect: 'none' as const };

interface GuestRowProps {
  guest: Guest;
  isSelected: boolean;
  fillHighlight: boolean;
  editingField: EditableField | null;
  draft: string;
  existingTags: string[];
  onToggleRow: (id: string) => void;
  onBeginEdit: (g: Guest, f: EditableField) => void;
  onSetDraft: (s: string) => void;
  onCommitEdit: (override?: string) => void;
  onCancelEdit: () => void;
  onRemoveGuest: (id: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onBeginFill: (sourceId: string, tags: string[], e: React.PointerEvent) => void;
  /** Clicking any cell except Tags opens the right-side detail drawer for the row. */
  onOpenDetails: (id: string) => void;
}

const GuestRow = memo(function GuestRow({
  guest: g,
  isSelected,
  fillHighlight,
  editingField,
  draft,
  existingTags,
  onToggleRow,
  onBeginEdit,
  onSetDraft,
  onCommitEdit,
  onCancelEdit,
  onRemoveGuest,
  onRemoveTag,
  onAddTag,
  onBeginFill,
  onOpenDetails,
}: GuestRowProps) {
  const addBtnRef = useRef<HTMLButtonElement | null>(null);
  const { setNodeRef, isOver } = useDroppable({ id: `row-${g.id}` });
  const tags = getTags(g);
  const cleanEmail = g.email && !g.email.includes('@phera.io') ? g.email : '';
  const plusOneName = getPlusOneName(g);
  const plusOnePhone = getPlusOnePhone(g);
  const additionalGuests = getAdditionalGuests(g);
  const partySize = getPartySize(g);
  // Remaining = party size minus primary minus named plus one minus each
  // named additional guest. Clamped at 0.
  const namedAdditional = additionalGuests.length;
  const plusOneCount = plusOneName ? 1 : 0;
  const unnamedRemaining = Math.max(0, partySize - 1 - plusOneCount - namedAdditional);
  const isEditingTag = editingField === 'tag';
  const openDetails = () => onOpenDetails(g.id);
  // No-name/email/phone inline editing — those cells open the detail drawer
  // instead. Only Tag cell remains interactive in place.

  return (
    <TableRow
      ref={setNodeRef}
      hover
      selected={isSelected}
      data-guest-row-id={g.id}
      sx={{
        '&:hover .row-actions': { opacity: 1 },
        '&:hover .fill-handle': { opacity: 1 },
        '&.Mui-selected': { bgcolor: COLORS.brand.primaryWash },
        '&.Mui-selected:hover': { bgcolor: COLORS.brand.primarySubtle },
        ...(isOver && {
          outline: `2px solid ${COLORS.brand.primary}`,
          outlineOffset: -2,
          bgcolor: `${COLORS.brand.primarySubtle} !important`,
        }),
        ...(fillHighlight && {
          bgcolor: `${COLORS.brand.primaryWash} !important`,
          boxShadow: `inset 0 0 0 1px ${COLORS.brand.primaryBorder}`,
        }),
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={() => onToggleRow(g.id)}
          sx={{
            color: COLORS.border.default,
            '&.Mui-checked': { color: COLORS.brand.primary },
          }}
        />
      </TableCell>
      <TableCell onClick={openDetails} sx={{ ...EDIT_HINT, py: 1.75 }}>
        <Stack spacing={0.25}>
          {/* Primary name — last name bold, first name regular. */}
          {(() => {
            const { first, last } = splitNameForEmphasis(g.name);
            return (
              <Typography
                variant="body2"
                sx={{
                  color: COLORS.text.strong,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {first && (
                  <Box component="span" sx={{ fontWeight: 400 }}>
                    {first}{' '}
                  </Box>
                )}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {last}
                </Box>
              </Typography>
            );
          })()}
          {/* Plus one name under the primary guest, muted. */}
          {plusOneName && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8125rem',
                color: COLORS.text.subtle,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              + {plusOneName}
            </Typography>
          )}
          {/* Named additional guests — one row each, same "+ name" style. */}
          {additionalGuests.map((ag, idx) =>
            ag.name ? (
              <Typography
                key={`ag-name-${idx}`}
                variant="body2"
                sx={{
                  fontSize: '0.8125rem',
                  color: COLORS.text.subtle,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                + {ag.name}
              </Typography>
            ) : null,
          )}
          {/* "+ Additional N guest(s)" — remainder of party size that isn't a
              named plus one or named additional guest. */}
          {unnamedRemaining > 0 && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8125rem',
                color: COLORS.text.subtle,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              + Additional {unnamedRemaining} guest{unnamedRemaining === 1 ? '' : 's'}
            </Typography>
          )}
        </Stack>
      </TableCell>
      {/* No. — party size (primary + expected companions). */}
      <TableCell onClick={openDetails} sx={{ ...bodyCell, ...EDIT_HINT, py: 1.75 }}>
        <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
          {partySize}
        </Typography>
      </TableCell>
      {/* Email & phone — stacked: email on top, primary phone, then optional
          plus-one phone. Clicking opens the detail drawer. */}
      <TableCell onClick={openDetails} sx={{ ...bodyCell, ...EDIT_HINT, py: 1.75 }}>
        <Stack spacing={0.25}>
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.text.strong }}>
            {cleanEmail || <span style={{ color: COLORS.text.faint }}>—</span>}
          </Box>
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.text.muted, fontSize: '0.8125rem' }}>
            {g.phone || <span style={{ color: COLORS.text.faint }}>—</span>}
          </Box>
          {plusOnePhone && (
            <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.text.muted, fontSize: '0.8125rem' }}>
              {plusOnePhone}
            </Box>
          )}
          {additionalGuests.map((ag, idx) =>
            ag.phone ? (
              <Box
                key={`ag-phone-${idx}`}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.text.muted, fontSize: '0.8125rem' }}
              >
                {ag.phone}
              </Box>
            ) : null,
          )}
        </Stack>
      </TableCell>
      {/* Status — derived from the latest rsvp record for this guest. */}
      <TableCell onClick={openDetails} sx={{ ...bodyCell, ...EDIT_HINT, py: 1.75 }}>
        {(() => {
          const meta = RSVP_STATUS_META[getRsvpStatus(g)];
          const Icon = meta.Icon;
          return (
            <Chip
              icon={<Icon sx={{ fontSize: 16, color: `${meta.fg} !important` }} />}
              label={meta.label}
              size="small"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                bgcolor: meta.bg,
                color: meta.fg,
                borderRadius: RADII.pill,
                '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
              }}
            />
          );
        })()}
      </TableCell>
      <TableCell sx={{ position: 'relative', pr: 3, minWidth: 260, py: 1.75 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={0.5} sx={{ minHeight: 28 }}>
          {tags.map((t) => (
            <DragTagChip
              key={t}
              rowId={g.id}
              tag={t}
              onDelete={() => onRemoveTag(g.id, t)}
            />
          ))}
          <Tooltip title={tags.length ? 'Add another tag' : 'Add tag'}>
            <IconButton
              ref={addBtnRef}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (isEditingTag) onCancelEdit();
                else onBeginEdit(g, 'tag');
              }}
              sx={{
                width: 24,
                height: 24,
                borderRadius: RADII.pill,
                border: `1px dashed ${isEditingTag ? COLORS.brand.primary : COLORS.border.default}`,
                color: isEditingTag ? COLORS.brand.primary : COLORS.text.faint,
                ...(isEditingTag && { borderStyle: 'solid', bgcolor: COLORS.brand.primarySubtle }),
                '&:hover': {
                  borderColor: COLORS.brand.primary,
                  color: COLORS.brand.primary,
                  borderStyle: 'solid',
                },
              }}
            >
              <Add sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
        <TagPicker
          open={isEditingTag}
          anchorEl={addBtnRef.current}
          draft={draft}
          onSetDraft={onSetDraft}
          existingTags={existingTags}
          currentTags={tags}
          onAdd={(t) => onAddTag(g.id, t)}
          onClose={onCancelEdit}
        />
        {tags.length > 0 && (
          <Tooltip title="Drag down to fill these tags into rows below">
            <Box
              className="fill-handle"
              onPointerDown={(e) => onBeginFill(g.id, tags, e)}
              sx={{
                position: 'absolute',
                right: 4,
                bottom: 4,
                width: 22,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: RADII.sm,
                bgcolor: COLORS.bg.white,
                border: `1px solid ${COLORS.border.default}`,
                color: COLORS.text.subtle,
                cursor: 'ns-resize',
                opacity: 0,
                transition: 'opacity 0.12s, border-color 0.12s, color 0.12s, background-color 0.12s',
                touchAction: 'none',
                '&:hover': {
                  borderColor: COLORS.brand.primary,
                  color: COLORS.brand.primary,
                  bgcolor: COLORS.brand.primarySubtle,
                },
              }}
            >
              <KeyboardDoubleArrowDown sx={{ fontSize: 14 }} />
            </Box>
          </Tooltip>
        )}
      </TableCell>
      <TableCell align="right">
        <Box className="row-actions" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => onRemoveGuest(g.id)}>
              <Delete sx={{ fontSize: 16, color: COLORS.text.faint }} />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
});

export default function GuestListPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  // 0 = Upload file tab, 1 = Add manually tab. Controls which tab the wizard
  // opens on so "Import Guests" and "Add Manually" both share one dialog.
  const [importTab, setImportTab] = useState<0 | 1>(0);

  // Which single cell is currently being edited. null when nothing is edited.
  const [editing, setEditing] = useState<CellEdit | null>(null);
  // Working value for the active cell; kept in local state so blur commits
  // the latest value without extra round-trips.
  const [draft, setDraft] = useState<string>('');
  // Prevent double-save if both blur + Enter fire.
  const committingRef = useRef(false);

  // Row selection for bulk tag edits.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail drawer state — clicking any non-tag cell opens this.
  const [detailGuestId, setDetailGuestId] = useState<string | null>(null);
  // A guard against the drawer closing on the second tap of an accidental
  // double-click (first click opens; second click lands on the backdrop).
  // Record the open timestamp and swallow close events within a short window.
  const drawerOpenedAt = useRef<number>(0);

  const openDetails = useCallback((id: string) => {
    drawerOpenedAt.current = Date.now();
    setDetailGuestId(id);
  }, []);

  const closeDetails = useCallback(() => {
    // Ignore close calls fired within 350ms of opening — the user's second
    // click hit the backdrop, not a deliberate dismiss.
    if (Date.now() - drawerOpenedAt.current < 350) return;
    setDetailGuestId(null);
  }, []);

  // Memoize the selected guest so parent re-renders (e.g. from another row's
  // tag edit) don't produce a new reference and re-fire the drawer's form
  // reset useEffect while the user is mid-edit.
  const detailGuest = useMemo(
    () =>
      detailGuestId
        ? (guests.find((x) => x.id === detailGuestId) as unknown as GuestDetailRecord | undefined) ?? null
        : null,
    [detailGuestId, guests],
  );
  const [bulkTagDraft, setBulkTagDraft] = useState<string>('');
  // Bulk staging: user can queue multiple tags via the picker before hitting
  // "Add tags" — mirrors the per-row tag UX (pills + add button) so the two
  // modes feel identical.
  const [stagedTags, setStagedTags] = useState<string[]>([]);
  const [stagedPickerOpen, setStagedPickerOpen] = useState(false);
  const stagedAddBtnRef = useRef<HTMLButtonElement | null>(null);

  // ─── Undo stack ──────────────────────────────────────────────
  // Every tag-mutating action captures `logistics_data` snapshots of the
  // affected guests so we can roll the rows back. Capped at 10 entries; older
  // ones fall off silently.
  type UndoSnapshot = { id: string; logistics_data: Guest['logistics_data'] };
  interface UndoEntry {
    label: string;
    snapshots: UndoSnapshot[];
  }
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [undoing, setUndoing] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);

  // Active drag (row→row tag copy).
  const [draggedTag, setDraggedTag] = useState<string | null>(null);

  // Fill-handle state (Airtable-style). pointerdown on handle activates this;
  // while active, we track rows whose DOM node the pointer passes over.
  const fillRef = useRef<{ sourceId: string; tags: string[]; hovered: Set<string> } | null>(null);
  const [fillHovered, setFillHovered] = useState<Set<string>>(new Set());

  // Mirror state in refs so stable callbacks (empty-dep useCallback) can read
  // the latest values without re-creating the handler on every render. Without
  // this, row handlers would change identity on any state change, which breaks
  // React.memo on GuestRow and causes every row to re-render when anything in
  // the parent updates (the dnd-kit "drag lag" symptom).
  const guestsRef = useRef(guests);
  const editingRef = useRef(editing);
  const draftRef = useRef(draft);
  useEffect(() => {
    guestsRef.current = guests;
  }, [guests]);
  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // ─── Load ────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    const wedding = await weddingService.getWeddingBySlug(weddingSlug);
    if (wedding) setWeddingId(wedding.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests row fields here aren't captured by generated supabase types
    const { data, error } = await (supabase as any)
      .from('guests')
      .select('id, name, email, phone, logistics_data, initials, avatar_color, created_at, rsvps(attending, guest_count, plus_one, created_at)')
      .eq('wedding_id', weddingSlug)
      .order('created_at', { ascending: false });

    if (error) console.error('guests load error:', error);
    setGuests((data || []) as Guest[]);
    setLoading(false);

    // Let listeners (e.g. AdminPreviewPanel's publish gate) refresh counts.
    try {
      const channel = new BroadcastChannel('phera-guests-sync');
      channel.postMessage({ type: 'GUESTS_UPDATED' });
      channel.close();
    } catch {
      // BroadcastChannel unavailable (older browsers) — non-critical.
    }
  }, [weddingSlug]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Derived: unique tags across this wedding ──────────────

  const existingTags = useMemo(() => {
    const set = new Set<string>();
    for (const g of guests) {
      for (const t of getTags(g)) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [guests]);

  // Name search. Matches against name first, with email + phone as
  // secondary hits so someone searching "rahul@" or a partial phone still
  // lands on the right row.
  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => {
      if (g.name?.toLowerCase().includes(q)) return true;
      if (g.email?.toLowerCase().includes(q)) return true;
      if (g.phone?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [guests, search]);

  // ─── Cell editing ────────────────────────────────────────────
  // All handlers are wrapped in useCallback with empty deps + read latest state
  // from refs. This keeps their identity stable so GuestRow's React.memo can
  // skip rows whose props didn't change.

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setDraft('');
    committingRef.current = false;
  }, []);

  const beginEdit = useCallback((guest: Guest, field: EditableField) => {
    if (editingRef.current) return; // one cell at a time
    let initial = '';
    if (field === 'name') initial = guest.name || '';
    else if (field === 'email') initial = guest.email && !guest.email.includes('@phera.io') ? guest.email : '';
    else if (field === 'phone') initial = guest.phone || '';
    else if (field === 'tag') initial = '';
    setDraft(initial);
    setEditing({ guestId: guest.id, field });
  }, []);

  // ─── Tag writers (shared across row edit, bulk pill, drag, fill) ─
  // JSONB can't be patched partially from the client — we merge tags in JS and
  // write the whole logistics_data back per guest. All three writers are
  // optimistic: UI updates immediately, reverts on per-row failure.

  // Snapshot helper: read current logistics_data for the given ids so we can
  // restore them later via the undo stack. Reads from guestsRef (not state) so
  // callers get a value synchronously without waiting for React to commit.
  const captureSnapshots = useCallback((ids: string[]): UndoSnapshot[] => {
    const byId = new Map(guestsRef.current.map((g) => [g.id, g.logistics_data]));
    return ids
      .filter((id) => byId.has(id))
      .map((id) => ({ id, logistics_data: byId.get(id) ?? null }));
  }, []);

  const pushUndo = useCallback((label: string, snapshots: UndoSnapshot[]) => {
    if (snapshots.length === 0) return;
    // Cap the stack at 10 so we don't accumulate unbounded state.
    setUndoStack((prev) => [...prev, { label, snapshots }].slice(-10));
  }, []);

  const undoLast = useCallback(async () => {
    const entry = undoStack[undoStack.length - 1];
    if (!entry) return;
    setUndoing(true);
    // Pop optimistically — if the writes fail per-row, those rows will be
    // logged but we don't unwind the pop (keeps undo simple & predictable).
    setUndoStack((prev) => prev.slice(0, -1));

    // Restore local state for all snapshots at once.
    setGuests((prev) =>
      prev.map((g) => {
        const s = entry.snapshots.find((x) => x.id === g.id);
        return s ? { ...g, logistics_data: s.logistics_data } : g;
      }),
    );

    // Persist in parallel.
    const results = await Promise.all(
      entry.snapshots.map(async (s) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests.update() shape isn't in generated types
        const { error } = await (supabase as any)
          .from('guests')
          .update({ logistics_data: s.logistics_data })
          .eq('id', s.id);
        return { id: s.id, error };
      }),
    );
    const failed = results.filter((r) => r.error);
    if (failed.length) {
      console.error('undo failed on', failed.length, 'guest(s)');
    }
    setUndoing(false);
  }, [undoStack]);

  const appendTagsToIds = useCallback(async (ids: string[], tagsToAdd: string[]) => {
    const filtered = tagsToAdd.map((t) => t.trim()).filter(Boolean);
    if (ids.length === 0 || filtered.length === 0) return;

    // Capture BEFORE mutating so the undo snapshot has the true pre-action state.
    const snapshots = captureSnapshots(ids);

    const prevById = new Map<string, Guest['logistics_data']>();
    const nextById = new Map<string, Record<string, unknown>>();

    setGuests((prev) =>
      prev.map((g) => {
        if (!ids.includes(g.id)) return g;
        prevById.set(g.id, g.logistics_data);
        const current = getTags(g);
        const merged = Array.from(new Set([...current, ...filtered]));
        const nextLogistics = buildLogisticsWithTags(g.logistics_data, merged);
        nextById.set(g.id, nextLogistics);
        return { ...g, logistics_data: nextLogistics as Guest['logistics_data'] };
      }),
    );

    // Filter: only guests that actually changed (skip ones where every tag was
    // already present — no-op doesn't belong in undo history).
    const changedSnapshots = snapshots.filter((s) => nextById.has(s.id));
    const label = filtered.length === 1
      ? `Added "${filtered[0]}" to ${changedSnapshots.length} guest${changedSnapshots.length === 1 ? '' : 's'}`
      : `Added ${filtered.length} tags to ${changedSnapshots.length} guest${changedSnapshots.length === 1 ? '' : 's'}`;
    pushUndo(label, changedSnapshots);

    const results = await Promise.all(
      Array.from(nextById.entries()).map(async ([id, nextLogistics]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests.update() shape isn't in generated types
        const { error } = await (supabase as any)
          .from('guests')
          .update({ logistics_data: nextLogistics })
          .eq('id', id);
        return { id, error };
      }),
    );

    const failedIds = results.filter((r) => r.error).map((r) => r.id);
    if (failedIds.length) {
      console.error('tag append failed on', failedIds.length, 'guest(s)');
      setGuests((prev) =>
        prev.map((g) =>
          failedIds.includes(g.id) && prevById.has(g.id)
            ? { ...g, logistics_data: prevById.get(g.id)! }
            : g,
        ),
      );
    }
  }, [captureSnapshots, pushUndo]);

  const clearTagsForIds = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    // Only snapshot guests that actually had tags — clearing an already-empty
    // guest is a no-op and shouldn't pollute undo history.
    const snapshots = captureSnapshots(ids).filter(
      (s) => getTags({ logistics_data: s.logistics_data }).length > 0,
    );

    const prevById = new Map<string, Guest['logistics_data']>();
    const nextById = new Map<string, Record<string, unknown>>();

    setGuests((prev) =>
      prev.map((g) => {
        if (!ids.includes(g.id)) return g;
        prevById.set(g.id, g.logistics_data);
        const nextLogistics = buildLogisticsWithTags(g.logistics_data, []);
        nextById.set(g.id, nextLogistics);
        return { ...g, logistics_data: nextLogistics as Guest['logistics_data'] };
      }),
    );

    pushUndo(
      `Cleared tags on ${snapshots.length} guest${snapshots.length === 1 ? '' : 's'}`,
      snapshots,
    );

    const results = await Promise.all(
      Array.from(nextById.entries()).map(async ([id, nextLogistics]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests.update() shape isn't in generated types
        const { error } = await (supabase as any)
          .from('guests')
          .update({ logistics_data: nextLogistics })
          .eq('id', id);
        return { id, error };
      }),
    );

    const failedIds = results.filter((r) => r.error).map((r) => r.id);
    if (failedIds.length) {
      console.error('tag clear failed on', failedIds.length, 'guest(s)');
      setGuests((prev) =>
        prev.map((g) =>
          failedIds.includes(g.id) && prevById.has(g.id)
            ? { ...g, logistics_data: prevById.get(g.id)! }
            : g,
        ),
      );
    }
  }, [captureSnapshots, pushUndo]);

  const addTagToGuest = useCallback(async (id: string, tag: string) => {
    await appendTagsToIds([id], [tag]);
  }, [appendTagsToIds]);

  const removeTagFromGuest = useCallback(async (id: string, tag: string) => {
    const snapshots = captureSnapshots([id]);
    let prev: Guest['logistics_data'] | undefined;
    let next: Record<string, unknown> | undefined;

    setGuests((list) =>
      list.map((g) => {
        if (g.id !== id) return g;
        prev = g.logistics_data;
        const remaining = getTags(g).filter((t) => t !== tag);
        next = buildLogisticsWithTags(g.logistics_data, remaining);
        return { ...g, logistics_data: next as Guest['logistics_data'] };
      }),
    );

    if (!next) return;
    pushUndo(`Removed "${tag}"`, snapshots);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests.update() shape isn't in generated types
    const { error } = await (supabase as any)
      .from('guests')
      .update({ logistics_data: next })
      .eq('id', id);
    if (error) {
      console.error('tag remove error:', error);
      setGuests((list) =>
        list.map((g) => (g.id === id ? { ...g, logistics_data: prev ?? null } : g)),
      );
    }
  }, [captureSnapshots, pushUndo]);

  const commitEdit = useCallback(async (overrideValue?: string) => {
    const editing = editingRef.current;
    const draft = draftRef.current;
    const guests = guestsRef.current;
    if (!editing || committingRef.current) return;
    committingRef.current = true;

    const guest = guests.find((g) => g.id === editing.guestId);
    if (!guest) {
      cancelEdit();
      return;
    }

    const value = overrideValue !== undefined ? overrideValue : draft;
    const field = editing.field;

    // Tag field is append-only in multi-tag mode. Delegate to appendTagsToIds
    // so the code path matches bulk/drag/fill and we stay consistent.
    if (field === 'tag') {
      const tag = (value || '').trim();
      const current = getTags(guest);
      if (tag && !current.includes(tag)) {
        await appendTagsToIds([guest.id], [tag]);
      }
      cancelEdit();
      return;
    }

    // No-op detection so we don't write on every blur of an unchanged cell.
    let unchanged = false;
    if (field === 'name') unchanged = (value || '').trim() === (guest.name || '').trim();
    else if (field === 'email') {
      const current = guest.email && !guest.email.includes('@phera.io') ? guest.email : '';
      unchanged = (value || '').trim() === current.trim();
    } else if (field === 'phone') unchanged = (value || '').trim() === (guest.phone || '').trim();

    if (unchanged) {
      cancelEdit();
      return;
    }

    const updates: Record<string, unknown> = {};
    const optimistic: Partial<Guest> = {};

    if (field === 'name') {
      const name = (value || '').trim();
      if (!name) {
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
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests.update() field shape isn't captured by generated supabase types
    const { error } = await (supabase as any).from('guests').update(updates).eq('id', editing.guestId);

    if (error) {
      console.error('guest update error:', error);
      committingRef.current = false;
      return;
    }

    setGuests((prev) => prev.map((g) => (g.id === editing.guestId ? { ...g, ...optimistic } : g)));
    cancelEdit();
  }, [cancelEdit, appendTagsToIds]);

  const removeGuest = useCallback(async (id: string) => {
    if (!confirm('Remove this guest?')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests.delete() isn't captured by generated supabase types
    const { error } = await (supabase as any).from('guests').delete().eq('id', id);
    if (error) {
      console.error('guest delete error:', error);
      return;
    }
    setGuests((prev) => prev.filter((g) => g.id !== id));
    try {
      const channel = new BroadcastChannel('phera-guests-sync');
      channel.postMessage({ type: 'GUESTS_UPDATED' });
      channel.close();
    } catch {
      // BroadcastChannel unavailable — non-critical.
    }
  }, []);

  // ─── Selection + bulk tag ────────────────────────────────────

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected = guests.length > 0 && selectedIds.size === guests.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(guests.map((g) => g.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkTagDraft('');
    setStagedTags([]);
    setStagedPickerOpen(false);
  };

  const stageTag = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    setStagedTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
  };

  const unstageTag = (tag: string) => {
    setStagedTags((prev) => prev.filter((t) => t !== tag));
  };

  const applyStagedBulkTags = async () => {
    if (selectedIds.size === 0 || stagedTags.length === 0) return;
    setBulkApplying(true);
    await appendTagsToIds(Array.from(selectedIds), stagedTags);
    setBulkApplying(false);
    setStagedTags([]);
    setBulkTagDraft('');
    setStagedPickerOpen(false);
    setSelectedIds(new Set());
  };

  const clearBulkTags = async () => {
    if (selectedIds.size === 0) return;
    setBulkApplying(true);
    await clearTagsForIds(Array.from(selectedIds));
    setBulkApplying(false);
    setBulkTagDraft('');
    setStagedTags([]);
    setStagedPickerOpen(false);
    setSelectedIds(new Set());
  };

  // ─── Drag-chip row → row ─────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 1px threshold fires on the first frame of motion — effectively instant
      // — while still filtering out true clicks with zero movement so the cell's
      // double-click-to-edit still works when you click outside the chip.
      activationConstraint: { distance: 1 },
    }),
  );

  const handleDragStart = (e: DragStartEvent) => {
    const t = (e.active.data.current as { tag?: string } | undefined)?.tag;
    setDraggedTag(t ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const data = e.active.data.current as { tag?: string; sourceRowId?: string } | undefined;
    const tag = data?.tag;
    const sourceId = data?.sourceRowId;
    const overId = e.over?.id ? String(e.over.id) : null;
    setDraggedTag(null);
    if (!tag || !overId) return;
    if (!overId.startsWith('row-')) return;
    const targetId = overId.slice(4);
    if (targetId === sourceId) return;
    // If target is part of multi-selection, apply to all selected for power UX.
    const ids = selectedIds.has(targetId) && selectedIds.size > 1
      ? Array.from(selectedIds)
      : [targetId];
    appendTagsToIds(ids, [tag]);
  };

  // ─── Fill handle (Airtable-style pointer drag) ───────────────

  const beginFill = useCallback((sourceId: string, tagsToCopy: string[], e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fillRef.current = { sourceId, tags: tagsToCopy, hovered: new Set([sourceId]) };
    setFillHovered(new Set([sourceId]));

    const onMove = (ev: PointerEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      if (!el) return;
      const rowEl = (el as HTMLElement).closest('[data-guest-row-id]') as HTMLElement | null;
      if (!rowEl) return;
      const id = rowEl.getAttribute('data-guest-row-id');
      if (!id || !fillRef.current) return;
      if (!fillRef.current.hovered.has(id)) {
        fillRef.current.hovered.add(id);
        setFillHovered(new Set(fillRef.current.hovered));
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const state = fillRef.current;
      fillRef.current = null;
      setFillHovered(new Set());
      if (!state) return;
      const ids = Array.from(state.hovered).filter((id) => id !== state.sourceId);
      if (ids.length === 0) return;
      appendTagsToIds(ids, state.tags);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [appendTagsToIds]);

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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}
        >
          <SecondaryActionButton
            startIcon={<Add />}
            onClick={() => {
              setImportTab(1);
              setImportOpen(true);
            }}
            sx={{ px: 2.5, py: 1, width: { xs: '100%', sm: 'auto' } }}
          >
            Add Manually
          </SecondaryActionButton>
          <PrimaryActionButton
            startIcon={<Upload />}
            onClick={() => {
              setImportTab(0);
              setImportOpen(true);
            }}
            sx={{ px: 2.5, py: 1, width: { xs: '100%', sm: 'auto' } }}
          >
            Import Guests
          </PrimaryActionButton>
        </Stack>
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
          <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.55 }}>
            <Box component="span" sx={{ fontWeight: 700, color: COLORS.text.strong }}>Tags</Box>{' '}
            keep the guest list organized — group households, control plus-ones, assign rooms and
            transport, and pick who&apos;s invited to which events. Try: <em>bride-side</em>,{' '}
            <em>family</em>, <em>plus-one-allowed</em>, <em>reception-only</em>.
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2.5,
            py: 1.5,
            borderBottom: `1px solid ${COLORS.border.faint}`,
            minHeight: 56,
          }}
        >
          <People sx={{ fontSize: 20, color: COLORS.text.strong }} />
          <Typography variant="subtitle1" sx={{ color: COLORS.text.strong }}>All Guests</Typography>
          <Chip
            label={
              loading
                ? '…'
                : search && filteredGuests.length !== guests.length
                  ? `${filteredGuests.length} of ${guests.length}`
                  : guests.length
            }
            size="small"
            sx={{ fontSize: '0.875rem', fontWeight: 600, bgcolor: 'rgba(0,0,0,0.05)', color: COLORS.text.muted }}
          />
          {existingTags.length > 0 && (
            <Typography variant="body2" sx={{ color: COLORS.text.faint, ml: 1 }}>
              · {existingTags.length} tag{existingTags.length === 1 ? '' : 's'} in use
            </Typography>
          )}

          {/* Right-aligned bulk-tag controls. Inline in the header rather than
              a floating pill so it's obvious the controls act on the table below.
              The undo button sits BEFORE the bulk bar so it coexists cleanly
              with a selection — undo reverts the prior action regardless of
              what's currently selected. */}
          <Box sx={{ flex: 1 }} />
          <AnimatePresence initial={false}>
            {undoStack.length > 0 && (
              <motion.div
                key="undo-btn"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <Tooltip title={`Undo: ${undoStack[undoStack.length - 1]?.label ?? ''}`}>
                  <span>
                    <SecondaryActionButton
                      onClick={undoLast}
                      disabled={undoing}
                      startIcon={<Undo sx={{ fontSize: 18 }} />}
                      sx={{ height: 32, px: 1.5, py: 0, mr: selectedIds.size > 0 ? 1 : 0 }}
                    >
                      {undoing ? 'Undoing…' : 'Undo'}
                    </SecondaryActionButton>
                  </span>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {selectedIds.size > 0 && (
              <motion.div
                key="bulk-inline"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                // Uniform 32px height on every child — button, chip, badge, + —
                // so the bar reads as a single horizontal control strip instead
                // of a collection of differently-sized pieces.
                style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}
              >
                <Box
                  sx={{
                    height: 32,
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1.25,
                    borderRadius: RADII.pill,
                    bgcolor: COLORS.brand.primarySubtle,
                    color: COLORS.brand.primary,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    flexShrink: 0,
                  }}
                >
                  {selectedIds.size} selected
                </Box>

                {/* Staged-tag pills — matches the per-row tag UX exactly. */}
                {stagedTags.map((t) => {
                  const c = getTagColor(t);
                  return (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      onDelete={() => unstageTag(t)}
                      deleteIcon={<Close sx={{ fontSize: 14 }} />}
                      sx={{
                        height: 32,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        bgcolor: c.bg,
                        color: c.fg,
                        border: `1px solid ${c.border}`,
                        '& .MuiChip-deleteIcon': {
                          color: c.fg,
                          opacity: 0.6,
                          '&:hover': { opacity: 1, color: c.fg },
                        },
                      }}
                    />
                  );
                })}

                <Button
                  ref={stagedAddBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStagedPickerOpen((o) => !o);
                  }}
                  disabled={bulkApplying}
                  endIcon={<Add sx={{ fontSize: 16 }} />}
                  sx={{
                    height: 32,
                    px: 1.5,
                    py: 0,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: RADII.pill,
                    border: `1px dashed ${stagedPickerOpen ? COLORS.brand.primary : COLORS.border.default}`,
                    color: stagedPickerOpen ? COLORS.brand.primary : COLORS.text.muted,
                    ...(stagedPickerOpen && { borderStyle: 'solid', bgcolor: COLORS.brand.primarySubtle }),
                    '&:hover': {
                      borderColor: COLORS.brand.primary,
                      color: COLORS.brand.primary,
                      borderStyle: 'solid',
                      bgcolor: COLORS.brand.primarySubtle,
                    },
                    '& .MuiButton-endIcon': { ml: 0.5 },
                  }}
                >
                  {stagedTags.length ? 'Add another' : 'Add tag'}
                </Button>
                <TagPicker
                  open={stagedPickerOpen}
                  anchorEl={stagedAddBtnRef.current}
                  draft={bulkTagDraft}
                  onSetDraft={setBulkTagDraft}
                  existingTags={existingTags}
                  currentTags={stagedTags}
                  onAdd={(t) => stageTag(t)}
                  onClose={() => {
                    setStagedPickerOpen(false);
                    setBulkTagDraft('');
                  }}
                />

                <PrimaryActionButton
                  onClick={applyStagedBulkTags}
                  disabled={bulkApplying || stagedTags.length === 0}
                  sx={{ height: 32, px: 2, py: 0 }}
                >
                  {bulkApplying
                    ? 'Applying…'
                    : stagedTags.length > 1
                      ? `Add ${stagedTags.length} tags`
                      : 'Add tag'}
                </PrimaryActionButton>
                <SecondaryActionButton
                  onClick={clearBulkTags}
                  disabled={bulkApplying}
                  sx={{ height: 32, px: 1.5, py: 0 }}
                >
                  Clear tags
                </SecondaryActionButton>
                <Tooltip title="Clear selection">
                  <IconButton
                    size="small"
                    onClick={clearSelection}
                    disabled={bulkApplying}
                    sx={{ width: 32, height: 32 }}
                  >
                    <Close sx={{ fontSize: 18, color: COLORS.text.muted }} />
                  </IconButton>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {guests.length > 0 && (
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderBottom: `1px solid ${COLORS.border.faint}`,
              bgcolor: COLORS.bg.white,
            }}
          >
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone"
              size="small"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: COLORS.text.faint }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearch('')}
                        aria-label="Clear search"
                        sx={{ color: COLORS.text.faint }}
                      >
                        <Close sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{
                maxWidth: 420,
                '& .MuiOutlinedInput-root': {
                  borderRadius: RADII.md,
                  bgcolor: COLORS.bg.white,
                  fontSize: '0.875rem',
                  '& input': { py: 0.75, color: COLORS.text.strong },
                  '& fieldset': { borderColor: COLORS.border.default },
                  '&:hover fieldset': { borderColor: COLORS.brand.primary },
                  '&.Mui-focused fieldset': {
                    borderColor: COLORS.brand.primary,
                    borderWidth: '1.5px',
                  },
                },
              }}
            />
          </Box>
        )}

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
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDraggedTag(null)}
          >
          <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
            <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 1120 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.bg.muted }}>
                  <TableCell sx={{ ...headerCell, width: 48, pr: 0 }} padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                      sx={{
                        color: COLORS.border.default,
                        '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: COLORS.brand.primary },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ ...headerCell, width: 240 }}>Guest</TableCell>
                  <TableCell sx={{ ...headerCell, width: 72 }} align="left">No.</TableCell>
                  <TableCell sx={{ ...headerCell, width: 260 }}>Email & phone</TableCell>
                  <TableCell sx={{ ...headerCell, width: 160 }}>Status</TableCell>
                  <TableCell sx={{ ...headerCell, width: 280, minWidth: 280 }}>Tags</TableCell>
                  <TableCell sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGuests.length === 0 && search ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center', color: COLORS.text.faint, border: 'none' }}>
                      <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
                        No guests match &ldquo;{search}&rdquo;.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredGuests.map((g) => {
                  const isSelected = selectedIds.has(g.id);
                  const fillHighlight = fillHovered.has(g.id);
                  // Narrow editing to this row only so memoized rows not being
                  // edited see a stable `null` / empty-string pair of props.
                  const isEditingThisRow = editing?.guestId === g.id;
                  return (
                    <GuestRow
                      key={g.id}
                      guest={g}
                      isSelected={isSelected}
                      fillHighlight={fillHighlight}
                      editingField={isEditingThisRow ? editing!.field : null}
                      draft={isEditingThisRow ? draft : ''}
                      existingTags={existingTags}
                      onToggleRow={toggleRow}
                      onBeginEdit={beginEdit}
                      onSetDraft={setDraft}
                      onCommitEdit={commitEdit}
                      onCancelEdit={cancelEdit}
                      onRemoveGuest={removeGuest}
                      onRemoveTag={removeTagFromGuest}
                      onAddTag={addTagToGuest}
                      onBeginFill={beginFill}
                      onOpenDetails={openDetails}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <DragOverlay dropAnimation={null}>
            {draggedTag ? (() => {
              const c = getTagColor(draggedTag);
              return (
                <Chip
                  label={draggedTag}
                  size="small"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    bgcolor: c.bg,
                    color: c.fg,
                    border: `1px solid ${c.border}`,
                    boxShadow: SHADOWS.popover,
                    cursor: 'grabbing',
                  }}
                />
              );
            })() : null}
          </DragOverlay>
          </DndContext>
        )}
      </Paper>

      {weddingId && (
        <GuestImportWizard
          open={importOpen}
          onClose={() => setImportOpen(false)}
          weddingId={weddingId}
          weddingSlug={weddingSlug}
          onImportComplete={load}
          initialTab={importTab}
          existingTags={existingTags}
        />
      )}

      {/* Detail drawer — opens on click of any non-tag cell. */}
      <GuestDetailDrawer
        open={detailGuestId !== null}
        guest={detailGuest}
        onClose={closeDetails}
        onSaved={(updated) => {
          setGuests((prev) =>
            prev.map((x) =>
              x.id === updated.id
                ? {
                    ...x,
                    name: updated.name,
                    email: updated.email,
                    phone: updated.phone,
                    logistics_data: updated.logistics_data as Guest['logistics_data'],
                  }
                : x,
            ),
          );
        }}
      />
    </Box>
  );
}

const headerCell = { fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong, bgcolor: COLORS.bg.muted, py: 1.25 } as const;
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
