'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';
import { ActionButton } from './ActionButton';
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
  confirmColor = '#d32f2f',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: RADII.lg,
          bgcolor: COLORS.bg.white,
        },
      }}
    >
      <DialogTitle sx={{ color: COLORS.text.strong, fontWeight: 600 }}>{title}</DialogTitle>
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
    </Dialog>
  );
}
