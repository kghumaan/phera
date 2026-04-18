'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { FONTS, COLORS } from '@/lib/theme/tokens';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OtpInput({ length = 6, value, onChange, disabled = false, autoFocus = true }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length && inputRefs.current[index]) {
      inputRefs.current[index]!.focus();
    }
  }, [length]);

  const handleChange = (index: number, char: string) => {
    if (disabled) return;

    // Only allow digits
    const digit = char.replace(/\D/g, '').slice(-1);
    if (!digit && char !== '') return;

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('').replace(/\s/g, '');
    onChange(newValue);

    // Auto-advance to next input
    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        // Clear current digit
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join('').replace(/\s/g, ''));
      } else if (index > 0) {
        // Move back and clear previous
        focusInput(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join('').replace(/\s/g, ''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (disabled) return;

    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, length - 1));
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, justifyContent: 'center' }}>
      {Array.from({ length }).map((_, i) => (
        <Box
          key={i}
          component="input"
          ref={(el: HTMLInputElement | null) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(i, e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
          disabled={disabled}
          sx={{
            width: { xs: 44, sm: 52 },
            height: { xs: 52, sm: 60 },
            borderRadius: '12px',
            border: '1.5px solid',
            borderColor: digits[i] ? COLORS.brand.primary : 'rgba(0, 0, 0, 0.23)',
            bgcolor: 'white',
            textAlign: 'center',
            fontSize: { xs: '22px', sm: '28px' },
            fontWeight: 600,
            fontFamily: FONTS.body,
            color: COLORS.text.strong,
            outline: 'none',
            caretColor: COLORS.brand.primary,
            transition: 'border-color 0.15s ease',
            '&:focus': {
              borderColor: COLORS.brand.primary,
              borderWidth: '2px',
              boxShadow: '0 0 0 3px rgba(222, 63, 94, 0.1)',
            },
            '&:disabled': {
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(0, 0, 0, 0.15)',
              color: COLORS.text.muted,
            },
            '&::placeholder': {
              color: COLORS.text.faint,
            },
          }}
        />
      ))}
    </Box>
  );
}
