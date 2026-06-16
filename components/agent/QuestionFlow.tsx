'use client';

import { Box, Stack, Typography, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { format, parse, parseISO } from 'date-fns';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { PrimaryActionButton, SecondaryActionButton, IconActionButton } from '@/components/admin/ActionButton';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { COLORS } from '@/lib/theme/tokens';
import type { AgentQuestion } from '@/lib/agent/types';

const INPUT_MAX_WIDTH = 460;

/** Black-on-white calendar styling (the picker defaults render near-invisible
 *  on our white surfaces). Mirrors the build-ai ChatDateForm treatment. */
const DATE_SLOT_PROPS = {
  textField: {
    fullWidth: true,
    size: 'small' as const,
    sx: {
      ...ENHANCED_TEXT_FIELD_SX,
      maxWidth: INPUT_MAX_WIDTH,
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
    if (typeof prior === 'string' && prior) {
      setDate(q.type === 'time' ? safeParseTime(prior) : safeParse(prior));
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
      </Box>

      <Box sx={{ width: '100%', maxWidth: INPUT_MAX_WIDTH }}>
        {(q.type === 'text' || q.type === 'textarea') && (
          <PheraTextField
            fullWidth
            size="small"
            autoFocus
            multiline={q.type === 'textarea'}
            minRows={q.type === 'textarea' ? 3 : undefined}
            maxRows={q.type === 'textarea' ? 8 : undefined}
            placeholder={q.placeholder}
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && q.type === 'text' && text.trim()) {
                e.preventDefault();
                commit(text.trim());
              }
            }}
          />
        )}

        {q.type === 'date' && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <MobileDatePicker
              value={date}
              onChange={(v) => setDate(v)}
              enableAccessibleFieldDOMStructure={false}
              slots={{ textField: TextField }}
              slotProps={DATE_SLOT_PROPS}
            />
          </LocalizationProvider>
        )}

        {q.type === 'time' && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <MobileTimePicker
              value={date}
              onChange={(v) => setDate(v)}
              enableAccessibleFieldDOMStructure={false}
              slots={{ textField: TextField }}
              slotProps={DATE_SLOT_PROPS}
            />
          </LocalizationProvider>
        )}

        {(q.type === 'single_select' || q.type === 'multi_select') && (
          <Stack spacing={1}>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {options.map((opt) => {
                const on = q.type === 'multi_select' ? multi.includes(opt) : false;
                return (
                  <PheraChip
                    key={opt}
                    tone={on ? 'brand' : 'neutral'}
                    label={on ? `✓ ${opt}` : opt}
                    onClick={() => {
                      if (disabled) return;
                      if (q.type === 'single_select') commit(opt);
                      else setMulti((m) => (on ? m.filter((x) => x !== opt) : [...m, opt]));
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                );
              })}
            </Stack>
            {q.allowOther && (
              <Stack direction="row" spacing={0.75} sx={{ maxWidth: 320 }}>
                <PheraTextField
                  fullWidth
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
                />
                <IconActionButton onClick={addOther} disabled={disabled || !otherText.trim()} aria-label="Add option">
                  <AddRoundedIcon fontSize="small" />
                </IconActionButton>
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      <Stack direction="row" spacing={1}>
        {step > 0 && (
          <SecondaryActionButton size="small" onClick={goBack} disabled={disabled}>
            Back
          </SecondaryActionButton>
        )}
        {q.type !== 'single_select' && (
          <PrimaryActionButton
            size="small"
            disabled={disabled || !canSubmit()}
            onClick={submitCurrent}
          >
            {isLastUnanswered() ? 'Done' : 'Next'}
          </PrimaryActionButton>
        )}
        {q.optional && q.type !== 'single_select' && (
          <SecondaryActionButton size="small" onClick={skip} disabled={disabled}>
            Skip
          </SecondaryActionButton>
        )}
      </Stack>
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
    if (q.type === 'multi_select') return multi.length > 0;
    return !!text.trim();
  }

  function submitCurrent() {
    if (q.type === 'date') commit(date ? format(date, 'yyyy-MM-dd') : '');
    else if (q.type === 'time') commit(date ? format(date, 'h:mm a') : '');
    else if (q.type === 'multi_select') commit(multi);
    else commit(text.trim());
  }

  function isLastUnanswered(): boolean {
    // After committing the current answer, would every question be answered?
    return questions.every((qq) => qq.id === q.id || answers[qq.id] !== undefined);
  }
}

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
