'use client';

import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Avatar,
  Chip,
  Switch,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import React, { useState, use, useEffect } from 'react';
import { WhatsApp, LockOutlined, CheckCircleOutline, InfoOutlined } from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import ConciergeDashboard from '@/components/admin/concierge/ConciergeDashboard';
import ConciergeConversations from '@/components/admin/concierge/ConciergeConversations';
import ConciergeKnowledgeBase from '@/components/admin/concierge/ConciergeKnowledgeBase';

const BETA_ACCESS_EMAILS = [
  'kv.s.ghumaan@gmail.com',
  'savani.simran@google.com',
];

const mockChats = [
  { name: 'Priya Sharma', avatar: 'PS', time: '2h ago', message: 'What time does the shuttle leave from the Oberoi on Saturday?', status: 'answered' },
  { name: 'Arjun & Meera Mehta', avatar: 'AM', time: '4h ago', message: 'Is there a dress code for the mehendi? Our kids are coming too!', status: 'answered' },
  { name: 'Neha Kapoor', avatar: 'NK', time: '6h ago', message: 'Can you recommend a good spa near the venue for Saturday morning?', status: 'answered' },
  { name: 'Raj Patel', avatar: 'RP', time: '1d ago', message: 'We\'re arriving a day early — any restaurant suggestions close to the hotel?', status: 'answered' },
  { name: 'Simran & Dev Kaur', avatar: 'SK', time: '1d ago', message: 'What\'s the weather looking like for the outdoor ceremony?', status: 'pending' },
  { name: 'Kabir Nair', avatar: 'KN', time: '2d ago', message: 'Is there parking available at the venue or should we Uber?', status: 'answered' },
];

const mockStats = [
  { label: 'Guest Chats', value: '14' },
  { label: 'Answered', value: '11' },
  { label: 'Pending', value: '3' },
];

const notifications = [
  { label: 'Shuttle reminders', desc: 'Alert guests before pickup times', enabled: true },
  { label: 'Weather advisory', desc: 'Auto-alert if conditions change suddenly', enabled: true },
  { label: 'Change break alerts', desc: 'Nudge guests when there\'s time to freshen up', enabled: false },
  { label: 'Upcoming event reminders', desc: 'Keep guests on schedule throughout the day', enabled: true, bold: true },
  { label: 'Post-wedding photo album', desc: 'Send guests a link to upload their photos to a shared album', enabled: false },
  { label: 'Broadcast messages', desc: 'Send an instant message to your entire guest list', enabled: false, bold: true },
];

