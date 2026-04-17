'use client';

import React, { useState, useRef, use } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Typography,
  Stack,
  Paper,
  alpha,
  Popper,
  ClickAwayListener,
  Grow,
} from '@mui/material';
import {
  AutoAwesome,
  LockOutlined,
  ArrowUpward,
  Check,
  HistoryOutlined,
} from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import Bubble from '@/components/admin/build-ai/Bubble';
import TypingIndicator from '@/components/admin/build-ai/TypingIndicator';
import ChatInput from '@/components/admin/build-ai/ChatInput';
import { useBuildAI } from '@/lib/build-ai/useBuildAI';
import { mockMessages } from '@/lib/build-ai/question-flow';
import { Message } from '@/lib/build-ai/types';
import ContinueButton from '@/components/admin/ContinueButton';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuildAIPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const {
    messages,
    input,
    setInput,
    isTyping,
    isLoading,
    messagesEndRef,
    handleSend,
    isFormDisabled,
    completedSteps,
    goBackToStep,
    currentQuestionId,
  } = useBuildAI(weddingSlug);

  const [goBackOpen, setGoBackOpen] = useState(false);
  const goBackAnchorRef = useRef<HTMLButtonElement>(null);

  // ── Non-pro teaser ──────────────────────────────────────────────────────────

  if (!isPro) {
    return (
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Build with AI
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Answer a few questions and watch your wedding website come to life
              </Typography>
            </Box>
            <PrimaryActionButton
              startIcon={<AutoAwesome />}
              onClick={() => setUpgradeModalOpen(true)}
              sx={{ px: 3, py: 1.25, borderRadius: '16px', fontSize: '0.9rem', flexShrink: 0 }}
            >
              Upgrade to Pro
            </PrimaryActionButton>
          </Box>

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

          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none' }}>
              <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 420 }}>
                <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5 }}>
                  {mockMessages.map(m => <Bubble key={m.id} message={m as Message} />)}
                </Box>
                <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 1 }}>
                  <Box sx={{ flex: 1, bgcolor: '#F8F8F8', borderRadius: '16px', px: 2, py: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#bbb' }}>Type your answer...</Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#DE3F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpward sx={{ fontSize: 18, color: 'white' }} />
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockOutlined sx={{ fontSize: 26, color: '#DE3F5E' }} />
              </Box>
              <PrimaryActionButton
                startIcon={<AutoAwesome />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{ px: 3.5, py: 1.5, borderRadius: '16px', fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(222,63,94,0.35)' }}
              >
                Unlock AI Builder
              </PrimaryActionButton>
            </Box>
          </Box>
        </Stack>
        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Container>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <AutoAwesome sx={{ fontSize: 48, color: '#DE3F5E', animation: 'pulse 1.5s infinite' }} />
          <Typography sx={{ color: '#6a6a6a' }}>Loading your wedding...</Typography>
        </Stack>
      </Box>
    );
  }

  // ── Pro view — chat interface ───────────────────────────────────────────────

  return (
    <Container maxWidth="xl" sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', pb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, pt: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Build with AI
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Answer a few questions and watch your wedding website come to life
          </Typography>
        </Box>
        <Chip
          icon={<Check sx={{ fontSize: 18, color: 'white !important' }} />}
          label="All Changes Saved"
          sx={{
            bgcolor: '#10B981',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.875rem',
            px: 1.5,
            py: 2.5,
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
            '& .MuiChip-label': { px: 1 },
          }}
        />

      </Box>

      <Box
        sx={{
          flex: 1,
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          bgcolor: alpha('#DE3F5E', 0.02),
          border: '2px solid',
          borderColor: alpha('#000', 0.12),
        }}
      >
        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 4, display: 'flex', flexDirection: 'column' }}>
          {messages.map(m => <Bubble key={m.id} message={m} />)}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </Box>

        {/* Go Back + Input area */}
        {completedSteps.length > 0 && currentQuestionId !== 'complete' && (
          <Box sx={{ px: 3, pt: 1.5, pb: 0, bgcolor: 'white', borderTop: '1px solid', borderColor: alpha('#000', 0.06) }}>
            <Button
              ref={goBackAnchorRef}
              size="small"
              startIcon={<HistoryOutlined sx={{ fontSize: 16 }} />}
              onClick={() => setGoBackOpen(prev => !prev)}
              sx={{
                color: '#888',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                '&:hover': { bgcolor: alpha('#DE3F5E', 0.06), color: '#DE3F5E' },
              }}
            >
              Go back to...
            </Button>
            <Popper
              open={goBackOpen}
              anchorEl={goBackAnchorRef.current}
              placement="top-start"
              transition
              sx={{ zIndex: 1300 }}
            >
              {({ TransitionProps }) => (
                <Grow {...TransitionProps}>
                  <Box>
                    <ClickAwayListener onClickAway={() => setGoBackOpen(false)}>
                      <Paper
                        elevation={8}
                        sx={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          maxHeight: 300,
                          overflowY: 'auto',
                          minWidth: 220,
                          border: '1px solid',
                          borderColor: alpha('#000', 0.1),
                          mb: 1,
                        }}
                      >
                        {completedSteps.map(({ questionId, label }) => (
                          <Box
                            key={questionId}
                            onClick={() => {
                              setGoBackOpen(false);
                              goBackToStep(questionId);
                            }}
                            sx={{
                              px: 2,
                              py: 1.25,
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#333',
                              fontWeight: 500,
                              transition: 'all 0.1s',
                              '&:hover': { bgcolor: alpha('#DE3F5E', 0.08), color: '#DE3F5E' },
                              borderBottom: '1px solid',
                              borderColor: alpha('#000', 0.05),
                              '&:last-child': { borderBottom: 'none' },
                            }}
                          >
                            {label}
                          </Box>
                        ))}
                      </Paper>
                    </ClickAwayListener>
                  </Box>
                </Grow>
              )}
            </Popper>
          </Box>
        )}

        <ChatInput
          input={input}
          onInputChange={setInput}
          onSend={() => handleSend()}
          disabled={isFormDisabled || isTyping}
        />
      </Box>
      <ContinueButton weddingSlug={weddingSlug} currentSection="build-ai" />
    </Container>
  );
}
