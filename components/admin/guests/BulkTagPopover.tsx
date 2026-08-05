'use client';

/**
 * Bulk tag editor — one popover anchored to the toolbar's "Edit Tags" button
 * (per the Figma "Guest List Tags" flow). Everything tag-related for the
 * current selection happens here:
 *
 *   - "Type a tag" input (Enter stages the typed tag as an addition)
 *   - Checked colored pills = tags currently on the selected guests plus any
 *     staged additions; clicking one toggles it off (existing tag → staged
 *     removal, staged addition → unstaged)
 *   - SUGGESTED TAGS = the wedding's other tags; clicking stages an addition
 *   - Footer: "Clear All Tags" (immediate) + "Add N Tags" / "Apply Changes"
 *
 * Nothing writes until Apply — the parent owns the staged state and the
 * actual writers, so undo capture stays in one place.
 */

import { Box, Chip, ClickAwayListener, Paper, Popper, TextField, Typography } from '@mui/material';
import { Check } from '@mui/icons-material';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';
import { getTagColor } from '@/lib/utils/tag-color';

export interface BulkTagPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  selectedCount: number;
  /** Tags carried by at least one selected guest. */
  unionTags: string[];
  stagedAdds: string[];
  stagedRemovals: string[];
  /** Every tag in use across the wedding (suggestion pool). */
  existingTags: string[];
  draft: string;
  onSetDraft: (s: string) => void;
  /** Stage/unstage a tag — parent decides add vs removal from current state. */
  onToggleTag: (tag: string) => void;
  onApply: () => void;
  onClearAll: () => void;
  onClose: () => void;
  applying: boolean;
}

export function BulkTagPopover({
  open,
  anchorEl,
  selectedCount,
  unionTags,
  stagedAdds,
  stagedRemovals,
  existingTags,
  draft,
  onSetDraft,
  onToggleTag,
  onApply,
  onClearAll,
  onClose,
  applying,
}: BulkTagPopoverProps) {
  const q = draft.trim().toLowerCase();

  // Active pills: on the selection (minus staged removals) plus staged adds.
  const activeTags = [
    ...unionTags.filter((t) => !stagedRemovals.includes(t)),
    ...stagedAdds.filter((t) => !unionTags.includes(t)),
  ];
  // Removal-marked pills render greyed-out in place so the pending change is visible.
  const removedTags = unionTags.filter((t) => stagedRemovals.includes(t));

  const suggestions = existingTags.filter(
    (t) => !unionTags.includes(t) && !stagedAdds.includes(t) && (!q || t.toLowerCase().includes(q)),
  );
  const hasExactMatch =
    q.length > 0 &&
    [...existingTags, ...stagedAdds].some((t) => t.toLowerCase() === q);

  const stagedCount = stagedAdds.length + stagedRemovals.length;
  const applyLabel =
    stagedRemovals.length > 0
      ? 'Apply Changes'
      : `Add ${stagedAdds.length} Tag${stagedAdds.length === 1 ? '' : 's'}`;

  const commitTyped = () => {
    const v = draft.trim();
    if (!v) return;
    onToggleTag(v);
    onSetDraft('');
  };

  if (!open || !anchorEl) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-end"
      style={{ zIndex: 1300 }}
      modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={0}
          sx={{
            width: 360,
            p: 2,
            borderRadius: RADII.lg,
            border: `1px solid ${COLORS.border.light}`,
            bgcolor: COLORS.bg.white,
            boxShadow: SHADOWS.popover,
          }}
        >
          {selectedCount === 0 ? (
            <Typography variant="body2" sx={{ color: COLORS.text.subtle, py: 1, textAlign: 'center' }}>
              Select guests in the table first, then edit their tags here.
            </Typography>
          ) : (
            <>
              <TextField
                autoFocus
                fullWidth
                size="small"
                placeholder="Type a tag"
                value={draft}
                onChange={(e) => onSetDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitTyped();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: RADII.sm,
                    bgcolor: COLORS.bg.white,
                    fontSize: '0.875rem',
                    '& input': { py: 0.75, fontSize: '0.875rem', color: COLORS.text.strong },
                    '& fieldset': { borderColor: COLORS.border.default },
                    '&:hover fieldset': { borderColor: COLORS.brand.primary },
                    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary, borderWidth: '1.5px' },
                  },
                }}
              />

              {q && !hasExactMatch && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`Create "${draft.trim()}"`}
                    size="small"
                    onClick={commitTyped}
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      bgcolor: COLORS.brand.primarySubtle,
                      color: COLORS.brand.primary,
                      border: `1px solid ${COLORS.brand.primaryBorder}`,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: COLORS.brand.primaryWash },
                    }}
                  />
                </Box>
              )}

              {(activeTags.length > 0 || removedTags.length > 0) && (
                <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {activeTags.map((t) => {
                    const c = getTagColor(t);
                    return (
                      <Chip
                        key={t}
                        icon={<Check sx={{ fontSize: 15, color: `${c.fg} !important` }} />}
                        label={t}
                        size="small"
                        onClick={() => onToggleTag(t)}
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          bgcolor: c.bg,
                          color: c.fg,
                          borderRadius: RADII.pill,
                          cursor: 'pointer',
                          '& .MuiChip-icon': { ml: 0.75, mr: -0.5 },
                          '&:hover': { bgcolor: c.bg, opacity: 0.85 },
                        }}
                      />
                    );
                  })}
                  {removedTags.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      onClick={() => onToggleTag(t)}
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        bgcolor: COLORS.bg.subtle,
                        color: COLORS.text.faint,
                        borderRadius: RADII.pill,
                        cursor: 'pointer',
                        textDecoration: 'line-through',
                        '&:hover': { bgcolor: COLORS.bg.muted },
                      }}
                    />
                  ))}
                </Box>
              )}

              {suggestions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitleCaps"
                    sx={{ color: COLORS.text.muted, mb: 1, display: 'block' }}
                  >
                    Suggested Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {suggestions.map((t) => (
                      <Chip
                        key={t}
                        label={t}
                        size="small"
                        onClick={() => onToggleTag(t)}
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          bgcolor: COLORS.bg.subtle,
                          color: COLORS.text.strong,
                          borderRadius: RADII.pill,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: COLORS.bg.muted },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <SecondaryActionButton
                  onClick={onClearAll}
                  disabled={applying || unionTags.length === 0}
                  sx={{ height: 36, px: 2, py: 0 }}
                >
                  Clear All Tags
                </SecondaryActionButton>
                {stagedCount > 0 && (
                  <PrimaryActionButton
                    onClick={onApply}
                    disabled={applying}
                    sx={{ height: 36, px: 2, py: 0 }}
                  >
                    {applying ? 'Applying…' : applyLabel}
                  </PrimaryActionButton>
                )}
              </Box>
            </>
          )}
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}

export default BulkTagPopover;
