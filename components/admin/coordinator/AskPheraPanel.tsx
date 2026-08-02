'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, alpha, Grow } from '@mui/material';
import { Close, AutoAwesome, Remove } from '@mui/icons-material';
import ChatInput from '@/components/admin/build-ai/ChatInput';
import TypingIndicator from '@/components/admin/build-ai/TypingIndicator';
import { parseAIResponse } from '@/lib/vendors/format-ai-response';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

interface AskPheraPanelProps {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  conversationId?: string;
  disabled?: boolean;
}

export default function AskPheraPanel({ weddingId, open, onClose, conversationId, disabled }: AskPheraPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: 'Hi! Ask me anything about your vendor conversations.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/vendors/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId, question, conversationId }),
      });
      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: data.answer || "I couldn't find an answer to that.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'ai', text: 'Something went wrong. Try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grow
      in={open}
      mountOnEnter
      unmountOnExit
      timeout={{ enter: 260, exit: 200 }}
      style={{ transformOrigin: 'bottom right' }}
    >
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 12, md: 24 },
        bottom: { xs: 12, md: 24 },
        width: { xs: 'calc(100vw - 24px)', sm: 420 },
        height: { xs: 'calc(100vh - 140px)', sm: 640 },
        maxHeight: 'calc(100vh - 80px)',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: COLORS.bg.white,
        borderRadius: RADII.lg,
        boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}
    >
      {/* Header — light gray bar with title + close */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: COLORS.bg.muted,
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          color: COLORS.text.strong,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              bgcolor: alpha(COLORS.brand.primary, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AutoAwesome sx={{ fontSize: 15, color: COLORS.brand.primary }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text.strong }}>
            Ask Phera
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Minimize to floating button"
            sx={{
              color: COLORS.text.subtle,
              '&:hover': { color: COLORS.text.strong, bgcolor: 'rgba(0,0,0,0.06)' },
            }}
          >
            <Remove sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Close"
            sx={{
              color: COLORS.text.subtle,
              '&:hover': { color: COLORS.text.strong, bgcolor: 'rgba(0,0,0,0.06)' },
            }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Disabled overlay for demo */}
      {disabled && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 3, textAlign: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha(COLORS.brand.primary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AutoAwesome sx={{ fontSize: 24, color: COLORS.brand.primary }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text.strong }}>
            AI Vendor Assistant
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, lineHeight: 1.6 }}>
            Ask questions about your vendor conversations, get quote comparisons, and receive suggestions — all powered by your actual vendor data.
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.faint, mt: 1 }}>
            Disabled in demo mode
          </Typography>
        </Box>
      )}

      {/* Chat area */}
      {!disabled && (<><Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2.5,
          py: 2,
        }}
      >
        {messages.map((msg) => {
          if (msg.role === 'ai') {
            return (
              <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5, gap: 1.5 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: alpha(COLORS.brand.primary, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 14, color: COLORS.brand.primary }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  {parseAIResponse(msg.text)}
                </Box>
              </Box>
            );
          }

          return (
            <Box key={msg.id} sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
              <Box
                sx={{
                  maxWidth: '85%',
                  px: 2,
                  py: 1.25,
                  borderRadius: '14px 14px 4px 14px',
                  bgcolor: COLORS.bg.muted,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    color: COLORS.text.strong,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {msg.text}
                </Typography>
              </Box>
            </Box>
          );
        })}
        {loading && <TypingIndicator />}
      </Box>

      {/* Input */}
      <ChatInput
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        disabled={loading}
        placeholder="Ask about your vendors..."
        compact
        noBorder
      /></>)}
    </Box>
    </Grow>
  );
}
