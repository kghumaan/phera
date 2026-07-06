import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PheraChip, PheraText, WarningAlert } from '@/components/ui';
import {
  PLANNER_EMPTY_COPY,
  PLANNER_STARTERS,
  WELCOME_PLACEHOLDER,
  streamAnswers,
  streamChat,
  streamConfirm,
  type AgentDataPanel,
  type AgentQuestion,
  type AgentStreamEvent,
  type BroadcastDraft,
  type VenueCard,
} from '@/lib/agent/client';
import { inMockMode } from '@/lib/supabase/client';
import { COLORS, FONT, RADII, TEXT } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

type ChatItem =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'assistant'; id: string; text: string; streaming?: boolean }
  | {
      kind: 'tool';
      id: string;
      name: string;
      label: string;
      status: 'running' | 'ok' | 'failed';
      summary?: string;
      undoable?: boolean;
    }
  | {
      kind: 'confirm';
      id: string;
      actionId: string;
      name?: string;
      label: string;
      summary?: string;
      input?: Record<string, unknown>;
      status: 'pending' | 'approved' | 'declined';
    }
  | {
      kind: 'questions';
      id: string;
      actionId: string;
      questions: AgentQuestion[];
      status: 'pending' | 'submitted';
    }
  | { kind: 'upgrade'; id: string; feature: string }
  | { kind: 'upload'; id: string; uploadKind: 'guests' | 'rooms' }
  | { kind: 'panel'; id: string; panel: AgentDataPanel }
  | { kind: 'faqs'; id: string; faqs: { id: string; question: string; answer: string }[] }
  | { kind: 'venues'; id: string; vendors: VenueCard[] }
  | { kind: 'broadcast'; id: string; draft: BroadcastDraft }
  | { kind: 'pairing'; id: string; status: string };

let nextId = 0;
const uid = () => `m${++nextId}`;

const cardStyle = {
  alignSelf: 'stretch' as const,
  backgroundColor: COLORS.bg.white,
  borderWidth: 1,
  borderColor: COLORS.border.light,
  borderRadius: RADII.lg,
  padding: 16,
  gap: 10,
};

/** Web ConfirmActionCard parity: summary or input k/v, Why line, Confirm /
 *  Edit… / Decline, "Don't ask again" (hidden for set_autonomy). */
