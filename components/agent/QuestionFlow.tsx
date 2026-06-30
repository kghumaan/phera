'use client';

import { Box, Stack, Typography, TextField, InputAdornment, Tooltip, Divider } from '@mui/material';
import { forwardRef, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { eachDayOfInterval, format, parse, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import { useVoiceInput } from './useVoiceInput';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { PrimaryActionButton, SecondaryActionButton, IconActionButton } from '@/components/admin/ActionButton';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { COLORS, FONTS } from '@/lib/theme/tokens';
import type { AgentQuestion } from '@/lib/agent/types';

const INPUT_MAX_WIDTH = 460;
const INPUT_HEIGHT = 48;

/**
 * Outlined-input styling for the form fields. PheraTextField shallow-merges
 * `{ ...ENHANCED, ...sx }`, so any consumer that overrides
 * `& .MuiOutlinedInput-root` (e.g. to set a fixed height) wipes ENHANCED's
 * border/hover/focus block — leaving the field with no visible outline when
 * unfocused. We re-declare the full root treatment here so every form input
 * keeps a clear resting outline.
 */
const INPUT_ROOT_SX = {
  height: INPUT_HEIGHT,
  bgcolor: COLORS.bg.white,
  '& fieldset': { borderColor: COLORS.border.strong },
  '&:hover fieldset': { borderColor: COLORS.brand.primary },
  '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary, borderWidth: '2px' },
} as const;

/** Larger, tappable select chips. */
const SELECT_CHIP_SX = {
  cursor: 'pointer',
  height: 'auto',
  borderRadius: '12px',
  '& .MuiChip-label': { px: 1.9, py: 1.2, fontSize: '1rem', lineHeight: 1.25 },
} as const;

/** A "The whole thing" option in a multi-select acts as select-all: tapping it
 *  toggles every option on/off, and on submit it collapses to just itself. */
const WHOLE_THING_RE = /whole thing/i;

/** Black-on-white calendar styling (the picker defaults render near-invisible
 *  on our white surfaces). Mirrors the build-ai ChatDateForm treatment. */
const DATE_SLOT_PROPS = {
  textField: {
    fullWidth: true,
    size: 'small' as const,
    sx: {
      ...ENHANCED_TEXT_FIELD_SX,
      maxWidth: INPUT_MAX_WIDTH,
      '& .MuiOutlinedInput-root': INPUT_ROOT_SX,
      '& .MuiOutlinedInput-input': { color: '#000 !important', WebkitTextFillColor: '#000 !important' },
      '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: COLORS.brand.primary },
    },
  },
  actionBar: {
    actions: ['cancel', 'accept'] as ('cancel' | 'accept')[],
    sx: { '& .MuiButton-root': { color: COLORS.brand.primary, fontWeight: 700 } },
  },
  calendarHeader: {
    sx: {
      '& .MuiPickersCalendarHeader-label': { color: COLORS.text.strong, fontWeight: 700 },
      '& .MuiSvgIcon-root': { color: COLORS.text.strong },
    },
  },
  layout: {
    sx: {
      '& .MuiDayCalendar-weekDayLabel': { color: COLORS.text.subtle },
      '& .MuiPickersYear-yearButton': { color: COLORS.text.strong },
    },
  },
  day: {
    sx: {
      color: '#000 !important',
      fontWeight: 500,
      '&.Mui-selected': { backgroundColor: `${COLORS.brand.primary} !important`, color: '#fff !important' },
      '&.MuiPickersDay-today': { borderColor: `${COLORS.brand.primary} !important`, color: COLORS.brand.primary },
    },
  },
};

/** Common event start times — one-tap chips so picking a time is inline, not a popup. */
const TIME_PRESETS = ['9:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

/** Styling for the inline native <input type="time"> custom-time field. */
const TIME_INPUT_SX = {
  height: INPUT_HEIGHT,
  flex: 1,
  minWidth: 130,
  maxWidth: 170,
  px: 1.5,
  border: `1px solid ${COLORS.border.strong}`,
  borderRadius: '12px',
  bgcolor: COLORS.bg.white,
  color: COLORS.text.strong,
  fontFamily: FONTS.body,
  fontSize: '0.95rem',
  '&:hover': { borderColor: COLORS.brand.primary },
  '&:focus': { outline: 'none', borderColor: COLORS.brand.primary, borderWidth: '2px' },
} as const;

export interface QuestionFlowProps {
  questions: AgentQuestion[];
  disabled?: boolean;
  /** Render bigger — used when the form sits in its own left-hand pane. */
  large?: boolean;
  /** Saved celebration date range; date questions offer these days as quick-picks. */
  dateRange?: { start: string; end: string } | null;
  onComplete: (answers: Record<string, string | string[]>) => void;
}

function shortLabel(answer: string | string[] | undefined): string {
  const v = Array.isArray(answer) ? answer.join(', ') : answer ?? '';
  if (!v) return 'skipped';
  return v.length > 28 ? `${v.slice(0, 28)}…` : v;
}

/** "Mehndi — date" / "Welcome Dinner — time" → { event, field }. Drives the
 *  live schedule table so each date/time is clearly tied to its event. */
function parseEventField(prompt: string): { event: string; field: 'date' | 'time' } | null {
  const m = /^(.+?)\s*[—–-]\s*(date|time)\b/i.exec(prompt.trim());
  if (!m) return null;
  return { event: m[1].trim(), field: m[2].toLowerCase() as 'date' | 'time' };
}

/** Short, friendly date for the schedule table ("2026-10-29" → "Oct 29"). */
function prettyDay(iso: string): string {
  try {
    const d = parseISO(iso);
    return isNaN(d.getTime()) ? iso : format(d, 'MMM d');
  } catch {
    return iso;
  }
}

/** "5:00 PM" → minutes since midnight, for chronological sorting (undated/no
 *  time sort last). */
function timeToMinutes(t?: string): number {
  if (!t) return 9999;
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return 9999;
  const h = (Number(m[1]) % 12) + (/pm/i.test(m[3]) ? 12 : 0);
  return h * 60 + Number(m[2]);
}

/**
 * Bottom-anchored question collector. Walks the agent's questions one at a
 * time with the right input per type, shows answers given so far as editable
 * chips (click to revisit), and lets the user move forward/back before the
 * batch is submitted.
 */
export function QuestionFlow({ questions, disabled, large, dateRange, onComplete }: QuestionFlowProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [text, setText] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [extraOptions, setExtraOptions] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  // For date questions with a known range: show the days as quick-picks until
  // the user opts into the full calendar for an out-of-range date.
  const [useCalendar, setUseCalendar] = useState(false);

  // The celebration days, as quick-pick options (empty if no/!sane range).
  const rangeDays = useMemo(() => {
    if (!dateRange) return [] as { value: string; label: string }[];
    try {
      const start = parseISO(dateRange.start);
      const end = parseISO(dateRange.end);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];
      const days = eachDayOfInterval({ start, end });
      if (days.length === 0 || days.length > 12) return [];
      return days.map((d) => ({ value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE · MMM d, yyyy') }));
    } catch {
      return [];
    }
  }, [dateRange]);

  const q = questions[step];

  // Group event date/time questions into a live schedule (Event · Date · Time)
  // so it's always clear which value belongs to which function.
  const eventRows = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, { event: string; date?: string; time?: string; dateStep?: number; timeStep?: number }> = {};
    questions.forEach((qq, i) => {
      const pf = parseEventField(qq.prompt);
      if (!pf) return;
      if (!map[pf.event]) {
        map[pf.event] = { event: pf.event };
        order.push(pf.event);
      }
      const ans = answers[qq.id];
      const val = typeof ans === 'string' ? ans : Array.isArray(ans) ? ans.join(', ') : undefined;
      if (pf.field === 'date') {
        map[pf.event].date = val || undefined;
        map[pf.event].dateStep = i;
      } else {
        map[pf.event].time = val || undefined;
        map[pf.event].timeStep = i;
      }
    });
    return order.map((e) => map[e]);
  }, [questions, answers]);
  const isEventScheduling = eventRows.length > 1;
  const currentEvent = q ? parseEventField(q.prompt)?.event : undefined;

  // The schedule, re-sorted chronologically (by day, then time) as answers
  // change — so it always reads top-to-bottom in running order. Undated last.
  const scheduleRows = useMemo(() => {
    return [...eventRows].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
  }, [eventRows]);

  // Prefill the working inputs whenever we land on a question (incl. revisits).
  useEffect(() => {
    const prior = answers[q.id];
    setText(typeof prior === 'string' ? prior : '');
    setMulti(Array.isArray(prior) ? prior : []);
    setExtraOptions(
      Array.isArray(prior) ? prior.filter((p) => !(q.options ?? []).includes(p)) : []
    );
    setOtherText('');
    setRangeStart(null);
    setRangeEnd(null);
    setUseCalendar(false);
    if (typeof prior === 'string' && prior) {
      if (q.type === 'time') setDate(safeParseTime(prior));
      else if (q.type === 'date_range') {
        const [s, e] = prior.split(' to ');
        setRangeStart(s ? safeParse(s) : null);
        setRangeEnd(e ? safeParse(e) : null);
      } else setDate(safeParse(prior));
    } else {
      setDate(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const commit = (value: string | string[]) => {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    // Advance to the first question we haven't touched yet. A skipped question
    // is recorded as '' (present, not undefined) so we never re-land on it —
    // otherwise Skip would just bounce back to the same question.
    const nextUnanswered = questions.findIndex((qq) => next[qq.id] === undefined);
    if (nextUnanswered === -1) onComplete(next);
    else setStep(nextUnanswered);
  };

  const skip = () => commit(q.type === 'multi_select' ? [] : '');
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const answeredChips = questions
    .map((qq, i) => ({ qq, i }))
    .filter(({ qq, i }) => i !== step && answers[qq.id] !== undefined);

  const options = [...(q.options ?? []), ...extraOptions];

  const chipSx = large
    ? { ...SELECT_CHIP_SX, '& .MuiChip-label': { px: 2, py: 1.35, fontSize: '1.05rem', lineHeight: 1.25 } }
    : SELECT_CHIP_SX;

  // Speech-to-text: the user can SPEAK an answer instead of tapping. For selects
  // we match the transcript to the options (adding any we don't recognise); for
  // text we drop it straight in. A ref keeps the latest closure so the voice
  // hook stays stable.
  const applyTranscript = (transcript: string) => {
    const t = transcript.trim();
    if (!t) return;
    const all = [...(q.options ?? []), ...extraOptions];
    const matchOf = (p: string) =>
      all.find((o) => o.toLowerCase() === p.toLowerCase()) ??
      all.find((o) => o.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(o.toLowerCase()));
    if (q.type === 'multi_select') {
      const parts = t.split(/,|\band\b|\bplus\b|\balso\b/i).map((p) => p.trim()).filter(Boolean);
      const picks: string[] = [];
      const extras: string[] = [];
      for (const p of parts) {
        const m = matchOf(p);
        if (m) picks.push(m);
        else { extras.push(p); picks.push(p); }
      }
      if (extras.length) setExtraOptions((e) => [...e, ...extras.filter((x) => !e.includes(x))]);
      setMulti((m) => Array.from(new Set([...m, ...picks])));
    } else if (q.type === 'single_select') {
      const m = matchOf(t);
      if (m) commit(m);
    } else {
      setText((prev) => (prev ? `${prev} ${t}` : t));
    }
  };
  const applyRef = useRef(applyTranscript);
  applyRef.current = applyTranscript;
  const voice = useVoiceInput(useCallback((t: string) => applyRef.current(t), []));
  // Voice lives only in the chat (right) pane now — never on the form itself.
  const voiceSupported = !large && !q.inputOnly && ['text', 'textarea', 'single_select', 'multi_select'].includes(q.type);

  const voiceButton = voiceSupported ? (
    <Tooltip
      title={voice.state === 'recording' ? "We're listening — tell us as much as you need" : 'Or just speak your answer'}
      placement="top"
      arrow
      open={voice.state === 'recording' ? true : undefined}
    >
      <Box component="span" sx={{ display: 'inline-flex' }}>
        <IconActionButton
          onClick={() => voice.toggle()}
          disabled={disabled || voice.state === 'transcribing'}
          loading={voice.state === 'transcribing'}
          aria-label={voice.state === 'recording' ? 'Stop recording' : 'Speak your answer'}
          sx={{
            height: INPUT_HEIGHT,
            width: INPUT_HEIGHT,
            flexShrink: 0,
            color: COLORS.brand.primary,
            ...(voice.state === 'recording' ? { bgcolor: COLORS.brand.primarySubtle } : {}),
          }}
        >
          {voice.state === 'recording' ? <StopRoundedIcon fontSize="small" /> : <MicRoundedIcon fontSize="small" />}
        </IconActionButton>
      </Box>
    </Tooltip>
  ) : null;

  // Back / Next-or-Done / Skip — placed to the right of single-line inputs.
  const actionButtons = (
    <>
      {step > 0 && (
        <SecondaryActionButton size="small" onClick={goBack} disabled={disabled} sx={{ height: INPUT_HEIGHT, flexShrink: 0 }}>
          Back
        </SecondaryActionButton>
      )}
      <PrimaryActionButton size="small" disabled={disabled || !canSubmit()} onClick={submitCurrent} sx={{ height: INPUT_HEIGHT, minWidth: 104, flexShrink: 0 }}>
        {isLastUnanswered() ? 'Done' : 'Next'}
      </PrimaryActionButton>
      {q.optional && (
        <SecondaryActionButton size="small" onClick={skip} disabled={disabled} sx={{ height: INPUT_HEIGHT, flexShrink: 0 }}>
          Skip
        </SecondaryActionButton>
      )}
    </>
  );

  return (
    <Stack spacing={large ? 2.25 : 1.25} sx={{ width: '100%' }}>
      {/* Live schedule table when placing events; otherwise the generic
          "answers so far" chips. Either way, tap to revisit. */}
      {isEventScheduling ? (
        <Box sx={{ border: `1px solid ${COLORS.border.faint}`, borderRadius: '12px', bgcolor: COLORS.bg.white, p: 1.5 }}>
          <Typography variant="caption" sx={{ color: COLORS.text.subtle, display: 'block', mb: 0.75 }}>
            Your schedule so far — tap a chip to change it
          </Typography>
          <Stack spacing={0.25}>
            {scheduleRows.map((r, idx) => {
              const active = r.event === currentEvent;
              const prev = scheduleRows[idx - 1];
              const showDivider = idx > 0 && r.date !== prev.date;
              return (
                <Fragment key={r.event}>
                {showDivider && <Divider sx={{ my: 0.5, borderColor: COLORS.border.faint }} />}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ py: 0.5, px: 0.75, borderRadius: '8px', bgcolor: active ? COLORS.brand.primarySubtle : 'transparent' }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: COLORS.text.strong, fontWeight: active ? 700 : 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {r.event}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <PheraChip
                      size="small"
                      tone={r.date ? 'brand' : 'neutral'}
                      label={r.date ? prettyDay(r.date) : '+ date'}
                      onClick={() => !disabled && r.dateStep !== undefined && setStep(r.dateStep)}
                      sx={{ cursor: 'pointer' }}
                    />
                    <PheraChip
                      size="small"
                      tone={r.time ? 'brand' : 'neutral'}
                      label={r.time ?? '+ time'}
                      onClick={() => !disabled && r.timeStep !== undefined && setStep(r.timeStep)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Stack>
                </Stack>
                </Fragment>
              );
            })}
          </Stack>
        </Box>
      ) : answeredChips.length > 0 ? (
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {answeredChips.map(({ qq, i }) => (
            <PheraChip
              key={qq.id}
              size="small"
              tone="neutral"
              label={`${shortLabel(answers[qq.id])} ✎`}
              onClick={() => !disabled && setStep(i)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
      ) : null}

      <Box>
        {questions.length > 1 && (
          <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
            Question {step + 1} of {questions.length}
          </Typography>
        )}
        <Typography
          variant={large ? 'h5' : 'body2'}
          sx={{ color: COLORS.text.strong, fontWeight: 600, mt: large && questions.length > 1 ? 0.75 : 0 }}
        >
          {q.prompt}
        </Typography>
        {q.hint && (
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: large ? 0.75 : 0.25 }}>
            {q.hint}
          </Typography>
        )}
        {(q.type === 'single_select' || q.type === 'multi_select') && (
          <Typography variant="caption" sx={{ color: COLORS.text.subtle, mt: large ? 1 : 0.5, display: 'block' }}>
            Tap to choose — or just tell me in the chat.
          </Typography>
        )}
      </Box>

      {/* Single-line inputs: full-width control on top, action buttons below —
          so the input is wide (no truncation) and the buttons don't float
          awkwardly far to the right. */}
      {q.type === 'text' && (
        <Stack spacing={1.25} sx={{ width: '100%' }}>
          <PheraTextField
            fullWidth
            size="small"
            autoFocus
            placeholder={q.placeholder}
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
                e.preventDefault();
                commit(text.trim());
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': INPUT_ROOT_SX }}
          />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            {voiceButton}
            {actionButtons}
          </Stack>
        </Stack>
      )}

      {q.type === 'date_range' && (
        <Stack spacing={1.25} sx={{ width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <DatePicker
              selectsRange
              startDate={rangeStart}
              endDate={rangeEnd}
              monthsShown={1}
              onChange={(dates) => {
                const [s, e] = dates as [Date | null, Date | null];
                setRangeStart(s);
                setRangeEnd(e);
              }}
              dateFormat="MMM d, yyyy"
              placeholderText={q.placeholder ?? 'First day → last day'}
              customInput={<RangeInput />}
            />
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>{actionButtons}</Stack>
        </Stack>
      )}

      {q.type === 'date' &&
        (rangeDays.length > 0 && !useCalendar ? (
          // Quick-pick the celebration days — no calendar needed per event.
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Stack spacing={1}>
              {rangeDays.map((d) => {
                const on = !!date && format(date, 'yyyy-MM-dd') === d.value;
                return (
                  <SecondaryActionButton
                    key={d.value}
                    fullWidth
                    disabled={disabled}
                    onClick={() => setDate(parseISO(d.value))}
                    sx={{
                      height: INPUT_HEIGHT,
                      justifyContent: 'center',
                      ...(on
                        ? { borderColor: COLORS.brand.primary, color: COLORS.brand.primary, bgcolor: COLORS.brand.primarySubtle, fontWeight: 700 }
                        : {}),
                    }}
                  >
                    {d.label}
                  </SecondaryActionButton>
                );
              })}
            </Stack>
            {/* Confirm the picked day before moving to the time. */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
              {step > 0 && (
                <SecondaryActionButton size="small" onClick={goBack} disabled={disabled} sx={{ height: INPUT_HEIGHT, flexShrink: 0 }}>
                  Back
                </SecondaryActionButton>
              )}
              <PrimaryActionButton size="small" disabled={disabled || !date} onClick={submitCurrent} sx={{ height: INPUT_HEIGHT, minWidth: 104, flexShrink: 0 }}>
                Confirm
              </PrimaryActionButton>
              <SecondaryActionButton size="small" disabled={disabled} onClick={() => setUseCalendar(true)} sx={{ height: INPUT_HEIGHT, flexShrink: 0 }}>
                Other date
              </SecondaryActionButton>
              {q.optional && (
                <SecondaryActionButton size="small" onClick={skip} disabled={disabled} sx={{ height: INPUT_HEIGHT, flexShrink: 0 }}>
                  Skip
                </SecondaryActionButton>
              )}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1.25} sx={{ width: '100%' }}>
            <Box sx={{ width: '100%' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <MobileDatePicker
                  value={date}
                  onChange={(v) => setDate(v)}
                  enableAccessibleFieldDOMStructure={false}
                  slots={{ textField: TextField }}
                  slotProps={DATE_SLOT_PROPS}
                />
              </LocalizationProvider>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>{actionButtons}</Stack>
          </Stack>
        ))}

      {/* Time: inline preset chips (one tap, no popup) + a native time field for
          anything custom. */}
      {q.type === 'time' && (
        <Stack spacing={1.25} sx={{ width: '100%' }}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {TIME_PRESETS.map((t) => {
              const on = !!date && format(date, 'h:mm a') === t;
              return (
                <PheraChip
                  key={t}
                  tone={on ? 'brand' : 'neutral'}
                  label={t}
                  onClick={() => !disabled && commit(t)}
                  sx={chipSx}
                />
              );
            })}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <Box
              component="input"
              type="time"
              aria-label="Custom time"
              disabled={disabled}
              value={date ? format(date, 'HH:mm') : ''}
              onChange={(e) => setDate(e.target.value ? parse(e.target.value, 'HH:mm', new Date()) : null)}
              sx={TIME_INPUT_SX}
            />
            {actionButtons}
          </Stack>
        </Stack>
      )}

      {q.type === 'textarea' && (
        <>
          <PheraTextField
            fullWidth
            size="small"
            autoFocus
            multiline
            minRows={3}
            maxRows={8}
            placeholder={q.placeholder}
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            sx={{ maxWidth: INPUT_MAX_WIDTH }}
          />
          <Stack direction="row" spacing={1}>{voiceButton}{actionButtons}</Stack>
        </>
      )}

      {q.type === 'single_select' && (
        <Stack spacing={1}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {options.map((opt) => {
              const on = text === opt;
              return (
                <PheraChip
                  key={opt}
                  tone={on ? 'brand' : 'neutral'}
                  label={opt}
                  onClick={() => !disabled && setText(opt)}
                  sx={{ ...chipSx, ...(on ? {} : { '&:hover': { bgcolor: COLORS.border.default } }) }}
                />
              );
            })}
          </Stack>
          {/* Buttons stay visible (Confirm disabled until a choice) so the form
              never looks empty — pick a chip, then Confirm. */}
          <Stack direction="row" spacing={1} alignItems="center">
            {voiceButton}
            {actionButtons}
          </Stack>
        </Stack>
      )}

      {q.type === 'multi_select' && (
        <Stack spacing={1}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {options.map((opt) => {
              const on = multi.includes(opt);
              return (
                <PheraChip
                  key={opt}
                  tone={on ? 'brand' : 'neutral'}
                  label={
                    on ? (
                      // Selected: check on the left pushes the text right.
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckRoundedIcon sx={{ fontSize: '1.05rem' }} />
                        {opt}
                      </Box>
                    ) : (
                      // Unselected: symmetric padding == check+gap, so the text is
                      // centered AND the chip width matches the selected state.
                      <Box component="span" sx={{ px: 1.3 }}>{opt}</Box>
                    )
                  }
                  onClick={() => {
                    if (disabled) return;
                    if (WHOLE_THING_RE.test(opt)) {
                      // "The whole thing" toggles every option on/off.
                      setMulti((m) => (options.every((o) => m.includes(o)) ? [] : [...options]));
                      return;
                    }
                    setMulti((m) => {
                      const base = m.includes(opt) ? m.filter((x) => x !== opt) : [...m, opt];
                      const wholeOpt = options.find((o) => WHOLE_THING_RE.test(o));
                      if (!wholeOpt) return base;
                      // Keep the whole-thing chip lit only when every other is.
                      const withoutWhole = base.filter((o) => !WHOLE_THING_RE.test(o));
                      const others = options.filter((o) => !WHOLE_THING_RE.test(o));
                      return others.every((o) => withoutWhole.includes(o))
                        ? [...withoutWhole, wholeOpt]
                        : withoutWhole;
                    });
                  }}
                  sx={{ ...chipSx, ...(on ? {} : { '&:hover': { bgcolor: COLORS.border.default } }) }}
                />
              );
            })}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="stretch" sx={{ width: '100%' }}>
            {voiceButton}
            {q.allowOther && (
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flex: 1, minWidth: 160 }}>
                <PheraTextField
                  size="small"
                  placeholder="Add another…"
                  value={otherText}
                  disabled={disabled}
                  onChange={(e) => setOtherText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && otherText.trim()) {
                      e.preventDefault();
                      addOther();
                    }
                  }}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': INPUT_ROOT_SX }}
                />
                {/* The + only appears once they've typed something to add. */}
                {otherText.trim() && (
                  <IconActionButton
                    onClick={addOther}
                    disabled={disabled}
                    aria-label="Add option"
                    sx={{ color: COLORS.brand.primary, flexShrink: 0 }}
                  >
                    <AddRoundedIcon fontSize="small" />
                  </IconActionButton>
                )}
              </Stack>
            )}
            {actionButtons}
          </Stack>
        </Stack>
      )}
      {voice.error && (
        <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
          {voice.error}
        </Typography>
      )}
    </Stack>
  );

  function addOther() {
    const v = otherText.trim();
    if (!v) return;
    if (!options.includes(v)) setExtraOptions((e) => [...e, v]);
    setMulti((m) => (m.includes(v) ? m : [...m, v]));
    setOtherText('');
  }

  function canSubmit(): boolean {
    if (q.optional) return true;
    if (q.type === 'date' || q.type === 'time') return !!date;
    if (q.type === 'date_range') return !!rangeStart;
    if (q.type === 'multi_select') return multi.length > 0;
    return !!text.trim();
  }

  function submitCurrent() {
    if (q.type === 'date') commit(date ? format(date, 'yyyy-MM-dd') : '');
    else if (q.type === 'time') commit(date ? format(date, 'h:mm a') : '');
    else if (q.type === 'date_range') {
      if (!rangeStart) return commit('');
      const s = format(rangeStart, 'yyyy-MM-dd');
      commit(rangeEnd ? `${s} to ${format(rangeEnd, 'yyyy-MM-dd')}` : s);
    } else if (q.type === 'multi_select') {
      // If "the whole thing" is selected, send only that — not every option.
      const wholeOpt = options.find((o) => WHOLE_THING_RE.test(o));
      commit(wholeOpt && multi.includes(wholeOpt) ? [wholeOpt] : multi);
    } else commit(text.trim());
  }

  function isLastUnanswered(): boolean {
    // After committing the current answer, would every question be answered?
    return questions.every((qq) => qq.id === q.id || answers[qq.id] !== undefined);
  }
}

/** react-datepicker custom input styled to match our other fields. */
const RangeInput = forwardRef<
  HTMLInputElement,
  { value?: string; onClick?: () => void; placeholder?: string }
>(function RangeInput({ value, onClick, placeholder }, ref) {
  return (
    <TextField
      fullWidth
      size="small"
      inputRef={ref}
      onClick={onClick}
      value={value ?? ''}
      placeholder={placeholder}
      InputProps={{
        readOnly: true,
        endAdornment: (
          <InputAdornment position="end">
            <CalendarMonthRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
          </InputAdornment>
        ),
      }}
      sx={{
        ...ENHANCED_TEXT_FIELD_SX,
        cursor: 'pointer',
        '& .MuiOutlinedInput-root': { ...INPUT_ROOT_SX, cursor: 'pointer' },
        '& .MuiOutlinedInput-input': { cursor: 'pointer', color: '#000 !important', WebkitTextFillColor: '#000 !important' },
      }}
    />
  );
});

function safeParse(value: string): Date | null {
  try {
    const d = parseISO(value);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function safeParseTime(value: string): Date | null {
  try {
    const d = parse(value, 'h:mm a', new Date());
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export default QuestionFlow;
