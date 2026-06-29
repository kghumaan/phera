'use client';

import { Box, Stack, Typography, CircularProgress, Tooltip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
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
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
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
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';
import { CONFIRMATION_NOTE_PREFIX } from '@/lib/agent/confirm';
import { ANSWERS_NOTE_PREFIX } from '@/lib/agent/answer';
import { HIDDEN_KICKOFF_PREFIX } from '@/lib/agent/message-prefixes';
import { QuestionFlow } from './QuestionFlow';
import { AnimatePresence, motion } from 'framer-motion';
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
  | { kind: 'upgrade'; feature: string; dismissed?: boolean }
  | { kind: 'upload'; uploadKind: 'guests' | 'rooms'; dismissed?: boolean };

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
          borderRadius: RADII.lg,
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
        borderRadius: RADII.lg,
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
      <Box sx={{ overflowX: 'auto', mb: 1.5, border: `1px solid ${COLORS.border.faint}`, borderRadius: RADII.sm }}>
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

/** "Mehndi — date" / "Welcome Dinner — time" → { event, field }. */
function eventFieldFromPrompt(prompt: string): { event: string; field: 'date' | 'time' } | null {
  const m = /^(.+?)\s*[—–-]\s*(date|time)\b/i.exec(prompt.trim());
  if (!m) return null;
  return { event: m[1].trim(), field: m[2].toLowerCase() as 'date' | 'time' };
}

/** "5:00 PM" → minutes since midnight, for chronological sorting. */
function answerMinutes(t?: string): number {
  if (!t) return 9999;
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return 9999;
  return ((Number(m[1]) % 12) + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + Number(m[2]);
}

/**
 * Turn answered (prompt → answer) pairs into the bubble the couple sees. A pure
 * event date/time batch becomes a readable, day-then-time-sorted schedule list
 * ("Mehndi — Oct 29, 5:00 PM"); anything else is the compact dot-joined values.
 */
function summarizePairs(pairs: { prompt: string; answer: string }[]): string {
  const events = new Map<string, { date?: string; time?: string }>();
  const allValues: string[] = [];
  let nonEventCount = 0;
  for (const p of pairs) {
    const ans = p.answer.trim();
    const skipped = !ans || ans === '(skipped)';
    const ef = eventFieldFromPrompt(p.prompt);
    if (ef) {
      const row = events.get(ef.event) ?? {};
      if (!skipped) {
        if (ef.field === 'date') row.date = ans;
        else row.time = ans;
      }
      events.set(ef.event, row);
    } else if (!skipped) {
      nonEventCount++;
    }
    if (!skipped) allValues.push(ans);
  }
  if (events.size > 1 && nonEventCount === 0) {
    const lines = Array.from(events.entries())
      .map(([event, v]) => ({ event, ...v }))
      .filter((r) => r.date || r.time)
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return answerMinutes(a.time) - answerMinutes(b.time);
      })
      .map((r) => `${r.event} — ${r.date ? prettyDate(r.date) : 'date TBD'}${r.time ? `, ${r.time}` : ''}`);
    if (lines.length) return lines.join('\n');
  }
  if (allValues.length === 0) return '';
  const joined = allValues.join(' · ');
  return joined.length > 300 ? `${joined.slice(0, 297)}…` : joined;
}

/** Summary of a just-answered ask_user batch, for the right-side bubble. */
function summarizeAnswers(questions: AgentQuestion[], answers: Record<string, string | string[]>): string {
  return summarizePairs(
    questions.map((q) => {
      const v = answers[q.id];
      return { prompt: q.prompt, answer: Array.isArray(v) ? v.join(', ') : v ?? '' };
    })
  );
}

/**
 * A captured wedding fact distilled from an answered form question, shown as a
 * tappable badge under the form ("Names: Priya & Rahul"). Tapping re-asks so
 * the couple can change it later.
 */
interface CapturedFact {
  label: string;
  value: string;
}

// Map a question prompt → a short fact label. Ordered: more specific first
// (a "venue name" prompt must read as Venue, not Names). Prompts that don't
// match any rule (per-event times, the schedule-style choice) aren't badged.
const FACT_RULES: { test: RegExp; label: string }[] = [
  { test: /venue/i, label: 'Venue' },
  { test: /\b(city|region|destination|leaning toward)\b/i, label: 'Location' },
  { test: /(date|when are|timeframe|celebration)/i, label: 'Dates' },
  { test: /(ceremon|\bevents?\b)/i, label: 'Events' },
  { test: /(your names|what are your name|partner|couple)/i, label: 'Names' },
  { test: /(stage|planning process|where are you in)/i, label: 'Stage' },
  { test: /(help with|would you like help|what would you like)/i, label: 'Helping with' },
];

// Control/choice questions (e.g. "How should we set up your events?", "lay out
// a typical schedule or set them yourself?") aren't data points — never badge
// them even though they mention "events"/"dates".
const FACT_EXCLUDE = /(how should we|set up your|lay (it|out)|typical schedule|set .* yourself|or set)/i;

