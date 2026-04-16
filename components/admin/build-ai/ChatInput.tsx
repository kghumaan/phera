'use client';

import React from 'react';
import { Box, TextField, IconButton, alpha } from '@mui/material';
import { ArrowUpward } from '@mui/icons-material';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
  compact?: boolean;
  noBorder?: boolean;
}

export default function ChatInput({ input, onInputChange, onSend, disabled, placeholder = "Type your answer...", compact, noBorder }: ChatInputProps) {
  // Keep input + button exactly the same height so the send button renders as
  // a clean square with matching corner radius. Single-line in compact mode
  // (Ask Phera) so the field can't grow and desync the button height.
  const size = compact ? 48 : 56;
  const isCompact = !!compact;
  return (
    <Box
      sx={{
        px: compact ? 2 : 3,
        py: compact ? 1.5 : 2.5,
        ...(!noBorder && {
          borderTop: '2px solid',
          borderColor: alpha('#000', 0.12),
        }),
        display: 'flex',
        gap: compact ? 1 : 1.5,
        alignItems: 'center',
        bgcolor: 'white',
      }}
    >
      <TextField
        fullWidth
        multiline={!isCompact}
        maxRows={isCompact ? undefined : 4}
        placeholder={disabled ? "Use the form above..." : placeholder}
        value={input}
        onChange={e => onInputChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        disabled={disabled}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            bgcolor: 'white',
            height: isCompact ? size : undefined,
            minHeight: isCompact ? undefined : size,
            fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
            '& input': {
              py: { xs: 1.5, md: 1.75 },
              color: '#1a1a1a',
              fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
            },
            '& textarea': {
              color: '#1a1a1a',
              fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
            },
            '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
            '&:hover fieldset': { borderColor: '#DE3F5E' },
            '&.Mui-focused fieldset': { borderColor: '#DE3F5E', borderWidth: '2px' },
            '&.Mui-disabled': { bgcolor: alpha('#000', 0.02) },
          },
        }}
      />
      <IconButton
        onClick={onSend}
        disabled={!input.trim() || disabled}
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          bgcolor: input.trim() ? '#DE3F5E' : alpha('#000', 0.06),
          color: input.trim() ? 'white' : '#bbb',
          borderRadius: '12px',
          transition: 'all 0.15s',
          '&:hover': { bgcolor: input.trim() ? '#c73552' : alpha('#000', 0.08) },
          '&.Mui-disabled': { bgcolor: alpha('#000', 0.04), color: '#ccc' },
        }}
      >
        <ArrowUpward sx={{ fontSize: compact ? 20 : 22 }} />
      </IconButton>
    </Box>
  );
}
