'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Tab,
  Tabs,
  useTheme,
  Divider,
  Collapse,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchOutlined,
  FavoriteOutlined,
  ChatBubbleOutlineRounded,
  ThumbUpOutlined,
  SendOutlined,
  MoreVertOutlined,
  ReplyOutlined,
  EmojiEmotionsOutlined,
} from '@mui/icons-material';
import { getAttendees, getComments, addComment } from '@/lib/supabase/rsvp-service';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface GuestItem {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  status: 'going' | 'maybe' | 'not-going';
  guestCount: number;
  timestamp: string;
}

interface Comment {
  id: string;
  guest_id: string;
  wedding_id: string;
  message: string;
  created_at: string;
  guest?: {
    name: string;
    initials: string;
    avatar_color: string;
  };
}

interface Reply {
  id: string;
  user_id: string;
  user_name: string;
  user_initials: string;
  user_avatar_color: string;
  content: string;
  created_at: string;
  reactions: Reaction[];
}

interface Reaction {
  id: string;
  user_id: string;
  user_name: string;
  emoji: string;
}

interface ActivityItem {
  id: string;
  guestName: string;
  action: string;
  timestamp: string;
  rawTimestamp: string;
  initials: string;
  avatarColor: string;
}

interface GuestListProps {
  weddingId: string;
}

const emojis = ['❤️', '😍', '🎉', '👏', '😂', '🥰', '🔥', '💯'];

