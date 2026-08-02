'use client';

/**
 * Password input with visibility toggle and optional copy-to-clipboard button.
 *
 * - Admin reveal mode: pass `showCopy`. Eye toggle + copy icon inside the
 *   end adornment so admins can share the wedding password with guests.
 * - Guest entry mode: omit `showCopy`. Only the eye toggle renders.
 *
 * Inherits all TextFieldProps so callers can still set `sx`, `size`,
 * `fullWidth`, etc. For guest-facing screens pass `sx={guestTextFieldSx(color)}`.
 */

import { TextField, InputAdornment, IconButton, Tooltip, type TextFieldProps } from '@mui/material';
import { Visibility, VisibilityOff, ContentCopy, Check } from '@mui/icons-material';
import { forwardRef, useState } from 'react';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { COLORS } from '@/lib/theme/tokens';

export interface PheraPasswordFieldProps extends Omit<TextFieldProps, 'type'> {
  showCopy?: boolean;
  adminStyle?: boolean;
}

export const PheraPasswordField = forwardRef<HTMLDivElement, PheraPasswordFieldProps>(
  function PheraPasswordField({ showCopy = false, adminStyle = true, sx, value, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(String(value));
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } catch {
        // clipboard API blocked; no fallback.
      }
    };

    return (
      <TextField
        ref={ref}
        {...rest}
        value={value ?? ''}
        type={visible ? 'text' : 'password'}
        sx={{ ...(adminStyle ? ENHANCED_TEXT_FIELD_SX : {}), ...sx }}
        InputProps={{
          ...rest.InputProps,
          endAdornment: (
            <InputAdornment position="end">
              {showCopy && (
                <Tooltip title={copied ? 'Copied' : 'Copy'} arrow>
                  <IconButton
                    onClick={handleCopy}
                    edge="end"
                    size="small"
                    sx={{ color: COLORS.text.subtle, mr: 0.25 }}
                    aria-label="Copy password"
                  >
                    {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={visible ? 'Hide' : 'Show'} arrow>
                <IconButton
                  onClick={() => setVisible(v => !v)}
                  edge="end"
                  size="small"
                  sx={{ color: COLORS.text.subtle }}
                  aria-label={visible ? 'Hide password' : 'Show password'}
                >
                  {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
    );
  },
);

export default PheraPasswordField;
