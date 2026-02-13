'use client';

import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
  Avatar,
  Chip,
  Switch,
  Divider,
} from '@mui/material';
import { useState, use } from 'react';
import { WhatsApp, LockOutlined } from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';

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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  if (isPro) {
    return (
      <Container maxWidth="xl">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              Phera Concierge
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              24/7 WhatsApp concierge for your guests — powered by your wedding details
            </Typography>
          </Box>
          <Box
            sx={{
              p: 8,
              border: '2px dashed rgba(0, 0, 0, 0.1)',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Typography sx={{ color: '#6a6a6a', fontStyle: 'italic' }}>
              This screen is currently blank. Content coming soon.
            </Typography>
          </Box>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>

        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
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
        <Box sx={{ maxWidth: 680 }}>
          <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.85, mb: 1.5 }}>
            The weeks leading up to a wedding are a whirlwind — and your guests always seem to have
            one more question. <strong>Phera Concierge is your 24/7 defense layer.</strong> It lives
            right inside WhatsApp and answers your guests' questions automatically, using the details
            you've already added to your wedding website. You stay focused on the things that actually
            need you.
          </Typography>
          <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.85, mb: 1 }}>
            From here you can also stay connected with your guests throughout the entire journey:
          </Typography>
          <Stack component="ul" spacing={0.75} sx={{ pl: 2.5, m: 0 }}>
            {[
              { text: 'Send gentle reminders before the wedding — like shuttle pickup times so no one\'s left behind' },
              { text: 'Auto-alert guests if there\'s a sudden weather change so they\'re always prepared' },
              { text: 'Let guests know when they have a moment to freshen up between events' },
              { text: '<b>Send timely reminders for each upcoming event — so every guest shows up exactly when they should</b>', html: true },
              { text: 'After the wedding, share a link for guests to upload all their favourite photos to a shared album, so the memories live on together' },
              { text: '<b>Broadcast an instant message to your entire guest list</b> — for a sudden venue change, exciting news, or anything you need everyone to hear right away', html: true },
            ].map((point, i) => (
              <Box key={i} component="li" sx={{ color: '#4a4a4a' }}>
                {point.html ? (
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: point.text }} />
                ) : (
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{point.text}</Typography>
                )}
              </Box>
            ))}
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
    </Container>
  );
}
