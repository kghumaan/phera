'use client';

/**
 * Tag picker popover — anchored to a "+" button. Click a suggestion → append
 * (stays open for multi-add). Type + Enter → append custom (clears draft, stays
 * open). Escape or click-away → close.
 *
 * Shared between the guest-list per-row tag UX and the Guest Import Wizard
 * manual-add form.
 */

import { Box, Chip, ClickAwayListener, Paper, Popper, TextField, Typography } from '@mui/material';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';
import { getTagColor } from '@/lib/utils/tag-color';

export interface TagPickerProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  draft: string;
  onSetDraft: (s: string) => void;
  existingTags: string[];
  currentTags: string[];
  onAdd: (tag: string) => void;
  onClose: () => void;
}

export function TagPicker({
  open,
  anchorEl,
  draft,
  onSetDraft,
  existingTags,
  currentTags,
  onAdd,
  onClose,
}: TagPickerProps) {
  const q = draft.trim().toLowerCase();
  const suggestions = existingTags.filter(
    (t) => !currentTags.includes(t) && (!q || t.toLowerCase().includes(q)),
  );
  const hasExactMatch = q.length > 0 && existingTags.some((t) => t.toLowerCase() === q);

  const commitTyped = () => {
    const v = draft.trim();
    if (!v || currentTags.includes(v)) return;
    onAdd(v);
    onSetDraft('');
  };

  if (!open || !anchorEl) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      style={{ zIndex: 1300 }}
      modifiers={[{ name: 'offset', options: { offset: [0, 6] } }]}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={0}
          sx={{
            minWidth: 280,
            maxWidth: 360,
            p: 1.5,
            borderRadius: RADII.md,
            border: `1px solid ${COLORS.border.light}`,
            bgcolor: COLORS.bg.white,
            boxShadow: SHADOWS.popover,
          }}
        >
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

          {suggestions.length > 0 ? (
            <Box sx={{ mt: 1.25 }}>
              <Typography
                variant="subtitleCaps"
                sx={{ color: COLORS.text.muted, mb: 0.75, display: 'block' }}
              >
                Suggested tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {suggestions.map((t) => {
                  const c = getTagColor(t);
                  return (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      onClick={() => onAdd(t)}
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        bgcolor: COLORS.bg.white,
                        color: COLORS.text.strong,
                        border: `1px solid ${COLORS.border.default}`,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: c.bg,
                          color: c.fg,
                          borderColor: c.border,
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          ) : (
            !q && (
              <Typography variant="body2" sx={{ mt: 1.25, color: COLORS.text.faint }}>
                No tags yet. Type one and press Enter.
              </Typography>
            )
          )}
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}

export default TagPicker;
