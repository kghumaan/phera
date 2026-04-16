'use client';

import {
  Box,
  Typography,
  Stack,
  Paper,
  Avatar,
  TextField,
  Chip,
  CircularProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import ConciergeConversationDetail from './ConciergeConversationDetail';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  guestId: string;
  guestName: string;
  messages: Message[];
  lastMessageAt: string;
  lastMessagePreview: string;
  messageCount: number;
}

interface ConciergeConversationsProps {
  weddingId: string;
  initialGuestId?: string | null;
}

export default function ConciergeConversations({ weddingId, initialGuestId }: ConciergeConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'today'>('all');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(initialGuestId || null);

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
    // Cheap (one GET of your own weddings' data) and stops when the tab unmounts.
    const interval = setInterval(loadConversations, 15_000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (initialGuestId) setSelectedGuestId(initialGuestId);
  }, [initialGuestId]);

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredConversations = conversations.filter((conv) => {
    // Search filter
    if (search && !conv.guestName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Time filter
    if (timeFilter !== 'all') {
      const msgTime = new Date(conv.lastMessageAt).getTime();
      const now = Date.now();
      if (timeFilter === 'today' && now - msgTime > 86400000) return false;
      if (timeFilter === 'week' && now - msgTime > 604800000) return false;
    }
    return true;
  });

  const selectedConversation = conversations.find((c) => c.guestId === selectedGuestId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress size={28} sx={{ color: '#DE3F5E' }} />
      </Box>
    );
  }

  if (selectedConversation) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: 'white',
          p: 2.5,
          maxHeight: 600,
          overflow: 'auto',
        }}
      >
        <ConciergeConversationDetail
          guestName={selectedConversation.guestName}
          messages={selectedConversation.messages}
          onBack={() => setSelectedGuestId(null)}
        />
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
        See what your guests have been asking about and how the concierge has been helping them.
      </Typography>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by guest name..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: '#9a9a9a', mr: 1, fontSize: 20 }} />,
          }}
          sx={{
            flex: 1,
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'white',
              borderRadius: '10px',
              fontSize: '0.85rem',
              '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
              '&:hover fieldset': { borderColor: '#DE3F5E' },
              '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
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
              fontSize: '0.8rem',
              px: 2,
              borderRadius: '10px !important',
              color: '#6a6a6a',
              '&.Mui-selected': {
                bgcolor: '#DE3F5E10',
                color: '#DE3F5E',
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

      {/* Conversation List */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: 'white',
          overflow: 'hidden',
        }}
      >
        {filteredConversations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#9a9a9a' }}>
              {search ? 'No conversations match your search.' : 'No conversations yet.'}
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {filteredConversations.map((conv) => (
              <Box
                key={conv.guestId}
                onClick={() => setSelectedGuestId(conv.guestId)}
                sx={{
                  px: 2.5,
                  py: 1.75,
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#FAFAFA' },
                  transition: 'background-color 0.15s',
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: '#DE3F5E15',
                    color: '#DE3F5E',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(conv.guestName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>
                      {conv.guestName}
                    </Typography>
                    <Typography variant="body4" sx={{ color: '#9a9a9a', flexShrink: 0, ml: 1 }}>
                      {formatTimeAgo(conv.lastMessageAt)}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      color: '#6a6a6a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.lastMessagePreview}
                  </Typography>
                </Box>
                <Chip
                  label={conv.messageCount}
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                    height: 22,
                    minWidth: 22,
                    flexShrink: 0,
                    bgcolor: '#F3F3F3',
                    color: '#6a6a6a',
                    fontWeight: 600,
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
