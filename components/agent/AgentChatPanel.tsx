'use client';

import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useVoiceInput } from './useVoiceInput';
import { MarkdownText } from './MarkdownText';
import { PheraCard } from '@/components/shared/Card';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { IconActionButton, PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { CONFIRMATION_NOTE_PREFIX } from '@/lib/agent/confirm';
import type { AgentStreamEvent, AgentContentBlock } from '@/lib/agent/types';

type ChatItem =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; label: string; status: 'running' | 'ok' | 'failed' }
  | {
      kind: 'confirm';
      actionId: string;
      label: string;
      status: 'pending' | 'resolving' | 'confirmed' | 'declined';
    };

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
        // Confirmation-outcome notes are internal plumbing — the agent's
        // acknowledgment that follows them carries the user-facing content.
        if (block.text.startsWith(CONFIRMATION_NOTE_PREFIX)) continue;
        items.push({ kind: message.role === 'user' ? 'user' : 'assistant', text: block.text });
      } else if (block.type === 'tool_use') {
        items.push({ kind: 'tool', label: block.name.replace(/_/g, ' '), status: 'ok' });
      }
    }
  }
  return items;
}

const SPEAK_STORAGE_KEY = 'phera-agent-speak';

export interface AgentChatPanelProps {
  weddingSlug: string;
  starters?: string[];
  /** Fired after each completed turn (done or error) — lets hosts refresh inspectors. */
  onTurnComplete?: () => void;
  minHeight?: number;
  /** Optional message auto-sent once on mount (e.g. onboarding kickoff). */
  autoGreet?: string;
}

export function AgentChatPanel({
  weddingSlug,
  starters = DEFAULT_STARTERS,
  onTurnComplete,
  minHeight = 480,
  autoGreet,
}: AgentChatPanelProps) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [speak, setSpeak] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSpeak(window.localStorage.getItem(SPEAK_STORAGE_KEY) === '1');
  }, []);

  const toggleSpeak = useCallback(() => {
    setSpeak((prev) => {
      const next = !prev;
      window.localStorage.setItem(SPEAK_STORAGE_KEY, next ? '1' : '0');
      if (!next && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return next;
    });
  }, []);

  const speakRef = useRef(speak);
  speakRef.current = speak;

  const playReply = useCallback(async (text: string) => {
    if (!speakRef.current || !text.trim()) return;
    try {
      const res = await fetch('/api/agent/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const url = URL.createObjectURL(await res.blob());
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      void audio.play().catch(() => URL.revokeObjectURL(url));
    } catch {
      /* speech is best-effort */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setLoadingHistory(true);
    conversationIdRef.current = null;
    (async () => {
      try {
        const res = await fetch(`/api/agent/conversations?weddingSlug=${encodeURIComponent(weddingSlug)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.conversation) conversationIdRef.current = data.conversation.id;
        const restored = data.messages?.length ? itemsFromPersisted(data.messages) : [];
        for (const pending of data.pendingActions ?? []) {
          restored.push({
            kind: 'confirm',
            actionId: pending.id,
            label: String(pending.tool_name).replace(/_/g, ' '),
            status: 'pending',
          });
        }
        if (restored.length) setItems(restored);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weddingSlug]);

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
      if (!res.ok || !res.body) {
        handleEvent({ type: 'error', message: 'I could not reach the planner just now — please try again.' });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let spokenText = '';
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
              if (event.type === 'text_delta') spokenText += event.text;
              handleEvent(event);
            }
          } catch {
            // Ignore malformed frames
          }
        }
      }
      // Speak the assistant's reply once the turn is fully streamed.
      void playReply(spokenText);
    },
    [handleEvent, playReply]
  );

  const resolveAction = useCallback(
    async (actionId: string, approve: boolean) => {
      if (busy) return;
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

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setInput('');
      setBusy(true);
      setItems((prev) => [...prev, { kind: 'user', text: trimmed }]);
      try {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weddingSlug,
            message: trimmed,
            conversationId: conversationIdRef.current ?? undefined,
          }),
        });
        await consumeStream(res);
      } finally {
        setBusy(false);
        onTurnComplete?.();
      }
    },
    [busy, weddingSlug, consumeStream, onTurnComplete]
  );

  const voice = useVoiceInput(
    useCallback((text: string) => {
      // Transcript lands in the input for review — the user still hits send.
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    }, [])
  );

  const startNewConversation = useCallback(() => {
    // Fresh thread: the next send creates a new conversation server-side.
    // (Reloading before sending restores the previous thread — by design.)
    conversationIdRef.current = null;
    setItems([]);
  }, []);

  // One-shot onboarding kickoff so the agent greets first.
  const greetedRef = useRef(false);
  useEffect(() => {
    if (autoGreet && !greetedRef.current && !loadingHistory && items.length === 0) {
      greetedRef.current = true;
      void send(autoGreet);
    }
  }, [autoGreet, loadingHistory, items.length, send]);

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
        <IconActionButton
          onClick={toggleSpeak}
          aria-label={speak ? 'Mute spoken replies' : 'Hear spoken replies'}
          sx={speak ? { color: COLORS.brand.primary, bgcolor: COLORS.brand.primarySubtle } : undefined}
        >
          {speak ? <VolumeUpRoundedIcon fontSize="small" /> : <VolumeOffRoundedIcon fontSize="small" />}
        </IconActionButton>
        {items.length > 0 && (
          <SecondaryActionButton size="small" disabled={busy} onClick={startNewConversation}>
            New conversation
          </SecondaryActionButton>
        )}
      </Stack>
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {loadingHistory ? (
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
              ) : item.kind === 'tool' ? (
                <Box key={index} sx={{ alignSelf: 'flex-start' }}>
                  <PheraChip
                    tone={item.status === 'failed' ? 'danger' : 'neutral'}
                    size="small"
                    label={item.status === 'running' ? `${item.label}…` : item.label}
                    icon={
                      item.status === 'running' ? (
                        <CircularProgress size={12} sx={{ color: COLORS.text.subtle }} />
                      ) : undefined
                    }
                  />
                </Box>
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
                  Thinking…
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      <Box sx={{ borderTop: `1px solid ${COLORS.border.faint}` }}>
        {voice.error && (
          <Typography variant="caption" sx={{ color: COLORS.text.subtle, px: 2, pt: 1, display: 'block' }}>
            {voice.error}
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
            placeholder={
              voice.state === 'recording'
                ? 'Listening… tap the mic again when you’re done'
                : 'Tell me what’s happening — e.g. “Uncle Raj can’t make it anymore”'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            autoComplete="off"
          />
          <IconActionButton
            onClick={() => voice.toggle()}
            disabled={busy || voice.state === 'transcribing'}
            loading={voice.state === 'transcribing'}
            aria-label={voice.state === 'recording' ? 'Stop recording' : 'Record a voice message'}
            sx={voice.state === 'recording' ? { color: COLORS.brand.primary, bgcolor: COLORS.brand.primarySubtle } : undefined}
          >
            {voice.state === 'recording' ? <StopRoundedIcon fontSize="small" /> : <MicRoundedIcon fontSize="small" />}
          </IconActionButton>
          <IconActionButton type="submit" disabled={busy || !input.trim()} aria-label="Send message">
            <SendRoundedIcon fontSize="small" />
          </IconActionButton>
        </Box>
      </Box>
    </PheraCard>
  );
}

export default AgentChatPanel;
