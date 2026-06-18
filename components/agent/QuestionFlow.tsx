'use client';

import { Box, Stack, Typography, TextField, InputAdornment } from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { format, parse, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { PrimaryActionButton, SecondaryActionButton, IconActionButton } from '@/components/admin/ActionButton';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { COLORS } from '@/lib/theme/tokens';
import type { AgentQuestion } from '@/lib/agent/types';

const INPUT_MAX_WIDTH = 460;
const INPUT_HEIGHT = 48;

/** Larger, tappable select chips. */
const SELECT_CHIP_SX = {
  cursor: 'pointer',
  height: 'auto',
  borderRadius: '12px',
  '& .MuiChip-label': { px: 1.75, py: 1.1, fontSize: '0.95rem', lineHeight: 1.2 },
} as const;

/** Black-on-white calendar styling (the picker defaults render near-invisible
 *  on our white surfaces). Mirrors the build-ai ChatDateForm treatment. */
const DATE_SLOT_PROPS = {
  textField: {
    fullWidth: true,
    size: 'small' as const,
    sx: {
      ...ENHANCED_TEXT_FIELD_SX,
      maxWidth: INPUT_MAX_WIDTH,
      '& .MuiOutlinedInput-root': { height: INPUT_HEIGHT },
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

export interface QuestionFlowProps {
  questions: AgentQuestion[];
  disabled?: boolean;
  onComplete: (answers: Record<string, string | string[]>) => void;
}

function shortLabel(answer: string | string[] | undefined): string {
  const v = Array.isArray(answer) ? answer.join(', ') : answer ?? '';
  if (!v) return 'skipped';
  return v.length > 28 ? `${v.slice(0, 28)}…` : v;
}

/**
 * Bottom-anchored question collector. Walks the agent's questions one at a
 * time with the right input per type, shows answers given so far as editable
 * chips (click to revisit), and lets the user move forward/back before the
 * batch is submitted.
 */
export function QuestionFlow({ questions, disabled, onComplete }: QuestionFlowProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [text, setText] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [extraOptions, setExtraOptions] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);

  const q = questions[step];

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
    // Advance to the first still-unanswered question; if none, finish.
    const nextUnanswered = questions.findIndex(
      (qq) => next[qq.id] === undefined || next[qq.id] === ''
    );
    if (nextUnanswered === -1) onComplete(next);
    else setStep(nextUnanswered);
  };

  const skip = () => commit(q.type === 'multi_select' ? [] : '');
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const answeredChips = questions
    .map((qq, i) => ({ qq, i }))
    .filter(({ qq, i }) => i !== step && answers[qq.id] !== undefined);

  const options = [...(q.options ?? []), ...extraOptions];

  // Back / Next-or-Done / Skip — placed to the right of single-line inputs.
  const actionButtons = (
    <>
      {step > 0 && (
        <SecondaryActionButton size="small" onClick={goBack} disabled={disabled} sx={{ height: INPUT_HEIGHT, flexShrink: 0 }}>
          Back
        </SecondaryActionButton>
      )}
      {q.type !== 'single_select' && (
        <PrimaryActionButton size="small" disabled={disabled || !canSubmit()} onClick={submitCurrent} sx={{ height: INPUT_HEIGHT, flexShrink: 0 }}>
          {isLastUnanswered() ? 'Done' : 'Next'}
        </PrimaryActionButton>
      )}
      {q.optional && q.type !== 'single_select' && (
        <SecondaryActionButton size="small" onClick={skip} disabled={disabled} sx={{ height: INPUT_HEIGHT, flexShrink: 0 }}>
          Skip
        </SecondaryActionButton>
      )}
    </>
  );

  return (
    <Stack spacing={1.25} sx={{ width: '100%' }}>
      {/* Answers so far — click to revisit */}
      {answeredChips.length > 0 && (
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
      )}

      <Box>
        <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
          Question {step + 1} of {questions.length}
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
          {q.prompt}
        </Typography>
        {q.hint && (
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 0.25 }}>
            {q.hint}
          </Typography>
        )}
      </Box>

      {/* Single-line inputs: control + action buttons on one height-matched row */}
      {q.type === 'text' && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
          <PheraTextField
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
            sx={{ flex: 1, maxWidth: INPUT_MAX_WIDTH, '& .MuiOutlinedInput-root': { height: INPUT_HEIGHT } }}
          />
          {actionButtons}
        </Stack>
      )}

      {q.type === 'date_range' && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
          <Box sx={{ flex: 1, maxWidth: INPUT_MAX_WIDTH }}>
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
          {actionButtons}
        </Stack>
      )}

      {(q.type === 'date' || q.type === 'time') && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
          <Box sx={{ flex: 1, maxWidth: INPUT_MAX_WIDTH }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {q.type === 'date' ? (
                <MobileDatePicker
                  value={date}
                  onChange={(v) => setDate(v)}
                  enableAccessibleFieldDOMStructure={false}
                  slots={{ textField: TextField }}
                  slotProps={DATE_SLOT_PROPS}
                />
              ) : (
                <MobileTimePicker
                  value={date}
                  onChange={(v) => setDate(v)}
                  enableAccessibleFieldDOMStructure={false}
                  slots={{ textField: TextField }}
                  slotProps={DATE_SLOT_PROPS}
                />
              )}
            </LocalizationProvider>
          </Box>
          {actionButtons}
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
          <Stack direction="row" spacing={1}>{actionButtons}</Stack>
        </>
      )}

      {q.type === 'single_select' && (
        <Stack spacing={1}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {options.map((opt) => (
              <PheraChip
                key={opt}
                tone="neutral"
                label={opt}
                onClick={() => !disabled && commit(opt)}
                sx={SELECT_CHIP_SX}
              />
            ))}
          </Stack>
          {step > 0 && (
            <Stack direction="row" spacing={1}>{actionButtons}</Stack>
          )}
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
                  label={on ? `✓ ${opt}` : opt}
                  onClick={() => !disabled && setMulti((m) => (on ? m.filter((x) => x !== opt) : [...m, opt]))}
                  sx={SELECT_CHIP_SX}
                />
              );
            })}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="stretch" sx={{ width: '100%' }}>
            {q.allowOther && (
              <Stack direction="row" spacing={0.75} alignItems="stretch" sx={{ flex: 1, maxWidth: 280 }}>
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
                  sx={{ flex: 1 }}
                />
                <IconActionButton
                  onClick={addOther}
                  disabled={disabled || !otherText.trim()}
                  aria-label="Add option"
                  sx={{ color: COLORS.brand.primary }}
                >
                  <AddRoundedIcon fontSize="small" />
                </IconActionButton>
              </Stack>
            )}
            {actionButtons}
          </Stack>
        </Stack>
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
    } else if (q.type === 'multi_select') commit(multi);
    else commit(text.trim());
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
        '& .MuiOutlinedInput-root': { height: INPUT_HEIGHT, cursor: 'pointer' },
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
