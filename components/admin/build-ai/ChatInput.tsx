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
  const size = compact ? 40 : 48;
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
        alignItems: 'stretch',
        bgcolor: 'white',
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
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
            fontSize: compact ? '0.88rem' : '1rem',
            bgcolor: 'white',
            minHeight: size,
            '& fieldset': { border: '2px solid', borderColor: alpha('#000', 0.15) },
            '&:hover fieldset': { borderColor: alpha('#000', 0.25) },
            '&.Mui-focused fieldset': { border: '2px solid #DE3F5E' },
            '&.Mui-disabled': { bgcolor: alpha('#000', 0.02) },
          },
          '& .MuiOutlinedInput-input': { py: compact ? 0.75 : 1.25, px: compact ? 1.5 : 2 },
        }}
      />
      <IconButton
        onClick={onSend}
        disabled={!input.trim() || disabled}
        sx={{
          width: size, minHeight: size,
          bgcolor: input.trim() ? '#DE3F5E' : alpha('#000', 0.06),
          color: input.trim() ? 'white' : '#bbb',
          borderRadius: '12px',
          flexShrink: 0,
          transition: 'all 0.15s',
          border: '2px solid',
          borderColor: input.trim() ? '#DE3F5E' : alpha('#000', 0.15),
          '&:hover': { bgcolor: input.trim() ? '#c73552' : alpha('#000', 0.08) },
          '&.Mui-disabled': { bgcolor: alpha('#000', 0.04), color: '#ccc', borderColor: alpha('#000', 0.1) },
        }}
      >
        <ArrowUpward sx={{ fontSize: compact ? 18 : 22 }} />
      </IconButton>
    </Box>
  );
}
