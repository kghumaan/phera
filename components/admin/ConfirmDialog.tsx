'use client';

import {
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';
import { ActionButton } from './ActionButton';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmColor = COLORS.brand.primary,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <PheraDialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
    >
      <PheraDialogTitle onClose={onCancel}>{title}</PheraDialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ color: COLORS.text.muted }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onCancel}
          sx={{
            color: COLORS.text.subtle,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: RADII.md,
          }}
        >
          {cancelLabel}
        </Button>
        <ActionButton
          variant="contained"
          onClick={onConfirm}
          loading={isLoading}
          sx={{
            bgcolor: confirmColor,
            color: COLORS.text.inverse,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: RADII.md,
            minWidth: 80,
            '&:hover': {
              bgcolor: confirmColor,
              filter: 'brightness(0.9)',
            },
          }}
        >
          {confirmLabel}
        </ActionButton>
      </DialogActions>
    </PheraDialog>
  );
}
