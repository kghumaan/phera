'use client';

import { Box, Typography, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ConciergeConversationDetailProps {
  guestName: string;
  messages: Message[];
  onBack: () => void;
}

export default function ConciergeConversationDetail({ guestName, messages, onBack }: ConciergeConversationDetailProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: COLORS.text.strong }}>
          <ArrowBack sx={{ fontSize: 20, color: COLORS.text.strong }} />
        </IconButton>
        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text.strong }}>
          {guestName}
        </Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'assistant' ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                maxWidth: '75%',
                px: 2,
                py: 1.25,
                borderRadius: RADII.md,
                bgcolor: msg.role === 'assistant' ? '#DE3F5E10' : '#F3F3F3',
                borderTopLeftRadius: msg.role === 'user' ? '4px' : '14px',
                borderTopRightRadius: msg.role === 'assistant' ? '4px' : '14px',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.85rem',
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
                  fontSize: '0.65rem',
                  color: COLORS.text.faint,
                  mt: 0.5,
                  textAlign: msg.role === 'assistant' ? 'right' : 'left',
                }}
              >
                {formatTime(msg.created_at)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