export default function GuestList({ weddingId }: GuestListProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<GuestItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const tabs = ['Activity', 'Going', 'Maybe'];

  const filterGuests = useCallback(() => {
    let filtered = guests;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(guest =>
        guest.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status tab (skip Activity tab - index 0)
    if (activeTab === 1) { // Going tab
      filtered = filtered.filter(guest => guest.status === 'going');
    } else if (activeTab === 2) { // Maybe tab  
      filtered = filtered.filter(guest => guest.status === 'maybe');
    }

    setFilteredGuests(filtered);
  }, [guests, searchQuery, activeTab]);

  useEffect(() => {
    fetchData();
    const cleanup = setupRealtimeListeners();
    
    // Return cleanup function for proper unmount
    return cleanup;
  }, [weddingId]);

  useEffect(() => {
    filterGuests();
  }, [filterGuests]);

  const setupRealtimeListeners = () => {
    // Prevent duplicate subscriptions
    if (isSubscribed) {
      return () => {}; // Return empty cleanup function
    }

    // RSVP updates - use unique channel name to avoid conflicts
    const rsvpChannel = supabase
      .channel(`guest_list_rsvp_updates_${weddingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rsvps',
          filter: `wedding_id=eq.${weddingId}`,
        },
        () => {
          setNewActivityCount(prev => prev + 1);
          setTimeout(() => setNewActivityCount(0), 3000);
          fetchData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('GuestList: Successfully subscribed to RSVP updates');
          setIsSubscribed(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('GuestList: Failed to subscribe to RSVP updates');
          setIsSubscribed(false);
        }
      });

    // Comments updates (when we implement the backend)
    // For now, we'll use local state
    
    return () => {
      try {
        setIsSubscribed(false);
        supabase.removeChannel(rsvpChannel);
      } catch (error) {
        console.error('Error removing GuestList channel:', error);
      }
    };
  };

  const fetchData = async () => {
    try {
      const [attendees, commentsData] = await Promise.all([
        getAttendees(weddingId),
        getComments(weddingId)
      ]);
      
      // Convert RSVP data to guest format
      const guestData = attendees.map((rsvp, index) => ({
        id: rsvp.id || `${rsvp.guest_id}-${index}`,
        name: rsvp.guest?.name || 'Unknown Guest',
        initials: rsvp.guest?.initials || '??',
        avatarColor: rsvp.guest?.avatar_color || '#666',
        status: rsvp.attending ? 'going' : 'not-going' as 'going' | 'maybe' | 'not-going',
        guestCount: rsvp.guest_count || 1,
        timestamp: rsvp.created_at,
      }));

      // Convert to activity format
      const activityData = attendees.map((rsvp) => ({
        id: rsvp.id,
        guestName: rsvp.guest?.name || 'Unknown Guest',
        action: 'RSVP\'d Going',
        timestamp: formatTimeAgo(rsvp.created_at),
        rawTimestamp: rsvp.created_at,
        initials: rsvp.guest?.initials || '??',
        avatarColor: rsvp.guest?.avatar_color || '#666',
      }));

      // Sort activities by most recent first
      activityData.sort((a, b) => new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime());

      setGuests(guestData);
      setActivities(activityData.slice(0, 10));

      // Load comments from database
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  // const handleBoop = (guestId: string) => {
  //   console.log(`Booped guest ${guestId}! 💕`);
  // };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      // Save to database
      const savedComment = await addComment(weddingId, user.id, newComment);
      
      // Add to local state
      setComments(prev => [savedComment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error saving comment:', error);
      // You could show a toast notification here
    }
  };

  const handleAddReply = async (commentId: string) => {
    // Temporarily disabled - requires API enhancement
    console.log('Reply functionality temporarily disabled');
  };

  const handleAddReaction = (commentId: string, emoji: string, isReply: boolean = false, replyId?: string) => {
    // Temporarily disabled - requires API enhancement
    console.log('Reaction functionality temporarily disabled');
  };

  const getStatusCounts = () => {
    const going = guests.filter(g => g.status === 'going').length;
    const maybe = guests.filter(g => g.status === 'maybe').length;
    const totalAttending = guests.reduce((sum, guest) => 
      guest.status === 'going' ? sum + guest.guestCount : sum, 0
    );
    return { going, maybe, totalAttending };
  };

  const { going, maybe, totalAttending } = getStatusCounts();

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
        <Typography sx={{ color: '#666', fontFamily: 'var(--font-playfair)' }}>
          Loading...
        </Typography>
      </Paper>
    );
  }

  const renderActivityTab = () => (
    <Stack spacing={2}>
      {/* Comment Input */}
      {user && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: user.avatar_color || '#DE3F5E',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {user.initials || '??'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={4}
              placeholder="Leave a comment!"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '& fieldset': {
                    borderColor: '#333',
                    borderWidth: '1.5px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#000',
                    borderWidth: '2px',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  fontFamily: 'var(--font-playfair)',
                  color: '#000',
                },
              }}
              InputProps={{
                endAdornment: newComment.trim() && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleAddComment}
                      sx={{
                        color: '#800020',
                        backgroundColor: 'rgba(128, 0, 32, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(128, 0, 32, 0.2)',
                        },
                      }}
                      size="small"
                    >
                      <SendOutlined fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
          </Box>
        </Box>
      )}

      {/* Comments List */}
      <Stack spacing={0}>
        {comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: '#666', fontFamily: 'var(--font-playfair)', mb: 1 }}>
              No comments yet! 💬
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', fontFamily: 'var(--font-playfair)' }}>
              Share your excitement about the wedding
            </Typography>
          </Box>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Box
                sx={{
                  py: 2,
                  borderBottom: index < comments.length - 1 ? '1px solid' : 'none',
                  borderColor: 'rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: comment.guest?.avatar_color || '#666',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    {comment.guest?.initials || '??'}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    {/* Comment Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: '#800020',
                          fontFamily: 'var(--font-playfair)',
                        }}
                      >
                        {comment.guest?.name || 'Unknown Guest'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999',
                          fontFamily: 'var(--font-playfair)',
                        }}
                      >
                        {formatTimeAgo(comment.created_at)}
                      </Typography>
                    </Box>

                    {/* Comment Content */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#333',
                        fontFamily: 'var(--font-playfair)',
                        lineHeight: 1.5,
                        mb: 1,
                      }}
                    >
                      {comment.message}
                    </Typography>

                    {/* Comment Actions - temporarily simplified */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        size="small"
                        startIcon={<ThumbUpOutlined />}
                        disabled
                        sx={{
                          color: '#666',
                          minWidth: 'auto',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.75rem',
                          textTransform: 'none',
                        }}
                      >
                        Like (Coming Soon)
                      </Button>

                      <Button
                        size="small"
                        startIcon={<ReplyOutlined />}
                        disabled
                        sx={{
                          color: '#666',
                          minWidth: 'auto',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.75rem',
                          textTransform: 'none',
                        }}
                      >
                        Reply (Coming Soon)
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          ))
        )}
      </Stack>
    </Stack>
  );

  const renderGuestTab = () => (
    <Stack spacing={0}>
      {filteredGuests.length === 0 ? (
        <Typography sx={{ color: '#666', fontFamily: 'var(--font-playfair)' }} textAlign="center" py={4}>
          {searchQuery ? 'No guests found matching your search.' : 'No guests in this category yet.'}
        </Typography>
      ) : (
        filteredGuests.map((guest, index) => (
          <motion.div
            key={guest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 2,
                gap: 2,
                borderBottom: index < filteredGuests.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: guest.avatarColor,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                }}
              >
                {guest.initials}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={600} sx={{ color: '#800020', fontFamily: 'var(--font-playfair)' }}>
                  {guest.name}
                </Typography>
                {guest.guestCount > 1 && (
                  <Typography variant="caption" sx={{ color: '#666', fontFamily: 'var(--font-playfair)' }}>
                    +{guest.guestCount - 1} guest{guest.guestCount > 2 ? 's' : ''}
                  </Typography>
                )}
              </Box>

              {/* <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleBoop(guest.id)}
                  sx={{
                    borderRadius: 20,
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: 70,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                    },
                  }}
                >
                  Boop
                </Button>
                <IconButton
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <ChatBubbleOutlineRounded fontSize="small" />
                </IconButton>
              </Stack> */}
            </Box>
          </motion.div>
        ))
      )}
    </Stack>
  );



  return (
    <Paper
      sx={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header with Total Count */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="h6" 
            fontWeight={600} 
            sx={{ 
              fontFamily: 'var(--font-instrument-serif)', 
              color: '#800020' 
            }}
          >
            Wedding Community
          </Typography>
          <Chip
            label={`${totalAttending} attending`}
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              color: '#4CAF50',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          />
        </Box>

        {/* Search - only show for guest tabs */}
        {/* {(activeTab === 1 || activeTab === 2) && (
          <TextField
            fullWidth
            placeholder="Find a guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0,0,0,0.03)',
                borderRadius: 2,
              },
            }}
          />
        )} */}
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minWidth: 'auto',
              px: 2,
              color: '#666',
              '&.Mui-selected': {
                color: '#800020',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#800020',
              height: 3,
              borderRadius: '2px 2px 0 0',
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab}
                  {index === 0 && newActivityCount > 0 && (
                    <Chip
                      label={newActivityCount}
                      size="small"
                      sx={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        height: 20,
                        minWidth: 20,
                        '& .MuiChip-label': {
                          px: 0.5,
                          fontSize: '0.7rem',
                        },
                      }}
                    />
                  )}
                  {index === 1 && (
                    <Chip
                      label={going}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(128, 0, 32, 0.1)',
                        color: '#800020',
                        height: 20,
                        minWidth: 20,
                        '& .MuiChip-label': {
                          px: 0.5,
                          fontSize: '0.7rem',
                        },
                      }}
                    />
                  )}
                  {index === 2 && (
                    <Chip
                      label={maybe}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255, 193, 7, 0.2)',
                        color: '#F57C00',
                        height: 20,
                        minWidth: 20,
                        '& .MuiChip-label': {
                          px: 0.5,
                          fontSize: '0.7rem',
                        },
                      }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ px: 3, pb: 3, mt: 2 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 0 && renderActivityTab()}
            {activeTab === 1 && renderGuestTab()}
            {activeTab === 2 && renderGuestTab()}
          </motion.div>
        </AnimatePresence>
      </Box>

{/* Emoji menu temporarily removed */}
    </Paper>
  );
} 