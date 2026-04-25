'use client';

/**
 * Standard Phera dialog / modal.
 *
 * Wraps MUI Dialog with the dialog radius token and shared padding so
 * every modal in the app sits on the same rounded surface. Use
 * `PheraDialogTitle` for the serif-display header + close button combo.
 *
 * ```tsx
 * <PheraDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
 *   <PheraDialogTitle onClose={onClose}>Customize Wedding ID</PheraDialogTitle>
 *   <DialogContent>…</DialogContent>
 *   <DialogActions>…</DialogActions>
 * </PheraDialog>
 * ```
 */

import { Dialog, DialogTitle, IconButton, type DialogProps } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { ReactNode } from 'react';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';

export function PheraDialog({ PaperProps, ...rest }: DialogProps) {
  const userSx = (PaperProps as { sx?: object } | undefined)?.sx;
  return (
    <Dialog
      {...rest}
      PaperProps={{
        ...PaperProps,
        sx: {
          borderRadius: RADII.dialog,
          bgcolor: COLORS.bg.white,
          boxShadow: SHADOWS.dialog,
          ...userSx,
        },
      }}
    />
  );
}

export interface PheraDialogTitleProps {
  children: ReactNode;
  onClose?: () => void;
  sx?: object;
}

export function PheraDialogTitle({ children, onClose, sx }: PheraDialogTitleProps) {
  // Body font (Outfit), not display — dialog titles render at MUI's default
  // ~1.25rem which is well under the 2rem threshold for Instrument Serif.
  // CLAUDE.md rule #4: serif is reserved for h1/h2 (≥ 2rem).
  return (
    <DialogTitle
      sx={{
        fontWeight: 700,
        fontSize: '1.125rem',
        color: COLORS.text.strong,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pr: onClose ? 1 : 3,
        ...sx,
      }}
    >
      <span>{children}</span>
      {onClose && (
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{ color: COLORS.text.subtle }}
        >
          <Close fontSize="small" />
        </IconButton>
      )}
    </DialogTitle>
  );
}

export default PheraDialog;