function ConfirmCard({
  item,
  busy,
  onResolve,
}: {
  item: ChatItem & { kind: 'confirm' };
  busy: boolean;
  onResolve: (approve: boolean, note?: string, alwaysAllow?: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [alwaysAllow, setAlwaysAllow] = useState(false);

  const reason = typeof item.input?.reason === 'string' ? item.input.reason : null;
  const inputRows = Object.entries(item.input ?? {}).filter(
    ([k, v]) => k !== 'reason' && v != null && typeof v !== 'object',
  );

  return (
    <View
      style={{
        ...cardStyle,
        borderWidth: 1.5,
        borderColor: COLORS.brand.primaryBorder,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.brand.primary} />
        <PheraText variant="h3" style={{ flex: 1 }}>
          Confirm: {item.label}
        </PheraText>
        {item.status !== 'pending' ? (
          <PheraChip
            label={item.status === 'approved' ? 'Confirmed ✓' : 'Declined'}
            tone={item.status === 'approved' ? 'success' : 'neutral'}
          />
        ) : null}
      </View>
      {item.summary ? (
        <PheraText variant="body2">{item.summary}</PheraText>
      ) : inputRows.length > 0 ? (
        <View style={{ gap: 2 }}>
          {inputRows.map(([k, v]) => (
            <PheraText key={k} variant="body2">
              {k.replace(/_/g, ' ')}: {String(v)}
            </PheraText>
          ))}
        </View>
      ) : null}
      {reason ? (
        <PheraText variant="body2" color={COLORS.text.subtle}>
          Why: {reason}
        </PheraText>
      ) : null}

      {item.status === 'pending' ? (
        editing ? (
          <View style={{ gap: 10 }}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What should change?"
              placeholderTextColor={COLORS.text.faint}
              multiline
              style={{
                minHeight: 64,
                backgroundColor: COLORS.bg.subtle,
                borderRadius: RADII.md,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: TEXT.sm,
                fontFamily: FONT.regular,
                color: COLORS.text.strong,
                textAlignVertical: 'top',
              }}
              testID="confirm-note"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditing(false)}
                style={{ flex: 1, height: 44, borderRadius: RADII.md, borderWidth: 1.5, borderColor: COLORS.border.default, alignItems: 'center', justifyContent: 'center' }}
              >
                <PheraText variant="body2" weight={600}>Cancel</PheraText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busy || !note.trim()}
                onPress={() => onResolve(false, note.trim())}
                style={{ flex: 1, height: 44, borderRadius: RADII.md, alignItems: 'center', justifyContent: 'center', backgroundColor: note.trim() ? COLORS.brand.primary : COLORS.brand.primaryDisabled }}
                testID="confirm-send-change"
              >
                <PheraText variant="body2" weight={600} color={COLORS.text.inverse}>Send change</PheraText>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {item.name !== 'set_autonomy' ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: alwaysAllow }}
                onPress={() => setAlwaysAllow((v) => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Ionicons
                  name={alwaysAllow ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={alwaysAllow ? COLORS.brand.primary : COLORS.text.faint}
                />
                <PheraText variant="body2" color={COLORS.text.subtle}>
                  Don&apos;t ask again for this
                </PheraText>
              </Pressable>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                testID="confirm-decline"
                disabled={busy}
                onPress={() => onResolve(false)}
                style={{ flex: 1, height: 44, borderRadius: RADII.md, borderWidth: 1.5, borderColor: COLORS.text.strong, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg.white }}
              >
                <PheraText variant="body2" weight={600}>Decline</PheraText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                testID="confirm-edit"
                disabled={busy}
                onPress={() => setEditing(true)}
                style={{ flex: 1, height: 44, borderRadius: RADII.md, borderWidth: 1.5, borderColor: COLORS.border.default, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg.white }}
              >
                <PheraText variant="body2" weight={600}>Edit…</PheraText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                testID="confirm-approve"
                disabled={busy}
                onPress={() => onResolve(true, undefined, alwaysAllow)}
                style={{ flex: 1, height: 44, borderRadius: RADII.md, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brand.primary }}
              >
                <PheraText variant="body2" weight={600} color={COLORS.text.inverse}>Confirm</PheraText>
              </Pressable>
            </View>
          </View>
        )
      ) : null}
    </View>
  );
}

/** Web QuestionFlow (compact): answers the parked ask_user set inline. */
function QuestionsCard({
  item,
  busy,
  onSubmit,
}: {
  item: ChatItem & { kind: 'questions' };
  busy: boolean;
  onSubmit: (answers: Record<string, string | string[]>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const setAnswer = (id: string, value: string | string[]) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  const complete = item.questions.every((q) => {
    if (q.optional) return true;
    const v = answers[q.id];
    return Array.isArray(v) ? v.length > 0 : !!v?.toString().trim();
  });

  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="help-circle-outline" size={18} color={COLORS.brand.primary} />
        <PheraText variant="h3" style={{ flex: 1 }}>
          A few details
        </PheraText>
        {item.status === 'submitted' ? <PheraChip label="Answered ✓" tone="success" /> : null}
      </View>
      {item.questions.map((q) => {
        const value = answers[q.id];
        const selectable = q.type === 'single_select' || q.type === 'multi_select';
        return (
          <View key={q.id} style={{ gap: 6 }}>
            <PheraText variant="body2" weight={600}>
              {q.prompt}
              {q.optional ? '  (optional)' : ''}
            </PheraText>
            {q.hint ? (
              <PheraText variant="body2" color={COLORS.text.faint}>
                {q.hint}
              </PheraText>
            ) : null}
            {selectable ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(q.options ?? []).map((opt) => {
                  const selected = Array.isArray(value) ? value.includes(opt) : value === opt;
                  return (
                    <Pressable
                      key={opt}
                      accessibilityRole="button"
                      disabled={item.status === 'submitted'}
                      onPress={() => {
                        if (q.type === 'multi_select') {
                          const cur = Array.isArray(value) ? value : [];
                          setAnswer(q.id, selected ? cur.filter((o) => o !== opt) : [...cur, opt]);
                        } else {
                          setAnswer(q.id, selected ? '' : opt);
                        }
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: RADII.pill,
                        borderWidth: 1.5,
                        borderColor: selected ? COLORS.brand.primary : COLORS.border.default,
                        backgroundColor: selected ? COLORS.brand.primarySubtle : COLORS.bg.white,
                      }}
                    >
                      <PheraText
                        variant="body2"
                        weight={500}
                        color={selected ? COLORS.brand.primary : COLORS.text.muted}
                      >
                        {opt}
                      </PheraText>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            {!selectable || q.allowOther ? (
              <TextInput
                editable={item.status !== 'submitted'}
                value={
                  selectable
                    ? undefined
                    : Array.isArray(value)
                      ? value.join(', ')
                      : (value ?? '')
                }
                onChangeText={(v) => setAnswer(q.id, v)}
                placeholder={
                  q.placeholder ??
                  (q.type === 'date'
                    ? 'YYYY-MM-DD'
                    : q.type === 'date_range'
                      ? 'YYYY-MM-DD to YYYY-MM-DD'
                      : q.type === 'time'
                        ? 'e.g. 7:00 PM'
                        : selectable
                          ? 'Or type your own…'
                          : 'Type your answer…')
                }
                placeholderTextColor={COLORS.text.faint}
                multiline={q.type === 'textarea'}
                style={{
                  minHeight: q.type === 'textarea' ? 64 : 42,
                  backgroundColor: COLORS.bg.subtle,
                  borderRadius: RADII.md,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: TEXT.sm,
                  fontFamily: FONT.regular,
                  color: COLORS.text.strong,
                }}
              />
            ) : null}
          </View>
        );
      })}
      {item.status === 'pending' ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy || !complete}
          onPress={() => onSubmit(answers)}
          style={{
            height: 44,
            borderRadius: RADII.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: complete ? COLORS.brand.primary : COLORS.brand.primaryDisabled,
          }}
          testID="questions-submit"
        >
          <PheraText variant="body2" weight={600} color={COLORS.text.inverse}>
            Send answers
          </PheraText>
        </Pressable>
      ) : null}
    </View>
  );
}

function DataPanelCard({ panel }: { panel: AgentDataPanel }) {
  return (
    <View style={cardStyle}>
      <PheraText variant="h3">{panel.title}</PheraText>
      {panel.kind === 'stats' ? (
        <View style={{ gap: 8 }}>
          {panel.items.map((it) => (
            <View key={it.label} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <PheraText variant="body" weight={700} style={{ minWidth: 44 }}>
                {it.value}
              </PheraText>
              <View style={{ flex: 1 }}>
                <PheraText variant="body2">{it.label}</PheraText>
                {it.hint ? (
                  <PheraText variant="body2" color={COLORS.text.faint}>
                    {it.hint}
                  </PheraText>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={{ flexDirection: 'row', gap: 16, paddingBottom: 6 }}>
              {panel.columns.map((c) => (
                <PheraText key={c.key} variant="body2" weight={700} style={{ minWidth: 96 }}>
                  {c.label}
                </PheraText>
              ))}
            </View>
            {panel.rows.slice(0, 12).map((row, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 16, paddingVertical: 4, borderTopWidth: 1, borderTopColor: COLORS.border.faint }}>
                {panel.columns.map((c) => (
                  <PheraText key={c.key} variant="body2" style={{ minWidth: 96 }}>
                    {row[c.key] == null ? '—' : String(row[c.key])}
                  </PheraText>
                ))}
              </View>
            ))}
            {panel.rows.length > 12 ? (
              <PheraText variant="body2" color={COLORS.text.faint} style={{ paddingTop: 6 }}>
                +{panel.rows.length - 12} more rows
              </PheraText>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/**
 * The Phera Planner chat — mobile port of web AgentChatPanel: same SSE
 * event handling (tool_start/tool_done with undo, confirmation cards with
 * Edit + always-allow, inline question flow, upgrade/upload/data panels),
 * same starters and empty-state copy.
 */
export default function PlannerScreen() {
  const weddingSlug = useWeddingSlug();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatItem>>(null);

  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
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
      setBusyLabel(null);
    }
  };

  /** Feed a stream's events into the transcript (chat + confirm + answers). */
  const consume = async (stream: AsyncGenerator<AgentStreamEvent>, assistantId: string) => {
    let assistantStarted = false;
    let textRuns = 0;
    let currentAssistantId = assistantId;
    for await (const event of stream) {
      switch (event.type) {
        case 'conversation':
          setConversationId(event.conversationId);
          break;
        case 'tool_start':
          setBusyLabel(`${event.label}…`);
          setItems((prev) => [
            ...prev,
            { kind: 'tool', id: uid(), name: event.name, label: event.label, status: 'running' },
          ]);
          // Text after a tool call starts a fresh assistant bubble (web parity).
          if (assistantStarted) {
            assistantStarted = false;
            textRuns += 1;
            currentAssistantId = `${assistantId}-${textRuns}`;
          }
          break;
        case 'tool_done':
          setBusyLabel(null);
          setItems((prev) => {
            const idx = [...prev]
              .reverse()
              .findIndex((it) => it.kind === 'tool' && it.name === event.name && it.status === 'running');
            if (idx === -1) return prev;
            const realIdx = prev.length - 1 - idx;
            return prev.map((it, i) =>
              i === realIdx && it.kind === 'tool'
                ? { ...it, status: event.ok ? 'ok' : 'failed', summary: event.summary, undoable: event.undoable }
                : it,
            );
          });
          break;
        case 'confirmation_required':
          setItems((prev) => [
            ...prev,
            {
              kind: 'confirm',
              id: uid(),
              actionId: event.actionId,
              name: event.name,
              label: event.label,
              summary: event.summary,
              input: event.input,
              status: 'pending',
            },
          ]);
          break;
        case 'questions_required':
          setItems((prev) => [
            ...prev,
            { kind: 'questions', id: uid(), actionId: event.actionId, questions: event.questions, status: 'pending' },
          ]);
          break;
        case 'upgrade_required':
          setItems((prev) => [...prev, { kind: 'upgrade', id: uid(), feature: event.feature }]);
          break;
        case 'upload_requested':
          setItems((prev) => [...prev, { kind: 'upload', id: uid(), uploadKind: event.uploadKind }]);
          break;
        case 'data_panel':
          setItems((prev) => [...prev, { kind: 'panel', id: uid(), panel: event.panel }]);
          break;
        case 'faq_review':
          setItems((prev) => [...prev, { kind: 'faqs', id: uid(), faqs: event.faqs }]);
          break;
        case 'venue_cards':
          setItems((prev) => [...prev, { kind: 'venues', id: uid(), vendors: event.vendors }]);
          break;
        case 'broadcast_review':
          setItems((prev) => [...prev, { kind: 'broadcast', id: uid(), draft: event.draft }]);
          break;
        case 'whatsapp_pairing':
          setItems((prev) => [...prev, { kind: 'pairing', id: uid(), status: event.status }]);
          break;
        case 'error':
          // Web parity: error frames land as a plain assistant bubble.
          setItems((prev) => [...prev, { kind: 'assistant', id: uid(), text: event.message }]);
          break;
        case 'text_delta': {
          const id = currentAssistantId;
          const delta = event.text;
          // Decide push-vs-append INSIDE the updater — React batches these,
          // so outside flags are stale by the time the updater runs.
          setItems((prev) =>
            prev.some((it) => it.id === id && it.kind === 'assistant')
              ? prev.map((it) =>
                  it.id === id && it.kind === 'assistant' ? { ...it, text: it.text + delta } : it,
                )
              : [...prev, { kind: 'assistant', id, text: delta, streaming: true }],
          );
          assistantStarted = true;
          break;
        }
      }
      scrollToEnd();
    }
    setItems((prev) =>
      prev.map((it) => (it.kind === 'assistant' && it.streaming ? { ...it, streaming: false } : it)),
    );
  };

  const resolveConfirmation = async (
    item: ChatItem & { kind: 'confirm' },
    approve: boolean,
    note?: string,
    alwaysAllow?: boolean,
  ) => {
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
      await consume(streamConfirm(item.actionId, approve, { note, alwaysAllow }), uid());
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Could not resolve the action — try again.');
    } finally {
      setBusy(false);
      setBusyLabel(null);
    }
  };

  const submitAnswers = async (
    item: ChatItem & { kind: 'questions' },
    answers: Record<string, string | string[]>,
  ) => {
    if (busy || item.status !== 'pending') return;
    setBusy(true);
    setFailure(null);
    setItems((prev) =>
      prev.map((it) => (it.id === item.id && it.kind === 'questions' ? { ...it, status: 'submitted' } : it)),
    );
    try {
      await consume(streamAnswers(item.actionId, answers), uid());
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Could not send those answers — try again.');
    } finally {
      setBusy(false);
      setBusyLabel(null);
    }
  };

  const empty = items.length === 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.bg.muted }}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {empty ? (
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 20 }}>
            <View style={{ gap: 8, alignItems: 'center' }}>
              <PheraText variant="display" align="center">
                Hi, I&apos;m your planner.
              </PheraText>
              <PheraText variant="body2" align="center" style={{ maxWidth: 300 }}>
                {PLANNER_EMPTY_COPY}
              </PheraText>
              {inMockMode() ? <PheraChip label="Demo — scripted replies" tone="info" /> : null}
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
                  <ConfirmCard
                    item={item}
                    busy={busy}
                    onResolve={(approve, note, alwaysAllow) =>
                      void resolveConfirmation(item, approve, note, alwaysAllow)
                    }
                  />
                );
              }
              if (item.kind === 'questions') {
                return (
                  <QuestionsCard item={item} busy={busy} onSubmit={(a) => void submitAnswers(item, a)} />
                );
              }
              if (item.kind === 'upgrade') {
                return (
                  <View style={cardStyle}>
                    <PheraText variant="h3">{item.feature} is a Premium feature</PheraText>
                    <PheraText variant="body2">
                      {item.feature} isn&apos;t on the free plan. Upgrade to unlock it — and everything
                      else — and we&apos;ll keep going right here.
                    </PheraText>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void Linking.openURL(`https://www.phera.io/admin/${weddingSlug}/overview`)}
                      style={{ height: 44, borderRadius: RADII.md, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brand.primary }}
                    >
                      <PheraText variant="body2" weight={600} color={COLORS.text.inverse}>
                        Upgrade on the web
                      </PheraText>
                    </Pressable>
                  </View>
                );
              }
              if (item.kind === 'upload') {
                return (
                  <View style={cardStyle}>
                    <PheraText variant="h3">
                      {item.uploadKind === 'guests' ? 'Upload your guest list' : 'Upload your hotel floor plan'}
                    </PheraText>
                    <PheraText variant="body2">
                      {item.uploadKind === 'guests'
                        ? 'Only Name is required — email, phone, plus-ones, party size, and tags all help. File uploads are easiest on the web dashboard; or just paste names here and I’ll add them.'
                        : 'PDF, photo, or spreadsheet — file uploads are easiest on the web dashboard; or describe the rooms here and I’ll set them up.'}
                    </PheraText>
                  </View>
                );
              }
              if (item.kind === 'panel') return <DataPanelCard panel={item.panel} />;
              if (item.kind === 'faqs') {
                return (
                  <View style={cardStyle}>
                    <PheraText variant="h3">FAQ drafts</PheraText>
                    {item.faqs.slice(0, 6).map((f) => (
                      <View key={f.id} style={{ gap: 2 }}>
                        <PheraText variant="body2" weight={600}>{f.question}</PheraText>
                        <PheraText variant="body2">{f.answer}</PheraText>
                      </View>
                    ))}
                  </View>
                );
              }
              if (item.kind === 'venues') {
                return (
                  <View style={cardStyle}>
                    <PheraText variant="h3">Suggestions</PheraText>
                    {item.vendors.slice(0, 6).map((v) => (
                      <View key={v.name} style={{ gap: 2 }}>
                        <PheraText variant="body2" weight={600}>{v.name}</PheraText>
                        <PheraText variant="body2" color={COLORS.text.subtle}>
                          {[v.category, v.city, v.rating ? `★ ${v.rating}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </PheraText>
                      </View>
                    ))}
                  </View>
                );
              }
              if (item.kind === 'broadcast') {
                return (
                  <View style={cardStyle}>
                    <PheraText variant="h3">WhatsApp broadcast draft</PheraText>
                    <PheraText variant="body">{item.draft.message}</PheraText>
                    <PheraText variant="body2" color={COLORS.text.subtle}>
                      Reaches {item.draft.count} guest{item.draft.count === 1 ? '' : 's'}
                      {item.draft.sampleNames?.length ? ` — e.g. ${item.draft.sampleNames.slice(0, 3).join(', ')}` : ''}
                    </PheraText>
                  </View>
                );
              }
              if (item.kind === 'pairing') {
                return (
                  <View style={cardStyle}>
                    <PheraText variant="h3">WhatsApp pairing</PheraText>
                    <PheraText variant="body2">{item.status}</PheraText>
                  </View>
                );
              }
              if (item.kind === 'tool') {
                // Web parity: running + plain-ok are invisible; failures get a
                // red chip; ok-with-summary gets the ✓ caption and Undo link.
                if (item.status === 'running') return null;
                if (item.status === 'failed') {
                  return (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: COLORS.accent.dangerBg,
                        borderRadius: RADII.pill,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                    >
                      <PheraText variant="body2" weight={600} color={COLORS.accent.dangerText}>
                        {item.label} failed
                      </PheraText>
                    </View>
                  );
                }
                if (!item.summary && !item.undoable) return null;
                return (
                  <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <PheraText variant="body2" color={COLORS.text.subtle}>
                      ✓ {item.label}
                      {item.summary ? ` — ${item.summary}` : ''}
                    </PheraText>
                    {item.undoable ? (
                      <PheraText
                        variant="body2"
                        weight={600}
                        color={COLORS.brand.primary}
                        onPress={() => void send(`Undo that last change (${item.label.toLowerCase()}).`)}
                      >
                        Undo
                      </PheraText>
                    ) : null}
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
        {busyLabel ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 4 }}>
            <PheraText variant="body2" color={COLORS.text.faint}>
              {busyLabel}
            </PheraText>
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
            placeholder={empty ? WELCOME_PLACEHOLDER : 'Tell me what’s happening — Enter to send'}
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
