'use client';

import { Box, Stack, Typography, TextField } from '@mui/material';
import { useState } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { format } from 'date-fns';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { COLORS, RADII } from '@/lib/theme/tokens';
import type { AgentQuestion } from '@/lib/agent/types';

export interface QuestionFlowProps {
  questions: AgentQuestion[];
  disabled?: boolean;
  onComplete: (answers: Record<string, string | string[]>) => void;
}

/**
 * Walks the user through the agent's questions one at a time — the right
 * input per type (text / textarea / date picker / single- or multi-select)
 * — then hands back all answers. Mirrors how Claude Code collects inputs.
 */
export function QuestionFlow({ questions, disabled, onComplete }: QuestionFlowProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [text, setText] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [multi, setMulti] = useState<string[]>([]);

  const q = questions[step];
  const isLast = step === questions.length - 1;

  const commit = (value: string | string[]) => {
    const nextAnswers = { ...answers, [q.id]: value };
    setAnswers(nextAnswers);
    setText('');
    setDate(null);
    setMulti([]);
    if (isLast) {
      onComplete(nextAnswers);
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => commit(q.type === 'multi_select' ? [] : '');

  if (!q) return null;

  return (
    <Box
      sx={{
        alignSelf: 'stretch',
        border: `1px solid ${COLORS.brand.primaryBorder}`,
        bgcolor: COLORS.brand.primaryWash,
        borderRadius: `${RADII.md}px`,
        p: 2,
      }}
    >
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, fontWeight: 600 }}>
        Question {step + 1} of {questions.length}
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600, mt: 0.5, mb: 1.5 }}>
        {q.prompt}
      </Typography>

      {(q.type === 'text' || q.type === 'textarea') && (
        <Stack spacing={1.25}>
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
          <FlowButtons
            optional={q.optional}
            disabled={disabled}
            canSubmit={!!text.trim()}
            isLast={isLast}
            onSubmit={() => commit(text.trim())}
            onSkip={skip}
          />
        </Stack>
      )}

      {q.type === 'date' && (
        <Stack spacing={1.25}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <MobileDatePicker
              value={date}
              onChange={(v) => setDate(v)}
              enableAccessibleFieldDOMStructure={false}
              slots={{ textField: TextField }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  placeholder: q.placeholder ?? 'Pick a date',
                  sx: {
                    ...ENHANCED_TEXT_FIELD_SX,
                    '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: COLORS.brand.primary },
                  },
                },
                actionBar: { actions: ['cancel', 'accept'] },
                day: {
                  sx: {
                    '&.Mui-selected': { backgroundColor: `${COLORS.brand.primary} !important`, color: '#fff !important' },
                  },
                },
              }}
            />
          </LocalizationProvider>
          <FlowButtons
            optional={q.optional}
            disabled={disabled}
            canSubmit={!!date}
            isLast={isLast}
            onSubmit={() => date && commit(format(date, 'yyyy-MM-dd'))}
            onSkip={skip}
          />
        </Stack>
      )}

      {q.type === 'single_select' && (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {(q.options ?? []).map((opt) => (
            <PheraChip
              key={opt}
              tone="brand"
              label={opt}
              onClick={() => !disabled && commit(opt)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
          {q.optional && (
            <PheraChip tone="neutral" label="Skip" onClick={skip} sx={{ cursor: 'pointer' }} />
          )}
        </Stack>
      )}

      {q.type === 'multi_select' && (
        <Stack spacing={1.25}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {(q.options ?? []).map((opt) => {
              const on = multi.includes(opt);
              return (
                <PheraChip
                  key={opt}
                  tone={on ? 'brand' : 'neutral'}
                  label={on ? `✓ ${opt}` : opt}
                  onClick={() => setMulti((m) => (on ? m.filter((x) => x !== opt) : [...m, opt]))}
                  sx={{ cursor: 'pointer' }}
                />
              );
            })}
          </Stack>
          <FlowButtons
            optional={q.optional}
            disabled={disabled}
            canSubmit={multi.length > 0}
            isLast={isLast}
            onSubmit={() => commit(multi)}
            onSkip={skip}
          />
        </Stack>
      )}
    </Box>
  );
}

function FlowButtons({
  optional,
  disabled,
  canSubmit,
  isLast,
  onSubmit,
  onSkip,
}: {
  optional?: boolean;
  disabled?: boolean;
  canSubmit: boolean;
  isLast: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  return (
    <Stack direction="row" spacing={1}>
      <PrimaryActionButton size="small" onClick={onSubmit} disabled={disabled || !canSubmit}>
        {isLast ? 'Done' : 'Next'}
      </PrimaryActionButton>
      {optional && (
        <SecondaryActionButton size="small" onClick={onSkip} disabled={disabled}>
          Skip
        </SecondaryActionButton>
      )}
    </Stack>
  );
}

export default QuestionFlow;
