import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

import { PheraChip, PheraText, WarningAlert } from '@/components/ui';
import {
  PLANNER_STARTERS,
  WELCOME_PLACEHOLDER,
  streamChat,
  streamConfirm,
  type AgentStreamEvent,
} from '@/lib/agent/client';
import { isPreviewMode } from '@/lib/supabase/client';
import { COLORS, FONT, RADII, TEXT } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

type ChatItem =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'assistant'; id: string; text: string; streaming?: boolean }
  | { kind: 'tool'; id: string; label: string }
  | {
      kind: 'confirm';
      id: string;
      actionId: string;
      label: string;
      summary?: string;
      status: 'pending' | 'approved' | 'declined';
    };

let nextId = 0;
const uid = () => `m${++nextId}`;

/**
 * The Phera Planner chat — mobile port of web AgentChatPanel's visual
 * contract: user bubbles in brand primarySubtle at radius 16, assistant
 * replies as plain text, tool calls as small labeled chips, neutral
 * starter chips on the empty state.
 */
export default function PlannerScreen() {
  const weddingSlug = useWeddingSlug();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatItem>>(null);

  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [failure, setFailure] = useState<string | null>(null);

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

    setFailure(null);
    try {
      await consume(streamChat({ weddingSlug, message, conversationId }), assistantId);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'The planner had trouble responding — try again.');
    } finally {
      setBusy(false);
    }
  };

  /** Feed a stream's events into the transcript (shared by send + confirm). */
  const consume = async (stream: AsyncGenerator<AgentStreamEvent>, assistantId: string) => {
    let assistantStarted = false;
    for await (const event of stream) {
      if (event.type === 'conversation') {
        setConversationId(event.conversationId);
      } else if (event.type === 'tool') {
        setItems((prev) => [...prev, { kind: 'tool', id: uid(), label: event.label }]);
      } else if (event.type === 'confirmation_required') {
        setItems((prev) => [
          ...prev,
          {
            kind: 'confirm',
            id: uid(),
            actionId: event.actionId,
            label: event.label,
            summary: event.summary,
            status: 'pending',
          },
        ]);
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
  };

  const resolveConfirmation = async (item: ChatItem & { kind: 'confirm' }, approve: boolean) => {
    if (busy || item.status !== 'pending') return;
    setBusy(true);
    setFailure(null);
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id && it.kind === 'confirm'
          ? { ...it, status: approve ? 'approved' : 'declined' }
          : it,
      ),
    );
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        approve ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
    try {
      await consume(streamConfirm(item.actionId, approve), uid());
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Could not resolve the action — try again.');
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
              if (item.kind === 'confirm') {
                return (
                  <View
                    style={{
                      alignSelf: 'stretch',
                      backgroundColor: COLORS.bg.white,
                      borderWidth: 1.5,
                      borderColor: COLORS.brand.primaryBorder,
                      borderRadius: RADII.lg,
                      padding: 16,
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.brand.primary} />
                      <PheraText variant="h3" style={{ flex: 1 }}>
                        {item.label}
                      </PheraText>
                      {item.status !== 'pending' ? (
                        <PheraChip
                          label={item.status === 'approved' ? 'Approved' : 'Declined'}
                          tone={item.status === 'approved' ? 'success' : 'neutral'}
                        />
                      ) : null}
                    </View>
                    {item.summary ? <PheraText variant="body2">{item.summary}</PheraText> : null}
                    {item.status === 'pending' ? (
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable
                          accessibilityRole="button"
                          testID="confirm-decline"
                          onPress={() => void resolveConfirmation(item, false)}
                          style={{
                            flex: 1,
                            height: 44,
                            borderRadius: RADII.md,
                            borderWidth: 1.5,
                            borderColor: COLORS.text.strong,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: COLORS.bg.white,
                          }}
                        >
                          <PheraText variant="body2" weight={600}>
                            Decline
                          </PheraText>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          testID="confirm-approve"
                          onPress={() => void resolveConfirmation(item, true)}
                          style={{
                            flex: 1,
                            height: 44,
                            borderRadius: RADII.md,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: COLORS.brand.primary,
                          }}
                        >
                          <PheraText variant="body2" weight={600} color={COLORS.text.inverse}>
                            Confirm
                          </PheraText>
                        </Pressable>
                      </View>
                    ) : null}
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

        {failure ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <WarningAlert onClose={() => setFailure(null)}>{failure}</WarningAlert>
          </View>
        ) : null}
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
