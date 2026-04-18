'use client';

import { Box, Typography, Stack, Paper, Avatar, Chip, CircularProgress, Divider, IconButton, Tooltip } from '@mui/material';
import { People, QuestionAnswer, Speed, ContentCopy, Circle } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import ConciergeMetricCard from './ConciergeMetricCard';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface Stats {
  guestsReached: number;
  messagesHandled: number;
  avgResponseTimeSec: number;
  totalMessages: number;
}

interface RecentActivity {
  guestId: string;
  guestName: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  messageCount: number;
}

interface ConciergeDashboardProps {
  weddingId: string;
  onViewConversation?: (guestId: string) => void;
}

export default function ConciergeDashboard({ weddingId, onViewConversation }: ConciergeDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, convsRes] = await Promise.all([
        fetch(`/api/concierge/stats?weddingId=${weddingId}`),
        fetch(`/api/concierge/conversations?weddingId=${weddingId}`),
      ]);

      const statsData = await statsRes.json();
      const convsData = await convsRes.json();

      if (statsRes.ok) setStats(statsData);
      if (convsRes.ok) {
        setRecentActivity(
          (convsData.conversations || []).slice(0, 8).map((c: any) => ({
            guestId: c.guestId,
            guestName: c.guestName,
            lastMessagePreview: c.lastMessagePreview,
            lastMessageAt: c.lastMessageAt,
            messageCount: c.messageCount,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

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

  const formatResponseTime = (seconds: number) => {
    if (seconds === 0) return '--';
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const conciergePhone = process.env.NEXT_PUBLIC_CONCIERGE_PHONE || '';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Metric Cards */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <ConciergeMetricCard
          icon={<People sx={{ fontSize: 20 }} />}
          label="Guests Reached"
          value={stats?.guestsReached ?? 0}
        />
        <ConciergeMetricCard
          icon={<QuestionAnswer sx={{ fontSize: 20 }} />}
          label="Messages Handled"
          value={stats?.messagesHandled ?? 0}
        />
        <ConciergeMetricCard
          icon={<Speed sx={{ fontSize: 20 }} />}
          label="Avg Response Time"
          value={formatResponseTime(stats?.avgResponseTimeSec ?? 0)}
          subtitle={stats?.avgResponseTimeSec ? 'Fully automated' : undefined}
        />
      </Box>

      {/* Recent Activity */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: COLORS.bg.white,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: COLORS.text.strong }}>
            Recent Activity
          </Typography>
        </Box>
        {recentActivity.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
              No conversations yet. Once guests start messaging your concierge, their activity will appear here.
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {recentActivity.map((activity) => (
              <Box
                key={activity.guestId}
                onClick={() => onViewConversation?.(activity.guestId)}
                sx={{
                  px: 2.5,
                  py: 1.75,
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                  cursor: onViewConversation ? 'pointer' : 'default',
                  '&:hover': onViewConversation ? { bgcolor: COLORS.bg.muted } : {},
                  transition: 'background-color 0.15s',
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#DE3F5E15',
                    color: COLORS.brand.primary,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(activity.guestName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.strong }}>
                      {activity.guestName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.faint, flexShrink: 0, ml: 1 }}>
                      {formatTimeAgo(activity.lastMessageAt)}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      color: COLORS.text.subtle,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activity.lastMessagePreview}
                  </Typography>
                </Box>
                <Chip
                  label="answered"
                  size="small"
                  sx={{
                    fontSize: '0.875rem',
                    height: 20,
                    flexShrink: 0,
                    bgcolor: '#E8F5E9',
                    color: '#2E7D32',
                    fontWeight: 600,
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Bot Status */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 1,
          border: '1px solid rgba(0,0,0,0.07)',
          bgcolor: COLORS.bg.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Circle sx={{ fontSize: 14, color: COLORS.accent.success }} />
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.strong }}>
            Concierge Active
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
          Text the concierge number from your phone to test it yourself
        </Typography>
      </Paper>
    </Stack>
  );
}