export default function ConciergePage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { user } = useAuth();
  const { isViewOnly } = useAdminRole();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'checking' | 'submitting' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState(0);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const isBetaUser = BETA_ACCESS_EMAILS.includes(user?.email?.toLowerCase() || '');

  // Load wedding ID
  useEffect(() => {
    if (isPro && isBetaUser) {
      const loadWeddingId = async () => {
        const { data: wedding } = await (supabase as any)
          .from('weddings')
          .select('id')
          .eq('slug', weddingSlug)
          .single();
        if (wedding) setWeddingId(wedding.id);
      };
      loadWeddingId();
    }
  }, [isPro, isBetaUser, weddingSlug]);

  // Early access request check (for non-beta Pro users)
  useEffect(() => {
    if (isPro && !isBetaUser && user?.email) {
      const checkExistingRequest = async () => {
        const hasRequestedLocal = localStorage.getItem(`phera_concierge_requested_${user.email.toLowerCase()}`);
        if (hasRequestedLocal === 'true') {
          setRequestStatus('success');
          return;
        }

        setRequestStatus('checking');
        try {
          const { data, error } = await (supabase as any)
            .from('contact_submissions')
            .select('id')
            .eq('email', user.email.toLowerCase())
            .eq('message', 'Phera Concierge: Early Preview Setup Request')
            .limit(1);

          if (error) {
            setRequestStatus('idle');
            return;
          }

          if (data && data.length > 0) {
            setRequestStatus('success');
            localStorage.setItem(`phera_concierge_requested_${user.email.toLowerCase()}`, 'true');
          } else {
            setRequestStatus('idle');
          }
        } catch {
          setRequestStatus('idle');
        }
      };

      checkExistingRequest();
    }
  }, [isPro, isBetaUser, user?.email]);

  const handleRequestSetup = async () => {
    if (isViewOnly) return;
    if (!user?.email) return;
    setRequestStatus('submitting');
    try {
      const { error } = await (supabase as any)
        .from('contact_submissions')
        .insert([{
          name: user.name || 'Admin',
          email: user.email.toLowerCase(),
          message: 'Phera Concierge: Early Preview Setup Request'
        }]);

      if (error) throw error;

      localStorage.setItem(`phera_concierge_requested_${user.email.toLowerCase()}`, 'true');
      setRequestStatus('success');
    } catch {
      setRequestStatus('error');
    }
  };

  const handleViewConversation = (guestId: string) => {
    setSelectedGuestId(guestId);
    setActiveTab(1);
  };

  // ─── State C: Beta user with Pro → Full tabbed dashboard ───
  if (isPro && isBetaUser) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              Phera Concierge
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              24/7 WhatsApp concierge for your guests — powered by your wedding details
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, val) => {
              setActiveTab(val);
              if (val !== 1) setSelectedGuestId(null);
            }}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#6a6a6a',
                minHeight: 42,
                '&.Mui-selected': { color: '#DE3F5E' },
              },
              '& .MuiTabs-indicator': { backgroundColor: '#DE3F5E' },
            }}
          >
            <Tab label="Dashboard" />
            <Tab label="Conversations" />
            <Tab label="Knowledge Bank" />
          </Tabs>

          {weddingId ? (
            <>
              {activeTab === 0 && (
                <ConciergeDashboard
                  weddingId={weddingId}
                  onViewConversation={handleViewConversation}
                />
              )}
              {activeTab === 1 && (
                <ConciergeConversations
                  weddingId={weddingId}
                  initialGuestId={selectedGuestId}
                />
              )}
              {activeTab === 2 && (
                <ConciergeKnowledgeBase
                  weddingId={weddingId}
                  isViewOnly={isViewOnly}
                />
              )}
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress size={28} sx={{ color: '#DE3F5E' }} />
            </Box>
          )}
        </Stack>
      </Box>
    );
  }

  // ─── State B: Pro but NOT beta → Early Preview request ───
  if (isPro) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              Phera Concierge
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              24/7 WhatsApp concierge for your guests — powered by your wedding details
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 8 },
              borderRadius: '32px',
              bgcolor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '20px',
                bgcolor: '#DE3F5E10',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <InfoOutlined sx={{ fontSize: 32, color: '#DE3F5E' }} />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a' }}>
              Early Preview Mode
            </Typography>

            <Typography variant="body2" sx={{ color: '#4a4a4a', maxWidth: 500, mb: 4, lineHeight: 1.6 }}>
              Phera Concierge is currently in early preview. We are rolling this out to our Pro members in batches to ensure the best experience for you and your guests.
            </Typography>

            {requestStatus === 'checking' ? (
              <CircularProgress size={24} sx={{ color: '#DE3F5E' }} />
            ) : requestStatus === 'success' ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 3,
                  bgcolor: '#F1F8E9',
                  borderRadius: '16px',
                  border: '1px solid #C5E1A5',
                }}
              >
                <CheckCircleOutline sx={{ color: '#2E7D32', fontSize: 28 }} />
                <Typography variant="body2" sx={{ color: '#1B5E20', fontWeight: 600 }}>
                  We've received your request! Someone from our team will be in touch shortly to get you set up.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  disabled={requestStatus === 'submitting'}
                  onClick={handleRequestSetup}
                  sx={{
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: '14px',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: '0 8px 16px rgba(222, 63, 94, 0.2)',
                    '&:hover': { bgcolor: '#c73552' },
                    '&.Mui-disabled': { bgcolor: '#DE3F5E80', color: 'rgba(255,255,255,0.8)' }
                  }}
                >
                  {requestStatus === 'submitting' ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Request Early Access'
                  )}
                </Button>
                {requestStatus === 'error' && (
                  <Typography variant="caption" sx={{ color: '#d32f2f' }}>
                    Something went wrong. Please try again or contact support.
                  </Typography>
                )}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Box>
    );
  }

  // ─── State A: Free user → Blurred mock + upgrade CTA ───
  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={3}>

        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              Phera Concierge
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              24/7 WhatsApp concierge for your guests — powered by your wedding details
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<WhatsApp />}
            onClick={() => setUpgradeModalOpen(true)}
            sx={{
              bgcolor: '#DE3F5E',
              color: 'white',
              px: 3,
              py: 1.25,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.9rem',
              flexShrink: 0,
              '&:hover': { bgcolor: '#c73552' },
            }}
          >
            Upgrade to Pro
          </Button>
        </Box>

        {/* Description */}
        <Box sx={{ maxWidth: 640 }}>
          <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.75, mb: 1.25 }}>
            Leading up to your wedding, guests will have a lot of questions — and most of them are ones you've already answered on your website. <strong>Phera Concierge is your defense layer</strong>: a 24/7 WhatsApp assistant that handles it all, so you don't have to.
          </Typography>
          <Stack spacing={0.6} sx={{ pl: 0 }}>
            {([
              <><strong>Shuttle & logistics reminders</strong> before the wedding so no one misses a beat</>,
              <><strong>Automatic weather advisories</strong> if conditions suddenly change</>,
              <><strong>Change break alerts</strong> in-day when guests have time to freshen up</>,
              <><strong>Timely reminders before each upcoming event</strong> so every guest is right where they need to be</>,
              <><strong>Post-wedding photo album link</strong> so every memory gets gathered in one place</>,
              <>Instantly <strong>broadcast a message to your entire guest list</strong> — urgent news, last-minute changes, or anything exciting</>,
            ] as React.ReactNode[]).map((content, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#DE3F5E', lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.65 }}>{content}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#DE3F5E', lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
              <Typography variant="body2" sx={{ color: '#9a9a9a', lineHeight: 1.65, fontStyle: 'italic' }}>and lots more</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Blurred mock view */}
        <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>

          {/* Mock UI */}
          <Box sx={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>

            {/* Stats row */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
              {mockStats.map((stat) => (
                <Paper key={stat.label} elevation={0} sx={{ flex: 1, minWidth: 120, p: 2.5, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white' }}>
                  <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>{stat.value}</Typography>
                  <Typography variant="body2" sx={{ color: '#6a6a6a', mt: 0.5 }}>{stat.label}</Typography>
                </Paper>
              ))}
            </Box>

            {/* Two-column layout */}
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

              {/* Guest chat list */}
              <Paper elevation={0} sx={{ flex: 1.4, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', bgcolor: 'white' }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>Recent Guest Inquiries</Typography>
                </Box>
                <Stack divider={<Divider />}>
                  {mockChats.map((chat) => (
                    <Box key={chat.name} sx={{ px: 2.5, py: 1.75, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#DE3F5E15', color: '#DE3F5E', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {chat.avatar}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>{chat.name}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#9a9a9a', flexShrink: 0, ml: 1 }}>{chat.time}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.8rem', color: '#6a6a6a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chat.message}
                        </Typography>
                      </Box>
                      <Chip
                        label={chat.status}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          height: 20,
                          flexShrink: 0,
                          bgcolor: chat.status === 'answered' ? '#E8F5E9' : '#FFF3E0',
                          color: chat.status === 'answered' ? '#2E7D32' : '#E65100',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* Notification toggles */}
              <Paper elevation={0} sx={{ flex: 1, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white', alignSelf: 'flex-start' }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>Guest Notifications</Typography>
                </Box>
                <Stack divider={<Divider />}>
                  {notifications.map((n) => (
                    <Box key={n.label} sx={{ px: 2.5, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: n.bold ? 700 : 500, color: '#1a1a1a' }}>{n.label}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#9a9a9a', mt: 0.25 }}>{n.desc}</Typography>
                      </Box>
                      <Switch size="small" checked={n.enabled} readOnly sx={{ flexShrink: 0, '& .MuiSwitch-thumb': { bgcolor: '#DE3F5E' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E50' } }} />
                    </Box>
                  ))}
                </Stack>
              </Paper>

            </Box>
          </Box>

          {/* Lock overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              bgcolor: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockOutlined sx={{ fontSize: 26, color: '#DE3F5E' }} />
            </Box>
            <Button
              variant="contained"
              startIcon={<WhatsApp />}
              onClick={() => setUpgradeModalOpen(true)}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                px: 3.5,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
                '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Unlock Phera Concierge
            </Button>
          </Box>

        </Box>
      </Stack>

      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </Box>
  );
}
