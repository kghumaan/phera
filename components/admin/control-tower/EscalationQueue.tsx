'use client';

import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Stack, TextField, Collapse, CircularProgress,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface Escalation {
  id: string;
  guest_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface ChatMessage {
  role: string;
  content: string;
  created_at: string;
}

interface EscalationQueueProps {
  escalations: Escalation[];
  weddingSlug: string;
  onResolved?: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF5350', high: COLORS.accent.warning, medium: COLORS.accent.info, low: COLORS.text.faint,
};
const CATEGORY_LABELS: Record<string, string> = {
  visa: 'Visa', hotel: 'Hotel', flight: 'Flight', dietary: 'Dietary',
  accessibility: 'Accessibility', family_dynamics: 'Family', attendance_change: 'Attendance',
  escalation: 'Escalation', events: 'Events', schedule: 'Schedule', outreach: 'Outreach',
  general: 'General', other: 'Other',
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function EscalationQueue({ escalations, weddingSlug, onResolved }: EscalationQueueProps) {
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  // Conversation snippet state
  const [viewingConvoId, setViewingConvoId] = useState<string | null>(null);
  const [convoMessages, setConvoMessages] = useState<ChatMessage[]>([]);
  const [convoLoading, setConvoLoading] = useState(false);
  const [convoGuestId, setConvoGuestId] = useState<string | null>(null);

  const active = escalations.filter((e) => !resolvedIds.has(e.id));
  const filtered = active.filter((e) => {
    if (filterPriority && e.priority !== filterPriority) return false;
    if (filterCategory && e.category !== filterCategory) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const po: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const pa = po[a.priority] ?? 4, pb = po[b.priority] ?? 4;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const categories = [...new Set(active.map((e) => e.category))];

  const handleResolve = async (id: string): Promise<void> => {
    try {
      await fetch('/api/outreach/escalations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: id, status: 'resolved', resolution_notes: resolveNotes || undefined }),
      });
    } catch {}
    setResolvedIds((prev) => new Set(prev).add(id));
    setResolvingId(null);
    setResolveNotes('');
    onResolved?.();
  };

  const handleDismissAll = async () => {
    if (!confirm(`Dismiss all ${active.length} open issues?`)) return;
    try {
      await fetch('/api/outreach/escalations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId: weddingSlug }),
      });
    } catch {}
    setResolvedIds(new Set(active.map((e) => e.id)));
    onResolved?.();
  };

  const handleViewConversation = async (escId: string, guestId: string) => {
    if (viewingConvoId === escId) {
      // Toggle off
      setViewingConvoId(null);
      setConvoMessages([]);
      setConvoGuestId(null);
      return;
    }

    setViewingConvoId(escId);
    setConvoGuestId(guestId);
    setConvoLoading(true);
    setConvoMessages([]);

    try {
      const res = await fetch(`/api/control-tower/conversation?weddingId=${weddingSlug}&guestId=${guestId}`);
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || [];
        // Show last 6 messages
        setConvoMessages(msgs.slice(-6));
      }
    } catch {}
    setConvoLoading(false);
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: RADII.md, border: '1px solid rgba(0,0,0,0.07)', p: 2.5, bgcolor: COLORS.bg.white }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14, color: COLORS.text.strong }}>
          Needs Your Attention ({active.length})
        </Typography>
        {active.length > 0 && (
          <Button size="small" onClick={handleDismissAll} sx={{ textTransform: 'none', fontSize: 11, color: COLORS.text.faint, '&:hover': { color: COLORS.accent.danger } }}>
            Dismiss All
          </Button>
        )}
      </Box>

      {/* Filters */}
      {active.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {['urgent', 'high', 'medium', 'low'].map((p) => {
            const cnt = active.filter((e) => e.priority === p).length;
            if (!cnt) return null;
            return (
              <Chip key={p} label={`${p} (${cnt})`} size="small"
                onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                sx={{ height: 22, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer',
                  bgcolor: filterPriority === p ? PRIORITY_COLORS[p] : `${PRIORITY_COLORS[p]}18`,
                  color: filterPriority === p ? COLORS.bg.white : PRIORITY_COLORS[p],
                  border: `1px solid ${PRIORITY_COLORS[p]}40` }}
              />
            );
          })}
          {categories.map((c) => (
            <Chip key={c} label={CATEGORY_LABELS[c] || c} size="small"
              variant={filterCategory === c ? 'filled' : 'outlined'}
              onClick={() => setFilterCategory(filterCategory === c ? null : c)}
              sx={{ height: 22, fontSize: 10, cursor: 'pointer',
                color: filterCategory === c ? COLORS.bg.white : COLORS.text.muted,
                bgcolor: filterCategory === c ? COLORS.text.muted : 'transparent',
                borderColor: 'rgba(0,0,0,0.15)' }}
            />
          ))}
        </Box>
      )}

      {sorted.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 13, color: COLORS.text.faint }}>
            {active.length === 0 ? 'No open issues. Everything is on track.' : 'No items match filter.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 500, overflow: 'auto' }}>
          {sorted.map((esc) => {
            const isResolving = resolvingId === esc.id;
            const isViewingConvo = viewingConvoId === esc.id;

            return (
              <Paper key={esc.id} elevation={0} sx={{
                p: 1.5, borderRadius: RADII.sm,
                bgcolor: esc.priority === 'urgent' ? '#FFF5F5' : esc.priority === 'high' ? '#FFFBF0' : COLORS.bg.muted,
                border: `1px solid ${esc.priority === 'urgent' ? '#FFCDD2' : esc.priority === 'high' ? '#FFE0B2' : 'rgba(0,0,0,0.07)'}`,
              }}>
                {/* Guest info + badges */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.text.strong }}>
                      {esc.guest_name}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: COLORS.text.subtle }}>
                      {esc.guest_email}{esc.guest_phone ? ` · ${esc.guest_phone}` : ''}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Chip label={esc.priority} size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', bgcolor: PRIORITY_COLORS[esc.priority] || COLORS.text.faint, color: COLORS.text.inverse }} />
                    <Chip label={CATEGORY_LABELS[esc.category] || esc.category} size="small" variant="outlined" sx={{ height: 18, fontSize: 9, color: COLORS.text.muted, borderColor: 'rgba(0,0,0,0.15)' }} />
                  </Stack>
                </Box>

                {/* Title + description */}
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: COLORS.text.strong, mb: 0.25 }}>
                  {esc.title}
                </Typography>
                {esc.description && esc.description !== esc.title && (
                  <Typography sx={{ fontSize: 11, color: COLORS.text.subtle, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {esc.description}
                  </Typography>
                )}
                <Typography sx={{ fontSize: 10, color: COLORS.text.faint, mt: 0.5 }}>
                  {timeAgo(esc.created_at)}
                </Typography>

                {/* Resolve flow */}
                <Collapse in={isResolving}>
                  <Box sx={{ mt: 1 }}>
                    <TextField size="small" fullWidth placeholder="Resolution notes (optional)" value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: RADII.sm, bgcolor: COLORS.bg.white, fontSize: 12, color: COLORS.text.strong, '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' } } }}
                    />
                    <Stack direction="row" spacing={1}>
                      <ActionButton size="small" variant="contained" onClick={() => handleResolve(esc.id)}
                        sx={{ bgcolor: COLORS.accent.success, borderRadius: RADII.sm, textTransform: 'none', fontSize: 11, fontWeight: 600, '&:hover': { bgcolor: '#16a34a' } }}>
                        Confirm
                      </ActionButton>
                      <Button size="small" onClick={() => { setResolvingId(null); setResolveNotes(''); }}
                        sx={{ textTransform: 'none', fontSize: 11, color: COLORS.text.subtle }}>
                        Cancel
                      </Button>
                    </Stack>
                  </Box>
                </Collapse>

                {/* Inline conversation snippet */}
                <Collapse in={isViewingConvo}>
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#F5F5F0', borderRadius: RADII.sm, border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.text.strong }}>
                        Recent Messages
                      </Typography>
                      <Button
                        size="small"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                        href={`/admin/${weddingSlug}/concierge?guest=${esc.guest_id}`}
                        sx={{ textTransform: 'none', fontSize: 10, color: COLORS.brand.primary, p: 0, minWidth: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                      >
                        Full Conversation
                      </Button>
                    </Box>

                    {convoLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={16} sx={{ color: COLORS.brand.primary }} />
                      </Box>
                    ) : convoMessages.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 200, overflow: 'auto' }}>
                        {convoMessages.map((msg, i) => (
                          <Box key={i} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <Box sx={{
                              maxWidth: '80%',
                              px: 1.25,
                              py: 0.75,
                              borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                              bgcolor: msg.role === 'user' ? '#DCF8C6' : COLORS.bg.white,
                              border: msg.role === 'assistant' ? '1px solid rgba(0,0,0,0.07)' : 'none',
                            }}>
                              <Typography sx={{ fontSize: 11, color: COLORS.text.strong, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                {msg.content}
                              </Typography>
                              <Typography sx={{ fontSize: 9, color: COLORS.text.faint, mt: 0.25, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: 11, color: COLORS.text.faint, textAlign: 'center', py: 1 }}>
                        No conversation history found for this guest.
                      </Typography>
                    )}
                  </Box>
                </Collapse>

                {/* Actions */}
                {!isResolving && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <ActionButton size="small" variant="outlined" startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setResolvingId(esc.id)}
                      sx={{ borderRadius: RADII.sm, textTransform: 'none', fontSize: 11, fontWeight: 600, color: COLORS.accent.success, borderColor: '#22c55e40', '&:hover': { borderColor: COLORS.accent.success, bgcolor: '#22c55e08' } }}>
                      Resolve
                    </ActionButton>
                    <ActionButton size="small" variant="outlined"
                      startIcon={isViewingConvo ? <CloseIcon sx={{ fontSize: 14 }} /> : <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />}
                      onClick={() => handleViewConversation(esc.id, esc.guest_id)}
                      sx={{ borderRadius: RADII.sm, textTransform: 'none', fontSize: 11, fontWeight: 600,
                        color: isViewingConvo ? COLORS.brand.primary : COLORS.text.subtle,
                        borderColor: isViewingConvo ? '#DE3F5E40' : 'rgba(0,0,0,0.12)',
                        '&:hover': { borderColor: isViewingConvo ? COLORS.brand.primary : 'rgba(0,0,0,0.3)', bgcolor: isViewingConvo ? '#DE3F5E08' : COLORS.bg.muted } }}>
                      {isViewingConvo ? 'Hide' : 'View Conversation'}
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
