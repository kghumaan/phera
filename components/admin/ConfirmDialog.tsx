'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
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
          borderRadius: '16px',
          bgcolor: 'white',
        },
      }}
    >
      <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onCancel}
          sx={{
            color: '#6a6a6a',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{
            bgcolor: confirmColor,
            color: 'white',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            '&:hover': {
              bgcolor: confirmColor,
              filter: 'brightness(0.9)',
            },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
