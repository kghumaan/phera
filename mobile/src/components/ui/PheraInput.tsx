import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { COLORS, PALETTE, RADII, TEXT, fontForWeight } from '@/lib/theme/tokens';
import { PheraText } from './PheraText';

export interface PheraInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helperText?: string;
}

/**
 * Port of web `PheraTextField`. Mobile-idiomatic: static label above the
 * field (instead of MUI's floating label), white bg, 12px radius, brand
 * 2px border on focus. 16px input text also prevents iOS zoom-on-focus.
 */
export function PheraInput({
  label,
  error,
  helperText,
  editable = true,
  style,
  onFocus,
  onBlur,
  ...rest
}: PheraInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? COLORS.accent.dangerText
    : focused
      ? COLORS.brand.primary
      : COLORS.border.strong;

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <PheraText
          variant="label"
          color={error ? COLORS.accent.dangerText : focused ? COLORS.brand.primary : COLORS.text.muted}
        >
          {label}
        </PheraText>
      ) : null}
      <TextInput
        {...rest}
        editable={editable}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={COLORS.text.placeholder}
        style={[
          {
            backgroundColor: editable ? COLORS.bg.white : PALETTE.white[80],
            borderWidth: focused || error ? 2 : 1,
            borderColor,
            borderRadius: RADII.md,
            paddingHorizontal: 14,
            paddingVertical: focused || error ? 14.5 : 15.5, // keep height stable as border grows
            fontSize: TEXT.base,
            fontFamily: fontForWeight(400),
            color: editable ? COLORS.text.strong : COLORS.text.muted,
          },
          style,
        ]}
      />
      {error ? (
        <PheraText variant="body2" color={COLORS.accent.dangerText}>
          {error}
        </PheraText>
      ) : helperText ? (
        <PheraText variant="body2" color={COLORS.text.subtle}>
          {helperText}
        </PheraText>
      ) : null}
    </View>
  );
}
