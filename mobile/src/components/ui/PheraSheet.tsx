import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';
import { PheraText } from './PheraText';

export interface PheraSheetProps {
  open: boolean;
  onClose: () => void;
  /** Serif title, matching web PheraDialogTitle. */
  title?: string;
  children: ReactNode;
  /** Pinned footer (e.g. action buttons) below the scrollable body. */
  footer?: ReactNode;
}

/**
 * Bottom sheet — the mobile counterpart of web `PheraDialog`:
 * 24px top radius, drag handle, serif-adjacent title row with close
 * button, scrollable body, optional pinned footer.
 */
export function PheraSheet({ open, onClose, title, children, footer }: PheraSheetProps) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  const animate = useCallback(
    (to: number, done?: () => void) => {
      Animated.timing(slide, {
        toValue: to,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(done);
    },
    [slide],
  );

  useEffect(() => {
    if (open) animate(1);
  }, [open, animate]);

  const close = () => animate(0, onClose);

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexEnd}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: slide }]}>
          <Pressable accessibilityLabel="Dismiss sheet" style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 16,
              transform: [
                {
                  translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handle} />
          {title ? (
            <View style={styles.titleRow}>
              <PheraText variant="h2" style={{ flex: 1 }}>
                {title}
              </PheraText>
              <Pressable accessibilityLabel="Close" hitSlop={8} onPress={close}>
                <Ionicons name="close" size={22} color={COLORS.text.muted} />
              </Pressable>
            </View>
          ) : null}
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingTop: 16 }}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flexEnd: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: {
    backgroundColor: COLORS.bg.white,
    borderTopLeftRadius: RADII.dialog,
    borderTopRightRadius: RADII.dialog,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '88%',
    ...SHADOWS.dialog,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border.default,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
  },
});
