'use client';

import { Box } from '@mui/material';
import { PheraChip } from '@/components/shared/Chip';

/**
 * A row of grey pills above the composer — canned questions a couple can tap
 * instead of typing. Tapping one runs it through the normal chat send path
 * (see AgentChatPanel's handleComposerSend), so it always gets a full-model
 * answer, never the fast onboarding-intake path.
 */
export function SuggestedQuestions({
  questions,
  onAsk,
  disabled,
}: {
  questions: string[];
  onAsk: (question: string) => void;
  disabled?: boolean;
}) {
  if (questions.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, px: 0.5, pb: 1 }}>
      {questions.map((q) => (
        <PheraChip
          key={q}
          tone="neutral"
          size="small"
          label={q}
          onClick={() => !disabled && onAsk(q)}
          sx={{
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'background-color 0.15s ease',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.09)' },
          }}
        />
      ))}
    </Box>
  );
}

export default SuggestedQuestions;
