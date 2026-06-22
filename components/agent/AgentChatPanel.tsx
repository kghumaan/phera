'use client';

import { Box, Stack, Typography, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded';
import { PheraMenu, PheraMenuItem } from '@/components/shared/Menu';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useVoiceInput } from './useVoiceInput';
import { useVoiceMode } from './useVoiceMode';
import { useSpeechQueue, drainSentences, type SpeechQueue } from './useSpeechQueue';
import { VoiceOrb, type OrbState } from './VoiceOrb';
import { MarkdownText } from './MarkdownText';
import { importGuestsFromFile, importRoomsFromFile } from '@/lib/agent/chat-uploads';
import { PheraCard } from '@/components/shared/Card';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { IconActionButton, PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { CONFIRMATION_NOTE_PREFIX } from '@/lib/agent/confirm';
import { ANSWERS_NOTE_PREFIX } from '@/lib/agent/answer';
import { HIDDEN_KICKOFF_PREFIX } from '@/lib/agent/message-prefixes';
import { QuestionFlow } from './QuestionFlow';
import type { AgentStreamEvent, AgentContentBlock, AgentQuestion } from '@/lib/agent/types';

type ChatItem =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; label: string; status: 'running' | 'ok' | 'failed' }
  | {
      kind: 'confirm';
      actionId: string;
      label: string;
      status: 'pending' | 'resolving' | 'confirmed' | 'declined';
    }
  | {
      kind: 'questions';
      actionId: string;
      questions: AgentQuestion[];
      status: 'pending' | 'resolving' | 'done';
    }
  | { kind: 'upgrade'; feature: string }
  | { kind: 'upload'; uploadKind: 'guests' | 'rooms' };

const GUEST_SCHEMA_COLUMNS = ['Name', 'Email', 'Phone', 'Plus One', 'Party Size', 'Tags'];
const GUEST_SCHEMA_EXAMPLE = ['Arjun Mehta', 'arjun@example.com', '+1 415 555 0200', 'Aisha Mehta', '2', 'groom-side, family'];

