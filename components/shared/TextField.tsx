'use client';

/**
 * Standard Phera text input.
 *
 * Wraps MUI's TextField with `ENHANCED_TEXT_FIELD_SX` already applied so
 * every admin form looks identical without each page re-spreading the
 * SX object. For one-off visual tweaks, pass `sx` — it merges on top.
 *
 * ```tsx
 * <PheraTextField label="Couple name" value={name} onChange={onChange} />
 * ```
 *
 * If you need the guest-facing (larger, placeholder-as-label) style,
 * use `guestTextFieldSx()` on a raw TextField until we promote that to
 * its own primitive.
 */

import { TextField, type TextFieldProps } from '@mui/material';
import { forwardRef } from 'react';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';

export const PheraTextField = forwardRef<HTMLDivElement, TextFieldProps>(
  function PheraTextField({ sx, ...rest }, ref) {
    return (
      <TextField
        ref={ref}
        {...rest}
        sx={{ ...ENHANCED_TEXT_FIELD_SX, ...sx }}
      />
    );
  },
);

export default PheraTextField;
