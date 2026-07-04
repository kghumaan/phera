'use client';

import { Box, Checkbox, Stack, Typography, CircularProgress, LinearProgress, Tooltip, Table, TableBody, TableCell, TableHead, TableRow, useMediaQuery, useTheme } from '@mui/material';
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
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { PheraMenu, PheraMenuItem } from '@/components/shared/Menu';
import { SPINE_STEPS } from '@/lib/agent/spine';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useVoiceInput } from './useVoiceInput';
import { useVoiceMode } from './useVoiceMode';
import { useSpeechQueue, drainSentences, type SpeechQueue } from './useSpeechQueue';
import { VoiceOrb, type OrbState } from './VoiceOrb';
import { MarkdownText } from './MarkdownText';
import { importGuestsFromFile, importRoomsFromFile, type GuestImportProgress } from '@/lib/agent/chat-uploads';
import { PheraCard } from '@/components/shared/Card';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { IconActionButton, PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII, SHADOWS } from '@/lib/theme/tokens';
import { CONFIRMATION_NOTE_PREFIX } from '@/lib/agent/confirm';
import { ANSWERS_NOTE_PREFIX } from '@/lib/agent/answer';
import { HIDDEN_KICKOFF_PREFIX } from '@/lib/agent/message-prefixes';
import { QuestionFlow } from './QuestionFlow';
import { FaqReviewPanel, type FaqReviewItem } from './FaqReviewPanel';
import { VenueCardsPanel } from './VenueCardsPanel';
import { WhatsAppPairingPanel } from './WhatsAppPairingPanel';
import { BroadcastPanel } from './BroadcastPanel';
import { DataPanel } from './DataPanel';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { AgentDataPanel, AgentStreamEvent, AgentContentBlock, AgentQuestion, VenueCard, WhatsAppBroadcastDraft } from '@/lib/agent/types';

