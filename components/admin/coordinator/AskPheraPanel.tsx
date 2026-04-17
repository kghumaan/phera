'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, alpha } from '@mui/material';
import { Close, AutoAwesome } from '@mui/icons-material';
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

  if (!open) return null;

  return (
    <Box
      sx={{
        width: 380,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid rgba(0,0,0,0.07)',
        bgcolor: COLORS.bg.white,
        // Anchor to the viewport so switching admin tabs doesn't re-flow the
        // panel. Sticky + height: 100vh was resetting the top offset whenever
        // the sibling column's height changed (e.g. Members tab is taller).
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        pt: 'calc(34px + 32px)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: alpha(COLORS.brand.primary, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AutoAwesome sx={{ fontSize: 16, color: COLORS.brand.primary }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem', color: COLORS.text.strong }}>
            Ask Phera
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: COLORS.text.subtle }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
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
          <Typography sx={{ fontSize: '0.82rem', color: COLORS.text.subtle, lineHeight: 1.6 }}>
            Ask questions about your vendor conversations, get quote comparisons, and receive suggestions — all powered by your actual vendor data.
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: COLORS.text.faint, mt: 1 }}>
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
                  bgcolor: '#eeeeee',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.85rem',
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
  );
}
