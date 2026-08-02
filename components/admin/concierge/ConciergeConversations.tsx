'use client';

import {
  Box,
  Typography,
  Stack,
  Avatar,
  TextField,
  Chip,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  IconButton,
} from '@mui/material';
import { Search, ExpandMore } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  guestId: string;
  guestName: string;
  guestPhone: string | null;
  messages: Message[];
  lastMessageAt: string;
  lastMessagePreview: string;
  messageCount: number;
}

interface ConciergeConversationsProps {
  weddingId: string;
  initialGuestId?: string | null;
}

const CARD_MAX_WIDTH = 400;
const CARD_MIN_WIDTH = 280;

function getInitials(name: string): string {
  // Skip non-letter prefixes like the "Unrecognized · …1234" fallback so
  // initials still come out readable when we don't have a real name.
  const cleaned = name.replace(/[^a-zA-Z\s]/g, ' ').trim();
  if (!cleaned) return '?';
  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface ConversationCardProps {
  conv: Conversation;
  expanded: boolean;
  onToggle: () => void;
}

function ConversationCard({ conv, expanded, onToggle }: ConversationCardProps) {
  return (
    <Box
      sx={{
        // Cap each card to a phone-screen width so several can sit side
        // by side on a wide screen, single-column on narrow.
        width: '100%',
        maxWidth: CARD_MAX_WIDTH,
        borderRadius: 1,
        border: `1px solid ${expanded ? COLORS.brand.primary : COLORS.border.faint}`,
        bgcolor: COLORS.bg.white,
        transition: 'border-color 0.15s',
        overflow: 'hidden',
        alignSelf: 'flex-start',
      }}
    >
      {/* Header — always visible, click to toggle */}
      <Box
        onClick={onToggle}
        role="button"
        aria-expanded={expanded}
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: expanded ? 'transparent' : COLORS.bg.muted },
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: '#DE3F5E15',
            color: COLORS.brand.primary,
            fontSize: '0.875rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {getInitials(conv.guestName)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 0.25 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.strong, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conv.guestName}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.faint, flexShrink: 0 }}>
              {formatTimeAgo(conv.lastMessageAt)}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: COLORS.text.subtle,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {conv.lastMessagePreview || '(no messages)'}
          </Typography>
        </Box>
        <Chip
          label={conv.messageCount}
          size="small"
          sx={{
            fontSize: '0.875rem',
            height: 22,
            minWidth: 22,
            flexShrink: 0,
            bgcolor: COLORS.bg.muted,
            color: COLORS.text.subtle,
            fontWeight: 600,
          }}
        />
        <IconButton
          size="small"
          aria-label={expanded ? 'Collapse conversation' : 'Expand conversation'}
          sx={{
            color: COLORS.text.faint,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <ExpandMore />
        </IconButton>
      </Box>

      {/* Expanded thread */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ borderTop: `1px solid ${COLORS.border.faint}`, p: 2, maxHeight: 480, overflow: 'auto' }}>
          {conv.guestPhone && (
            <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.faint, mb: 1.5 }}>
              {conv.guestPhone}
            </Typography>
          )}
          <Stack spacing={1.25}>
            {conv.messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'assistant' ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    maxWidth: '85%',
                    px: 1.5,
                    py: 1,
                    borderRadius: RADII.md,
                    bgcolor: msg.role === 'assistant' ? COLORS.brand.primarySubtle : COLORS.bg.muted,
                    borderTopLeftRadius: msg.role === 'user' ? '4px' : RADII.md,
                    borderTopRightRadius: msg.role === 'assistant' ? '4px' : RADII.md,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      color: COLORS.text.strong,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      color: COLORS.text.faint,
                      mt: 0.5,
                      textAlign: msg.role === 'assistant' ? 'right' : 'left',
                    }}
                  >
                    {formatTimestamp(msg.created_at)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

export default function ConciergeConversations({ weddingId, initialGuestId }: ConciergeConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'today'>('all');
  // A Set so multiple cards can stay open at once — useful for triaging
  // multiple unrelated guest threads side-by-side.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(initialGuestId ? [initialGuestId] : []),
  );

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/concierge/conversations?weddingId=${weddingId}`);
      const data = await res.json();
      if (res.ok) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => {
    loadConversations();
    // Poll every 15s so new guest messages show up without a manual refresh.
    const interval = setInterval(loadConversations, 15_000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (initialGuestId) {
      setExpandedIds((prev) => new Set([...prev, initialGuestId]));
    }
  }, [initialGuestId]);

  const filteredConversations = conversations.filter((conv) => {
    if (search && !conv.guestName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (timeFilter !== 'all') {
      const msgTime = new Date(conv.lastMessageAt).getTime();
      const now = Date.now();
      if (timeFilter === 'today' && now - msgTime > 86400000) return false;
      if (timeFilter === 'week' && now - msgTime > 604800000) return false;
    }
    return true;
  });

  const toggle = (guestId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(guestId)) next.delete(guestId);
      else next.add(guestId);
      return next;
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
        See what your guests have been asking about and how the bot has been helping them.
      </Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by guest name..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: COLORS.text.faint, mr: 1, fontSize: 20 }} />,
          }}
          sx={{
            flex: 1,
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              bgcolor: COLORS.bg.white,
              borderRadius: RADII.sm,
              fontSize: '0.875rem',
              '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
              '&:hover fieldset': { borderColor: COLORS.brand.primary },
              '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
            },
          }}
        />
        <ToggleButtonGroup
          value={timeFilter}
          exclusive
          onChange={(_, val) => val && setTimeFilter(val)}
          size="small"
          sx={{
            gap: 1,
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid rgba(0,0,0,0.15) !important',
              '&:not(:first-of-type)': { ml: 0 },
            },
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontSize: '0.875rem',
              px: 2,
              borderRadius: '10px !important',
              color: COLORS.text.subtle,
              '&.Mui-selected': {
                bgcolor: '#DE3F5E10',
                color: COLORS.brand.primary,
                fontWeight: 600,
              },
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="today">Today</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Card grid */}
      {filteredConversations.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px solid ${COLORS.border.faint}`,
            borderRadius: 1,
            bgcolor: COLORS.bg.white,
          }}
        >
          <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
            {search ? 'No conversations match your search.' : 'No conversations yet.'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: `repeat(auto-fill, minmax(${CARD_MIN_WIDTH}px, ${CARD_MAX_WIDTH}px))`,
            },
            gap: 2,
            justifyContent: 'start',
          }}
        >
          {filteredConversations.map((conv) => (
            <ConversationCard
              key={conv.guestId}
              conv={conv}
              expanded={expandedIds.has(conv.guestId)}
              onToggle={() => toggle(conv.guestId)}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
}