function factLabelFor(prompt: string): string | null {
  if (FACT_EXCLUDE.test(prompt)) return null;
  for (const rule of FACT_RULES) if (rule.test.test(prompt)) return rule.label;
  return null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function prettyDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1] ?? ''} ${Number(m[3])}`;
}
function formatFactValue(value: string): string {
  const range = /^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/.exec(value);
  if (range) return `${prettyDate(range[1])} – ${prettyDate(range[2])}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return prettyDate(value);
  return value.length > 40 ? `${value.slice(0, 38)}…` : value;
}

const FULL_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** Capitalize the first letter of each name word, leaving the rest as typed
 *  ("sim & kv" → "Sim & Kv", "KV" stays "KV"). */
function titleCaseName(value: string): string {
  return value.replace(/(^|[\s&/-])([a-z])/g, (_, sep, c) => sep + c.toUpperCase());
}

/** Tidy a free-typed answer into a short display phrase: drop hedges/filler,
 *  soften "probably" → "likely", abbreviate months. So a chat-typed
 *  "Probably February 2027 idk" reads "likely Feb 2027" and
 *  "Jaipur or somewhere in Thailand" reads "Jaipur or Thailand". Picker answers
 *  (ISO dates, selects) have no filler, so they pass through unchanged. */
function summarizeFreeText(value: string): string {
  let v = ` ${value} `;
  v = v.replace(/\b(idk|dunno|i\s*don'?t\s*know|not\s*sure|tbd|lol|i\s*think|i\s*guess)\b/gi, ' ');
  v = v.replace(/\b(somewhere|anywhere)\s+(in|around|near)\s+/gi, '');
  v = v.replace(/\b(around|roughly|approximately|approx\.?|about|like|or\s+so)\s+/gi, ' ');
  v = v.replace(/\bprobably\b/gi, 'likely');
  v = v.replace(/[A-Za-z]+/g, (w) => {
    const i = FULL_MONTHS.indexOf(w.toLowerCase());
    return i >= 0 ? MONTHS[i] : w;
  });
  v = v.replace(/\s+([,.;])/g, '$1').replace(/\s{2,}/g, ' ');
  return v.replace(/^[\s,;.]+|[\s,;.]+$/g, '');
}

/** Display value for a captured fact: names get capitalized; free-text-prone
 *  fields get tidied; everything runs through the date/length formatter. */
function factDisplayValue(label: string, raw: string): string {
  const v = raw.trim();
  if (label === 'Names') return formatFactValue(titleCaseName(v));
  if (label === 'Location' || label === 'Venue' || label === 'Dates') {
    return formatFactValue(summarizeFreeText(v));
  }
  return formatFactValue(v);
}

/** Natural-language phrase for the re-ask message a fact badge sends on tap. */
const FACT_EDIT_PHRASE: Record<string, string> = {
  Names: 'our names',
  Stage: 'where we are in planning',
  Venue: 'the venue',
  Location: 'the location',
  Dates: 'the dates',
  Events: 'the events',
  'Helping with': "what you're helping me with",
};

// Facts woven into the "Planning a wedding for X in Y …" clause, in reading
// order with their connecting word. Stage and "Helping with" read better as
// short trailing sentences, so they're handled separately.
const WEDDING_CLAUSE: { label: string; connector: string }[] = [
  { label: 'Names', connector: 'for' },
  { label: 'Location', connector: 'in' },
  { label: 'Venue', connector: 'at' },
  { label: 'Dates', connector: 'on' },
  { label: 'Events', connector: 'with' },
];

/** Merge new facts into the running list, replacing any with the same label. */
function mergeFacts(prev: CapturedFact[], incoming: CapturedFact[]): CapturedFact[] {
  const next = [...prev];
  for (const fact of incoming) {
    const i = next.findIndex((p) => p.label === fact.label);
    if (i >= 0) next[i] = fact;
    else next.push(fact);
  }
  return next;
}

/** Distill badge-worthy facts from a just-answered ask_user batch. */
function factsFromAnswers(
  questions: AgentQuestion[],
  answers: Record<string, string | string[]>
): CapturedFact[] {
  const out: CapturedFact[] = [];
  for (const q of questions) {
    const label = factLabelFor(q.prompt);
    if (!label) continue;
    const raw = answers[q.id];
    const value = Array.isArray(raw) ? raw.join(', ') : raw ?? '';
    if (!value.trim()) continue;
    out.push({ label, value: factDisplayValue(label, value.trim()) });
  }
  return out;
}

/** Rebuild captured facts from persisted answer-note messages, so the badges
 *  survive a reload. The note lists "- <prompt> → <answer>" per question. */
function factsFromMessages(messages: Array<{ content?: AgentContentBlock[] }>): CapturedFact[] {
  let facts: CapturedFact[] = [];
  for (const message of messages) {
    for (const block of message.content ?? []) {
      if (block.type !== 'text' || !block.text.startsWith(ANSWERS_NOTE_PREFIX)) continue;
      for (const line of block.text.split('\n')) {
        const t = line.trim();
        if (!t.startsWith('- ')) continue;
        const sep = t.indexOf(' → ');
        if (sep < 0) continue;
        const prompt = t.slice(2, sep).trim();
        const answer = t.slice(sep + 3).trim();
        if (!answer || answer === '(skipped)') continue;
        const label = factLabelFor(prompt);
        if (!label) continue;
        facts = mergeFacts(facts, [{ label, value: factDisplayValue(label, answer) }]);
      }
    }
  }
  return facts;
}

/** A wedding date range parsed from a "YYYY-MM-DD to YYYY-MM-DD" answer. */
function parseWeddingRange(value: string): { start: string; end: string } | null {
  const m = /^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/.exec(value.trim());
  return m ? { start: m[1], end: m[2] } : null;
}

/** Pull the saved celebration date range from persisted answer notes (the last
 *  "X to Y" dates answer), so per-event date questions can offer those days. */
function dateRangeFromMessages(
  messages: Array<{ content?: AgentContentBlock[] }>
): { start: string; end: string } | null {
  let found: { start: string; end: string } | null = null;
  for (const message of messages) {
    for (const block of message.content ?? []) {
      if (block.type !== 'text' || !block.text.startsWith(ANSWERS_NOTE_PREFIX)) continue;
      for (const line of block.text.split('\n')) {
        const t = line.trim();
        if (!t.startsWith('- ')) continue;
        const sep = t.indexOf(' → ');
        if (sep < 0) continue;
        if (factLabelFor(t.slice(2, sep).trim()) !== 'Dates') continue;
        const r = parseWeddingRange(t.slice(sep + 3).trim());
        if (r) found = r; // keep the last
      }
    }
  }
  return found;
}

/** Short placeholder for the first-visit centered input (summarizes what the
 *  planner can do, so we don't need a paragraph above the starters). */
const WELCOME_PLACEHOLDER = "Tell me what's happening — guests, schedule, rooms, vendors & more";

/** Vertically-centers the composer's text/placeholder (the multiline textarea
 *  otherwise top-aligns while the buttons sit centered). Targets MuiInputBase so
 *  it layers onto — not clobbers — the base field styles. */
const COMPOSER_INPUT_SX = {
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiInputBase-root': { alignItems: 'center', py: 0.75 },
  '& .MuiInputBase-inputMultiline': { py: 0 },
} as const;

const DEFAULT_STARTERS = [
  'How is our planning going so far?',
  "What's still missing from our setup?",
  'How many guests have RSVPed?',
  'Which rooms still have space?',
];

/** Rebuild the user bubble a form answer showed, from its persisted
 *  "- <prompt> → <answer>" note — so the couple's responses survive a reload,
 *  with the same readable schedule formatting as live. */
function answersSummaryFromNote(noteText: string): string {
  const pairs: { prompt: string; answer: string }[] = [];
  for (const line of noteText.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('- ')) continue;
    const sep = t.indexOf(' → ');
    if (sep < 0) continue;
    pairs.push({ prompt: t.slice(2, sep).trim(), answer: t.slice(sep + 3).trim() });
  }
  return summarizePairs(pairs);
}

function itemsFromPersisted(messages: Array<{ role: string; content: AgentContentBlock[] }>): ChatItem[] {
  const items: ChatItem[] = [];
  for (const message of messages) {
    for (const block of message.content ?? []) {
      if (block.type === 'text' && block.text.trim()) {
        // Internal plumbing notes — the agent's reply that follows carries
        // the user-facing content.
        if (block.text.startsWith(CONFIRMATION_NOTE_PREFIX)) continue;
        if (block.text.startsWith(HIDDEN_USER_PREFIX)) continue;
        if (block.text.startsWith(ANSWERS_NOTE_PREFIX)) {
          // Form answers persist as an internal note — surface the couple's
          // response as the same compact bubble they saw when they answered.
          const summary = answersSummaryFromNote(block.text);
          if (summary) items.push({ kind: 'user', text: summary });
          continue;
        }
        items.push({ kind: message.role === 'user' ? 'user' : 'assistant', text: block.text });
      } else if (block.type === 'tool_use') {
        items.push({ kind: 'tool', label: block.name.replace(/_/g, ' '), status: 'ok' });
      }
    }
  }
  return items;
}

const SPEAK_STORAGE_KEY = 'phera-agent-speak';

// Hands-free voice mode (the orb surface + spoken replies / TTS) is hidden for
// now. Everyone stays on the chat surface, where they can SPEAK their messages
// via the mic (speech-to-text) and READ the agent's text replies. No audio is
// played back. Flip this to true to bring the hands-free voice agent back.
const HANDS_FREE_VOICE_ENABLED = false;

/** Spoken when reopening the planner with work already in progress. */
const RESUME_GREETING = "Let's pick up where we left off. What would you like to tackle next?";

/** Hidden kickoff sent on onboarding — never rendered as a user bubble. */
const HIDDEN_USER_PREFIX = HIDDEN_KICKOFF_PREFIX;
// Stable signature of the onboarding greeting. We normalize any persisted
// greeting that starts with this back to the current ONBOARDING_OPENER on
// restore, so copy tweaks show on reload instead of replaying the stale text
// the model saved when the conversation began.
const ONBOARDING_OPENER_PREFIX = 'Congratulations on your engagement';
const ONBOARDING_OPENER =
  "Congratulations on your engagement! 🎉 I'm your Phera wedding assistant - " +
  "We understand how hectic wedding planning can be and we're here to make it as fun as possible for you.";
  
const ONBOARDING_OPENER2 =
  "Let's start by gathering as much information about your celebrations so we can personalize your experience. Answer the questions on the right, " +
  "or just just brain-dump below — share any details, any documentation or notes you may already have. The more you share with us, the better we can help.";
// Text-onboarding kickoff: the model greets, asks for names (typed only), then
// walks the warm onboarding sequence from the system prompt.
const ONBOARDING_KICKOFF =
  `${HIDDEN_USER_PREFIX} I just got engaged and I'm setting up my wedding from scratch. ` +
  `Greet me with EXACTLY this line, nothing before it: "${ONBOARDING_OPENER}" ` +
  'Then immediately call ask_user with ONE text question (id "couple_names", prompt "Your names", placeholder "e.g. Priya & Rahul", inputOnly true). ' +
  'Do not write anything after the ask_user call. Follow your onboarding sequence for everything after their names.';

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
  starters,
  onTurnComplete,
  minHeight = 480,
  onboarding,
  defaultVoice,
}: AgentChatPanelProps) {
  const [items, setItems] = useState<ChatItem[]>([]);
  // Analytical, wedding-specific starter prompts for a returning couple ("41 of
  // 280 RSVPs are in…"), fetched from /api/agent/summary. A caller-supplied
  // `starters` wins; otherwise these, then the static defaults.
  const [dynamicStarters, setDynamicStarters] = useState<string[] | null>(null);
  // Captured wedding facts distilled from answered form questions — shown as
  // tappable badges under the form so the couple sees (and can change) what's
  // been recorded.
  const [facts, setFacts] = useState<CapturedFact[]>([]);
  // The saved celebration date range — drives the per-event date quick-picks.
  const [weddingDateRange, setWeddingDateRange] = useState<{ start: string; end: string } | null>(null);
  // One-time animated "try voice" nudge over the mic, revealed right after the
  // (typed-only) names question is answered.
  const [showVoiceHint, setShowVoiceHint] = useState(false);
  const voiceHintShownRef = useRef(false);
  const wasAskingNameRef = useRef(false);
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
  const [voicePending, setVoicePending] = useState<boolean>(HANDS_FREE_VOICE_ENABLED && !!defaultVoice);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  // One-shot guard for the opener/resume decision; reset per wedding.
  const greetedRef = useRef(false);
  const voiceActiveRef = useRef(false);
  const voiceRestartRef = useRef<() => void>(() => {});
  const voiceSetSpeakingRef = useRef<(v: boolean) => void>(() => {});
  const sendRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    setSpeak(HANDS_FREE_VOICE_ENABLED && window.localStorage.getItem(SPEAK_STORAGE_KEY) === '1');
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
    setFacts([]);
    setWeddingDateRange(null);
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
        const pendingActions = data.pendingActions ?? [];
        // Returning couples land on a clean, full-width composer (ChatGPT-style)
        // with analytical starters — continuity is preserved via conversationId,
        // but we don't replay the old transcript. We DO restore the thread when
        // onboarding (the kickoff flow) or when something is awaiting them (a
        // pending question / confirmation), so nothing actionable is stranded.
        const restoreThread = !!onboarding || pendingActions.length > 0;
        if (restoreThread) {
          if (data.messages?.length) {
          setFacts(factsFromMessages(data.messages));
          setWeddingDateRange(dateRangeFromMessages(data.messages));
        }
          const restored = (data.messages?.length ? itemsFromPersisted(data.messages) : []).map((it) =>
            // Always show the latest onboarding greeting copy, not the stale text
            // saved when the thread began.
            it.kind === 'assistant' && it.text.startsWith(ONBOARDING_OPENER_PREFIX)
              ? { ...it, text: ONBOARDING_OPENER }
              : it
          );
          for (const pending of pendingActions) {
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
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weddingSlug, defaultVoice, onboarding]);

  // Fetch analytical starter prompts for a returning couple (skip the onboarding
  // flow, which has its own scripted kickoff). Fail-open to the static defaults.
  useEffect(() => {
    if (onboarding) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/agent/summary?weddingSlug=${encodeURIComponent(weddingSlug)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.starters) && data.starters.length) {
          setDynamicStarters(data.starters);
        }
      } catch {
        /* fall back to defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weddingSlug, onboarding]);

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
      // Reveal/refresh the captured-fact badges for anything answered here.
      const newFacts = factsFromAnswers(questions, answers);
      if (newFacts.length) setFacts((prev) => mergeFacts(prev, newFacts));
      // Remember the celebration date range so per-event date questions can
      // offer those days as quick-picks instead of a fresh calendar each time.
      for (const q of questions) {
        if (factLabelFor(q.prompt) !== 'Dates') continue;
        const raw = answers[q.id];
        const r = typeof raw === 'string' ? parseWeddingRange(raw) : null;
        if (r) setWeddingDateRange(r);
      }
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
        // Upload done — clear any upload panel so it doesn't linger.
        setItems((prev) => prev.map((it) => (it.kind === 'upload' ? { ...it, dismissed: true } : it)));
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

  // While the agent is waiting on a structured-question answer, the user
  // answers via the QuestionFlow at the bottom — not the free-text composer.
  const pendingQuestions = [...items]
    .reverse()
    .find((i): i is Extract<ChatItem, { kind: 'questions' }> => i.kind === 'questions' && i.status !== 'done');
  const awaitingQuestions = !!pendingQuestions;

  // The onboarding names question is the only typed-only (inputOnly) ask. While
  // it's open we hide the voice nudge (you can't speak that answer); the moment
  // it's answered we reveal the one-time animated mic hint.
  const askingForName = !!pendingQuestions && pendingQuestions.questions.some((q) => q.inputOnly);
  useEffect(() => {
    if (wasAskingNameRef.current && !askingForName && !voiceHintShownRef.current) {
      voiceHintShownRef.current = true;
      setShowVoiceHint(true);
    }
    wasAskingNameRef.current = askingForName;
  }, [askingForName]);
  // Only run the 3s dismissal while the hint is actually visible — i.e. the mic
  // is on screen and usable (not mid-turn, not recording/transcribing). So if
  // the agent is busy right after the names answer, we wait to reveal it.
  const voiceHintVisible = showVoiceHint && !busy && voice.state === 'idle';
  useEffect(() => {
    if (!voiceHintVisible) return;
    const t = setTimeout(() => setShowVoiceHint(false), 3000);
    return () => clearTimeout(t);
  }, [voiceHintVisible]);

  // Show the couple's fixed framing line (ONBOARDING_OPENER2) as a second chat
  // bubble, right after the greeting — both live and on reload. The greeting
  // itself is model-generated and persisted; this derived line is inserted
  // once, just after it.
  useEffect(() => {
    if (busy) return;
    setItems((prev) => {
      const openerIdx = prev.findIndex(
        (it) => it.kind === 'assistant' && it.text.startsWith(ONBOARDING_OPENER_PREFIX)
      );
      if (openerIdx < 0) return prev;
      if (prev.some((it) => it.kind === 'assistant' && it.text === ONBOARDING_OPENER2)) return prev;
      const next = [...prev];
      next.splice(openerIdx + 1, 0, { kind: 'assistant', text: ONBOARDING_OPENER2 });
      return next;
    });
  }, [items, busy]);

  // Captured facts rendered as a flowing, lightly-bolded sentence (not pills) —
  // each detail fades in as it's answered, and stays tappable to change.
  const renderFactSentence = () => {
    const byLabel: Record<string, string> = {};
    for (const f of facts) byLabel[f.label] = f.value;
    const clause = WEDDING_CLAUSE.filter((c) => byLabel[c.label]);
    const stage = byLabel['Stage'];
    const helping = byLabel['Helping with'];
    const detail = (label: string, value: string) => (
      <Box
        component="span"
        onClick={() =>
          !busy && send(`I'd like to change ${FACT_EDIT_PHRASE[label] ?? `the ${label.toLowerCase()}`}.`)
        }
        sx={{
          fontWeight: 700,
          color: COLORS.text.strong,
          cursor: 'pointer',
          '&:hover': { textDecoration: 'underline', textDecorationColor: COLORS.brand.primary },
        }}
      >
        {value}
      </Box>
    );
    const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } };
    return (
      <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.75 }}>
        {clause.length > 0 && 'Planning a wedding'}
        {clause.map((c) => (
          <motion.span key={c.label} {...fade}>
            {` ${c.connector} `}
            {detail(c.label, byLabel[c.label])}
          </motion.span>
        ))}
        {clause.length > 0 && '. '}
        {stage && (
          <motion.span key="Stage" {...fade}>
            You&apos;re {detail('Stage', stage)}.{' '}
          </motion.span>
        )}
        {helping && (
          <motion.span key="Helping with" {...fade}>
            Looking for help with {detail('Helping with', helping)}.
          </motion.span>
        )}
      </Typography>
    );
  };

  // In the split layout the chat composer stays usable while a form is open on
  // the left. If the user types/speaks there instead of using the form, resolve
  // the parked questions with their message (the form clears and the agent
  // applies what they said) rather than orphaning the parked ask_user.
  const handleComposerSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (pendingQuestions) {
      const pq = pendingQuestions;
      setInput('');
      void resolveAnswers(pq.actionId, { [pq.questions[0]?.id ?? 'response']: trimmed }, pq.questions);
      return;
    }
    void send(trimmed);
  };

  // Upload / upgrade actions need a click, so in voice mode they surface as a
  // big obvious panel (the typed chat renders them inline instead). We show the
  // most recent one that hasn't been acted on or skipped.
  const voiceActionIndex = (() => {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if ((it.kind === 'upload' || it.kind === 'upgrade') && !it.dismissed) return i;
    }
    return -1;
  })();
  const voiceAction = voiceActionIndex >= 0 ? items[voiceActionIndex] : null;
  const dismissVoiceAction = useCallback((index: number) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index && (it.kind === 'upload' || it.kind === 'upgrade') ? { ...it, dismissed: true } : it
      )
    );
  }, []);

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
      if (voiceActiveRef.current) {
        // Speak the fixed warm opener instantly — no model round-trip, so there's
        // no ~5s "thinking" silence before the first words. The model only
        // engages once the user actually responds (their utterance is sent
        // normally and handles set_planning_goals from there).
        setItems((prev) => [...prev, { kind: 'assistant', text: ONBOARDING_OPENER }]);
        speech.enqueue(ONBOARDING_OPENER);
        speech.end();
      } else {
        void send(ONBOARDING_KICKOFF);
      }
    }
  }, [loadingHistory, voicePending, onboarding, hasExistingData, awaitingQuestions, items.length, send, speech]);

  const voiceOrbState: OrbState = busy
    ? 'thinking'
    : voiceSpeaking
      ? 'speaking'
      : voiceMode.listening
        ? 'listening'
        : 'idle';
  const lastAssistant = [...items]
    .reverse()
    .find((i): i is Extract<ChatItem, { kind: 'assistant' }> => i.kind === 'assistant');
  // Show the voice surface (live loop or the tap-to-start gate) unless a
  // question card is pending — those can only be answered on the typed surface.
  const showVoice = HANDS_FREE_VOICE_ENABLED && (voiceMode.active || voicePending) && !awaitingQuestions;
  // Caller-supplied starters win; otherwise the analytical (wedding-specific)
  // ones; otherwise the static defaults.
  const resolvedStarters = starters ?? dynamicStarters ?? DEFAULT_STARTERS;
  // First visit, nothing said yet (not loading, not onboarding): show a centered
  // input with the starters below it; it collapses to the bottom composer once
  // there's a message.
  const isWelcomeEmpty = items.length === 0 && !loadingHistory && !onboarding;
  // Whether the structured right pane is open — a question is pending or facts
  // have been captured. When closed, the chat runs full-width (ChatGPT-style).
  const formPaneOpen = !!pendingQuestions || facts.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight }}>
      {/* File pickers live at the root so they work from both the voice
          action panel and the typed composer. */}
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
        // Live surface mirrors the gate's layout (orb on top, centered group) so
        // the orb stays exactly where it was instead of jumping down.
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
            <VoiceOrb state={voiceOrbState} size={188} />
          </Box>

          {/* Big, obvious action panel for things that need a click (CSV import,
              upgrade) — these can't be done by voice, so surface them here with a
              clear primary action and a skip. */}
          {voiceAction?.kind === 'upload' && (
            <PheraCard
              variant="feature"
              sx={{
                width: '100%',
                maxWidth: 480,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 1.25,
                border: `2px solid ${COLORS.brand.primary}`,
              }}
            >
              <UploadFileRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 34 }} />
              <Typography variant="h6" sx={{ color: COLORS.text.strong }}>
                {voiceAction.uploadKind === 'rooms' ? 'Add your room block' : 'Add your guest list'}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                {voiceAction.uploadKind === 'rooms'
                  ? 'Upload a PDF, image, or spreadsheet of your hotel rooms and I’ll read them in.'
                  : 'Upload a CSV, Excel, or vCard and I’ll import everyone automatically.'}
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                <PrimaryActionButton
                  startIcon={<UploadFileRoundedIcon fontSize="small" />}
                  onClick={() =>
                    voiceAction.uploadKind === 'rooms'
                      ? roomFileRef.current?.click()
                      : guestFileRef.current?.click()
                  }
                >
                  {voiceAction.uploadKind === 'rooms' ? 'Upload floor plan' : 'Upload guest list'}
                </PrimaryActionButton>
                <SecondaryActionButton onClick={() => dismissVoiceAction(voiceActionIndex)}>
                  Skip for now
                </SecondaryActionButton>
              </Stack>
            </PheraCard>
          )}
          {voiceAction?.kind === 'upgrade' && (
            <PheraCard
              variant="feature"
              sx={{
                width: '100%',
                maxWidth: 480,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 1.25,
                border: `2px solid ${COLORS.brand.primary}`,
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 34 }} />
              <Typography variant="h6" sx={{ color: COLORS.text.strong }}>
                {voiceAction.feature} is a Premium feature
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                Upgrade to unlock it and everything else. You can do this now or later.
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                <PrimaryActionButton onClick={() => setUpgradeOpen(true)}>Upgrade</PrimaryActionButton>
                <SecondaryActionButton onClick={() => dismissVoiceAction(voiceActionIndex)}>
                  Maybe later
                </SecondaryActionButton>
              </Stack>
            </PheraCard>
          )}

          {/* Recent reply / live transcript / status — hidden while an action
              panel is up so the panel stays the clear focus. */}
          {!voiceAction && (
            <Stack
              spacing={1.5}
              sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 540, px: 2 }}
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
                      ? 'Thinking…'
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
          )}

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
        </Box>
        )
      ) : (
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
      {/* FORM — the big structured form, on the RIGHT (order 2 on md). Hidden
          until a question is pending or facts have been captured, so the chat
          runs full-width (ChatGPT-style) on open and the pane slides in on the
          first form. DOM-first so it stacks on top on mobile when present. */}
      <AnimatePresence initial={false}>
        {formPaneOpen && (
          <Box
            component={motion.div}
            key="form-pane"
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 48 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            sx={{
              order: { md: 2 },
              display: 'flex',
              flexDirection: 'column',
              flex: { md: 1 },
              minWidth: 0,
              overflowY: 'auto',
              px: { xs: 2, md: 5 },
              py: { xs: 2.5, md: 4 },
            }}
          >
            {/* Centered question / placeholder. Two `mt: auto` boxes (here + the
                facts strip) pin the strip to the bottom while keeping this
                centered; when content overflows, the auto margins collapse. */}
            <Box sx={{ mt: 'auto', mx: 'auto', width: '100%', maxWidth: 460 }}>
              {pendingQuestions ? (
                <QuestionFlow
                  key={pendingQuestions.actionId}
                  questions={pendingQuestions.questions}
                  disabled={busy}
                  large
                  dateRange={weddingDateRange}
                  onComplete={(answers) => resolveAnswers(pendingQuestions.actionId, answers, pendingQuestions.questions)}
                />
              ) : (
                <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <AutoAwesomeRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 30 }} />
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
                    Forms appear here as we go — pick options, dates, and details on this side. Prefer to chat? Just type or talk on the left.
                  </Typography>
                </Stack>
              )}
            </Box>
            {/* Captured facts woven into a flowing, lightly-bolded sentence —
                each detail fades in as it's answered; tap a detail to change it. */}
            <Box sx={{ mt: 'auto', mx: 'auto', width: '100%', maxWidth: 460 }}>
              {facts.length > 0 && <Box sx={{ pt: 2.5 }}>{renderFactSentence()}</Box>}
            </Box>
          </Box>
        )}
      </AnimatePresence>
      {/* CHAT — on the LEFT (order 1 on md), wider. Messages on a soft grey
          rounded panel with a white input. */}
      <Box sx={{ order: { md: 1 }, flex: { xs: 1, md: 1.6 }, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: COLORS.bg.subtle, borderRadius: RADII.lg, overflow: 'hidden' }}>
      {isWelcomeEmpty ? (
      // First-visit hero: a centered input the couple types into, with the
      // conversation starters below it. Collapses to the bottom composer once
      // anything is sent.
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2.5, p: 3, overflowY: 'auto' }}>
        <AutoAwesomeRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 36 }} />
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleComposerSend(input);
          }}
          sx={{
            width: '100%',
            maxWidth: 620,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: COLORS.bg.white,
            border: `1px solid ${COLORS.border.faint}`,
            borderRadius: RADII.lg,
            px: 1.25,
            py: 0.75,
            boxShadow: SHADOWS.card,
          }}
        >
          <PheraTextField
            fullWidth
            size="small"
            multiline
            maxRows={6}
            autoFocus
            placeholder={WELCOME_PLACEHOLDER}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleComposerSend(input);
              }
            }}
            disabled={busy}
            autoComplete="off"
            sx={COMPOSER_INPUT_SX}
          />
          <IconActionButton
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send message"
            sx={{ color: COLORS.brand.primary, '&.Mui-disabled': { color: COLORS.border.strong } }}
          >
            <SendRoundedIcon fontSize="small" />
          </IconActionButton>
        </Box>
        <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1} sx={{ maxWidth: 640 }}>
          {resolvedStarters.map((starter) => (
            <PheraChip key={starter} tone="brand" label={starter} onClick={() => send(starter)} sx={{ cursor: 'pointer' }} />
          ))}
        </Stack>
      </Box>
      ) : (
      <>
      <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {loadingHistory || (onboarding && items.length === 0) ? (
          // During onboarding the kickoff fires immediately — show a spinner,
          // not the generic starter prompts, so we land straight on the greeting.
          <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: '100%', py: 6, textAlign: 'center' }}>
            <CircularProgress size={40} thickness={4} sx={{ color: COLORS.brand.primary }} />
            <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
              Setting up your planner…
            </Typography>
          </Stack>
        ) : items.length === 0 ? (
          <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: '100%', py: 6 }}>
            <AutoAwesomeRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 32 }} />
            <Typography variant="body1" sx={{ color: COLORS.text.muted, textAlign: 'center', maxWidth: 420 }}>
              I&apos;m your wedding planner. I can read and update your guest list, schedule, rooms,
              vendors, and more — just tell me what&apos;s happening.
            </Typography>
            <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>
              {resolvedStarters.map((starter) => (
                <PheraChip
                  key={starter}
                  tone="brand"
                  label={starter}
                  onClick={() => send(starter)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
            {HANDS_FREE_VOICE_ENABLED && (
              <SecondaryActionButton
                size="small"
                startIcon={<GraphicEqRoundedIcon fontSize="small" />}
                onClick={toggleVoiceMode}
              >
                Or talk to me — start voice mode
              </SecondaryActionButton>
            )}
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
                    borderRadius: RADII.lg,
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
                    borderRadius: RADII.lg,
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
                    // Planner replies are borderless text on the grey panel; the
                    // couple's messages stay as a soft pink bubble.
                    maxWidth: item.kind === 'user' ? '85%' : '100%',
                    px: item.kind === 'user' ? 2 : 0,
                    py: item.kind === 'user' ? 1.25 : 0.25,
                    borderRadius: item.kind === 'user' ? RADII.lg : 0,
                    bgcolor: item.kind === 'user' ? COLORS.brand.primarySubtle : 'transparent',
                    border: item.kind === 'user' ? `1px solid ${COLORS.brand.primaryBorder}` : 'none',
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
        {/* Persistent voice-mode toggle — floats at the bottom-right of the
            message area so it's always reachable, never hidden behind the
            question card or composer. */}
        {HANDS_FREE_VOICE_ENABLED && (items.length > 0 || !!pendingQuestions) && (
          <Tooltip
            title={awaitingQuestions ? 'Answer the questions below first, then switch to voice' : 'Switch to voice mode'}
            placement="left"
          >
            <Box component="span" sx={{ position: 'absolute', right: 16, bottom: 16, zIndex: 5 }}>
              <Box
                component="button"
                type="button"
                onClick={toggleVoiceMode}
                disabled={busy || awaitingQuestions}
                aria-label="Switch to voice mode"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.75,
                  py: 1,
                  borderRadius: RADII.pill,
                  border: `1px solid ${COLORS.brand.primaryBorder}`,
                  bgcolor: COLORS.bg.white,
                  color: COLORS.brand.primary,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: SHADOWS.popover,
                  transition: 'background 0.15s ease, opacity 0.15s ease',
                  '&:hover': { bgcolor: COLORS.brand.primarySubtle },
                  '&:disabled': { opacity: 0.45, cursor: 'default' },
                }}
              >
                <GraphicEqRoundedIcon sx={{ fontSize: 18 }} />
                Voice
              </Box>
            </Box>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ p: 2 }}>
        {(voice.error || voiceMode.error) && (
          <Typography variant="caption" sx={{ color: COLORS.text.subtle, px: 0.5, pb: 1, display: 'block' }}>
            {voice.error || voiceMode.error}
          </Typography>
        )}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleComposerSend(input);
          }}
          sx={{
            display: 'flex',
            gap: 0.5,
            alignItems: 'center',
            bgcolor: COLORS.bg.white,
            border: `1px solid ${COLORS.border.faint}`,
            borderRadius: RADII.lg,
            px: 1,
            py: 0.5,
            boxShadow: SHADOWS.card,
          }}
        >
          <PheraTextField
            fullWidth
            size="small"
            multiline
            maxRows={6}
            placeholder={
              voice.state === 'recording'
                ? 'Listening… tap the mic again when you’re done'
                : awaitingQuestions
                  ? 'Use the form on the right, or just type / say it here…'
                  : 'Tell me what’s happening — Enter to send'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleComposerSend(input);
              }
            }}
            disabled={busy}
            autoComplete="off"
            sx={COMPOSER_INPUT_SX}
          />
          {/* Mute toggle for spoken replies — only relevant on the typed
              surface, hidden while the hands-free voice agent is disabled. */}
          {HANDS_FREE_VOICE_ENABLED && !voiceMode.active && (
            <IconActionButton
              onClick={toggleSpeak}
              aria-label={speak ? 'Mute spoken replies' : 'Hear spoken replies'}
              sx={speak ? { color: COLORS.brand.primary, bgcolor: COLORS.brand.primarySubtle } : { color: COLORS.text.subtle }}
            >
              {speak ? <VolumeUpRoundedIcon fontSize="small" /> : <VolumeOffRoundedIcon fontSize="small" />}
            </IconActionButton>
          )}
          <IconActionButton
            onClick={(e) => setAttachAnchor(e.currentTarget)}
            disabled={busy}
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
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <Tooltip
              title={voice.state === 'recording' ? 'Tell us as much as you need' : 'Use voice mode'}
              placement="top"
              arrow
              // No persistent nudge — only the recording hint forces open. The
              // post-names "try voice" prompt is the animated callout below.
              open={voice.state === 'recording' ? true : undefined}
            >
              <Box component="span" sx={{ display: 'inline-flex' }}>
                <IconActionButton
                  onClick={() => voice.toggle()}
                  disabled={busy || voice.state === 'transcribing'}
                  loading={voice.state === 'transcribing'}
                  aria-label={voice.state === 'recording' ? 'Stop recording' : 'Record a voice message'}
                  sx={voice.state === 'recording' ? { color: COLORS.brand.primary, bgcolor: COLORS.brand.primarySubtle } : { color: COLORS.text.subtle }}
                >
                  {voice.state === 'recording' ? <StopRoundedIcon fontSize="small" /> : <MicRoundedIcon fontSize="small" />}
                </IconActionButton>
              </Box>
            </Tooltip>
            {/* One-time "try voice" callout — mild bounce for 3s, dismissable,
                auto-hides. Revealed right after the typed names question. */}
            <AnimatePresence>
              {voiceHintVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: [0, -3, 0], scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                    y: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  style={{ position: 'absolute', bottom: 'calc(100% + 10px)', right: -4, zIndex: 20 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      whiteSpace: 'nowrap',
                      bgcolor: COLORS.bg.white,
                      border: `1px solid ${COLORS.brand.primaryBorder}`,
                      borderRadius: RADII.md,
                      boxShadow: SHADOWS.popover,
                      pl: 1.25,
                      pr: 0.5,
                      py: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                      Prefer to talk? Tap the mic to speak your answers.
                    </Typography>
                    <IconActionButton
                      onClick={() => setShowVoiceHint(false)}
                      aria-label="Dismiss"
                      sx={{ width: 24, height: 24, color: COLORS.text.subtle }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 16 }} />
                    </IconActionButton>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
          <IconActionButton
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send message"
            sx={{ color: COLORS.brand.primary, '&.Mui-disabled': { color: COLORS.border.strong } }}
          >
            <SendRoundedIcon fontSize="small" />
          </IconActionButton>
        </Box>
      </Box>
      </>
      )}
      </Box>
      </Box>
      )}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} tier="base" />
    </Box>
  );
}

export default AgentChatPanel;
