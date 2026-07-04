import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PheraChip, PheraText } from '@/components/ui';
import {
  PLANNER_STARTERS,
  WELCOME_PLACEHOLDER,
  streamChat,
} from '@/lib/agent/client';
import { isPreviewMode } from '@/lib/supabase/client';
import { COLORS, FONT, RADII, TEXT } from '@/lib/theme/tokens';

type ChatItem =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'assistant'; id: string; text: string; streaming?: boolean }
  | { kind: 'tool'; id: string; label: string };

let nextId = 0;
const uid = () => `m${++nextId}`;

/**
 * The Phera Planner chat — mobile port of web AgentChatPanel's visual
 * contract: user bubbles in brand primarySubtle at radius 16, assistant
 * replies as plain text, tool calls as small labeled chips, neutral
 * starter chips on the empty state.
 */
export default function PlannerScreen() {
  const { weddingSlug } = useLocalSearchParams<{ weddingSlug: string }>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatItem>>(null);

  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setInput('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const assistantId = uid();
    setItems((prev) => [...prev, { kind: 'user', id: uid(), text: message }]);
    scrollToEnd();

    try {
      let assistantStarted = false;
      for await (const event of streamChat({ weddingSlug, message })) {
        if (event.type === 'tool') {
          setItems((prev) => [...prev, { kind: 'tool', id: uid(), label: event.label }]);
        } else if (event.type === 'text_delta') {
          setItems((prev) => {
            if (!assistantStarted) {
              assistantStarted = true;
              return [...prev, { kind: 'assistant', id: assistantId, text: event.text, streaming: true }];
            }
            return prev.map((it) =>
              it.id === assistantId && it.kind === 'assistant'
                ? { ...it, text: it.text + event.text }
                : it,
            );
          });
        }
        scrollToEnd();
      }
      setItems((prev) =>
        prev.map((it) =>
          it.id === assistantId && it.kind === 'assistant' ? { ...it, streaming: false } : it,
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const empty = items.length === 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.bg.muted }}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
        {empty ? (
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 20 }}>
            <View style={{ gap: 8, alignItems: 'center' }}>
              <PheraText variant="display" align="center">
                Hi, I&apos;m your planner.
              </PheraText>
              <PheraText variant="body2" align="center" style={{ maxWidth: 300 }}>
                {WELCOME_PLACEHOLDER}
              </PheraText>
              {isPreviewMode ? <PheraChip label="Preview — scripted replies" tone="info" /> : null}
            </View>
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}
            >
              {PLANNER_STARTERS.map((starter) => (
                <Pressable key={starter} accessibilityRole="button" onPress={() => void send(starter)}>
                  <PheraChip label={starter} tone="neutral" />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if (item.kind === 'user') {
                return (
                  <View
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '85%',
                      backgroundColor: COLORS.brand.primarySubtle,
                      borderRadius: RADII.lg,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <PheraText variant="body">{item.text}</PheraText>
                  </View>
                );
              }
              if (item.kind === 'tool') {
                return (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: COLORS.bg.white,
                      borderWidth: 1,
                      borderColor: COLORS.border.light,
                      borderRadius: RADII.pill,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.accent.success} />
                    <PheraText variant="body2">{item.label}</PheraText>
                  </View>
                );
              }
              return (
                <View style={{ alignSelf: 'flex-start', maxWidth: '92%' }}>
                  <PheraText variant="body">
                    {item.text}
                    {item.streaming ? ' ▍' : ''}
                  </PheraText>
                </View>
              );
            }}
          />
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 10),
            backgroundColor: COLORS.bg.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.border.light,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={empty ? WELCOME_PLACEHOLDER : 'Message your planner…'}
            placeholderTextColor={COLORS.text.faint}
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              backgroundColor: COLORS.bg.subtle,
              borderRadius: RADII.cta,
              paddingHorizontal: 16,
              paddingVertical: 12,
              // 16px prevents iOS zoom-on-focus (same rule as web composer).
              fontSize: TEXT.base,
              fontFamily: FONT.regular,
              color: COLORS.text.strong,
            }}
            onSubmitEditing={() => void send(input)}
            testID="planner-input"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={busy || !input.trim()}
            onPress={() => void send(input)}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                busy || !input.trim()
                  ? COLORS.brand.primaryDisabled
                  : pressed
                    ? COLORS.brand.primaryHover
                    : COLORS.brand.primary,
            })}
            testID="planner-send"
          >
            <Ionicons name="arrow-up" size={20} color={COLORS.text.inverse} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
