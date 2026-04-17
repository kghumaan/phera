'use client';

import {
  Box,
  Typography,
  Stack,
  Paper,
  Avatar,
  Chip,
    Divider,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import React, { useState, use, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { WhatsApp, LockOutlined, CheckCircleOutline, PhoneAndroid, ContentCopy, AutoAwesome, Bolt, Schedule, Campaign } from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import { supabase } from '@/lib/supabase/client';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import ConciergeConversations from '@/components/admin/concierge/ConciergeConversations';
import ConciergeKnowledgeBase from '@/components/admin/concierge/ConciergeKnowledgeBase';
import ConciergeBroadcasts from '@/components/admin/concierge/ConciergeBroadcasts';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraSwitch } from '@/components/shared/Switch';
import { PheraCard } from '@/components/shared/Card';
import { PageHeading } from '@/components/shared/PageHeading';
import { StatCard } from '@/components/shared/StatCard';
import { PheraChip } from '@/components/shared/Chip';

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
  const { isViewOnly } = useAdminRole();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [conciergeEnabled, setConciergeEnabled] = useState<boolean | null>(null);
  const [enabling, setEnabling] = useState(false);
  const [generatingKB, setGeneratingKB] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [conciergePhone, setConciergePhone] = useState('');
  const searchParams = useSearchParams();

  // Fetch the configured phone number (shared with Coordinator — driven by
  // COORDINATOR_PHONE_NUMBER env var so both features show the same number).
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/vendors/coordinator-info');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.phoneNumber) setConciergePhone(data.phoneNumber);
      } catch {}
    })();
  }, []);

  // Deep-link: if ?guest=<id> is in URL, auto-select that guest and switch to conversations tab
  useEffect(() => {
    const guestParam = searchParams.get('guest');
    if (guestParam) {
      setSelectedGuestId(guestParam);
      setActiveTab(1); // Switch to Conversations tab
    }
  }, [searchParams]);

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(conciergePhone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {}
  };

  // Load wedding ID + concierge_enabled flag for pro users.
  useEffect(() => {
    if (!isPro) return;
    (async () => {
      const { data: wedding } = await (supabase as any)
        .from('weddings')
        .select('id')
        .eq('slug', weddingSlug)
        .single();
      if (!wedding) return;
      setWeddingId(wedding.id);
      const { data: settings } = await (supabase as any)
        .from('wedding_settings')
        .select('concierge_enabled')
        .eq('wedding_id', wedding.id)
        .maybeSingle();
      setConciergeEnabled(!!settings?.concierge_enabled);
    })();
  }, [isPro, weddingSlug]);

  const handleEnableConcierge = async () => {
    if (isViewOnly || !weddingId || enabling) return;
    setEnabling(true);
    try {
      const { data: existing } = await (supabase as any)
        .from('wedding_settings')
        .select('id')
        .eq('wedding_id', weddingId)
        .maybeSingle();

      if (existing) {
        await (supabase as any)
          .from('wedding_settings')
          .update({ concierge_enabled: true, concierge_enabled_at: new Date().toISOString() })
          .eq('wedding_id', weddingId);
      } else {
        await (supabase as any)
          .from('wedding_settings')
          .insert({
            wedding_id: weddingId,
            concierge_enabled: true,
            concierge_enabled_at: new Date().toISOString(),
            pin_codes: [],
            whatsapp_group_link: '',
            google_sheets_id: '',
            lapse_event_codes: {},
          });
      }
      setConciergeEnabled(true);

      // Seed the Knowledge Bank from the wedding's venue + dates so the
      // agent has useful context the moment Concierge turns on. Best-effort
      // — users can regenerate later from the KB tab.
      setGeneratingKB(true);
      try {
        await fetch('/api/concierge/knowledge/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weddingId }),
        });
      } catch (err) {
        console.error('Auto KB generation failed:', err);
      } finally {
        setGeneratingKB(false);
      }
    } finally {
      setEnabling(false);
    }
  };

  // ─── Pro users ───────────────────────────────────────────────────
  // Pro + concierge_enabled → tabbed dashboard.
  // Pro + not enabled → intro/marketing page with Enable button.
  if (isPro) {
    // Still loading flag.
    if (conciergeEnabled === null) {
      return (
        <Box sx={{ maxWidth: 1000, display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
        </Box>
      );
    }

    // Seeding the Knowledge Bank right after enable — show a dedicated
    // status screen so users know what's happening before the dashboard
    // renders with populated entries.
    if (generatingKB) {
      return (
        <Box sx={{ maxWidth: 1000 }}>
          <Stack spacing={3} alignItems="center" sx={{ py: 10, px: 3 }}>
            <CircularProgress size={44} sx={{ color: COLORS.brand.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.text.strong, textAlign: 'center' }}>
              Building your Concierge&apos;s knowledge bank
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle, textAlign: 'center', maxWidth: 460, lineHeight: 1.65 }}>
              Generating venue details, event timing, and local guides for your wedding — so the agent has context from the moment your first guest messages in. Takes about 20 seconds.
            </Typography>
          </Stack>
        </Box>
      );
    }

    // Enabled → active dashboard (Knowledge Bank / Conversations / Broadcasts).
    if (conciergeEnabled) {
      return (
        <Box sx={{ maxWidth: 1000 }}>
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong, flex: 1 }}>
                  Guest Concierge
                </Typography>
                <Tooltip
                  title="This is the WhatsApp number your guests message. Phera's Concierge answers from this line 24/7."
                  arrow
                >
                  <Paper
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 0.75,
                      bgcolor: COLORS.bg.subtle,
                      borderRadius: 1,
                      border: '1px solid rgba(0,0,0,0.07)',
                      cursor: 'help',
                    }}
                  >
                    <PhoneAndroid sx={{ fontSize: 18, color: COLORS.text.subtle }} />
                    <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, letterSpacing: 0.5 }}>
                      {conciergePhone}
                    </Typography>
                  </Paper>
                </Tooltip>
                <Tooltip title={phoneCopied ? 'Copied!' : 'Copy Concierge number — this is our business number that guests can contact'} arrow>
                  <IconButton
                    size="small"
                    onClick={handleCopyPhone}
                    sx={{ color: phoneCopied ? COLORS.accent.success : COLORS.text.subtle }}
                  >
                    {phoneCopied ? <CheckCircleOutline fontSize="small" /> : <ContentCopy fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
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
                  color: COLORS.text.subtle,
                  minHeight: 42,
                  '&.Mui-selected': { color: COLORS.brand.primary },
                },
                '& .MuiTabs-indicator': { backgroundColor: COLORS.brand.primary },
              }}
            >
              <Tab label="Knowledge Bank" />
              <Tab label="Conversations" />
              <Tab label="Broadcasts" />
            </Tabs>

            {weddingId ? (
              <>
                {activeTab === 0 && (
                  <ConciergeKnowledgeBase
                    weddingId={weddingId}
                    isViewOnly={isViewOnly}
                  />
                )}
                {activeTab === 1 && (
                  <ConciergeConversations
                    weddingId={weddingId}
                    initialGuestId={selectedGuestId}
                  />
                )}
                {activeTab === 2 && (
                  <ConciergeBroadcasts
                    weddingId={weddingId}
                    weddingSlug={weddingSlug}
                    isViewOnly={isViewOnly}
                  />
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
              </Box>
            )}
          </Stack>
        </Box>
      );
    }

    // Not enabled → marketing intro page with Enable CTA.
    const features: Array<{ icon: React.ComponentType<{ sx?: any }>; title: string; body: string }> = [
      {
        icon: AutoAwesome,
        title: 'Answers on autopilot',
        body: 'Shuttle times, venue addresses, dress codes, dietary questions — answered in seconds using your wedding details.',
      },
      {
        icon: Schedule,
        title: 'Reminders before every event',
        body: 'Nudge guests before each ceremony, shuttle, or change break so no one misses a moment.',
      },
      {
        icon: Campaign,
        title: 'Broadcast & collect in one tap',
        body: 'Send updates to everyone or targeted groups — and when you need info back (flight details, dietary preferences, hotel check-in times), collect it right in the same thread.',
      },
      {
        icon: Bolt,
        title: 'You stay in control',
        body: 'Review every conversation, edit knowledge the AI uses, and jump in personally whenever you want.',
      },
    ];

    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={4}>
          <PageHeading
            title="Guest Concierge"
            subtitle="24/7 WhatsApp assistant for your guests — powered by your wedding details"
          />

          <PheraCard variant="default" sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={3} alignItems="flex-start">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: RADII.lg,
                    bgcolor: '#DE3F5E12',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WhatsApp sx={{ fontSize: 28, color: COLORS.brand.primary }} />
                </Box>
                <PrimaryActionButton
                  startIcon={<WhatsApp />}
                  onClick={handleEnableConcierge}
                  loading={enabling}
                  disabled={isViewOnly || !weddingId}
                  sx={{
                    px: 3,
                    py: 1.25,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(222, 63, 94, 0.25)',
                  }}
                >
                  Enable Guest Concierge
                </PrimaryActionButton>
              </Box>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.text.strong, mb: 1 }}>
                  Give every guest a personal concierge
                </Typography>
                <Typography variant="body1" sx={{ color: COLORS.text.muted, lineHeight: 1.65 }}>
                  Guests always have the same handful of questions — shuttle times, dress code, where to park. Concierge answers all of it over WhatsApp, 24/7, so you don&apos;t have to. When you&apos;re ready, flip it on and we&apos;ll do the rest.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2,
                  width: '100%',
                  mt: 1,
                }}
              >
                {features.map(({ icon: Icon, title, body }) => (
                  <Box
                    key={title}
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      alignItems: 'flex-start',
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid rgba(0,0,0,0.07)',
                      bgcolor: COLORS.bg.subtle,
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: COLORS.bg.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <Icon sx={{ fontSize: 18, color: COLORS.brand.primary }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '0.9rem', mb: 0.25 }}>
                        {title}
                      </Typography>
                      <Typography sx={{ color: COLORS.text.muted, fontSize: '0.82rem', lineHeight: 1.55 }}>
                        {body}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  mt: 1,
                  p: 2.5,
                  borderRadius: 1,
                  bgcolor: '#DE3F5E08',
                  border: '1px solid rgba(222, 63, 94, 0.15)',
                  width: '100%',
                }}
              >
                <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
                  <strong style={{ color: COLORS.text.strong }}>How it works:</strong> Click Enable. We spin up a dedicated WhatsApp line for your wedding. You fill your Knowledge Bank (or let AI draft it from your wedding details), send broadcasts to your guests, and review every conversation from this page.
                </Typography>
              </Box>
            </Stack>
          </PheraCard>
        </Stack>
      </Box>
    );
  }

  // ─── State A: Free user → Blurred mock + upgrade CTA ───
  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={3}>

        {/* Header row */}
        <PageHeading
          title="Guest Concierge"
          subtitle="24/7 WhatsApp concierge for your guests — powered by your wedding details"
          actions={
            <PrimaryActionButton
              startIcon={<WhatsApp />}
              onClick={() => setUpgradeModalOpen(true)}
              sx={{ px: 3, py: 1.25, fontSize: '0.9rem' }}
            >
              Upgrade to Pro
            </PrimaryActionButton>
          }
        />

        {/* Description */}
        <Box sx={{ maxWidth: 640 }}>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.75, mb: 1.25 }}>
            Leading up to your wedding, guests will have a lot of questions — and most of them are ones you've already answered on your website. <strong>Guest Concierge is your defense layer</strong>: a 24/7 WhatsApp assistant that handles it all, so you don't have to.
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
                <Typography variant="body2" sx={{ color: COLORS.brand.primary, lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.65 }}>{content}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ color: COLORS.brand.primary, lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.faint, lineHeight: 1.65, fontStyle: 'italic' }}>and lots more</Typography>
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
                <StatCard key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </Box>

            {/* Two-column layout */}
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

              {/* Guest chat list */}
              <PheraCard variant="default" sx={{ flex: 1.4, overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${COLORS.border.faint}` }}>
                  <Typography variant="subtitle2" sx={{ color: COLORS.text.strong }}>Recent Guest Inquiries</Typography>
                </Box>
                <Stack divider={<Divider />}>
                  {mockChats.map((chat) => (
                    <Box key={chat.name} sx={{ px: 2.5, py: 1.75, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: COLORS.brand.primarySubtle, color: COLORS.brand.primary, fontSize: '0.875rem', fontWeight: 700, flexShrink: 0 }}>
                        {chat.avatar}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong }}>{chat.name}</Typography>
                          <Typography variant="caption" sx={{ color: COLORS.text.faint, flexShrink: 0, ml: 1 }}>{chat.time}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: COLORS.text.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chat.message}
                        </Typography>
                      </Box>
                      <PheraChip
                        label={chat.status}
                        size="small"
                        tone={chat.status === 'answered' ? 'success' : 'warning'}
                        sx={{ flexShrink: 0 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </PheraCard>

              {/* Notification toggles */}
              <PheraCard variant="default" sx={{ flex: 1, alignSelf: 'flex-start' }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${COLORS.border.faint}` }}>
                  <Typography variant="subtitle2" sx={{ color: COLORS.text.strong }}>Guest Notifications</Typography>
                </Box>
                <Stack divider={<Divider />}>
                  {notifications.map((n) => (
                    <Box key={n.label} sx={{ px: 2.5, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: n.bold ? 700 : 500, color: COLORS.text.strong }}>{n.label}</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.text.faint, mt: 0.25, display: 'block' }}>{n.desc}</Typography>
                      </Box>
                      <PheraSwitch size="small" checked={n.enabled} readOnly sx={{ flexShrink: 0 }} />
                    </Box>
                  ))}
                </Stack>
              </PheraCard>

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
                bgcolor: COLORS.bg.white,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockOutlined sx={{ fontSize: 26, color: COLORS.brand.primary }} />
            </Box>
            <PrimaryActionButton
              startIcon={<WhatsApp />}
              onClick={() => setUpgradeModalOpen(true)}
              sx={{
                px: 3.5,
                py: 1.5,
                borderRadius: 2,
                fontSize: '0.95rem',
                boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
              }}
            >
              Unlock Guest Concierge
            </PrimaryActionButton>
          </Box>

        </Box>
      </Stack>

      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </Box>
  );
}
