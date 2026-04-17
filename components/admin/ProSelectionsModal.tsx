'use client';

import { DialogContent, DialogActions, Button, Box, Typography, Stack } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { PrimaryActionButton } from './ActionButton';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { COLORS, RADII } from '@/lib/theme/tokens';

export interface ProSelection {
  category: string;
  name: string;
  color?: string;
}

interface ProSelectionsModalProps {
  open: boolean;
  selections: ProSelection[];
  onCancel: () => void;
  onUpgrade: () => void;
}

export default function ProSelectionsModal({ open, selections, onCancel, onUpgrade }: ProSelectionsModalProps) {
  return (
    <PheraDialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { p: 1 } }}
    >
      <PheraDialogTitle onClose={onCancel}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome sx={{ color: COLORS.brand.primary, fontSize: 24 }} />
          You have Pro selections
        </Box>
      </PheraDialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
          The following selections require a Pro plan:
        </Typography>
        <Stack spacing={1.5}>
          {selections.map((sel, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: RADII.sm,
                bgcolor: '#f8f8f8',
                border: '1px solid rgba(0,0,0,0.07)',
              }}
            >
              {sel.color && (
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    bgcolor: sel.color,
                    flexShrink: 0,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
              )}
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.text.subtle, fontWeight: 500 }}>
                  {sel.category}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                  {sel.name}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onCancel}
          sx={{ color: COLORS.text.subtle, borderRadius: RADII.md, textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <PrimaryActionButton
          onClick={onUpgrade}
          startIcon={<AutoAwesome />}
          sx={{ px: 3 }}
        >
          Upgrade to Pro
        </PrimaryActionButton>
      </DialogActions>
    </PheraDialog>
  );
}