type ChatItem =
  | { kind: 'user'; text: string; markdown?: boolean }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; label: string; status: 'running' | 'ok' | 'failed'; summary?: string; undoable?: boolean }
  | {
      kind: 'confirm';
      actionId: string;
      label: string;
      name: string;
      summary?: string;
      reason?: string;
      input?: Record<string, unknown>;
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

/** Compact display value for a confirm-card input field. */
function confirmValue(value: unknown): string {
  const s = String(value);
  return s.length > 120 ? `${s.slice(0, 119)}…` : s;
}

/**
 * The in-chat gated-action card: what the agent wants to do (the tool's
 * describe() summary — or a raw key/value fallback — plus its stated reason),
 * with Confirm / Edit… / Decline. "Edit…" opens a correction note that declines
 * the action and has the agent re-propose an amended one; the "Don't ask again"
 * checkbox persists an 'auto' autonomy override on approval.
 */
function ConfirmActionCard({
  item,
  busy,
  onResolve,
}: {
  item: Extract<ChatItem, { kind: 'confirm' }>;
  busy: boolean;
  onResolve: (actionId: string, approve: boolean, opts?: { note?: string; alwaysAllow?: boolean }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [alwaysAllow, setAlwaysAllow] = useState(false);
  // Raw input fields shown only when there's no friendly summary; the reason
  // gets its own "Why:" line below.
  const inputEntries = item.summary
    ? []
    : Object.entries(item.input ?? {}).filter(([key]) => key !== 'reason');
  return (
    <Box
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
      {item.summary ? (
        <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 1 }}>
          {item.summary}
        </Typography>
      ) : inputEntries.length > 0 ? (
        <Stack spacing={0.25} sx={{ mb: 1 }}>
          {inputEntries.map(([key, value]) => (
            <Typography key={key} variant="caption" sx={{ color: COLORS.text.muted }}>
              <Box component="span" sx={{ color: COLORS.text.subtle }}>
                {key.replace(/_/g, ' ')}:
              </Box>{' '}
              {confirmValue(value)}
            </Typography>
          ))}
        </Stack>
      ) : null}
      {item.reason && (
        <Typography variant="caption" sx={{ color: COLORS.text.subtle, display: 'block', mb: 1 }}>
          Why: {item.reason}
        </Typography>
      )}
      {item.status === 'pending' || item.status === 'resolving' ? (
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <PrimaryActionButton
              size="small"
              loading={item.status === 'resolving'}
              disabled={busy}
              onClick={() => onResolve(item.actionId, true, alwaysAllow ? { alwaysAllow: true } : undefined)}
            >
              Confirm
            </PrimaryActionButton>
            <SecondaryActionButton size="small" disabled={busy} onClick={() => setEditing((v) => !v)}>
              Edit…
            </SecondaryActionButton>
            <SecondaryActionButton size="small" disabled={busy} onClick={() => onResolve(item.actionId, false)}>
              Decline
            </SecondaryActionButton>
          </Stack>
          {editing && (
            <Stack spacing={1}>
              <PheraTextField
                size="small"
                multiline
                minRows={2}
                placeholder="What should change?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={busy}
              />
              <Stack direction="row" spacing={1.5} alignItems="center">
                <PrimaryActionButton
                  size="small"
                  disabled={busy || !note.trim()}
                  onClick={() => onResolve(item.actionId, false, { note: note.trim() })}
                >
                  Send change
                </PrimaryActionButton>
                <Typography
                  component="button"
                  type="button"
                  variant="caption"
                  onClick={() => {
                    setEditing(false);
                    setNote('');
                  }}
                  sx={{
                    border: 'none',
                    background: 'none',
                    p: 0,
                    cursor: 'pointer',
                    color: COLORS.text.subtle,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Cancel
                </Typography>
              </Stack>
            </Stack>
          )}
          {item.name !== 'set_autonomy' && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Checkbox
                size="small"
                checked={alwaysAllow}
                onChange={(e) => setAlwaysAllow(e.target.checked)}
                disabled={busy}
                sx={{ p: 0.25, color: COLORS.text.subtle, '&.Mui-checked': { color: COLORS.brand.primary } }}
              />
              <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                Don&apos;t ask again for this
              </Typography>
            </Stack>
          )}
        </Stack>
      ) : (
        <PheraChip
          size="small"
          tone={item.status === 'confirmed' ? 'success' : 'neutral'}
          label={item.status === 'confirmed' ? 'Confirmed ✓' : 'Declined'}
        />
      )}
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

// A friendly category label for the couple's answer bubble, so a tapped option
// reads "Preferred Destination: Goa" rather than a bare "Goa".
const BUBBLE_LABEL_RULES: { test: RegExp; label: string }[] = [
  { test: /venue/i, label: 'Venue' },
  { test: /\b(city|region|destination|leaning toward)\b/i, label: 'Preferred Destination' },
  { test: /(date|when are|timeframe|celebration)/i, label: 'Dates' },
  { test: /(ceremon|\bevents?\b)/i, label: 'Events' },
  { test: /(your names|what are your name|partner|couple)/i, label: 'Names' },
  { test: /(stage|planning process|where are you in)/i, label: 'Planning stage' },
  { test: /(help with|would you like help|what would you like)/i, label: 'Helping with' },
  { test: /budget/i, label: 'Budget' },
];
function bubbleLabelFor(prompt: string): string | null {
  for (const r of BUBBLE_LABEL_RULES) if (r.test.test(prompt)) return r.label;
  return null;
}

/** ISO dates in an answer bubble read like a database dump — render them the
 *  way a person would say them: "2026-07-09 to 2026-07-11" → "Jul 9–11, 2026",
 *  "2026-12-30 to 2027-01-02" → "Dec 30, 2026 – Jan 2, 2027", a single
 *  "2026-07-09" → "Jul 9, 2026". Anything else passes through unchanged. */
function prettyAnswerValue(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: to (\d{4})-(\d{2})-(\d{2}))?$/.exec(value.trim());
  if (!m) return value;
  const [, y1, mo1, d1, y2, mo2, d2] = m;
  const start = `${MONTHS[Number(mo1) - 1] ?? ''} ${Number(d1)}`;
  if (!y2) return `${start}, ${y1}`;
  if (y1 === y2 && mo1 === mo2) return `${start}–${Number(d2)}, ${y1}`;
  const end = `${MONTHS[Number(mo2) - 1] ?? ''} ${Number(d2)}`;
  if (y1 === y2) return `${start} – ${end}, ${y1}`;
  return `${start}, ${y1} – ${end}, ${y2}`;
}

/**
 * Turn answered (prompt → answer) pairs into the bubble the couple sees. A pure
 * event date/time batch becomes a readable, day-then-time-sorted schedule list
 * ("Mehndi — Oct 29, 5:00 PM"); anything else is the compact dot-joined values,
 * each prefixed with a bold category label.
 */
function summarizePairs(pairs: { prompt: string; answer: string }[]): string {
  const events = new Map<string, { date?: string; time?: string }>();
  const allValues: string[] = [];
  // Non-event answers prefixed with a bold category ("**Dates:** Jan 4–6").
  const labeled: string[] = [];
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
      const lbl = bubbleLabelFor(p.prompt);
      const display = prettyAnswerValue(ans);
      labeled.push(lbl ? `**${lbl}:** ${display}` : display);
    }
    if (!skipped) allValues.push(prettyAnswerValue(ans));
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
  const display = labeled.length ? labeled : allValues;
  if (display.length === 0) return '';
  const joined = display.join(' · ');
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

/** The most recent panel payload a tool streamed (venueCards / faqReview),
 *  recovered from persisted tool results so a refresh re-renders the right-pane
 *  cards or review that were live before reload — instead of an empty pane. */
function lastToolPanel<T>(
  messages: Array<{ role?: string; content?: AgentContentBlock[] }>,
  key: string,
  options?: {
    /** A later user message matching this marks the panel consumed (e.g. the
     *  venue Choose/skip messages) — don't restore it on reload. */
    consumedBy?: RegExp;
  }
): T | null {
  let found: T | null = null;
  for (const message of messages) {
    if (found && options?.consumedBy && message.role === 'user') {
      for (const block of message.content ?? []) {
        if (block.type === 'text' && options.consumedBy.test(block.text)) {
          found = null;
          break;
        }
      }
    }
    for (const block of message.content ?? []) {
      if (block.type !== 'tool_result' || typeof block.content !== 'string') continue;
      try {
        const value = (JSON.parse(block.content) as Record<string, unknown>)[key];
        if (Array.isArray(value) ? value.length > 0 : value && typeof value === 'object') found = value as T;
      } catch {
        // non-JSON tool result — ignore
      }
    }
  }
  return found;
}

/** The venue-cards Choose / skip messages — once one follows the cards, the
 *  couple has acted on them and a reload must not resurrect the panel. */
const VENUE_CARDS_CONSUMED_RE = /^I'd like to go with |None of those — let's keep going\./;

/** Short placeholder for the first-visit centered input (summarizes what the
 *  planner can do, so we don't need a paragraph above the starters). */
const WELCOME_PLACEHOLDER = "Tell me what's happening — guests, schedule, rooms, vendors & more";

/** Vertically-centers the composer's text/placeholder (the multiline textarea
 *  otherwise top-aligns while the buttons sit centered). Targets MuiInputBase so
 *  it layers onto — not clobbers — the base field styles. */
const COMPOSER_INPUT_SX = {
  mt: 0, // ENHANCED adds mt:1 for stacked fields; not wanted inline
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  // Zero the wrapper's vertical padding and put symmetric padding on the input
  // itself, so the text/placeholder is centered (the textarea would otherwise
  // top-align in a box taller than one line).
  '& .MuiInputBase-root': { py: 0, alignItems: 'center' },
  '& .MuiInputBase-input': { py: 1.25 },
  // 16px on mobile — anything smaller makes iOS Safari auto-zoom the page on
  // focus, which shoves the chat under the fixed top nav. The doubled `&&`
  // outranks the admin layout's mobile typography override.
  '&& .MuiInputBase-input': { '@media (max-width: 899.95px)': { fontSize: '1rem' } },
  // Darker, more legible placeholder than the default faint grey.
  '& .MuiInputBase-input::placeholder': { color: COLORS.text.faint, opacity: 1 },
} as const;

const DEFAULT_STARTERS = [
  'Help me create my wedding website.',
  'Can we refine my wedding schedule?',
  'Help me find a photographer.',
  "What's still missing from my setup?",
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
          if (summary) items.push({ kind: 'user', text: summary, markdown: true });
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

/** A short, celebratory confetti burst spread across the chat — fired once when
 *  the congratulations opener appears, to make the first moment feel special. */
function fireCongratsConfetti() {
  const common = {
    spread: 75,
    startVelocity: 42,
    ticks: 130,
    gravity: 0.9,
    zIndex: 2000,
    disableForReducedMotion: true,
    colors: [
      COLORS.brand.primary,
      COLORS.cultural.gold,
      COLORS.cultural.purple,
      COLORS.cultural.saffron,
      COLORS.cultural.teal,
    ],
  };
  // Three origins (left, centre, right) so it rains across the whole panel.
  confetti({ ...common, particleCount: 45, angle: 60, origin: { x: 0.15, y: 0.35 } });
  confetti({ ...common, particleCount: 55, angle: 90, origin: { x: 0.5, y: 0.2 } });
  confetti({ ...common, particleCount: 45, angle: 120, origin: { x: 0.85, y: 0.35 } });
}
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
  const theme = useTheme();
  // Mobile gets a different form treatment: panels render inline in the chat
  // stream instead of a side pane stacked above the conversation.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [items, setItems] = useState<ChatItem[]>([]);
  // Analytical, wedding-specific starter prompts for a returning couple ("41 of
  // 280 RSVPs are in…"), fetched from /api/agent/summary. A caller-supplied
  // `starters` wins; otherwise these, then the static defaults.
  const [dynamicStarters, setDynamicStarters] = useState<string[] | null>(null);
  // The "Working on" bar (PLANNER-SPINE-TRACKER A1): the persisted spine step
  // from /api/agent/summary. Refetched after every turn so the bar tracks the
  // agent's set_current_focus / complete_focus_step calls.
  const [focus, setFocus] = useState<{
    step: string | null;
    label: string | null;
    stepNumber: number | null;
    totalSteps: number;
    done: string[];
    skipped: string[];
    complete: boolean;
  } | null>(null);
  // Captured wedding facts distilled from answered form questions — shown as
  // tappable badges under the form so the couple sees (and can change) what's
  // been recorded.
  const [facts, setFacts] = useState<CapturedFact[]>([]);
  // The saved celebration date range — drives the per-event date quick-picks.
  const [weddingDateRange, setWeddingDateRange] = useState<{ start: string; end: string } | null>(null);
  // Live FAQs the planner drafted/updated — shown in the right-pane review panel
  // (expand/edit/approve). Non-null while a review is in front of the couple.
  const [faqReview, setFaqReview] = useState<FaqReviewItem[] | null>(null);
  // Vendor-directory matches the planner surfaced — shown as Airbnb-style
  // listing cards in the right pane. Non-null while results are on screen.
  const [venueCards, setVenueCards] = useState<VenueCard[] | null>(null);
  // Structured tool output (guest tables, RSVP stats, schedules) — shown as a
  // right-pane data panel. Non-null while a panel is on screen.
  const [dataPanel, setDataPanel] = useState<AgentDataPanel | null>(null);
  // Couple's WhatsApp pairing — non-null while the QR connect panel is up;
  // holds the latest channel status string.
  const [pairingStatus, setPairingStatus] = useState<string | null>(null);
  // A drafted guest broadcast awaiting the couple's review + send choice.
  const [broadcastDraft, setBroadcastDraft] = useState<WhatsAppBroadcastDraft | null>(null);
  // One-time animated "try voice" nudge over the mic, revealed right after the
  // (typed-only) names question is answered.
  const [showVoiceHint, setShowVoiceHint] = useState(false);
  const voiceHintShownRef = useRef(false);
  const wasAskingNameRef = useRef(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('Thinking…');
  const [importProgress, setImportProgress] = useState<GuestImportProgress | null>(null);
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
  // One-shot guard so the congrats confetti fires only once per wedding.
  const congratsConfettiRef = useRef(false);
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
    setFaqReview(null);
    setVenueCards(null);
    setDataPanel(null);
    setPairingStatus(null);
    setBroadcastDraft(null);
    setLoadingHistory(true);
    setHasExistingData(false);
    greetedRef.current = false; // each wedding gets its opener decision once
    congratsConfettiRef.current = false;
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
          // Re-hydrate the transient right-pane panels so a refresh doesn't strand
          // the user staring at an empty pane the agent says has cards/FAQs.
          setFaqReview(lastToolPanel<FaqReviewItem[]>(data.messages, 'faqReview'));
          setVenueCards(
            lastToolPanel<VenueCard[]>(data.messages, 'venueCards', { consumedBy: VENUE_CARDS_CONSUMED_RE })
          );
          setDataPanel(lastToolPanel<AgentDataPanel>(data.messages, 'dataPanel'));
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
              // Pending gated rows stash the describe() summary in their result.
              const pendingResult = (pending.result ?? null) as { summary?: string } | null;
              restored.push({
                kind: 'confirm',
                actionId: pending.id,
                label: String(pending.tool_name).replace(/_/g, ' '),
                name: String(pending.tool_name),
                summary:
                  pendingResult && typeof pendingResult === 'object' ? pendingResult.summary : undefined,
                input: pending.input ?? undefined,
                reason: typeof pending.input?.reason === 'string' ? pending.input.reason : undefined,
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

  // Fetch the wedding summary: analytical starter prompts for a returning
  // couple (skipped during the scripted onboarding kickoff) + the Working-on
  // bar's spine focus. Called on mount and after every completed turn, so the
  // bar tracks the agent's focus tools. Fail-open on any error.
  const refreshSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/agent/summary?weddingSlug=${encodeURIComponent(weddingSlug)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!onboarding && Array.isArray(data.starters) && data.starters.length) {
        setDynamicStarters(data.starters);
      }
      setFocus(data.focus ?? null);
    } catch {
      /* fall back to defaults */
    }
  }, [weddingSlug, onboarding]);
  const refreshSummaryRef = useRef(refreshSummary);
  refreshSummaryRef.current = refreshSummary;

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    // The panel states matter on mobile, where the active form renders inline
    // at the end of the conversation — reveal it the moment it appears.
  }, [items, busy, faqReview, venueCards, pairingStatus, broadcastDraft, dataPanel]);

  const handleEvent = useCallback((event: AgentStreamEvent) => {
    // FAQ review drives its own right-pane state, not the chat item list.
    if (event.type === 'faq_review') {
      setFaqReview(event.faqs.length ? event.faqs : null);
      return;
    }
    // Vendor-directory matches drive their own right-pane state too.
    if (event.type === 'venue_cards') {
      setVenueCards(event.vendors.length ? event.vendors : null);
      return;
    }
    // WhatsApp pairing + broadcast review each drive their own right-pane panel.
    if (event.type === 'whatsapp_pairing') {
      setPairingStatus(event.status);
      return;
    }
    if (event.type === 'broadcast_review') {
      setBroadcastDraft(event.draft);
      return;
    }
    // Structured tool output (tables/stats) drives its own right-pane panel.
    if (event.type === 'data_panel') {
      setDataPanel(event.panel);
      return;
    }
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
              next[i] = {
                ...item,
                status: event.ok ? 'ok' : 'failed',
                summary: event.summary,
                undoable: event.undoable,
              };
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
            name: event.name,
            summary: event.summary,
            input: event.input,
            reason: typeof event.input.reason === 'string' ? event.input.reason : undefined,
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
                // Once the agent actually starts working, move past "Saving…" —
                // a running tool shows its own label ("Checking RSVPs…").
                if (event.type === 'tool_start') {
                  streamingRef.current = true;
                  setBusyLabel(`${event.label}…`);
                } else if (event.type === 'text_delta') {
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
    async (actionId: string, approve: boolean, opts?: { note?: string; alwaysAllow?: boolean }) => {
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
          body: JSON.stringify({
            actionId,
            approve,
            ...(opts?.note ? { note: opts.note } : {}),
            ...(opts?.alwaysAllow ? { alwaysAllow: true } : {}),
          }),
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
        ...(summary ? [{ kind: 'user' as const, text: summary, markdown: true }] : []),
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
      // Show activity the instant the file lands — before parsing even starts —
      // so there's no dead gap while the file is read.
      if (kind === 'guests') setImportProgress({ done: 0, total: 0, phase: 'parsing' });
      try {
        let note: string;
        if (kind === 'guests') {
          const r = await importGuestsFromFile(file, weddingSlug, setImportProgress);
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
        setImportProgress(null);
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
        // Keep the Working-on bar in sync with any focus-tool calls this turn.
        void refreshSummaryRef.current();
        onTurnComplete?.();
      }
    },
    [busy, streamChat, onTurnComplete]
  );
  sendRef.current = send;

  // The Working-on bar's right-side action: hand the decision to the agent,
  // which marks the step done vs skipped based on the snapshot and advances
  // the focus (skip = defer-and-resurface).
  const moveOnFromFocus = useCallback(() => {
    if (busy || !focus?.step || !focus.label) return;
    void send(`Let's move on from ${focus.label} for now — take me to the next step.`);
  }, [busy, focus, send]);

  // The spine checklist behind the "Working on" bar: anchor for the dropdown,
  // and jump-back — tapping a past (or skipped) step asks the agent to reopen
  // it, so skipping is never a dead end.
  const [spineAnchor, setSpineAnchor] = useState<null | HTMLElement>(null);
  const jumpToSpineStep = useCallback(
    (key: string, label: string) => {
      setSpineAnchor(null);
      if (busy || focus?.step === key) return;
      void send(`Let's go back to ${label} — I want to review or finish it.`);
    },
    [busy, focus, send]
  );

  // The couple approved the drafted FAQs: clear the review panel and hand a
  // hidden note to the agent so it acknowledges and moves to the next step
  // (mirrors the post-upload continuation note).
  const approveFaqs = useCallback(() => {
    if (busy) return;
    setFaqReview(null);
    void send(
      `${HIDDEN_USER_PREFIX} I've reviewed and approved the FAQs — continue with my next step.`
    );
  }, [busy, send]);

  // The couple picked one of the suggested venues/vendors, or chose to skip.
  const selectVenue = useCallback((v: VenueCard) => {
    if (busy) return;
    setVenueCards(null);
    void send(`I'd like to go with ${v.name}${v.city ? ` in ${v.city}` : ''}.`);
  }, [busy, send]);
  const skipVenues = useCallback(() => {
    if (busy) return;
    setVenueCards(null);
    void send(`${HIDDEN_USER_PREFIX} None of those — let's keep going.`);
  }, [busy, send]);

  // The couple's WhatsApp finished pairing — clear the panel, nudge the agent on.
  const onWhatsAppConnected = useCallback(() => {
    setPairingStatus(null);
    void send(`${HIDDEN_USER_PREFIX} My WhatsApp is now connected — continue with my next step.`);
  }, [send]);
  // A broadcast was sent from the review panel — acknowledge + continue.
  const onBroadcastSent = useCallback(
    (summary: string) => {
      setBroadcastDraft(null);
      void send(`${HIDDEN_USER_PREFIX} ${summary} Acknowledge in one short line and continue.`);
    },
    [send]
  );
  const cancelBroadcast = useCallback(() => setBroadcastDraft(null), []);

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

  // Rain a little confetti on the congrats moment — the first assistant greeting
  // of an onboarding session, or any message that carries the congrats opener.
  useEffect(() => {
    if (congratsConfettiRef.current) return;
    const greeted = items.some(
      (i) => i.kind === 'assistant' && (onboarding || /congratulations on your engagement/i.test(i.text)),
    );
    if (greeted) {
      congratsConfettiRef.current = true;
      fireCongratsConfetti();
    }
  }, [items, onboarding]);

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
    const t = setTimeout(() => setShowVoiceHint(false), 7000);
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
          !busy &&
          send(
            `${HIDDEN_USER_PREFIX} The couple tapped "${label}" to change it. Re-ask just that one field with ask_user (a single question, same input type) so the form reappears, then apply their answer. If it's a minor fix (spelling/wording) update it quietly; if it's a significant change (a different destination, dates, or venue) note in one line what it affects and confirm before cascading.`
          )
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
  // Whether the structured right pane is open — a question is pending, FAQs are
  // up for review, or facts have been captured. When closed, the chat runs
  // full-width (ChatGPT-style).
  const hasFaqReview = !!faqReview && faqReview.length > 0;
  const hasVenueCards = !!venueCards && venueCards.length > 0;
  const hasPairing = !!pairingStatus;
  const hasBroadcast = !!broadcastDraft;
  const hasDataPanel = !!dataPanel;
  const formPaneOpen =
    !!pendingQuestions || hasFaqReview || hasVenueCards || hasPairing || hasBroadcast || hasDataPanel || facts.length > 0;
  // The concrete interactive panel in front of the couple right now (facts
  // alone don't count — they're commentary, not something to act on).
  const hasActivePanel =
    !!pendingQuestions || hasFaqReview || hasVenueCards || hasPairing || hasBroadcast || hasDataPanel;
  // Desktop keeps the side-by-side pane. On mobile that pane would stack on
  // top and shove the whole conversation down-screen, so the active panel
  // renders inline in the chat stream instead.
  const sidePaneOpen = !isMobile && formPaneOpen;
  const mobilePanelOpen = isMobile && hasActivePanel;

  /** The active form/review panel, shared between the desktop side pane
   *  (large) and the mobile inline chat card (compact). */
  const renderActivePanel = (large: boolean) =>
    pendingQuestions ? (
      <QuestionFlow
        key={pendingQuestions.actionId}
        questions={pendingQuestions.questions}
        disabled={busy}
        large={large}
        dateRange={weddingDateRange}
        onComplete={(answers) => resolveAnswers(pendingQuestions.actionId, answers, pendingQuestions.questions)}
      />
    ) : hasFaqReview && faqReview ? (
      <FaqReviewPanel faqs={faqReview} disabled={busy} onApprove={approveFaqs} />
    ) : hasVenueCards && venueCards ? (
      <VenueCardsPanel vendors={venueCards} disabled={busy} onSelect={selectVenue} onSkip={skipVenues} />
    ) : hasPairing && pairingStatus ? (
      <WhatsAppPairingPanel
        weddingSlug={weddingSlug}
        initialStatus={pairingStatus}
        disabled={busy}
        onConnected={onWhatsAppConnected}
      />
    ) : hasBroadcast && broadcastDraft ? (
      <BroadcastPanel
        weddingSlug={weddingSlug}
        draft={broadcastDraft}
        disabled={busy}
        onSent={onBroadcastSent}
        onCancel={cancelBroadcast}
      />
    ) : hasDataPanel && dataPanel ? (
      <DataPanel panel={dataPanel} disabled={busy} onDismiss={() => setDataPanel(null)} />
    ) : null;

  return (
    // On mobile a fixed minimum would overflow short viewports (keyboard open,
    // small phones) and push the composer off-screen — fill whatever height
    // the page gives us instead. Desktop keeps the caller's minimum.
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: { xs: 0, md: minHeight } }}>
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
        {sidePaneOpen && (
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
              {renderActivePanel(true) ?? (
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
      <Box sx={{ order: { md: 1 }, flex: { xs: 1, md: 1.6 }, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: COLORS.bg.subtle, border: `1px solid ${COLORS.border.light}`, borderRadius: RADII.lg, overflow: 'hidden' }}>
      {/* The "Working on" bar — one line pinned to the top of the chat panel:
          the persisted spine step on the left, skip/move-on on the right
          (PLANNER-SPINE-TRACKER A1/A3). Shows "All caught up" once the spine
          is complete; hidden until the agent first sets a focus. */}
      {focus && (focus.step || focus.complete) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 2,
            py: 0.75,
            bgcolor: COLORS.bg.white,
            borderBottom: `1px solid ${COLORS.border.light}`,
            flexShrink: 0,
            minHeight: 44,
          }}
        >
          {focus.step ? (
            <>
              {/* Tap the step to open the full spine checklist (A5): review
                  what's done, jump back to anything — skipped or finished. */}
              <Box
                component="button"
                type="button"
                onClick={(e: React.MouseEvent<HTMLElement>) => setSpineAnchor(e.currentTarget)}
                aria-label="Show all planning steps"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  minWidth: 0,
                  border: 'none',
                  background: 'none',
                  p: 0,
                  cursor: 'pointer',
                  borderRadius: RADII.sm,
                  '&:hover': { bgcolor: COLORS.bg.subtle },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: COLORS.text.muted, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  Working on:{' '}
                  <Box component="span" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                    {focus.label}
                  </Box>
                  {focus.stepNumber && (
                    <Box component="span" sx={{ color: COLORS.text.faint, display: { xs: 'none', sm: 'inline' } }}>
                      {' '}· step {focus.stepNumber} of {focus.totalSteps}
                    </Box>
                  )}
                </Typography>
                <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: COLORS.text.subtle, flexShrink: 0 }} />
              </Box>
              <SecondaryActionButton size="small" onClick={moveOnFromFocus} disabled={busy} sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                Skip
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, whiteSpace: 'pre' }}>
                  {' / move on'}
                </Box>
              </SecondaryActionButton>
            </>
          ) : (
            <Box
              component="button"
              type="button"
              onClick={(e: React.MouseEvent<HTMLElement>) => setSpineAnchor(e.currentTarget)}
              aria-label="Show all planning steps"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                border: 'none',
                background: 'none',
                p: 0,
                cursor: 'pointer',
                borderRadius: RADII.sm,
                '&:hover': { bgcolor: COLORS.bg.subtle },
              }}
            >
              <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                All caught up ✓
                {focus.skipped.length > 0 &&
                  ` · ${focus.skipped.length} skipped step${focus.skipped.length !== 1 ? 's' : ''} parked for later`}
              </Typography>
              <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: COLORS.text.subtle, flexShrink: 0 }} />
            </Box>
          )}
          {/* The spine checklist: every step with its state — pink ✓ done,
              "skipped" parked, "now" current. Tap any step to jump back. */}
          <PheraMenu
            anchorEl={spineAnchor}
            open={!!spineAnchor}
            onClose={() => setSpineAnchor(null)}
            PaperProps={{ sx: { minWidth: 264 } }}
          >
            {SPINE_STEPS.map((s, i) => {
              const isDone = focus.done.includes(s.key);
              const isSkipped = focus.skipped.includes(s.key);
              const isCurrent = focus.step === s.key;
              return (
                <PheraMenuItem
                  key={s.key}
                  onClick={() => jumpToSpineStep(s.key, s.label)}
                  selected={isCurrent}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
                >
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Box component="span" sx={{ color: COLORS.text.faint, width: 16, flexShrink: 0, textAlign: 'right' }}>
                      {i + 1}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isDone || isCurrent ? COLORS.text.strong : COLORS.text.muted,
                      }}
                    >
                      {s.label}
                    </Box>
                  </Box>
                  {isDone ? (
                    <CheckRoundedIcon sx={{ fontSize: 18, color: COLORS.brand.primary, flexShrink: 0 }} />
                  ) : isCurrent ? (
                    <Typography variant="caption" sx={{ color: COLORS.brand.primary, fontWeight: 700, flexShrink: 0 }}>
                      now
                    </Typography>
                  ) : isSkipped ? (
                    <Typography variant="caption" sx={{ color: COLORS.text.faint, flexShrink: 0 }}>
                      skipped
                    </Typography>
                  ) : null}
                </PheraMenuItem>
              );
            })}
          </PheraMenu>
        </Box>
      )}
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
            border: `1px solid ${COLORS.border.default}`,
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
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, md: 3 } }}>
        {loadingHistory || (onboarding && items.length === 0) ? (
          // During onboarding the kickoff fires immediately — show a spinner,
          // not the generic starter prompts, so we land straight on the greeting.
          <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: '100%', py: 6, textAlign: 'center' }}>
            <CircularProgress size={40} thickness={4} sx={{ color: COLORS.brand.primary }} />
            <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
              Setting up your planner…
            </Typography>
          </Stack>
        ) : items.length === 0 && !mobilePanelOpen ? (
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
                <ConfirmActionCard key={index} item={item} busy={busy} onResolve={resolveAction} />
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
                // Failures stay loud; a successful run with a receipt (summary
                // and/or an undoable snapshot) renders as a muted one-liner;
                // everything else stays invisible — success without detail is noise.
                item.status === 'failed' ? (
                  <Box key={index} sx={{ alignSelf: 'flex-start' }}>
                    <PheraChip tone="danger" size="small" label={`${item.label} failed`} />
                  </Box>
                ) : item.status === 'ok' && (item.summary || item.undoable) ? (
                  <Stack
                    key={index}
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                      ✓ {item.label}
                      {item.summary ? ` — ${item.summary}` : ''}
                    </Typography>
                    {item.undoable && (
                      <Typography
                        component="button"
                        type="button"
                        variant="caption"
                        disabled={busy}
                        onClick={() => send(`Undo that last change (${item.label.toLowerCase()}).`)}
                        sx={{
                          border: 'none',
                          background: 'none',
                          p: 0,
                          color: COLORS.brand.primary,
                          cursor: busy ? 'default' : 'pointer',
                          opacity: busy ? 0.5 : 1,
                          '&:hover': { textDecoration: busy ? 'none' : 'underline' },
                        }}
                      >
                        Undo
                      </Typography>
                    )}
                  </Stack>
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
                  {item.kind === 'assistant' || (item.kind === 'user' && item.markdown) ? (
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
            {/* Mobile: the active form/review panel rides inline at the end of
                the conversation — a white card in the stream — instead of a
                pane that shoves the chat down-screen. */}
            {mobilePanelOpen && (
              <Box
                component={motion.div}
                key={pendingQuestions?.actionId ?? 'mobile-panel'}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                sx={{
                  alignSelf: 'stretch',
                  bgcolor: COLORS.bg.white,
                  border: `1px solid ${COLORS.border.light}`,
                  borderRadius: RADII.lg,
                  boxShadow: SHADOWS.card,
                  p: 2,
                }}
              >
                {renderActivePanel(false)}
                {/* The captured-facts sentence lives under the form here (the
                    side pane that usually hosts it doesn't exist on mobile). */}
                {!!pendingQuestions && facts.length > 0 && (
                  <Box sx={{ pt: 2, mt: 2, borderTop: `1px solid ${COLORS.border.faint}` }}>{renderFactSentence()}</Box>
                )}
              </Box>
            )}
            {((busy && items[items.length - 1]?.kind !== 'assistant') || importProgress) && (
              <Stack spacing={0.75} sx={{ pl: 0.5, maxWidth: 320 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={14} sx={{ color: COLORS.brand.primary }} />
                  <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                    {importProgress
                      ? importProgress.phase === 'importing' && importProgress.total > 0
                        ? `Importing ${importProgress.done}/${importProgress.total} guests…`
                        : 'Reading your file…'
                      : busyLabel}
                  </Typography>
                </Stack>
                {importProgress && (
                  <LinearProgress
                    variant={
                      importProgress.phase === 'importing' && importProgress.total > 0
                        ? 'determinate'
                        : 'indeterminate'
                    }
                    value={
                      importProgress.phase === 'importing' && importProgress.total > 0
                        ? Math.round((importProgress.done / importProgress.total) * 100)
                        : undefined
                    }
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: COLORS.border.faint,
                      '& .MuiLinearProgress-bar': { bgcolor: COLORS.brand.primary, borderRadius: 3 },
                    }}
                  />
                )}
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

      <Box sx={{ p: { xs: 1.25, md: 2 } }}>
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
            border: `1px solid ${COLORS.border.default}`,
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
                  ? isMobile
                    ? 'Answer above, or just type it here…'
                    : 'Use the form on the right, or just type / say it here…'
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
                      position: 'relative',
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
                    {/* Caret pointing down at the mic button right below. */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -6,
                        right: 18,
                        width: 11,
                        height: 11,
                        bgcolor: COLORS.bg.white,
                        borderRight: `1px solid ${COLORS.brand.primaryBorder}`,
                        borderBottom: `1px solid ${COLORS.brand.primaryBorder}`,
                        transform: 'rotate(45deg)',
                      }}
                    />
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
