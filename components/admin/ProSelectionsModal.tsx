'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';

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
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1a1a1a', fontWeight: 600 }}>
        <AutoAwesome sx={{ color: '#DE3F5E', fontSize: 24 }} />
        You have Pro selections
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 2 }}>
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
                borderRadius: '10px',
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
                <Typography variant="caption" sx={{ color: '#6a6a6a', fontWeight: 500 }}>
                  {sel.category}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
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
          sx={{ color: '#6a6a6a', borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onUpgrade}
          startIcon={<AutoAwesome />}
          sx={{
            bgcolor: '#DE3F5E',
            color: 'white',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': { bgcolor: '#C8365A' },
          }}
        >
          Upgrade to Pro
        </Button>
      </DialogActions>
    </Dialog>
  );
}
