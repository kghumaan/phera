'use client';

import { Box, DialogContent, Stack, Typography, CircularProgress } from '@mui/material';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { ErrorAlert } from '@/components/shared/Alert';
import { COLORS, FONTS } from '@/lib/theme/tokens';

interface ConfirmChargeModalProps {
  open: boolean;
  amountLabel: string; // e.g. "$249"
  cardLast4?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function ConfirmChargeModal({
  open,
  amountLabel,
  cardLast4,
  onCancel,
  onConfirm,
  loading = false,
  error = null,
}: ConfirmChargeModalProps) {
  return (
    <PheraDialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <PheraDialogTitle onClose={loading ? undefined : onCancel}>
        Charge {amountLabel}?
      </PheraDialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
            We&apos;ll charge {amountLabel} to your saved card
            {cardLast4 ? (
              <> ending in <Box component="span" sx={{ fontWeight: 600, color: COLORS.text.strong }}>{cardLast4}</Box></>
            ) : (
              <> on file</>
            )}
            {' '}for this new wedding.
          </Typography>

          {error && <ErrorAlert>{error}</ErrorAlert>}

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
            <SecondaryActionButton onClick={onCancel} disabled={loading}>
              Cancel
            </SecondaryActionButton>
            <PrimaryActionButton onClick={onConfirm} disabled={loading}>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  <Box component="span" sx={{ fontFamily: FONTS.body }}>Charging…</Box>
                </Box>
              ) : (
                `Charge ${amountLabel}`
              )}
            </PrimaryActionButton>
          </Stack>
        </Stack>
      </DialogContent>
    </PheraDialog>
  );
}
