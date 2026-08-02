import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraText } from './PheraText';

type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

const SEVERITIES: Record<
  AlertSeverity,
  { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  info: { bg: COLORS.accent.infoBg, text: COLORS.accent.infoText, icon: 'information-circle' },
  success: {
    bg: COLORS.accent.successBg,
    text: COLORS.accent.successText,
    icon: 'checkmark-circle',
  },
  warning: { bg: COLORS.accent.warningBg, text: COLORS.accent.warningText, icon: 'warning' },
  error: { bg: COLORS.accent.dangerBg, text: COLORS.accent.dangerText, icon: 'alert-circle' },
};

interface AlertProps {
  children: ReactNode;
  onClose?: () => void;
}

function BaseAlert({ severity, children, onClose }: AlertProps & { severity: AlertSeverity }) {
  const s = SEVERITIES[severity];
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: s.bg,
        borderRadius: RADII.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <Ionicons name={s.icon} size={20} color={s.text} style={{ marginTop: 1 }} />
      <PheraText variant="body2" color={s.text} style={{ flex: 1 }}>
        {children}
      </PheraText>
      {onClose ? (
        <Pressable accessibilityLabel="Dismiss" hitSlop={8} onPress={onClose}>
          <Ionicons name="close" size={18} color={s.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Ports of web Alert primitives (components/shared/Alert.tsx). */
export const InfoAlert = (p: AlertProps) => <BaseAlert severity="info" {...p} />;
export const SuccessAlert = (p: AlertProps) => <BaseAlert severity="success" {...p} />;
export const WarningAlert = (p: AlertProps) => <BaseAlert severity="warning" {...p} />;
export const ErrorAlert = (p: AlertProps) => <BaseAlert severity="error" {...p} />;
