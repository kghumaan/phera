'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  ThumbUpOutlined,
  ChatBubbleOutlineRounded,
} from '@mui/icons-material';
import { getAttendees } from '@/lib/supabase/rsvp-service';
import { supabase } from '@/lib/supabase/client';

interface ActivityItem {
  id: string;
  guestName: string;
  action: string;
  timestamp: string;
  rawTimestamp: string;
  initials: string;
  avatarColor: string;
}

interface ActivityFeedProps {
  weddingId: string;
}

export default function ActivityFeed({ weddingId }: ActivityFeedProps) {
  const theme = useTheme();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    fetchActivities();

    // Prevent duplicate subscriptions
    if (isSubscribed) {
      return;
    }

    // Set up real-time subscription for RSVP updates
    // Use a unique channel name to avoid conflicts with other components
    const channel = supabase
      .channel(`activity_feed_rsvp_updates_${weddingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rsvps',
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          console.log('New RSVP received:', payload);
          // Show a brief notification of new activity
          setNewActivityCount(prev => prev + 1);
          // Reset the notification after 3 seconds
          setTimeout(() => setNewActivityCount(0), 3000);
          // Refresh activities when new RSVP is submitted
          fetchActivities();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rsvps', 
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          console.log('RSVP updated:', payload);
          // Refresh activities when RSVP is updated
          fetchActivities();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('ActivityFeed: Successfully subscribed to RSVP updates');
          setIsSubscribed(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('ActivityFeed: Failed to subscribe to RSVP updates');
          setIsSubscribed(false);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      try {
        setIsSubscribed(false);
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Error removing ActivityFeed channel:', error);
      }
    };
  }, [weddingId, isSubscribed]);

  const fetchActivities = async () => {
    try {
      const attendees = await getAttendees(weddingId);
      
      // Convert RSVP data to activity format
      const activityData = attendees.map((rsvp) => ({
        id: rsvp.id,
        guestName: rsvp.guest?.name || 'Unknown Guest',
        action: 'rsvped Going',
        timestamp: formatTimeAgo(rsvp.created_at),
        rawTimestamp: rsvp.created_at,
        initials: rsvp.guest?.initials || '??',
        avatarColor: rsvp.guest?.avatar_color || '#666',
      }));

      // Sort by most recent first
      activityData.sort((a, b) => new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime());
      
      setActivities(activityData.slice(0, 10)); // Show last 10 activities
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w`;
  };

  if (loading) {
    return (
      <Paper
        sx={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#666', fontFamily: 'var(--font-playfair)' }}>Loading activity...</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography 
          variant="h6" 
          fontWeight={600}
          sx={{ 
            fontFamily: 'var(--font-instrument-serif)', 
            color: '#800020' 
          }}
        >
          Activity
        </Typography>
        <Chip
          label={newActivityCount > 0 ? `+${newActivityCount} new!` : `${activities.length} updates`}
          size="small"
          sx={{
            backgroundColor: newActivityCount > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(128, 0, 32, 0.1)',
            color: newActivityCount > 0 ? '#4CAF50' : '#800020',
            fontWeight: 500,
            transition: 'all 0.3s ease',
          }}
        />
      </Box>

      {/* Activity List */}
      <Stack spacing={0} sx={{ px: 3, pb: 3 }}>
        {activities.length === 0 ? (
          <Typography 
            sx={{ color: '#666', fontFamily: 'var(--font-playfair)' }} 
            textAlign="center" 
            py={4}
          >
            No activity yet. Be the first to RSVP! 🎉
          </Typography>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 2,
                  gap: 2,
                }}
              >
                {/* Avatar */}
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: activity.avatarColor,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                  }}
                >
                  {activity.initials}
                </Avatar>

                {/* Content */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5, color: '#800020', fontFamily: 'var(--font-playfair)' }}>
                    <Box component="span" sx={{ fontWeight: 600, color: '#800020' }}>
                      {activity.guestName}
                    </Box>{' '}
                    {activity.action} 👍
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', fontFamily: 'var(--font-playfair)' }}>
                    {activity.timestamp}
                  </Typography>
                </Box>

                {/* Actions */}
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: 'success.main',
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      },
                    }}
                  >
                    <ThumbUpOutlined fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                      },
                    }}
                  >
                    <ChatBubbleOutlineRounded fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </motion.div>
          ))
        )}
      </Stack>
    </Paper>
  );
} 