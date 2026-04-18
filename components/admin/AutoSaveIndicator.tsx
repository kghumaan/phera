'use client';

import { Box, Typography } from '@mui/material';
import { Check, ErrorOutline } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { SaveStatus } from '@/lib/hooks/useAutoSave';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  message?: string | null;
}

export default function AutoSaveIndicator({ status, message }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {status === 'saving' && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    border: '2px solid #ccc',
                    borderTopColor: COLORS.brand.primary,
                    borderRadius: '50%',
                  }}
                />
              </motion.div>
              <Typography variant="caption" sx={{ color: COLORS.text.faint, fontSize: '0.875rem' }}>
                {message || 'Saving...'}
              </Typography>
            </>
          )}
          {status === 'saved' && (
            <>
              <Check sx={{ fontSize: 16, color: COLORS.accent.success }} />
              <Typography variant="caption" sx={{ color: COLORS.accent.success, fontSize: '0.875rem', fontWeight: 500 }}>
                {message || 'Saved'}
              </Typography>
            </>
          )}
          {status === 'error' && (
            <>
              <ErrorOutline sx={{ fontSize: 16, color: COLORS.accent.danger }} />
              <Typography variant="caption" sx={{ color: COLORS.accent.danger, fontSize: '0.875rem' }}>
                {message || 'Error saving'}
              </Typography>
            </>
          )}
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}
