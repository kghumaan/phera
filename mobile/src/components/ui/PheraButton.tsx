import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { COLORS, RADII, SPACING, TEXT, fontForWeight } from '@/lib/theme/tokens';
import { PheraText } from './PheraText';

export type PheraButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface PheraButtonProps {
  children: ReactNode;
  onPress?: () => void | Promise<void>;
  variant?: PheraButtonVariant;
  /** External loading control; a Promise-returning onPress auto-spins. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'md' | 'lg';
  icon?: ReactNode;
  /** Radius override — e.g. RADII.pill for the Google button, RADII.cta for guest CTAs. */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Port of web `PrimaryActionButton` / `SecondaryActionButton`
 * (`components/admin/ActionButton.tsx`), including the loading treatment:
 * while in-flight the button turns white with a 1.5px brand border and a
 * centered spinner, preserving its size so layout never jumps.
 */
export function PheraButton({
  children,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth,
  size = 'md',
  icon,
  borderRadius = RADII.md,
  style,
  testID,
}: PheraButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading ?? internalLoading;
  const isDisabled = disabled || isLoading;

  const handlePress = () => {
    if (!onPress || isLoading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const result = onPress();
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      setInternalLoading(true);
      (result as Promise<unknown>).finally(() => setInternalLoading(false));
    }
  };

  const height = size === 'lg' ? 52 : SPACING.touchTarget;

  const base: ViewStyle = {
    height,
    borderRadius,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => {
        if (isLoading) {
          // Match web: white bg + brand border while the spinner shows.
          return [
            base,
            {
              backgroundColor: COLORS.bg.white,
              borderWidth: 1.5,
              borderColor: COLORS.brand.primary,
            },
            style,
          ];
        }
        switch (variant) {
          case 'primary':
            return [
              base,
              {
                backgroundColor: disabled
                  ? COLORS.brand.primaryDisabled
                  : pressed
                    ? COLORS.brand.primaryHover
                    : COLORS.brand.primary,
              },
              style,
            ];
          case 'secondary':
            return [
              base,
              {
                backgroundColor: pressed ? 'rgba(0, 0, 0, 0.04)' : COLORS.bg.white,
                borderWidth: 1.5,
                borderColor: disabled ? COLORS.border.default : COLORS.text.strong,
                opacity: disabled ? 0.6 : 1,
              },
              style,
            ];
          case 'ghost':
            return [
              base,
              { backgroundColor: pressed ? COLORS.brand.primarySubtle : 'transparent' },
              style,
            ];
        }
      }}
    >
      <View style={[styles.content, isLoading && styles.hidden]}>
        {icon}
        <PheraText
          weight={600}
          style={{
            fontFamily: fontForWeight(600),
            fontSize: size === 'lg' ? TEXT.base : TEXT.sm,
            color:
              variant === 'primary'
                ? COLORS.text.inverse
                : variant === 'ghost'
                  ? COLORS.brand.primary
                  : COLORS.text.strong,
          }}
        >
          {children}
        </PheraText>
      </View>
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={COLORS.brand.primary}
          style={StyleSheet.absoluteFill}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hidden: { opacity: 0 },
});
