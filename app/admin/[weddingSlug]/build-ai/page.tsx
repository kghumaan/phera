'use client';

import React, { useState, use, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
  TextField,
  IconButton,
  alpha,
} from '@mui/material';
import {
  AutoAwesome,
  LockOutlined,
  Send,
  ArrowUpward,
} from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

// ─── Mock chat for blurred preview ───────────────────────────────────────────

const mockMessages: Message[] = [
  { id: '1', role: 'ai', text: "Welcome! 🎉 Let's build your wedding website together. What are the names of the happy couple?" },
  { id: '2', role: 'user', text: 'Priya & Arjun!' },
  { id: '3', role: 'ai', text: 'So lovely! 💕 When is your big day?' },
  { id: '4', role: 'user', text: 'December 14th, 2025' },
  { id: '5', role: 'ai', text: "Wonderful! Where will you be celebrating?" },
  { id: '6', role: 'user', text: 'The Oberoi, Udaipur' },
  { id: '7', role: 'ai', text: "A stunning choice! 🏰 What theme are you going for — traditional, modern, or something in between?" },
  { id: '8', role: 'user', text: 'Modern with a touch of classic Indian elegance' },
  { id: '9', role: 'ai', text: "Perfect. I've noted your colour palette preferences — shall we move on to your event schedule?" },
];

// ─── Initial AI greeting ──────────────────────────────────────────────────────

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'ai',
  text: "Hi there! 👋 I'm your AI wedding website builder. Instead of filling out forms section by section, just chat with me — I'll ask you everything we need and put your website together as we go. Ready? Let's start with the most important question: what are the names of the couple getting married? 💍",
};

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function Bubble({ message }: { message: Message }) {
  const isAI = message.role === 'ai';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isAI ? 'flex-start' : 'flex-end',
        mb: 1.5,
        gap: 1,
        alignItems: 'flex-end',
      }}
    >
      {isAI && (
        <Box
          sx={{
            width: 28, height: 28, borderRadius: '50%',
            bgcolor: '#DE3F5E', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, mb: 0.25,
          }}
        >
          <AutoAwesome sx={{ fontSize: 14, color: 'white' }} />
        </Box>
      )}
      <Box
        sx={{
          maxWidth: '72%',
          px: 2, py: 1.25,
          borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          bgcolor: isAI ? '#F4F4F4' : '#DE3F5E',
          color: isAI ? '#1a1a1a' : 'white',
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.55 }}>
          {message.text}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 1.5 }}>
      <Box
        sx={{
          width: 28, height: 28, borderRadius: '50%', bgcolor: '#DE3F5E',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <AutoAwesome sx={{ fontSize: 14, color: 'white' }} />
      </Box>
      <Box sx={{ px: 2, py: 1.5, borderRadius: '4px 16px 16px 16px', bgcolor: '#F4F4F4', display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <Box
            key={i}
            sx={{
              width: 6, height: 6, borderRadius: '50%', bgcolor: '#aaa',
              animation: 'bounce 1.2s infinite',
              animationDelay: `${i * 0.2}s`,
              '@keyframes bounce': {
                '0%, 60%, 100%': { transform: 'translateY(0)' },
                '30%': { transform: 'translateY(-5px)' },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuildAIPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Placeholder: AI response simulation (replace with real API call)
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: "Got it! ✨ I've noted that down. Let me ask you the next question — what's the venue name and location for your big day?",
      }]);
    }, 1400);
  };

  // ── Non-pro teaser ──────────────────────────────────────────────────────────

  if (!isPro) {
    return (
      <Container maxWidth="xl">
        <Stack spacing={3}>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Build with AI
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Answer a few questions and watch your wedding website come to life
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={() => setUpgradeModalOpen(true)}
              sx={{
                bgcolor: '#DE3F5E', color: 'white', px: 3, py: 1.25,
                borderRadius: 2, fontWeight: 600, textTransform: 'none',
                fontSize: '0.9rem', flexShrink: 0, '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Upgrade to Pro
            </Button>
          </Box>

          {/* Description */}
          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.75, mb: 1.25 }}>
              Building a wedding website shouldn't mean navigating form after form. <strong>Just have a conversation.</strong> Our AI walks you through every detail — venue, schedule, travel info, FAQs and more — one question at a time. You answer, we build. Your beautiful website takes shape in minutes, not hours.
            </Typography>
            <Stack spacing={0.6}>
              {([
                <><strong>One question at a time</strong> — no forms, no overwhelm, just a natural conversation</>,
                <><strong>Every section covered</strong> automatically — details, schedule, travel, registry and more</>,
                <><strong>Your choices, your style</strong> — the AI tailors the design to what you describe</>,
                <><strong>Lightning fast</strong> — go from blank slate to a fully built website in one sitting</>,
              ] as React.ReactNode[]).map((content, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#DE3F5E', lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.65 }}>{content}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Blurred mock chat */}
          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none' }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: 420,
                }}
              >
                <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5 }}>
                  {mockMessages.map(m => <Bubble key={m.id} message={m} />)}
                </Box>
                <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 1 }}>
                  <Box sx={{ flex: 1, bgcolor: '#F8F8F8', borderRadius: 2, px: 2, py: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#bbb' }}>Type your answer...</Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#DE3F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpward sx={{ fontSize: 18, color: 'white' }} />
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Lock overlay */}
            <Box
              sx={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, bgcolor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)',
              }}
            >
              <Box
                sx={{
                  width: 56, height: 56, borderRadius: '50%', bgcolor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <LockOutlined sx={{ fontSize: 26, color: '#DE3F5E' }} />
              </Box>
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  bgcolor: '#DE3F5E', color: 'white', px: 3.5, py: 1.5,
                  borderRadius: 2, fontWeight: 600, textTransform: 'none',
                  fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
                  '&:hover': { bgcolor: '#c73552' },
                }}
              >
                Unlock AI Builder
              </Button>
            </Box>
          </Box>

        </Stack>
        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Container>
    );
  }

  // ── Pro view — chat interface ───────────────────────────────────────────────

  return (
    <Container maxWidth="md">
      <Stack spacing={2} sx={{ height: 'calc(100vh - 120px)', maxHeight: 800 }}>

        {/* Header */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Build with AI
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Answer questions one by one and your wedding website builds itself
          </Typography>
        </Box>

        {/* Chat container */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 3,
              py: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {messages.map(m => <Bubble key={m.id} message={m} />)}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input area */}
          <Box
            sx={{
              px: 2, py: 1.5,
              borderTop: '1px solid rgba(0,0,0,0.07)',
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
              bgcolor: 'white',
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type your answer..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  fontSize: '0.875rem',
                  bgcolor: '#F8F8F8',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: '1.5px solid #DE3F5E' },
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim()}
              sx={{
                width: 44, height: 44,
                bgcolor: input.trim() ? '#DE3F5E' : 'rgba(0,0,0,0.06)',
                color: input.trim() ? 'white' : '#ccc',
                borderRadius: '50%',
                flexShrink: 0,
                transition: 'all 0.15s',
                '&:hover': { bgcolor: input.trim() ? '#c73552' : 'rgba(0,0,0,0.06)' },
                '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.06)', color: '#ccc' },
              }}
            >
              <ArrowUpward sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Paper>

      </Stack>
    </Container>
  );
}