/** Inline upload card with format guidance, triggered by the agent. */
function UploadCard({ uploadKind, onPick }: { uploadKind: 'guests' | 'rooms'; onPick: () => void }) {
  if (uploadKind === 'rooms') {
    return (
      <Box
        sx={{
          alignSelf: 'flex-start',
          maxWidth: '92%',
          border: `1px solid ${COLORS.border.faint}`,
          bgcolor: COLORS.bg.subtle,
          borderRadius: `${RADII.md}px`,
          p: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600, mb: 0.5 }}>
          Upload your hotel floor plan
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 1.5 }}>
          A PDF, image, or spreadsheet of your room block — I&apos;ll read the room numbers, floors, and
          bed types automatically.
        </Typography>
        <PrimaryActionButton size="small" onClick={onPick} startIcon={<UploadFileRoundedIcon fontSize="small" />}>
          Upload floor plan
        </PrimaryActionButton>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        alignSelf: 'flex-start',
        maxWidth: '92%',
        border: `1px solid ${COLORS.border.faint}`,
        bgcolor: COLORS.bg.subtle,
        borderRadius: `${RADII.md}px`,
        p: 2,
      }}
    >
      <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600, mb: 0.5 }}>
        Upload your guest list
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 1.5 }}>
        CSV, Excel, or vCard. Here&apos;s the ideal layout — but don&apos;t worry about matching it exactly,
        if your columns are close I&apos;ll map them automatically.
      </Typography>
      <Box sx={{ overflowX: 'auto', mb: 1.5, border: `1px solid ${COLORS.border.faint}`, borderRadius: `${RADII.sm}px` }}>
        <Table size="small" sx={{ minWidth: 520 }}>
          <TableHead>
            <TableRow>
              {GUEST_SCHEMA_COLUMNS.map((c) => (
                <TableCell key={c} sx={{ fontWeight: 700, color: COLORS.text.strong, fontSize: '0.8rem', py: 0.75 }}>
                  {c}
                  {c === 'Name' && <Box component="span" sx={{ color: COLORS.brand.primary }}> *</Box>}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {GUEST_SCHEMA_EXAMPLE.map((v, i) => (
                <TableCell key={i} sx={{ color: COLORS.text.muted, fontSize: '0.8rem', py: 0.75 }}>
                  {v}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Box>
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, display: 'block', mb: 1.5 }}>
        Only <strong>Name</strong> is required. Email and/or phone let guests RSVP and get WhatsApp updates.
      </Typography>
      <PrimaryActionButton size="small" onClick={onPick} startIcon={<UploadFileRoundedIcon fontSize="small" />}>
        Upload guest list
      </PrimaryActionButton>
    </Box>
  );
}

/** Compact one-line summary of what the user answered, for the right-side bubble. */
function summarizeAnswers(questions: AgentQuestion[], answers: Record<string, string | string[]>): string {
  const parts = questions
    .map((q) => {
      const v = answers[q.id];
      return Array.isArray(v) ? v.join(', ') : (v ?? '');
    })
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'Skipped';
  const joined = parts.join(' · ');
  return joined.length > 160 ? `${joined.slice(0, 157)}…` : joined;
}

const DEFAULT_STARTERS = [
  'How is our planning going so far?',
  "What's still missing from our setup?",
  'How many guests have RSVPed?',
  'Which rooms still have space?',
];

function itemsFromPersisted(messages: Array<{ role: string; content: AgentContentBlock[] }>): ChatItem[] {
  const items: ChatItem[] = [];
  for (const message of messages) {
    for (const block of message.content ?? []) {
      if (block.type === 'text' && block.text.trim()) {
        // Internal plumbing notes — the agent's reply that follows carries
        // the user-facing content.
        if (block.text.startsWith(CONFIRMATION_NOTE_PREFIX)) continue;
        if (block.text.startsWith(ANSWERS_NOTE_PREFIX)) continue;
        if (block.text.startsWith(HIDDEN_USER_PREFIX)) continue;
        items.push({ kind: message.role === 'user' ? 'user' : 'assistant', text: block.text });
      } else if (block.type === 'tool_use') {
        items.push({ kind: 'tool', label: block.name.replace(/_/g, ' '), status: 'ok' });
      }
    }
  }
  return items;
}

const SPEAK_STORAGE_KEY = 'phera-agent-speak';

/** Spoken when reopening the planner with work already in progress. */
const RESUME_GREETING = "Let's pick up where we left off — what would you like to tackle next?";

/** Hidden kickoff sent on onboarding — never rendered as a user bubble. */
const HIDDEN_USER_PREFIX = HIDDEN_KICKOFF_PREFIX;
const ONBOARDING_OPENER = "Hi! I'm your Phera wedding planner. What can I help you with?";
const ONBOARDING_KICKOFF =
  `${HIDDEN_USER_PREFIX} I just signed up and I'm setting up my wedding from scratch. ` +
  `Greet me with EXACTLY this line, nothing before it: "${ONBOARDING_OPENER}" ` +
  'Then immediately use ask_user to collect the essentials. Do not write anything after the ask_user call.';
const ONBOARDING_KICKOFF_VOICE =
  `${HIDDEN_USER_PREFIX} I just signed up — we're talking by VOICE. ` +
  `Open with EXACTLY this line, nothing before it: "${ONBOARDING_OPENER}" ` +
  'Keep it that short — introduce yourself and ask what they need, nothing more. No trailing "…", no second sentence. ' +
  'Whatever they say (transportation, a website, save-the-dates, RSVPs, vendors, guest list, etc.), help with it: ' +
  'call set_planning_goals with their goals and stage, then continue in short, natural, one-at-a-time questions. ' +
  'No lists, no on-screen cards, never use ask_user.';

export interface AgentChatPanelProps {
  weddingSlug: string;
  starters?: string[];
  /** Fired after each completed turn (done or error) — lets hosts refresh inspectors. */
  onTurnComplete?: () => void;
  minHeight?: number;
  /** When true, fire the hidden onboarding kickoff once on mount. */
  onboarding?: boolean;
  /** When true, open straight into hands-free voice mode (the default experience). */
  defaultVoice?: boolean;
}

export function AgentChatPanel({
  weddingSlug,
  starters = DEFAULT_STARTERS,
  onTurnComplete,
  minHeight = 480,
  onboarding,
  defaultVoice,
}: AgentChatPanelProps) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('Thinking…');
  const [loadingHistory, setLoadingHistory] = useState(true);
  // True once history loads if the couple has already provided anything (chat,
  // goals, guests, date/venue) — drives resume-vs-fresh on open.
  const [hasExistingData, setHasExistingData] = useState(false);
  const [speak, setSpeak] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const speechRef = useRef<SpeechQueue | null>(null);
  const guestFileRef = useRef<HTMLInputElement | null>(null);
  const roomFileRef = useRef<HTMLInputElement | null>(null);
  const [attachAnchor, setAttachAnchor] = useState<HTMLElement | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  // Hands-free voice mode: agent replies are spoken and the mic auto-listens.
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);
  // Voice is the default, but a cold reload has no user gesture, so the browser
  // blocks audio (the opener would be silent) and the mic prompt is unexpected.
  // We show a "tap to start" gate first; the tap unlocks audio + starts the loop.
  // Initialized from defaultVoice (a prop — same on server & client, so no
  // hydration mismatch) so the gate paints on the first frame with no flash;
  // an effect drops it if the browser can't actually do speech.
  const [voicePending, setVoicePending] = useState<boolean>(!!defaultVoice);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  // One-shot guard for the opener/resume decision; reset per wedding.
  const greetedRef = useRef(false);
  const voiceActiveRef = useRef(false);
  const voiceRestartRef = useRef<() => void>(() => {});
  const voiceSetSpeakingRef = useRef<(v: boolean) => void>(() => {});
  const sendRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    setSpeak(window.localStorage.getItem(SPEAK_STORAGE_KEY) === '1');
  }, []);

  const toggleSpeak = useCallback(() => {
    setSpeak((prev) => {
      const next = !prev;
      window.localStorage.setItem(SPEAK_STORAGE_KEY, next ? '1' : '0');
      if (!next) speechRef.current?.cancel(); // muting → stop any in-flight speech
      return next;
    });
  }, []);

  const speakRef = useRef(speak);
  speakRef.current = speak;

  // Tracks whether the model has begun streaming this turn (drives the label).
  const streamingRef = useRef(false);

  // Streaming TTS: sentences are spoken as they arrive (see consumeStream), so
  // the agent starts talking on the first sentence instead of after the whole
  // reply is generated. Pauses the mic while speaking; resumes the hands-free
  // loop once the queue fully drains.
  const speech = useSpeechQueue({
    getEnabled: useCallback(() => speakRef.current || voiceActiveRef.current, []),
    onSpeakingChange: useCallback((s: boolean) => {
      setVoiceSpeaking(s);
      voiceSetSpeakingRef.current(s);
    }, []),
    onIdle: useCallback(() => {
      if (voiceActiveRef.current) voiceRestartRef.current();
    }, []),
  });
  speechRef.current = speech;

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setLoadingHistory(true);
    setHasExistingData(false);
    greetedRef.current = false; // each wedding gets its opener decision once
    conversationIdRef.current = null;
    (async () => {
      try {
        const res = await fetch(`/api/agent/conversations?weddingSlug=${encodeURIComponent(weddingSlug)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setHasExistingData(!!data.hasData);
        // A pristine voice-onboarding session that only holds the auto-kickoff
        // (greeting + a parked onboarding card, no real input yet) should start
        // clean in voice — restoring that stale ask_user card would eject the
        // user straight to the typed chat. Abandon it and open a fresh thread.
        const genuineUserMessage = (data.messages ?? []).some(
          (m: { role: string; content?: AgentContentBlock[] }) =>
            m.role === 'user' &&
            (m.content ?? []).some(
              (b) => b.type === 'text' && b.text.trim() && !b.text.startsWith(HIDDEN_USER_PREFIX)
            )
        );
        if (defaultVoice && onboarding && !genuineUserMessage) {
          setLoadingHistory(false);
          return; // conversationIdRef stays null → next send starts fresh
        }
        if (data.conversation) conversationIdRef.current = data.conversation.id;
        const restored = data.messages?.length ? itemsFromPersisted(data.messages) : [];
        for (const pending of data.pendingActions ?? []) {
          if (pending.tool_name === 'ask_user') {
            restored.push({
              kind: 'questions',
              actionId: pending.id,
              questions: (pending.input?.questions ?? []) as AgentQuestion[],
              status: 'pending',
            });
          } else {
            restored.push({
              kind: 'confirm',
              actionId: pending.id,
              label: String(pending.tool_name).replace(/_/g, ' '),
              status: 'pending',
            });
          }
        }
        if (restored.length) setItems(restored);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weddingSlug, defaultVoice, onboarding]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [items, busy]);

  const handleEvent = useCallback((event: AgentStreamEvent) => {
    setItems((prev) => {
      const next = [...prev];
      switch (event.type) {
        case 'text_delta': {
          const last = next[next.length - 1];
          if (last?.kind === 'assistant') {
            next[next.length - 1] = { ...last, text: last.text + event.text };
          } else {
            next.push({ kind: 'assistant', text: event.text });
          }
          return next;
        }
        case 'tool_start':
          next.push({ kind: 'tool', label: event.label, status: 'running' });
          return next;
        case 'tool_done': {
          for (let i = next.length - 1; i >= 0; i--) {
            const item = next[i];
            if (item.kind === 'tool' && item.status === 'running') {
              next[i] = { ...item, status: event.ok ? 'ok' : 'failed' };
              break;
            }
          }
          return next;
        }
        case 'confirmation_required':
          next.push({
            kind: 'confirm',
            actionId: event.actionId,
            label: event.label,
            status: 'pending',
          });
          return next;
        case 'questions_required':
          next.push({
            kind: 'questions',
            actionId: event.actionId,
            questions: event.questions,
            status: 'pending',
          });
          return next;
        case 'upgrade_required':
          next.push({ kind: 'upgrade', feature: event.feature });
          return next;
        case 'upload_requested':
          next.push({ kind: 'upload', uploadKind: event.uploadKind });
          return next;
        case 'error':
          next.push({ kind: 'assistant', text: event.message });
          return next;
        default:
          return next;
      }
    });
  }, []);

  /** Shared SSE consumer for chat + confirm responses. */
  const consumeStream = useCallback(
    async (res: Response) => {
      // Sentences are flushed to the speech queue as they complete, so audio
      // starts on the first sentence instead of after the full reply.
      let speechBuf = '';
      try {
        if (!res.ok || !res.body) {
          handleEvent({ type: 'error', message: 'I could not reach the planner just now — please try again.' });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';
          for (const frame of frames) {
            const line = frame.trim();
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6)) as AgentStreamEvent;
              if (event.type === 'conversation') {
                conversationIdRef.current = event.conversationId;
              } else {
                // Once the agent actually starts working, move past "Saving…".
                if (event.type === 'tool_start' || event.type === 'text_delta') {
                  streamingRef.current = true;
                  setBusyLabel('Thinking…');
                }
                if (event.type === 'text_delta') {
                  speechBuf += event.text;
                  const { sentences, rest } = drainSentences(speechBuf, false);
                  for (const s of sentences) speech.enqueue(s);
                  speechBuf = rest;
                }
                handleEvent(event);
              }
            } catch {
              // Ignore malformed frames
            }
          }
        }
      } finally {
        // Flush any trailing partial sentence, then signal end-of-reply so the
        // queue resumes the hands-free loop once it drains — even on a
        // failed/aborted turn, so voice never stalls.
        const { sentences } = drainSentences(speechBuf, true);
        for (const s of sentences) speech.enqueue(s);
        speech.end();
      }
    },
    [handleEvent, speech]
  );

  const resolveAction = useCallback(
    async (actionId: string, approve: boolean) => {
      if (busy) return;
      streamingRef.current = false;
      setBusyLabel('Saving…');
      setBusy(true);
      setItems((prev) =>
        prev.map((item) =>
          item.kind === 'confirm' && item.actionId === actionId ? { ...item, status: 'resolving' } : item
        )
      );
      try {
        const res = await fetch('/api/agent/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionId, approve }),
        });
        setItems((prev) =>
          prev.map((item) =>
            item.kind === 'confirm' && item.actionId === actionId
              ? { ...item, status: approve ? 'confirmed' : 'declined' }
              : item
          )
        );
        await consumeStream(res);
      } finally {
        setBusy(false);
        onTurnComplete?.();
      }
    },
    [busy, consumeStream, onTurnComplete]
  );

  const resolveAnswers = useCallback(
    async (actionId: string, answers: Record<string, string | string[]>, questions: AgentQuestion[]) => {
      if (busy) return;
      streamingRef.current = false;
      setBusyLabel('Saving…');
      setBusy(true);
      // Show what the user answered as a right-side bubble (summarized).
      const summary = summarizeAnswers(questions, answers);
      setItems((prev) => [
        ...prev.map((item) =>
          item.kind === 'questions' && item.actionId === actionId ? { ...item, status: 'done' as const } : item
        ),
        ...(summary ? [{ kind: 'user' as const, text: summary }] : []),
      ]);
      try {
        const res = await fetch('/api/agent/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionId, answers }),
        });
        await consumeStream(res);
      } finally {
        setBusy(false);
        onTurnComplete?.();
      }
    },
    [busy, consumeStream, onTurnComplete]
  );

  const handleUpload = useCallback(
    async (kind: 'guests' | 'rooms', file: File | undefined) => {
      if (!file) return;
      streamingRef.current = true; // fixed label during the import itself
      setBusyLabel(kind === 'guests' ? 'Importing guests…' : 'Reading floor plan…');
      setBusy(true);
      try {
        let note: string;
        if (kind === 'guests') {
          const r = await importGuestsFromFile(file, weddingSlug);
          const dupes = r.duplicates ? `, ${r.duplicates} duplicate${r.duplicates === 1 ? '' : 's'} skipped` : '';
          note = `${HIDDEN_USER_PREFIX} I just imported my guest list — ${r.imported} guests added${dupes}. Confirm in one short line and continue with the next step for my goals.`;
        } else {
          const r = await importRoomsFromFile(file, weddingSlug);
          note = `${HIDDEN_USER_PREFIX} I just uploaded my hotel floor plan — ${r.count} rooms added. Confirm in one short line and continue with the next step.`;
        }
        // Hand off to the agent so it confirms + keeps moving (no dead end).
        streamingRef.current = false;
        setBusyLabel('Thinking…');
        await streamChatRef.current(note);
      } catch (error) {
        setItems((prev) => [
          ...prev,
          { kind: 'assistant', text: error instanceof Error ? error.message : 'That upload failed — please try again.' },
        ]);
      } finally {
        setBusy(false);
        onTurnComplete?.();
      }
    },
    [weddingSlug, onTurnComplete]
  );

  // Core POST → SSE consume. No busy/UI bookkeeping — callers own that.
  const streamChat = useCallback(
    async (message: string) => {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingSlug,
          message,
          conversationId: conversationIdRef.current ?? undefined,
          voice: voiceActiveRef.current,
        }),
      });
      await consumeStream(res);
    },
    [weddingSlug, consumeStream]
  );
  const streamChatRef = useRef(streamChat);
  streamChatRef.current = streamChat;

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      // Hidden kickoff messages drive the agent without showing a user bubble.
      const hidden = trimmed.startsWith(HIDDEN_USER_PREFIX);
      if (!hidden) setInput('');
      streamingRef.current = true; // a plain message goes straight to thinking
      setBusyLabel('Thinking…');
      setBusy(true);
      if (!hidden) setItems((prev) => [...prev, { kind: 'user', text: trimmed }]);
      try {
        await streamChat(trimmed);
      } finally {
        setBusy(false);
        onTurnComplete?.();
      }
    },
    [busy, streamChat, onTurnComplete]
  );
  sendRef.current = send;

  const voice = useVoiceInput(
    useCallback((text: string) => {
      // Transcript lands in the input for review — the user still hits send.
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    }, [])
  );

  // Hands-free voice mode: spoken utterances (with a live transcript) are
  // auto-sent; the agent's reply is spoken back, then the mic re-opens — a
  // continuous loop like ChatGPT/Claude voice.
  const voiceMode = useVoiceMode({
    onUtterance: useCallback((text: string) => sendRef.current(text), []),
    getBusy: useCallback(() => busyRef.current, []),
  });
  voiceActiveRef.current = voiceMode.active;
  voiceRestartRef.current = voiceMode.restart;
  voiceSetSpeakingRef.current = voiceMode.setSpeaking;

  const enterVoiceMode = useCallback(() => {
    if (voice.state === 'recording') voice.toggle(); // free the mic from push-to-talk
    // An explicit click is already a user gesture, so audio is unlocked — start
    // the loop directly (no tap-to-start gate needed).
    setVoicePending(false);
    voiceMode.start();
  }, [voiceMode, voice]);

  // Begin the auto-defaulted voice session from the tap-to-start gate. The tap
  // is the user gesture that unlocks audio playback for the session, so the
  // spoken opener/resume is actually heard.
  const beginVoiceSession = useCallback(() => {
    try {
      window.speechSynthesis?.resume();
    } catch {
      /* noop */
    }
    setVoicePending(false);
    voiceMode.start();
  }, [voiceMode]);

  // Switch to the typed chat. Session-only — a reload re-opens in voice, since
  // voice is the default modality of the planner.
  const exitVoiceMode = useCallback(() => {
    voiceMode.stop();
    setVoicePending(false);
    speech.cancel(); // stop any queued/playing speech
    setVoiceSpeaking(false);
  }, [voiceMode, speech]);

  const toggleVoiceMode = useCallback(() => {
    if (voiceMode.active || voicePending) exitVoiceMode();
    else enterVoiceMode();
  }, [voiceMode.active, voicePending, enterVoiceMode, exitVoiceMode]);

  // Voice is the default experience: the tap-to-start gate is shown from the
  // first paint (voicePending initialized from defaultVoice). Here we just drop
  // the gate to the typed surface when the browser can't do speech recognition.
  const autoVoiceRef = useRef(false);
  useEffect(() => {
    if (autoVoiceRef.current) return;
    autoVoiceRef.current = true;
    if (!defaultVoice || !voiceMode.supported) setVoicePending(false);
  }, [defaultVoice, voiceMode]);

  const startNewConversation = useCallback(() => {
    // Fresh thread: the next send creates a new conversation server-side.
    // (Reloading before sending restores the previous thread — by design.)
    voiceMode.stop();
    conversationIdRef.current = null;
    setItems([]);
    setHasExistingData(false);
    greetedRef.current = false; // let the opener/resume decision run again
    // Voice is the default, so a fresh thread re-opens the tap-to-start gate.
    setVoicePending(!!defaultVoice);
  }, [defaultVoice, voiceMode]);

  // While the agent is waiting on a structured-question answer, the user
  // answers via the QuestionFlow at the bottom — not the free-text composer.
  const pendingQuestions = [...items]
    .reverse()
    .find((i): i is Extract<ChatItem, { kind: 'questions' }> => i.kind === 'questions' && i.status !== 'done');
  const awaitingQuestions = !!pendingQuestions;

  // Question cards can't be answered by voice — if one appears while in (or
  // about to enter) voice mode, drop to the typed surface so the user can respond.
  useEffect(() => {
    if ((voiceMode.active || voicePending) && awaitingQuestions) exitVoiceMode();
  }, [voiceMode.active, voicePending, awaitingQuestions, exitVoiceMode]);

  // One-shot opener once history has loaded:
  //  - returning with real work in progress (hasExistingData) → resume: a spoken
  //    "let's pick up where we left off" in voice (text mode restores silently).
  //  - otherwise (welcome flow, or a pristine wedding) → fresh opener, but only
  //    if nothing's on screen yet (avoid re-greeting a restored stale greeting).
  useEffect(() => {
    // Wait for the tap-to-start gate before greeting, so the opener is audible.
    if (greetedRef.current || loadingHistory || voicePending) return;
    greetedRef.current = true;
    // A restored pending question needs answering — no opener/resume; the
    // safety-net effect drops voice to the card surface so the user can respond.
    if (awaitingQuestions) return;
    if (!onboarding && hasExistingData) {
      if (voiceActiveRef.current) {
        setItems((prev) => [...prev, { kind: 'assistant', text: RESUME_GREETING }]);
        speech.enqueue(RESUME_GREETING);
        speech.end();
      }
      return;
    }
    if (items.length === 0) {
      void send(voiceActiveRef.current ? ONBOARDING_KICKOFF_VOICE : ONBOARDING_KICKOFF);
    }
  }, [loadingHistory, voicePending, onboarding, hasExistingData, awaitingQuestions, items.length, send, speech]);

  const voiceOrbState: OrbState = busy
    ? 'thinking'
    : voiceSpeaking
      ? 'speaking'
      : voiceMode.listening
        ? 'listening'
        : 'idle';
  const voiceStatus = busy
    ? 'Thinking…'
    : voiceSpeaking
      ? 'Speaking…'
      : voiceMode.listening
        ? 'Listening…'
        : 'Tap the mic to talk';
  const lastAssistant = [...items]
    .reverse()
    .find((i): i is Extract<ChatItem, { kind: 'assistant' }> => i.kind === 'assistant');
  // Show the voice surface (live loop or the tap-to-start gate) unless a
  // question card is pending — those can only be answered on the typed surface.
  const showVoice = (voiceMode.active || voicePending) && !awaitingQuestions;

  return (
    <PheraCard
      variant="default"
      sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight, overflow: 'hidden', p: 0 }}
    >
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        spacing={0.5}
        sx={{ px: 1.5, py: 0.75, borderBottom: `1px solid ${COLORS.border.faint}` }}
      >
        {/* Mute toggle only applies to the typed surface — in voice mode replies
            are always spoken, so hide it there to avoid a no-op control. */}
        {!voiceMode.active && (
          <IconActionButton
            onClick={toggleSpeak}
            aria-label={speak ? 'Mute spoken replies' : 'Hear spoken replies'}
            sx={speak ? { color: COLORS.brand.primary, bgcolor: COLORS.brand.primarySubtle } : undefined}
          >
            {speak ? <VolumeUpRoundedIcon fontSize="small" /> : <VolumeOffRoundedIcon fontSize="small" />}
          </IconActionButton>
        )}
        {items.length > 0 && (
          <SecondaryActionButton size="small" disabled={busy} onClick={startNewConversation}>
            New conversation
          </SecondaryActionButton>
        )}
      </Stack>
      {showVoice ? (
        !voiceMode.active ? (
        // Tap-to-start gate: the tap unlocks audio so the opener is heard, and
        // the mic isn't requested until the user opts in.
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            p: 3,
          }}
        >
          <Box aria-hidden>
            <VoiceOrb state="idle" size={188} />
          </Box>
          <Stack spacing={0.75} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 460 }}>
            <Typography variant="body1" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
              Talk with your planner
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
              Tap start, then just speak — I&apos;ll listen and reply out loud. You can switch to
              typing anytime.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <PrimaryActionButton startIcon={<MicRoundedIcon fontSize="small" />} onClick={beginVoiceSession}>
              Start
            </PrimaryActionButton>
            <SecondaryActionButton startIcon={<KeyboardRoundedIcon fontSize="small" />} onClick={exitVoiceMode}>
              Switch to chat
            </SecondaryActionButton>
          </Stack>
        </Box>
        ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
          }}
        >
          {/* Recent reply / live transcript area */}
          <Stack
            spacing={1.5}
            sx={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: 540,
              px: 2,
            }}
          >
            <Typography
              variant="body1"
              role="status"
              aria-live="polite"
              sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}
            >
              {voiceMode.listening && voiceMode.interim
                ? voiceMode.interim
                : voiceSpeaking && lastAssistant
                  ? lastAssistant.text
                  : busy
                    ? '…'
                    : lastAssistant
                      ? lastAssistant.text
                      : 'Starting…'}
            </Typography>
            {/* Short "what to say" hint with the keywords emphasized, shown until
                they start chatting so the spoken question can stay brief. */}
            {!items.some((i) => i.kind === 'user') && (
              <Typography variant="caption" sx={{ color: COLORS.text.subtle, lineHeight: 1.7 }}>
                Say things like{' '}
                {['transportation help', 'a website', 'save-the-dates', 'collecting RSVPs', 'finding vendors'].map(
                  (phrase, i, arr) => (
                    <Box component="span" key={phrase}>
                      <Box component="span" sx={{ fontWeight: 700, color: COLORS.text.muted }}>
                        {phrase}
                      </Box>
                      {i < arr.length - 1 ? ', ' : ''}
                    </Box>
                  )
                )}
              </Typography>
            )}
          </Stack>

          <Box aria-hidden>
            <VoiceOrb state={voiceOrbState} size={208} />
          </Box>

          <Stack alignItems="center" spacing={2} sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              role="status"
              aria-live="polite"
              sx={{ color: COLORS.text.subtle, letterSpacing: '0.04em' }}
            >
              {voiceStatus}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconActionButton
                onClick={() => voiceMode.restart()}
                disabled={busy || voiceSpeaking || voiceMode.listening}
                aria-label="Talk now"
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: COLORS.bg.subtle,
                  color: COLORS.text.strong,
                  '&:hover': { bgcolor: COLORS.bg.muted },
                  '&.Mui-disabled': { bgcolor: COLORS.bg.muted, color: COLORS.text.placeholder },
                }}
              >
                <MicRoundedIcon />
              </IconActionButton>
              <SecondaryActionButton
                onClick={exitVoiceMode}
                startIcon={<KeyboardRoundedIcon fontSize="small" />}
              >
                Switch to chat
              </SecondaryActionButton>
            </Stack>
          </Stack>
        </Box>
        )
      ) : (
      <>
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {loadingHistory || (onboarding && items.length === 0) ? (
          // During onboarding the kickoff fires immediately — show a spinner,
          // not the generic starter prompts, so we land straight on the greeting.
          <Stack alignItems="center" py={6}>
            <CircularProgress size={22} sx={{ color: COLORS.brand.primary }} />
          </Stack>
        ) : items.length === 0 ? (
          <Stack spacing={2} alignItems="center" py={6}>
            <AutoAwesomeRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 32 }} />
            <Typography variant="body1" sx={{ color: COLORS.text.muted, textAlign: 'center', maxWidth: 420 }}>
              I&apos;m your wedding planner. I can read and update your guest list, schedule, rooms,
              vendors, and more — just tell me what&apos;s happening.
            </Typography>
            <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>
              {starters.map((starter) => (
                <PheraChip
                  key={starter}
                  tone="brand"
                  label={starter}
                  onClick={() => send(starter)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
            <SecondaryActionButton
              size="small"
              startIcon={<GraphicEqRoundedIcon fontSize="small" />}
              onClick={toggleVoiceMode}
            >
              Or talk to me — start voice mode
            </SecondaryActionButton>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {items.map((item, index) =>
              item.kind === 'confirm' ? (
                <Box
                  key={index}
                  sx={{
                    alignSelf: 'flex-start',
                    border: `1px solid ${COLORS.brand.primaryBorder}`,
                    bgcolor: COLORS.brand.primaryWash,
                    borderRadius: `${RADII.md}px`,
                    px: 2,
                    py: 1.5,
                    maxWidth: '85%',
                  }}
                >
                  <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600, mb: 1 }}>
                    Confirm: {item.label}
                  </Typography>
                  {item.status === 'pending' || item.status === 'resolving' ? (
                    <Stack direction="row" spacing={1}>
                      <PrimaryActionButton
                        size="small"
                        loading={item.status === 'resolving'}
                        disabled={busy}
                        onClick={() => resolveAction(item.actionId, true)}
                      >
                        Confirm
                      </PrimaryActionButton>
                      <SecondaryActionButton
                        size="small"
                        disabled={busy}
                        onClick={() => resolveAction(item.actionId, false)}
                      >
                        Decline
                      </SecondaryActionButton>
                    </Stack>
                  ) : (
                    <PheraChip
                      size="small"
                      tone={item.status === 'confirmed' ? 'success' : 'neutral'}
                      label={item.status === 'confirmed' ? 'Confirmed ✓' : 'Declined'}
                    />
                  )}
                </Box>
              ) : item.kind === 'upgrade' ? (
                <Box
                  key={index}
                  sx={{
                    alignSelf: 'flex-start',
                    maxWidth: '85%',
                    border: `1px solid ${COLORS.brand.primaryBorder}`,
                    bgcolor: COLORS.brand.primaryWash,
                    borderRadius: `${RADII.md}px`,
                    px: 2,
                    py: 1.75,
                  }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="center" mb={0.5}>
                    <AutoAwesomeRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 700 }}>
                      {item.feature} is a Premium feature
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 1.5 }}>
                    {item.feature} isn&apos;t on the free plan. Upgrade to unlock it — and everything
                    else — and we&apos;ll keep going right here.
                  </Typography>
                  <PrimaryActionButton size="small" onClick={() => setUpgradeOpen(true)}>
                    Upgrade to continue
                  </PrimaryActionButton>
                </Box>
              ) : item.kind === 'upload' ? (
                <UploadCard
                  key={index}
                  uploadKind={item.uploadKind}
                  onPick={() =>
                    item.uploadKind === 'guests'
                      ? guestFileRef.current?.click()
                      : roomFileRef.current?.click()
                  }
                />
              ) : item.kind === 'questions' ? (
                // Rendered in the bottom composer while pending; nothing inline.
                null
              ) : item.kind === 'tool' ? (
                // Only surface failures — successful tool runs are noise.
                item.status === 'failed' ? (
                  <Box key={index} sx={{ alignSelf: 'flex-start' }}>
                    <PheraChip tone="danger" size="small" label={`${item.label} failed`} />
                  </Box>
                ) : null
              ) : (
                <Box
                  key={index}
                  sx={{
                    alignSelf: item.kind === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    px: 2,
                    py: 1.25,
                    borderRadius: `${RADII.md}px`,
                    bgcolor: item.kind === 'user' ? COLORS.brand.primarySubtle : COLORS.bg.subtle,
                    border: `1px solid ${item.kind === 'user' ? COLORS.brand.primaryBorder : COLORS.border.faint}`,
                  }}
                >
                  {item.kind === 'assistant' ? (
                    <MarkdownText text={item.text} />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: COLORS.text.strong, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {item.text}
                    </Typography>
                  )}
                </Box>
              )
            )}
            {busy && items[items.length - 1]?.kind !== 'assistant' && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
                <CircularProgress size={14} sx={{ color: COLORS.brand.primary }} />
                <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                  {busyLabel}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      <Box sx={{ borderTop: `1px solid ${COLORS.border.faint}` }}>
        {/* When the agent asked structured questions, the composer becomes the
            question collector so the user always answers from the bottom. */}
        {pendingQuestions ? (
          <Box sx={{ p: 2 }}>
            <QuestionFlow
              key={pendingQuestions.actionId}
              questions={pendingQuestions.questions}
              disabled={busy}
              onComplete={(answers) => resolveAnswers(pendingQuestions.actionId, answers, pendingQuestions.questions)}
            />
          </Box>
        ) : (
        <>
        {(voice.error || voiceMode.error) && (
          <Typography variant="caption" sx={{ color: COLORS.text.subtle, px: 2, pt: 1, display: 'block' }}>
            {voice.error || voiceMode.error}
          </Typography>
        )}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          sx={{ display: 'flex', gap: 1, p: 2 }}
        >
          <PheraTextField
            fullWidth
            size="small"
            multiline
            maxRows={6}
            placeholder={
              awaitingQuestions
                ? 'Answer the questions above to continue…'
                : voice.state === 'recording'
                  ? 'Listening… tap the mic again when you’re done'
                  : 'Tell me what’s happening — Enter to send, Shift+Enter for a new line'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            disabled={busy || awaitingQuestions}
            autoComplete="off"
          />
          <input
            ref={guestFileRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls,.vcf,.vcard"
            hidden
            onChange={(e) => {
              void handleUpload('guests', e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <input
            ref={roomFileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.xls"
            hidden
            onChange={(e) => {
              void handleUpload('rooms', e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <IconActionButton
            onClick={(e) => setAttachAnchor(e.currentTarget)}
            disabled={busy || awaitingQuestions}
            aria-label="Upload a guest list or floor plan"
            sx={{ color: COLORS.text.subtle }}
          >
            <AttachFileRoundedIcon fontSize="small" />
          </IconActionButton>
          <PheraMenu anchorEl={attachAnchor} open={!!attachAnchor} onClose={() => setAttachAnchor(null)}>
            <PheraMenuItem
              onClick={() => {
                setAttachAnchor(null);
                guestFileRef.current?.click();
              }}
            >
              Upload guest list (CSV, Excel, vCard)
            </PheraMenuItem>
            <PheraMenuItem
              onClick={() => {
                setAttachAnchor(null);
                roomFileRef.current?.click();
              }}
            >
              Upload room floor plan (PDF, image, CSV)
            </PheraMenuItem>
          </PheraMenu>
          <IconActionButton
            onClick={toggleVoiceMode}
            disabled={busy || awaitingQuestions}
            aria-label="Start hands-free voice mode"
            sx={{ color: COLORS.text.subtle }}
          >
            <GraphicEqRoundedIcon fontSize="small" />
          </IconActionButton>
          <IconActionButton
            onClick={() => voice.toggle()}
            disabled={busy || awaitingQuestions || voice.state === 'transcribing'}
            loading={voice.state === 'transcribing'}
            aria-label={voice.state === 'recording' ? 'Stop recording' : 'Record a voice message'}
            sx={voice.state === 'recording' ? { color: COLORS.brand.primary, bgcolor: COLORS.brand.primarySubtle } : { color: COLORS.text.subtle }}
          >
            {voice.state === 'recording' ? <StopRoundedIcon fontSize="small" /> : <MicRoundedIcon fontSize="small" />}
          </IconActionButton>
          <IconActionButton
            type="submit"
            disabled={busy || awaitingQuestions || !input.trim()}
            aria-label="Send message"
            sx={{ color: COLORS.brand.primary, '&.Mui-disabled': { color: COLORS.border.strong } }}
          >
            <SendRoundedIcon fontSize="small" />
          </IconActionButton>
        </Box>
        </>
        )}
      </Box>
      </>
      )}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} tier="base" />
    </PheraCard>
  );
}

export default AgentChatPanel;
