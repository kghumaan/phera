'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  TextField,
  Collapse,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ActionQueueProps {
  pendingSequences: any[];
  escalationsCount: number;
  weddingSlug: string;
  onIssueResolved?: () => void;
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const PRIORITY_COLORS: Record<string, string> = {
  urgent: COLORS.accent.danger,
  high: COLORS.accent.warning,
  medium: COLORS.accent.info,
  low: COLORS.text.faint,
};
const CATEGORY_LABELS: Record<string, string> = {
  visa: 'Visa',
  hotel: 'Hotel',
  flight: 'Flight',
  dietary: 'Dietary',
  accessibility: 'Accessibility',
  family_dynamics: 'Family',
  attendance_change: 'Attendance',
  escalation: 'Escalation',
  events: 'Events',
  schedule: 'Schedule',
  outreach: 'Outreach',
  general: 'General',
  other: 'Other',
};

function formatRelativeTime(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActionQueue({
  pendingSequences,
  escalationsCount,
  weddingSlug,
  onIssueResolved,
}: ActionQueueProps) {
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  // Filter to only issue-type items (from coordination_issues)
  const issueItems = pendingSequences.filter((s) => s._is_issue && !resolvedIds.has(s.id));

  // Apply filters
  const filtered = issueItems.filter((item) => {
    if (filterPriority && item._priority !== filterPriority) return false;
    if (filterCategory && item._category !== filterCategory) return false;
    return true;
  });

  // Sort: urgent first, then by date
  const sorted = [...filtered].sort((a, b) => {
    const pa = PRIORITY_ORDER[a._priority] ?? 4;
    const pb = PRIORITY_ORDER[b._priority] ?? 4;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Unique categories in the data for filter chips
  const categories = [...new Set(issueItems.map((i) => i._category).filter(Boolean))];

  const handleResolve = async (issueId: string): Promise<void> => {
    const realId = issueId.replace('issue-', '');
    try {
      const res = await fetch(`/api/outreach/escalations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: realId,
          status: 'resolved',
          resolution_notes: resolveNotes || undefined,
        }),
      });
      // Even if the endpoint doesn't handle this yet, mark it locally
      setResolvedIds((prev) => new Set(prev).add(issueId));
      setResolvingId(null);
      setResolveNotes('');
      onIssueResolved?.();
    } catch {
      // Best-effort — mark resolved locally
      setResolvedIds((prev) => new Set(prev).add(issueId));
      setResolvingId(null);
      setResolveNotes('');
    }
  };

  const openCount = issueItems.length;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.07)',
        p: 3,
        bgcolor: COLORS.bg.white,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
          Action Queue ({openCount} open)
        </Typography>
        {openCount > 0 && (
          <Button
            size="small"
            onClick={async () => {
              if (!confirm(`Dismiss all ${openCount} open issues?`)) return;
              try {
                await fetch('/api/outreach/escalations', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ weddingId: weddingSlug }),
                });
                // Mark all resolved locally
                setResolvedIds(new Set(issueItems.map((i) => i.id)));
                onIssueResolved?.();
              } catch {}
            }}
            sx={{ textTransform: 'none', fontSize: 14, color: COLORS.text.faint, '&:hover': { color: COLORS.accent.danger } }}
          >
            Dismiss All
          </Button>
        )}
      </Box>

      {/* Filter bar */}
      {openCount > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {/* Priority filters */}
          {['urgent', 'high', 'medium', 'low'].map((p) => {
            const count = issueItems.filter((i) => i._priority === p).length;
            if (count === 0) return null;
            return (
              <Chip
                key={p}
                label={`${p} (${count})`}
                size="small"
                onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                sx={{
                  height: 22,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  bgcolor: filterPriority === p ? PRIORITY_COLORS[p] : `${PRIORITY_COLORS[p]}18`,
                  color: filterPriority === p ? COLORS.bg.white : PRIORITY_COLORS[p],
                  border: `1px solid ${PRIORITY_COLORS[p]}40`,
                }}
              />
            );
          })}
          {/* Category filters */}
          {categories.map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABELS[c] || c}
              size="small"
              variant={filterCategory === c ? 'filled' : 'outlined'}
              onClick={() => setFilterCategory(filterCategory === c ? null : c)}
              sx={{
                height: 22,
                fontSize: 14,
                cursor: 'pointer',
                color: filterCategory === c ? COLORS.bg.white : COLORS.text.muted,
                bgcolor: filterCategory === c ? COLORS.text.muted : 'transparent',
                borderColor: 'rgba(0,0,0,0.15)',
              }}
            />
          ))}
        </Box>
      )}

      {/* Items */}
      {sorted.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            {openCount === 0 ? 'No pending actions. Everything is on track.' : 'No items match the current filter.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 450, overflow: 'auto' }}>
          {sorted.map((item) => {
            const isResolving = resolvingId === item.id;
            return (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: RADII.sm,
                  bgcolor: item._priority === 'urgent' ? COLORS.accent.dangerBg : item._priority === 'high' ? COLORS.accent.warningBg : COLORS.bg.muted,
                  border: `1px solid ${item._priority === 'urgent' ? COLORS.accent.dangerBg : item._priority === 'high' ? COLORS.accent.warningBg : 'rgba(0,0,0,0.07)'}`,
                }}
              >
                {/* Badges row */}
                <Stack direction="row" spacing={0.5} sx={{ mb: 0.75 }}>
                  <Chip
                    label={item._priority}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      bgcolor: PRIORITY_COLORS[item._priority] || COLORS.text.faint,
                      color: COLORS.text.inverse,
                    }}
                  />
                  <Chip
                    label={CATEGORY_LABELS[item._category] || item._category}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: 9, color: COLORS.text.muted, borderColor: 'rgba(0,0,0,0.15)' }}
                  />
                  <Typography sx={{ fontSize: 14, color: COLORS.text.faint, ml: 'auto !important', alignSelf: 'center' }}>
                    {formatRelativeTime(item.created_at)}
                  </Typography>
                </Stack>

                {/* Title */}
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.text.strong, lineHeight: 1.3, mb: 0.25 }}>
                  {item._title || item.template_name || 'Untitled issue'}
                </Typography>

                {/* Description (if from sequence's template_name field carrying the title) */}
                {item.template_name && item.template_name !== item._title && (
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: COLORS.text.muted,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.template_name}
                  </Typography>
                )}

                {/* Resolve section */}
                <Collapse in={isResolving}>
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Resolution notes (optional)"
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      sx={{
                        mb: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: RADII.sm,
                          bgcolor: COLORS.bg.white,
                          fontSize: 14,
                          color: COLORS.text.strong,
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                        },
                      }}
                    />
                    <Stack direction="row" spacing={1}>
                      <ActionButton
                        size="small"
                        variant="contained"
                        onClick={() => handleResolve(item.id)}
                        sx={{
                          bgcolor: COLORS.accent.success,
                          borderRadius: RADII.sm,
                          textTransform: 'none',
                          fontSize: 14,
                          fontWeight: 600,
                          '&:hover': { bgcolor: COLORS.accent.success },
                        }}
                      >
                        Confirm Resolve
                      </ActionButton>
                      <Button
                        size="small"
                        onClick={() => { setResolvingId(null); setResolveNotes(''); }}
                        sx={{ textTransform: 'none', fontSize: 14, color: COLORS.text.subtle }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Box>
                </Collapse>

                {/* Actions */}
                {!isResolving && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <ActionButton
                      size="small"
                      variant="outlined"
                      startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setResolvingId(item.id)}
                      sx={{
                        borderRadius: RADII.sm,
                        textTransform: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        color: COLORS.accent.success,
                        borderColor: '#22c55e40',
                        '&:hover': { borderColor: COLORS.accent.success, bgcolor: '#22c55e08' },
                      }}
                    >
                      Resolve
                    </ActionButton>
                    <ActionButton
                      size="small"
                      variant="outlined"
                      startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />}
                      href={`/admin/${weddingSlug}/whatsapp-bot`}
                      sx={{
                        borderRadius: RADII.sm,
                        textTransform: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        color: COLORS.text.subtle,
                        borderColor: 'rgba(0,0,0,0.12)',
                        '&:hover': { borderColor: 'rgba(0,0,0,0.3)', bgcolor: COLORS.bg.muted },
                      }}
                    >
                      View Conversation
                    </ActionButton>
                  </Stack>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
