'use client';

import { Box, Collapse, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { PheraCard } from '@/components/shared/Card';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import {
  IconActionButton,
  PrimaryActionButton,
  SecondaryActionButton,
} from '@/components/admin/ActionButton';
import { weddingService } from '@/lib/supabase/wedding-service';
import { COLORS, RADII } from '@/lib/theme/tokens';

export interface FaqReviewItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqReviewPanelProps {
  faqs: FaqReviewItem[];
  onApprove: () => void;
  disabled?: boolean;
}

/** Stable signature of the incoming list, so we re-adopt the agent's version
 *  whenever a chat edit re-emits a fresh list (without clobbering nothing else). */
function signatureOf(faqs: FaqReviewItem[]): string {
  return faqs.map((f) => `${f.id}|${f.question}|${f.answer}`).join('');
}

/**
 * Right-pane review panel for FAQs the planner drafted and saved live. Each Q&A
 * is a collapsible card the couple can expand, edit inline (persists straight to
 * the DB), and finally approve. Chat-driven edits flow in via the `faqs` prop —
 * a new signature re-syncs the local copy so the panel always shows the latest.
 */
export function FaqReviewPanel({ faqs, onApprove, disabled }: FaqReviewPanelProps) {
  const [localFaqs, setLocalFaqs] = useState<FaqReviewItem[]>(faqs);
  // First card open by default; edits keep their card open.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(faqs[0] ? [faqs[0].id] : [])
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftQuestion, setDraftQuestion] = useState('');
  const [draftAnswer, setDraftAnswer] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Adopt the agent's latest list whenever it actually changes (chat edit /
  // re-draft) — dedupe on a content signature so an unchanged re-render is a
  // no-op. Drop edit mode if the row being edited disappeared.
  const lastSignatureRef = useRef(signatureOf(faqs));
  useEffect(() => {
    const signature = signatureOf(faqs);
    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;
    setLocalFaqs(faqs);
    setExpandedIds((prev) => {
      const ids = new Set(faqs.map((f) => f.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      if (next.size === 0 && faqs[0]) next.add(faqs[0].id);
      return next;
    });
    setEditingId((prev) => (prev && faqs.some((f) => f.id === prev) ? prev : null));
  }, [faqs]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (faq: FaqReviewItem) => {
    setEditingId(faq.id);
    setDraftQuestion(faq.question);
    setDraftAnswer(faq.answer);
    setExpandedIds((prev) => new Set(prev).add(faq.id));
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    const question = draftQuestion.trim();
    const answer = draftAnswer.trim();
    if (!question || !answer) return;
    setSavingId(id);
    try {
      await weddingService.updateFAQ(id, { question, answer });
      setLocalFaqs((prev) =>
        prev.map((f) => (f.id === id ? { ...f, question, answer } : f))
      );
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Box>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
          <CheckCircleRoundedIcon sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
          <Typography variant="body1" sx={{ color: COLORS.text.strong, fontWeight: 700 }}>
            Your guest FAQs — review &amp; approve
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
          These are live on your site. Expand any to read it, tweak the wording, or just approve —
          you can also tell me changes in the chat.
        </Typography>
      </Box>

      <Stack spacing={1.25}>
        {localFaqs.map((faq, index) => {
          const expanded = expandedIds.has(faq.id);
          const editing = editingId === faq.id;
          return (
            <PheraCard key={faq.id} variant="default" sx={{ p: 0, overflow: 'hidden' }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ px: 1.75, py: 1.5, cursor: editing ? 'default' : 'pointer' }}
                onClick={() => !editing && toggleExpand(faq.id)}
              >
                <PheraChip size="small" tone="neutral" label={String(index + 1)} />
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    color: COLORS.text.strong,
                    fontWeight: 600,
                    ...(expanded
                      ? {}
                      : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
                  }}
                >
                  {faq.question}
                </Typography>
                {!editing && (
                  <IconActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(faq);
                    }}
                    disabled={disabled}
                    aria-label="Edit this FAQ"
                    sx={{ color: COLORS.text.subtle, flexShrink: 0 }}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconActionButton>
                )}
                <IconActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(faq.id);
                  }}
                  disabled={disabled || editing}
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                  sx={{
                    color: COLORS.text.subtle,
                    flexShrink: 0,
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <ExpandMoreRoundedIcon fontSize="small" />
                </IconActionButton>
              </Stack>

              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    px: 1.75,
                    pb: 1.75,
                    pt: 0.25,
                    borderTop: `1px solid ${COLORS.border.faint}`,
                  }}
                >
                  {editing ? (
                    <Stack spacing={1.25} sx={{ pt: 1.5 }}>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: COLORS.text.subtle, display: 'block', mb: 0.5 }}
                        >
                          Question
                        </Typography>
                        <PheraTextField
                          fullWidth
                          size="small"
                          value={draftQuestion}
                          disabled={savingId === faq.id}
                          onChange={(e) => setDraftQuestion(e.target.value)}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: COLORS.text.subtle, display: 'block', mb: 0.5 }}
                        >
                          Answer
                        </Typography>
                        <PheraTextField
                          fullWidth
                          size="small"
                          multiline
                          minRows={2}
                          maxRows={8}
                          value={draftAnswer}
                          disabled={savingId === faq.id}
                          onChange={(e) => setDraftAnswer(e.target.value)}
                        />
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <PrimaryActionButton
                          size="small"
                          loading={savingId === faq.id}
                          disabled={disabled || !draftQuestion.trim() || !draftAnswer.trim()}
                          onClick={() => saveEdit(faq.id)}
                        >
                          Save
                        </PrimaryActionButton>
                        <SecondaryActionButton
                          size="small"
                          disabled={savingId === faq.id}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </SecondaryActionButton>
                      </Stack>
                    </Stack>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: COLORS.text.muted, lineHeight: 1.7, pt: 1.5, whiteSpace: 'pre-wrap' }}
                    >
                      {faq.answer}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </PheraCard>
          );
        })}
      </Stack>

      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          pt: 1,
          bgcolor: COLORS.bg.white,
          borderRadius: RADII.md,
        }}
      >
        <PrimaryActionButton
          fullWidth
          disabled={disabled || !!editingId}
          startIcon={<CheckCircleRoundedIcon fontSize="small" />}
          onClick={onApprove}
        >
          Approve — looks good
        </PrimaryActionButton>
      </Box>
    </Stack>
  );
}

export default FaqReviewPanel;
