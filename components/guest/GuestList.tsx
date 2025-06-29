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
  DeleteOutlineOutlined,
} from '@mui/icons-material';
import { getAttendees, getComments, addComment, deleteComment } from '@/lib/supabase/rsvp-service';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface GuestItem {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  avatarStyle?: string;
  avatarSeed?: string;
  avatarSvg?: string;
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
    avatar_style?: string;
    avatar_seed?: string;
    avatar_svg?: string;
  };
  gif_id?: string;
  gif_url?: string;
  gif_title?: string;
  gif_preview_url?: string;
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
    // Always start with loading true
    setLoading(true);
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

    // Comments updates - real-time subscription
    const commentsChannel = supabase
      .channel(`guest_list_comments_${weddingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          console.log('Comments change detected:', payload);
          // Refresh comments on any change
          fetchData();
        }
      )
      .subscribe();
    
    return () => {
      try {
        setIsSubscribed(false);
        supabase.removeChannel(rsvpChannel);
        supabase.removeChannel(commentsChannel);
      } catch (error) {
        console.error('Error removing GuestList channels:', error);
      }
    };
  };

  const fetchData = async () => {
    console.log('GuestList: Starting fetchData...');
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
      );
      
      const [attendees, commentsData] = await Promise.race([
        Promise.all([
          getAttendees(weddingId),
          getComments(weddingId)
        ]),
        timeoutPromise
      ]);
      
      console.log('GuestList: Fetched data successfully', { 
        attendeesCount: attendees.length, 
        commentsCount: commentsData.length 
      });
      
      // Convert RSVP data to guest format
      const guestData = attendees.map((rsvp, index) => ({
        id: rsvp.id || `${rsvp.guest_id}-${index}`,
        name: rsvp.guest?.name || 'Unknown Guest',
        initials: rsvp.guest?.initials || '??',
        avatarColor: rsvp.guest?.avatar_color || '#666',
        avatarStyle: rsvp.guest?.avatar_style,
        avatarSeed: rsvp.guest?.avatar_seed,
        avatarSvg: rsvp.guest?.avatar_svg,
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
      
      console.log('GuestList: State updated successfully');
    } catch (error) {
      console.error('GuestList: Error fetching data:', error);
    } finally {
      console.log('GuestList: Setting loading to false');
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

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      console.error('No user found for delete operation');
      return;
    }

    console.log('Attempting to delete comment:', commentId, 'by user:', user.id);

    try {
      // Delete from database
      const result = await deleteComment(commentId, user.id);
      console.log('Delete result:', result);
      
      // Remove from local state
      setComments(prev => {
        const filtered = prev.filter(comment => comment.id !== commentId);
        console.log('Updated comments:', filtered.length, 'remaining');
        return filtered;
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
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
    const going = guests.reduce((sum, guest) => 
      guest.status === 'going' ? sum + guest.guestCount : sum, 0
    );
    const maybe = guests.reduce((sum, guest) => 
      guest.status === 'maybe' ? sum + guest.guestCount : sum, 0
    );
    const totalAttending = going; // Same as going count since we're summing guest counts
    return { going, maybe, totalAttending };
  };

  const { going, maybe, totalAttending } = getStatusCounts();

  if (loading) {
    return (
      <Paper
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography sx={{ 
          fontFamily: 'Outfit',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: '1.5em',
          color: '#858585'
        }}>
          Loading comments...
        </Typography>
      </Paper>
    );
  }

  const renderActivityTab = () => (
    <Stack spacing={3}> {/* 24px gap */}
      {/* Comment Input */}
      {user && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 42,
              height: 42,
              backgroundColor: user.avatar_color || '#DE3F5E',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {user.avatar_svg ? (
              <Box
                dangerouslySetInnerHTML={{ __html: user.avatar_svg }}
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& svg': {
                    width: '100%',
                    height: '100%',
                  },
                }}
              />
            ) : (
              user.initials || '??'
            )}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Paper
              sx={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #BCBCBC',
                borderRadius: '8px', // 8px
                py: '8px',
                px: '12px',
                minHeight: '40px', // Match avatar height
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  borderColor: '#BCBCBC',
                },
                '&:focus-within': {
                  borderColor: '#DE3F5E',
                  boxShadow: '0 0 0 2px rgba(222, 63, 94, 0.1)',
                },
              }}
            >
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={4}
                placeholder="Leave a comment!"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: '16px',
                    fontFamily: 'Outfit',
                    color: '#141414',
                    '& textarea::placeholder': {
                      color: '#BCBCBC',
                      opacity: 1,
                    },
                  },
                  endAdornment: newComment.trim() && (
                    <InputAdornment 
                      position="end" 
                      sx={{ 
                        ml: 1,
                        alignSelf: 'center',
                        height: 'auto'
                      }}
                    >
                      <IconButton
                        onClick={handleAddComment}
                        sx={{
                          color: '#DE3F5E',
                          backgroundColor: 'rgba(222, 63, 94, 0.1)',
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(222, 63, 94, 0.2)',
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
            </Paper>
          </Box>
        </Box>
      )}

      {/* Comments List */}
      <Stack spacing={0}>
        {comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ 
              color: '#858585', 
              fontFamily: 'Outfit',
              fontSize: '16px',
              lineHeight: '1.5em',
              mb: 1 
            }}>
              No comments yet! 💬
            </Typography>
            <Typography sx={{ 
              color: '#BCBCBC', 
              fontFamily: 'Outfit',
              fontSize: '14px',
              lineHeight: '1.5em'
            }}>
              Share your excitement about the wedding
            </Typography>
          </Box>
        ) : (
          comments.map((comment, index) => {
            console.log('Rendering comment:', comment.id, 'by guest:', comment.guest_id, 'current user:', user?.id);
            return (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Box>
                <Box sx={{ display: 'flex', gap: 1, py: 3 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: comment.guest?.avatar_color || '#C4C4C4',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    {comment.guest?.avatar_svg ? (
                      <Box
                        dangerouslySetInnerHTML={{ __html: comment.guest.avatar_svg }}
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '& svg': {
                            width: '100%',
                            height: '100%',
                          },
                        }}
                      />
                    ) : (
                      comment.guest?.initials || '??'
                    )}
                  </Avatar>

                  <Box sx={{ flex: 1, ml: 1 }}>
                    {/* Comment Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        sx={{
                          fontFamily: 'Outfit',
                          fontWeight: 600,
                          fontSize: '16px',
                          lineHeight: '1.5em',
                          color: '#141414',
                        }}
                      >
                        {comment.guest?.name || 'Unknown Guest'}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Outfit',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '1.5em',
                          color: '#858585',
                        }}
                      >
                        {formatTimeAgo(comment.created_at)}
                      </Typography>
                      
                      {/* Delete button - only show for user's own comments */}
                      {user && comment.guest_id === user.id && (
                        <Box sx={{ ml: 'auto' }}>
                          <IconButton
                            onClick={() => {
                              console.log('Delete button clicked for comment:', comment.id);
                              console.log('User ID:', user.id);
                              console.log('Comment guest_id:', comment.guest_id);
                              handleDeleteComment(comment.id);
                            }}
                            size="small"
                            sx={{
                              color: '#858585',
                              opacity: 0.7,
                              '&:hover': {
                                color: '#DE3F5E',
                                opacity: 1,
                                backgroundColor: 'rgba(222, 63, 94, 0.1)',
                              },
                            }}
                          >
                            <DeleteOutlineOutlined fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    {/* Comment Content */}
                    {comment.message && (
                      <Typography
                        sx={{
                          fontFamily: 'Outfit',
                          fontWeight: 400,
                          fontSize: '16px',
                          lineHeight: '1.5em',
                          color: '#141414',
                          mb: comment.gif_url ? 1 : 1,
                        }}
                      >
                        {comment.message}
                      </Typography>
                    )}

                    {/* Comment GIF */}
                    {comment.gif_url && (
                      <Box
                        sx={{
                          mt: comment.message ? 1 : 0,
                          borderRadius: '16px',
                          overflow: 'hidden',
                          maxWidth: '280px',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          mb: 1,
                        }}
                      >
                        <img
                          src={comment.gif_preview_url || comment.gif_url}
                          alt={comment.gif_title || 'GIF'}
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Divider - show for all comments except the last one */}
                {index < comments.length - 1 && (
                  <Divider sx={{ borderColor: '#EBEBEB' }} />
                )}
              </Box>
            </motion.div>
            );
          })
        )}
      </Stack>
    </Stack>
  );

  const renderGuestTab = () => (
    <Stack spacing={0}>
      {filteredGuests.length === 0 ? (
        <Typography sx={{ 
          fontFamily: 'Outfit',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: '1.5em',
          color: '#858585',
          textAlign: 'center',
          py: 4
        }}>
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
                {guest.avatarSvg ? (
                  <Box
                    dangerouslySetInnerHTML={{ __html: guest.avatarSvg }}
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '& svg': {
                        width: '100%',
                        height: '100%',
                      },
                    }}
                  />
                ) : (
                  guest.initials
                )}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography sx={{ 
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '1.5em',
                  color: '#141414'
                }}>
                  {guest.name}
                </Typography>
                {guest.guestCount > 1 && (
                  <Typography sx={{ 
                    fontFamily: 'Outfit',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '1.5em',
                    color: '#858585'
                  }}>
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
        backgroundColor: '#FFFFFF',
        borderRadius: 1, // 16px
        overflow: 'hidden',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >

      {/* Tabs */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            width: '100%',
          }}
        >
          {tabs.map((tab, index) => (
            <Box
              key={tab}
              onClick={() => setActiveTab(index)}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                py: 2,
                px: 1,
                cursor: 'pointer',
                borderBottom: index === activeTab ? '2px solid #DE3F5E' : '2px solid #EBEBEB',
                transition: 'all 0.2s ease',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Outfit',
                  fontWeight: index === activeTab ? 600 : 400,
                  fontSize: '16px',
                  lineHeight: '1.26em',
                  textAlign: 'center',
                  color: index === activeTab ? '#DE3F5E' : '#000000',
                }}
              >
                {tab}
              </Typography>
              
              {/* Count chips */}
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
                      px: 0.75,
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '6%',
                      textTransform: 'uppercase',
                    },
                  }}
                />
              )}
              {index === 1 && (
                <Chip
                  label={going}
                  size="small"
                  sx={{
                    backgroundColor: '#D6D6D6',
                    color: '#000000',
                    height: 20,
                    minWidth: 20,
                    '& .MuiChip-label': {
                      px: 0.75,
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '6%',
                      textTransform: 'uppercase',
                    },
                  }}
                />
              )}
              {index === 2 && (
                <Chip
                  label={maybe}
                  size="small"
                  sx={{
                    backgroundColor: '#D6D6D6',
                    color: '#000000',
                    height: 20,
                    minWidth: 20,
                    '& .MuiChip-label': {
                      px: 0.75,
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '6%',
                      textTransform: 'uppercase',
                    },
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Tab Content */}
      <Box sx={{ px: 3, pb: 2.5, mt: 3 }}> {/* pb: 20px to match design */}
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