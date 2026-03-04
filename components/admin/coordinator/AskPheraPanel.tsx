'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, alpha } from '@mui/material';
import { Close, AutoAwesome } from '@mui/icons-material';
import ChatInput from '@/components/admin/build-ai/ChatInput';
import TypingIndicator from '@/components/admin/build-ai/TypingIndicator';
import { parseAIResponse } from '@/lib/vendors/format-ai-response';

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
}

export default function AskPheraPanel({ weddingId, open, onClose, conversationId }: AskPheraPanelProps) {
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
        bgcolor: 'white',
        height: '100vh',
        position: 'sticky',
        top: 0,
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
              bgcolor: alpha('#DE3F5E', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AutoAwesome sx={{ fontSize: 16, color: '#DE3F5E' }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>
            Ask Phera
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#6a6a6a' }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Chat area */}
      <Box
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
                    bgcolor: alpha('#DE3F5E', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 14, color: '#DE3F5E' }} />
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
                  sx={{
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: '#1a1a1a',
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
      />
    </Box>
  );
}
