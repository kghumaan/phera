import { Text, type TextProps } from 'react-native';

import {
  COLORS,
  DISPLAY_SIZE_THRESHOLD,
  FONT,
  TEXT,
  fontForWeight,
  type FontWeight,
} from '@/lib/theme/tokens';

export type PheraTextVariant =
  | 'display' // ≥32px, Instrument Serif — page-level heroes
  | 'h1' // 24px semibold — screen titles
  | 'h2' // 20px semibold — section titles
  | 'h3' // 18px semibold — card titles
  | 'body' // 16px — default copy
  | 'body2' // 14px — secondary copy (the floor)
  | 'label' // 14px medium — form labels, list meta
  | 'caps'; // 14px semibold, letter-spaced uppercase — subtitleCaps

export interface PheraTextProps extends TextProps {
  variant?: PheraTextVariant;
  /** Override weight within the variant (Outfit variants only). */
  weight?: FontWeight;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

const VARIANT_STYLES: Record<
  PheraTextVariant,
  { fontSize: number; weight: FontWeight; color: string; display?: boolean; caps?: boolean }
> = {
  display: { fontSize: TEXT['3xl'], weight: 400, color: COLORS.text.strong, display: true },
  h1: { fontSize: TEXT['2xl'], weight: 600, color: COLORS.text.strong },
  h2: { fontSize: TEXT.xl, weight: 600, color: COLORS.text.strong },
  h3: { fontSize: TEXT.lg, weight: 600, color: COLORS.text.strong },
  body: { fontSize: TEXT.base, weight: 400, color: COLORS.text.strong },
  body2: { fontSize: TEXT.sm, weight: 400, color: COLORS.text.muted },
  label: { fontSize: TEXT.sm, weight: 500, color: COLORS.text.muted },
  caps: { fontSize: TEXT.sm, weight: 600, color: COLORS.text.subtle, caps: true },
};

/**
 * The only way text is rendered in Phera mobile. Encodes the type rules:
 * Outfit for everything, Instrument Serif at ≥32px (`display`), 14px floor.
 */
export function PheraText({
  variant = 'body',
  weight,
  color,
  align,
  style,
  children,
  ...rest
}: PheraTextProps) {
  const v = VARIANT_STYLES[variant];
  const useDisplayFont = v.display || v.fontSize >= DISPLAY_SIZE_THRESHOLD;

  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: useDisplayFont ? FONT.display : fontForWeight(weight ?? v.weight),
          fontSize: v.fontSize,
          lineHeight: Math.round(v.fontSize * (useDisplayFont ? 1.15 : 1.4)),
          color: color ?? v.color,
          textAlign: align,
          ...(v.caps ? { textTransform: 'uppercase' as const, letterSpacing: 1 } : null),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
