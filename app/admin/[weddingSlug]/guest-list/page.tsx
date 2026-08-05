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
  TableSortLabel,
  Tooltip,
  Checkbox,
  InputAdornment,
  DialogContent,
  DialogActions,
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
import { BulkTagPopover } from '@/components/admin/guests/BulkTagPopover';
import GuestDetailDrawer, { type GuestDetailRecord } from '@/components/admin/guests/GuestDetailDrawer';
import { useAgentTurnRefresh } from '@/lib/hooks/use-agent-turn-refresh';
import GroupGuestsDialog from '@/components/admin/guests/GroupGuestsDialog';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, FONTS, RADII, SCALES, SHADOWS } from '@/lib/theme/tokens';
import { getTagColor } from '@/lib/utils/tag-color';
import { Groups } from '@mui/icons-material';

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

const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform);

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
          borderRadius: RADII.pill,
          px: 0.5,
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
        '&.Mui-selected': { bgcolor: SCALES.raniPink[50] },
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
          {/* All companions on a single muted line: "+ Priya, Anil, Neha". */}
          {(() => {
            const names = [
              plusOneName,
              ...additionalGuests.map((ag) => ag.name).filter(Boolean),
            ].filter((n): n is string => !!n && n.length > 0);
            if (names.length === 0) return null;
            return (
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.8125rem',
                  color: COLORS.text.subtle,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={`+ ${names.join(', ')}`}
              >
                + {names.join(', ')}
              </Typography>
            );
          })()}
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
      {/* Status — derived from the latest rsvp record for this guest.
          "No response" renders as quiet placeholder text (per Figma); real
          responses keep their colored status pill. */}
      <TableCell onClick={openDetails} sx={{ ...bodyCell, ...EDIT_HINT, py: 1.75 }}>
        {(() => {
          const status = getRsvpStatus(g);
          const meta = RSVP_STATUS_META[status];
          if (status === 'no_response') {
            return (
              <Typography variant="body2" sx={{ color: SCALES.black[300] }}>
                {meta.label}
              </Typography>
            );
          }
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

  // "Group together" dialog — absorbs N selected guests into the primary's
  // logistics_data (plus_one + additional_guests) and deletes the rest.
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

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
  // Bulk staging lives behind the toolbar's single "Edit Tags" popover (per
  // Figma): additions AND removals are staged there, then applied in one write
  // so the whole change lands as one undo entry.
  const [stagedTags, setStagedTags] = useState<string[]>([]);
  const [stagedRemovals, setStagedRemovals] = useState<string[]>([]);
  const [bulkPopoverOpen, setBulkPopoverOpen] = useState(false);
  const editTagsBtnRef = useRef<HTMLButtonElement | null>(null);

  // Column sorting. null = insertion order (created_at desc from the query).
  type SortKey = 'name' | 'status' | 'tags';
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    // Silent refetches (agent-sidebar sync) skip the spinner so the table
    // doesn't flash away under the user mid-scroll.
    if (!opts?.silent) setLoading(true);
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

  // The agent may have added/edited/tagged guests from the docked Planner
  // sidebar — refetch quietly to stay in sync.
  useAgentTurnRefresh(() => load({ silent: true }));

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

  // Column sort applied on top of the search filter. Untagged guests always
  // sort last on the Tags column regardless of direction — a blank cell above
  // tagged rows never reads as intentional.
  const STATUS_RANK: Record<RsvpStatus, number> = useMemo(
    () => ({ attending: 0, maybe: 1, not_attending: 2, no_response: 3 }),
    [],
  );
  const sortedGuests = useMemo(() => {
    if (!sortKey) return filteredGuests;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filteredGuests].sort((a, b) => {
      if (sortKey === 'name') return dir * a.name.localeCompare(b.name);
      if (sortKey === 'status') {
        return dir * (STATUS_RANK[getRsvpStatus(a)] - STATUS_RANK[getRsvpStatus(b)]);
      }
      const ta = getTags(a);
      const tb = getTags(b);
      if (ta.length === 0 && tb.length === 0) return 0;
      if (ta.length === 0) return 1;
      if (tb.length === 0) return -1;
      return dir * ta.join(', ').toLowerCase().localeCompare(tb.join(', ').toLowerCase());
    });
  }, [filteredGuests, sortKey, sortDir, STATUS_RANK]);

  // Same column cycles asc → desc → off; a new column starts at asc.
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir('asc');
    }
  }, [sortKey, sortDir]);

  // Tags carried by at least one selected guest — the ✓ pills in the bulk popover.
  const selectionUnionTags = useMemo(() => {
    const set = new Set<string>();
    for (const g of guests) {
      if (!selectedIds.has(g.id)) continue;
      for (const t of getTags(g)) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [guests, selectedIds]);

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

  const applyTagEdits = useCallback(async (ids: string[], tagsToAdd: string[], tagsToRemove: string[] = []) => {
    const adds = tagsToAdd.map((t) => t.trim()).filter(Boolean);
    const removals = tagsToRemove.map((t) => t.trim()).filter(Boolean);
    if (ids.length === 0 || (adds.length === 0 && removals.length === 0)) return;

    // Compute the next logistics_data OUTSIDE the setState updater. React 18
    // runs updaters at flush time, AFTER this function's synchronous code —
    // populating a map inside the updater and reading it here left the map
    // empty, so DB writes silently no-oped while the UI showed the new tags.
    const idSet = new Set(ids);
    const prevById = new Map<string, Guest['logistics_data']>();
    const nextById = new Map<string, Record<string, unknown>>();
    for (const g of guestsRef.current) {
      if (!idSet.has(g.id)) continue;
      const current = getTags(g);
      const merged = Array.from(
        new Set([...current.filter((t) => !removals.includes(t)), ...adds]),
      );
      if (merged.length === current.length && merged.every((t, i) => t === current[i])) {
        continue; // no-op row — skip the write and the undo entry
      }
      prevById.set(g.id, g.logistics_data);
      nextById.set(g.id, buildLogisticsWithTags(g.logistics_data, merged));
    }
    if (nextById.size === 0) return;

    // Capture BEFORE mutating so the undo snapshot has the true pre-action state.
    const changedSnapshots = captureSnapshots(Array.from(nextById.keys()));

    setGuests((prev) =>
      prev.map((g) =>
        nextById.has(g.id)
          ? { ...g, logistics_data: nextById.get(g.id) as Guest['logistics_data'] }
          : g,
      ),
    );

    const n = changedSnapshots.length;
    const label =
      removals.length > 0
        ? `Updated tags on ${n} guest${n === 1 ? '' : 's'}`
        : adds.length === 1
          ? `Added "${adds[0]}" to ${n} guest${n === 1 ? '' : 's'}`
          : `Added ${adds.length} tags to ${n} guest${n === 1 ? '' : 's'}`;
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

  // Add-only path used by row edit, drag-chip, and the fill handle.
  const appendTagsToIds = useCallback(async (ids: string[], tagsToAdd: string[]) => {
    await applyTagEdits(ids, tagsToAdd, []);
  }, [applyTagEdits]);

  const clearTagsForIds = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    // Next values computed outside the updater (see applyTagEdits). Only
    // guests that actually had tags get a write or an undo snapshot.
    const idSet = new Set(ids);
    const prevById = new Map<string, Guest['logistics_data']>();
    const nextById = new Map<string, Record<string, unknown>>();
    for (const g of guestsRef.current) {
      if (!idSet.has(g.id) || getTags(g).length === 0) continue;
      prevById.set(g.id, g.logistics_data);
      nextById.set(g.id, buildLogisticsWithTags(g.logistics_data, []));
    }
    if (nextById.size === 0) return;

    const snapshots = captureSnapshots(Array.from(nextById.keys()));

    setGuests((prev) =>
      prev.map((g) =>
        nextById.has(g.id)
          ? { ...g, logistics_data: nextById.get(g.id) as Guest['logistics_data'] }
          : g,
      ),
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
    // Next value computed outside the updater (see applyTagEdits).
    const guest = guestsRef.current.find((g) => g.id === id);
    if (!guest) return;
    const remaining = getTags(guest).filter((t) => t !== tag);
    if (remaining.length === getTags(guest).length) return;
    const prev = guest.logistics_data;
    const next = buildLogisticsWithTags(prev, remaining);

    const snapshots = captureSnapshots([id]);
    setGuests((list) =>
      list.map((g) => (g.id === id ? { ...g, logistics_data: next as Guest['logistics_data'] } : g)),
    );

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

  // Delete-confirmation dialog flow. Triggers from per-row delete icon AND
  // bulk delete in the selection bar — both funnel through `pendingDelete`
  // so the same Phera-styled modal is the single confirmation surface (no
  // browser confirm()).
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const requestDeleteGuests = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setPendingDelete(ids);
  }, []);

  const cancelDeleteGuests = useCallback(() => {
    if (deleting) return;
    setPendingDelete(null);
  }, [deleting]);

  const confirmDeleteGuests = useCallback(async () => {
    const ids = pendingDelete;
    if (!ids || ids.length === 0) return;
    setDeleting(true);
    // FKs that previously blocked guest deletes (coordination_issues +
    // whatsapp_broadcasts) now cascade / set null at the DB level (see
    // migration guests_fk_cascade_cleanup) — no client-side child cleanup
    // needed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests.delete() isn't captured by generated supabase types
    const { error } = await (supabase as any).from('guests').delete().in('id', ids);
    setDeleting(false);
    if (error) {
      console.error('guest delete error:', error);
      return;
    }
    const idSet = new Set(ids);
    setGuests((prev) => prev.filter((g) => !idSet.has(g.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
    setPendingDelete(null);
    try {
      const channel = new BroadcastChannel('phera-guests-sync');
      channel.postMessage({ type: 'GUESTS_UPDATED' });
      channel.close();
    } catch {
      // BroadcastChannel unavailable — non-critical.
    }
  }, [pendingDelete]);

  const removeGuest = useCallback((id: string) => {
    requestDeleteGuests([id]);
  }, [requestDeleteGuests]);

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

  const resetBulkStaging = () => {
    setBulkTagDraft('');
    setStagedTags([]);
    setStagedRemovals([]);
    setBulkPopoverOpen(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    resetBulkStaging();
  };

  // One toggle drives every pill in the popover: a staged addition unstages,
  // a tag on the selection toggles in/out of the removal set, anything else
  // stages as an addition.
  const toggleBulkTag = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    if (stagedTags.includes(t)) {
      setStagedTags((prev) => prev.filter((x) => x !== t));
    } else if (selectionUnionTags.includes(t)) {
      setStagedRemovals((prev) =>
        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
      );
    } else {
      setStagedTags((prev) => [...prev, t]);
    }
  };

  const applyStagedBulkTags = async () => {
    if (selectedIds.size === 0 || (stagedTags.length === 0 && stagedRemovals.length === 0)) return;
    setBulkApplying(true);
    await applyTagEdits(Array.from(selectedIds), stagedTags, stagedRemovals);
    setBulkApplying(false);
    resetBulkStaging();
    setSelectedIds(new Set());
  };

  const clearBulkTags = async () => {
    if (selectedIds.size === 0) return;
    setBulkApplying(true);
    await clearTagsForIds(Array.from(selectedIds));
    setBulkApplying(false);
    resetBulkStaging();
    setSelectedIds(new Set());
  };

  // Cmd/Ctrl+Z undoes the last tag action (matches the floating Undo pill).
  // Skipped while typing so text-field undo keeps native behavior.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (undoStack.length === 0 || undoing) return;
      e.preventDefault();
      void undoLast();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undoStack.length, undoing, undoLast]);

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
          borderRadius: RADII.xl,
          border: `1px solid ${SCALES.black[50]}`,
          bgcolor: COLORS.bg.white,
          // 'clip' (not 'hidden') keeps the rounded-corner clipping without
          // creating a scroll container — required for the sticky toolbar.
          overflow: 'clip',
        }}
      >
        {/* Toolbar — sticky just below the fixed top nav so the bulk actions
            (Group together, delete, Edit Tags) stay reachable while scrolling. */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2.5,
            py: 1.5,
            borderBottom: `1px solid ${COLORS.border.faint}`,
            minHeight: 56,
            position: 'sticky',
            top: { xs: '48px', md: '56px' },
            zIndex: 5,
            bgcolor: COLORS.bg.white,
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
            sx={{ fontSize: '0.875rem', fontWeight: 600, bgcolor: SCALES.black[50], color: COLORS.text.muted }}
          />

          {/* Selection cluster — count, Group together, delete, clear (per Figma). */}
          <AnimatePresence initial={false}>
            {selectedIds.size > 0 && (
              <motion.div
                key="selection-cluster"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, flexShrink: 0 }}
              >
                <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {selectedIds.size} selected
                </Typography>
                {selectedIds.size >= 2 && (
                  <PrimaryActionButton
                    onClick={() => setGroupDialogOpen(true)}
                    disabled={bulkApplying}
                    startIcon={<Groups sx={{ fontSize: 18 }} />}
                    sx={{ height: 33, px: 2, py: 0, borderRadius: RADII.pill }}
                  >
                    Group together
                  </PrimaryActionButton>
                )}
                <Tooltip title={`Delete ${selectedIds.size} guest${selectedIds.size === 1 ? '' : 's'}`}>
                  <IconButton
                    size="small"
                    onClick={() => requestDeleteGuests(Array.from(selectedIds))}
                    disabled={bulkApplying}
                    sx={{
                      width: 33,
                      height: 33,
                      borderRadius: RADII.md,
                      color: SCALES.raniPink[600],
                      bgcolor: SCALES.raniPink[100],
                      '&:hover': { bgcolor: SCALES.raniPink[200] },
                    }}
                  >
                    <Delete sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear selection">
                  <IconButton
                    size="small"
                    onClick={clearSelection}
                    disabled={bulkApplying}
                    sx={{ width: 33, height: 33 }}
                  >
                    <Close sx={{ fontSize: 18, color: COLORS.text.muted }} />
                  </IconButton>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>

          <Box sx={{ flex: 1 }} />

          {/* Edit Tags — the single entry point for bulk tag editing. Count =
              tags in use across the wedding (matches Figma). */}
          {guests.length > 0 && (
            <Button
              ref={editTagsBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                setBulkPopoverOpen((o) => !o);
              }}
              disabled={bulkApplying}
              startIcon={<Add sx={{ fontSize: 16 }} />}
              sx={{
                height: 36,
                px: 1.75,
                py: 0,
                flexShrink: 0,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: RADII.pill,
                border: `1px dashed ${
                  selectedIds.size > 0 || bulkPopoverOpen ? COLORS.brand.primary : COLORS.border.default
                }`,
                color: selectedIds.size > 0 || bulkPopoverOpen ? COLORS.brand.primary : COLORS.text.strong,
                ...(bulkPopoverOpen && { borderStyle: 'solid', bgcolor: COLORS.brand.primarySubtle }),
                '&:hover': {
                  borderColor: COLORS.brand.primary,
                  color: COLORS.brand.primary,
                  borderStyle: 'solid',
                  bgcolor: COLORS.brand.primarySubtle,
                },
                '& .MuiButton-startIcon': { mr: 0.5 },
              }}
            >
              Edit Tags{existingTags.length > 0 ? ` (${existingTags.length})` : ''}
            </Button>
          )}
          <BulkTagPopover
            open={bulkPopoverOpen}
            anchorEl={editTagsBtnRef.current}
            selectedCount={selectedIds.size}
            unionTags={selectionUnionTags}
            stagedAdds={stagedTags}
            stagedRemovals={stagedRemovals}
            existingTags={existingTags}
            draft={bulkTagDraft}
            onSetDraft={setBulkTagDraft}
            onToggleTag={toggleBulkTag}
            onApply={applyStagedBulkTags}
            onClearAll={clearBulkTags}
            onClose={() => {
              setBulkPopoverOpen(false);
              setBulkTagDraft('');
            }}
            applying={bulkApplying}
          />

          {guests.length > 0 && (
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone"
              size="small"
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
                ml: 2,
                width: { xs: '100%', sm: 280, md: 320 },
                // Quiet filled input per Figma — gray wash, border only appears
                // on hover/focus.
                '& .MuiOutlinedInput-root': {
                  borderRadius: RADII.md,
                  bgcolor: COLORS.bg.subtle,
                  fontSize: '0.875rem',
                  '& input': { py: 0.75, color: COLORS.text.strong },
                  '& input::placeholder': { color: SCALES.black[400], opacity: 1 },
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: COLORS.border.default },
                  '&.Mui-focused': { bgcolor: COLORS.bg.white },
                  '&.Mui-focused fieldset': {
                    borderColor: COLORS.brand.primary,
                    borderWidth: '1.5px',
                  },
                },
              }}
            />
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
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDraggedTag(null)}
          >
          {/* maxHeight turns the container into the vertical scroll region on
              md+ so stickyHeader keeps the column headers pinned while rows
              scroll. On xs the page itself scrolls (better on phones) and the
              sticky toolbar above still keeps the actions visible. */}
          <TableContainer
            sx={{
              overflowX: 'auto',
              maxWidth: '100%',
              maxHeight: { md: 'calc(100vh - 340px)' },
            }}
          >
            <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth: 1120 }}>
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
                  <TableCell sx={{ ...headerCell, width: 240 }} sortDirection={sortKey === 'name' ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === 'name'}
                      direction={sortKey === 'name' ? sortDir : 'asc'}
                      onClick={() => handleSort('name')}
                      sx={sortLabelSx}
                    >
                      Guest
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ ...headerCell, width: 72 }} align="left">No.</TableCell>
                  <TableCell sx={{ ...headerCell, width: 260 }}>Email & phone</TableCell>
                  <TableCell sx={{ ...headerCell, width: 160 }} sortDirection={sortKey === 'status' ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === 'status'}
                      direction={sortKey === 'status' ? sortDir : 'asc'}
                      onClick={() => handleSort('status')}
                      sx={sortLabelSx}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ ...headerCell, width: 280, minWidth: 280 }} sortDirection={sortKey === 'tags' ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === 'tags'}
                      direction={sortKey === 'tags' ? sortDir : 'asc'}
                      onClick={() => handleSort('tags')}
                      sx={sortLabelSx}
                    >
                      Tags
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ ...headerCell, width: 60 }} />
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
                {sortedGuests.map((g) => {
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
                    borderRadius: RADII.pill,
                    px: 0.5,
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

      {/* Floating undo pill (per Figma) — sticks above the scrollport bottom
          so the escape hatch is visible right after any tag change. */}
      <AnimatePresence initial={false}>
        {undoStack.length > 0 && (
          <motion.div
            key="undo-pill"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'sticky',
              bottom: 16,
              zIndex: 10,
              display: 'flex',
              justifyContent: 'flex-end',
              pointerEvents: 'none',
              marginTop: 12,
            }}
          >
            <Tooltip title={undoStack[undoStack.length - 1]?.label ?? ''}>
              <Box
                component="button"
                onClick={undoLast}
                disabled={undoing}
                sx={{
                  pointerEvents: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2.5,
                  py: 1.25,
                  border: 'none',
                  borderRadius: RADII.pill,
                  bgcolor: SCALES.plum[900],
                  color: COLORS.bg.white,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  fontFamily: FONTS.body,
                  cursor: 'pointer',
                  boxShadow: SHADOWS.popover,
                  '&:hover': { bgcolor: SCALES.plum[800] },
                  '&:disabled': { opacity: 0.7, cursor: 'default' },
                }}
              >
                <Undo sx={{ fontSize: 18 }} />
                {undoing ? 'Undoing…' : `Undo (${IS_MAC ? '⌘' : 'Ctrl+'}Z)`}
              </Box>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {weddingId && (
        <GuestImportWizard
          open={importOpen}
          onClose={() => setImportOpen(false)}
          weddingId={weddingId}
          weddingSlug={weddingSlug}
          onImportComplete={() => void load()}
          initialTab={importTab}
          existingTags={existingTags}
        />
      )}

      {/* Group-creation modal — fired from the bulk action bar. */}
      <GroupGuestsDialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        selected={Array.from(selectedIds)
          .map((id) => guests.find((g) => g.id === id))
          .filter((g): g is Guest => !!g)
          .map((g) => ({
            id: g.id,
            name: g.name,
            phone: g.phone,
            logistics_data: g.logistics_data as Record<string, unknown> | null,
          }))}
        onCreated={() => {
          setSelectedIds(new Set());
          load();
        }}
      />

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

      {/* Delete-guest confirmation modal. Same dialog handles single-row +
          bulk deletes — pendingDelete carries the id list. */}
      <PheraDialog
        open={pendingDelete !== null}
        onClose={cancelDeleteGuests}
        maxWidth="xs"
        fullWidth
      >
        <PheraDialogTitle onClose={cancelDeleteGuests}>
          {pendingDelete && pendingDelete.length > 1
            ? `Delete ${pendingDelete.length} guests?`
            : 'Delete this guest?'}
        </PheraDialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.55 }}>
            {pendingDelete && pendingDelete.length > 1
              ? `${pendingDelete.length} guests will be permanently removed from this wedding, along with their RSVPs and tags. This can't be undone.`
              : "This guest will be permanently removed, along with their RSVPs and tags. This can't be undone."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <SecondaryActionButton onClick={cancelDeleteGuests} disabled={deleting}>
            Cancel
          </SecondaryActionButton>
          <PrimaryActionButton
            onClick={confirmDeleteGuests}
            disabled={deleting}
            startIcon={<Delete sx={{ fontSize: 18 }} />}
          >
            {deleting
              ? 'Deleting…'
              : pendingDelete && pendingDelete.length > 1
                ? `Delete ${pendingDelete.length} guests`
                : 'Delete'}
          </PrimaryActionButton>
        </DialogActions>
      </PheraDialog>
    </Box>
  );
}

const headerCell = { fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong, bgcolor: COLORS.bg.muted, py: 1.25 } as const;
const sortLabelSx = {
  color: 'inherit !important',
  '& .MuiTableSortLabel-icon': { fontSize: 16, color: `${COLORS.brand.primary} !important` },
} as const;
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
