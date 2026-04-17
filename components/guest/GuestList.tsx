'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
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
  Gif as GifIcon,
  KeyboardArrowDown,
  Search,
  Close,
} from '@mui/icons-material';
import { getAllRSVPs, getComments, addComment, deleteComment } from '@/lib/supabase/rsvp-service';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import GifPicker from '@/components/ui/GifPicker';
import { GifData } from '@/lib/supabase/types';
import { COLORS, RADII } from '@/lib/theme/tokens';

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
  weddingSlug?: string;
  compact?: boolean;
  initialMaxComments?: number;
  initialTab?: number;
  primaryColor?: string;
  hideCommentInput?: boolean;
}

const emojis = ['❤️', '😍', '🎉', '👏', '😂', '🥰', '🔥', '💯'];

export default function GuestList({
  weddingId,
  weddingSlug,
  compact = false,
  initialMaxComments = 2,
  initialTab = 0,
  primaryColor: primaryColorProp,
  hideCommentInput = false,
}: GuestListProps) {
  const themeColor = primaryColorProp || COLORS.brand.primary;
  const theme = useTheme();
  const { user } = useAuth();
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<GuestItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(initialMaxComments);
  const [visibleRSVPCount, setVisibleRSVPCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [newComment, setNewComment] = useState('');
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<GifData | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const isSubscribedRef = useRef(false);

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

  // Single stable useEffect for data fetching + realtime - only depends on weddingId
  useEffect(() => {
    const doFetch = async () => {
      // Prevent multiple simultaneous fetches using immediate ref lock
      if (isFetchingRef.current) {
        return;
      }
      isFetchingRef.current = true;
      lastFetchTimeRef.current = Date.now();
      setIsFetching(true);

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
        );

        // Try fetching with UUID first
        let [attendees, commentsData] = await Promise.race([
          Promise.all([
            getAllRSVPs(weddingId),
            getComments(weddingId)
          ]),
          timeoutPromise
        ]);



        // If we got nothing and we have a slug, try the slug
        if (attendees.length === 0 && commentsData.length === 0 && weddingSlug) {

          const [slugAttendees, slugComments] = await Promise.race([
            Promise.all([
              getAllRSVPs(weddingSlug),
              getComments(weddingSlug)
            ]),
            timeoutPromise
          ]);



          if (slugAttendees.length > 0 || slugComments.length > 0) {
            attendees = slugAttendees;
            commentsData = slugComments;
          }
        }



        // Convert RSVP data to guest format
        const guestData = attendees.map((rsvp: any, index: number) => {
          let status: 'going' | 'maybe' | 'not-going';
          if (rsvp.attending === 'yes') {
            status = 'going';
          } else if (rsvp.attending === 'maybe') {
            status = 'maybe';
          } else {
            status = 'not-going';
          }

          return {
            id: rsvp.id || `${rsvp.guest_id}-${index}`,
            name: rsvp.guest?.name || 'Unknown Guest',
            initials: rsvp.guest?.initials || '??',
            avatarColor: rsvp.guest?.avatar_color || COLORS.text.subtle,
            avatarStyle: rsvp.guest?.avatar_style,
            avatarSeed: rsvp.guest?.avatar_seed,
            avatarSvg: rsvp.guest?.avatar_svg,
            status,
            guestCount: rsvp.guest_count || 1,
            timestamp: rsvp.created_at,
          };
        });

        // Convert to activity format
        const activityData = attendees.map((rsvp: any) => {
          let action: string;
          if (rsvp.attending === 'yes') {
            action = 'RSVP\'d Going';
          } else if (rsvp.attending === 'maybe') {
            action = 'RSVP\'d Maybe';
          } else {
            action = 'RSVP\'d Not Going';
          }

          return {
            id: rsvp.id,
            guestName: rsvp.guest?.name || 'Unknown Guest',
            action,
            timestamp: formatTimeAgo(rsvp.created_at),
            rawTimestamp: rsvp.created_at,
            initials: rsvp.guest?.initials || '??',
            avatarColor: rsvp.guest?.avatar_color || COLORS.text.subtle,
          };
        });

        // Sort activities by most recent first
        activityData.sort((a: any, b: any) => new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime());

        setGuests(guestData);
        setActivities(activityData.slice(0, 10));

        setComments(commentsData.map(c => ({
          ...c,
          guest_id: c.guest_id || '',
        })) as Comment[]);


      } catch (error) {
        console.error('GuestList: Error fetching data:', error);
      } finally {

        setLoading(false);
        setIsFetching(false);
        isFetchingRef.current = false;
      }
    };

    // Initial data fetch
    setLoading(true);
    doFetch();

    // Setup realtime listeners
    let rsvpChannel: any = null;
    let commentsChannel: any = null;

    if (!isSubscribedRef.current) {
      // Realtime-triggered re-fetches use throttling
      const realtimeFetch = () => {
        const now = Date.now();
        if (now - lastFetchTimeRef.current < 2000) {
          console.log('GuestList: Throttling realtime re-fetch');
          return;
        }
        doFetch();
      };

      rsvpChannel = supabase
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
            realtimeFetch();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {

            isSubscribedRef.current = true;
          } else if (status === 'CHANNEL_ERROR') {
            console.error('GuestList: Failed to subscribe to RSVP updates');
            isSubscribedRef.current = false;
          }
        });

      commentsChannel = supabase
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

            realtimeFetch();
          }
        )
        .subscribe();
    }

    return () => {
      // Reset refs so next mount can fetch and subscribe
      isFetchingRef.current = false;
      isSubscribedRef.current = false;
      try {
        if (rsvpChannel) supabase.removeChannel(rsvpChannel);
        if (commentsChannel) supabase.removeChannel(commentsChannel);
      } catch (error) {
        console.error('Error removing GuestList channels:', error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId]);


  useEffect(() => {
    filterGuests();
  }, [filterGuests]);


  // const handleBoop = (guestId: string) => {
  //   console.log(`Booped guest ${guestId}! 💕`);
  // };

  const userAlreadyCommented = user?.guestId
    ? comments.some((c) => c.guest_id === user.guestId)
    : false;

  const handleAddComment = async () => {
    if ((!newComment.trim() && !selectedGif) || !user) return;

    const guestId = user.guestId;
    if (!guestId) {
      console.error('Cannot post comment: user has no guestId for this wedding');
      return;
    }

    // Prevent duplicate: if this guest already has a comment, don't add another
    if (userAlreadyCommented) {
      return;
    }

    try {
      const savedComment = await addComment(
        weddingId,
        guestId,
        newComment,
        selectedGif ? {
          gif_id: selectedGif.id,
          gif_url: selectedGif.url,
          gif_title: selectedGif.title,
          gif_preview_url: selectedGif.preview_url,
        } : undefined
      );

      setComments(prev => [savedComment, ...prev]);
      setNewComment('');
      setSelectedGif(null);
    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  const handleGifSelect = (gif: GifData) => {
    setSelectedGif(gif);
    setShowGifPicker(false);
  };

  const handleRemoveGif = () => {
    setSelectedGif(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      console.error('No user found for delete operation');
      return;
    }

    const guestId = user.guestId || user.id;
    console.log('Attempting to delete comment:', commentId, 'by guestId:', guestId);

    try {
      // Delete from database
      const result = await deleteComment(commentId, guestId);
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
          backgroundColor: COLORS.bg.white,
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="body1" sx={{
          fontSize: '16px',
          lineHeight: '1.5em',
          color: COLORS.text.subtle
        }}>
          Loading comments...
        </Typography>
      </Paper>
    );
  }

  const renderActivityTab = () => (
    <Stack spacing={3}> {/* 24px gap */}
      {/* Comment Input — hidden if admin removed comment step or user already posted */}
      {user && !hideCommentInput && !userAlreadyCommented && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 42,
              height: 42,
              backgroundColor: user.avatar_color || themeColor,
              color: COLORS.text.inverse,
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
              <Box sx={{ width: '100%', height: '100%' }} />
            )}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Paper
              sx={{
                backgroundColor: COLORS.bg.white,
                border: '1px solid #BCBCBC',
                borderRadius: RADII.sm, // 8px
                py: '8px',
                px: '12px',
                minHeight: '50px', // Match avatar height
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  borderColor: COLORS.text.faint,
                },
                '&:focus-within': {
                  borderColor: themeColor,
                  boxShadow: '0 0 0 2px rgba(222, 63, 94, 0.1)',
                },
              }}
            >
              <Box sx={{ position: 'relative', width: '100%' }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={selectedGif ? 2 : 1}
                  maxRows={selectedGif ? 5 : 4}
                  placeholder="Leave a comment!"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  variant="standard"
                  sx={{ pb: '4px' }}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      fontSize: '16px',
                      color: '#141414',
                      paddingBottom: selectedGif ? '160px' : '0px',
                      '& textarea::placeholder': {
                        color: COLORS.text.faint,
                        opacity: 1,
                      },
                    },
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />

                {/* Buttons positioned at top right */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  {/* GIF Button */}
                  {!selectedGif && (
                    <IconButton
                      onClick={() => setShowGifPicker(true)}
                      sx={{
                        width: 32,
                        height: 32,
                        border: '1px solid #000',
                        borderRadius: '6px',
                        color: COLORS.text.strong,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                      size="small"
                    >
                      <GifIcon fontSize="small" sx={{ width: '130%', height: '130%' }} />
                    </IconButton>
                  )}

                  {/* Send Button - only show when there's content */}
                  {(newComment.trim() || selectedGif) && (
                    <IconButton
                      onClick={handleAddComment}
                      sx={{
                        width: 32,
                        height: 32,
                        color: themeColor,
                        backgroundColor: 'rgba(222, 63, 94, 0.1)',
                        borderRadius: '6px',
                        '&:hover': {
                          backgroundColor: 'rgba(222, 63, 94, 0.2)',
                        },
                      }}
                      size="small"
                    >
                      <SendOutlined fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {/* Selected GIF Display inside input */}
                {selectedGif && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 0,
                      right: 0,
                      px: 0,
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        borderRadius: RADII.md,
                        overflow: 'hidden',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                        },
                      }}
                      onClick={() => setShowGifPicker(true)}
                    >
                      <Image
                        src={selectedGif.preview_url}
                        alt={selectedGif.title}
                        width={160}
                        height={140}
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: '140px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        unoptimized // For external GIF URLs
                      />
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGif();
                        }}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          color: COLORS.text.inverse,
                          width: 24,
                          height: 24,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          },
                        }}
                        size="small"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Comments List */}
      <Stack spacing={0}>
        {comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" sx={{
              color: COLORS.text.subtle,
              fontSize: '16px',
              lineHeight: '1.5em',
              mb: 1
            }}>
              No comments yet! 💬
            </Typography>
            <Typography variant="body2" sx={{
              color: COLORS.text.faint,
              fontSize: '14px',
              lineHeight: '1.5em'
            }}>
              Share your excitement about the wedding
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{
              maxHeight: 'none',
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s ease-in-out'
            }}>
              {comments.slice(0, compact ? visibleCommentsCount : undefined).map((comment, index) => (
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
                          color: COLORS.text.inverse,
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
                          <Box sx={{ width: '100%', height: '100%' }} />
                        )}
                      </Avatar>

                      <Box sx={{ flex: 1, ml: 1 }}>
                        {/* Comment Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontSize: '16px',
                              lineHeight: '1.5em',
                              color: '#141414',
                            }}
                          >
                            {comment.guest?.name || 'Unknown Guest'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '14px',
                              lineHeight: '1.5em',
                              color: COLORS.text.subtle,
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
                                  color: COLORS.text.subtle,
                                  opacity: 0.7,
                                  '&:hover': {
                                    color: themeColor,
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
                            variant="body1"
                            sx={{
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
                              borderRadius: RADII.lg,
                              overflow: 'hidden',
                              maxWidth: '280px',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              mb: 1,
                            }}
                          >
                            <Image
                              src={comment.gif_preview_url || comment.gif_url}
                              alt={comment.gif_title || 'GIF'}
                              width={160}
                              height={120}
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                              }}
                              unoptimized // For external GIF URLs
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              ))}

              {compact && visibleCommentsCount < comments.length && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 100,
                    background: 'linear-gradient(to bottom, transparent, white)',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />
              )}
            </Box>

            {compact && comments.length > initialMaxComments && (
              <Box sx={{ mt: 1, borderTop: visibleCommentsCount > initialMaxComments ? '1px solid #ECECEC' : 'none', pt: visibleCommentsCount > initialMaxComments ? 2 : 0, width: '100%', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {visibleCommentsCount < comments.length ? (
                  <Button
                    onClick={() => setVisibleCommentsCount(prev => Math.min(prev + 2, comments.length))}
                    fullWidth
                    sx={{
                      color: COLORS.text.subtle,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      py: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    View More Activity
                    <KeyboardArrowDown sx={{ ml: 0.5 }} />
                  </Button>
                ) : null}

                {visibleCommentsCount > initialMaxComments && (
                  <Button
                    onClick={() => setVisibleCommentsCount(initialMaxComments)}
                    fullWidth
                    sx={{
                      color: COLORS.text.subtle,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      py: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    Collapse
                    <KeyboardArrowDown sx={{ ml: 0.5, transform: 'rotate(180deg)' }} />
                  </Button>
                )}
              </Box>
            )}
          </>
        )}
      </Stack>
    </Stack>
  );

  const renderGuestTab = () => (
    <Stack spacing={0}>
      {filteredGuests.length === 0 ? (
        <Typography variant="body1" sx={{
          fontSize: '16px',
          lineHeight: '1.5em',
          color: COLORS.text.subtle,
          textAlign: 'center',
          py: 4
        }}>
          {searchQuery ? 'No guests found matching your search.' : 'No guests in this category yet.'}
        </Typography>
      ) : (
        <>
          {filteredGuests.slice(0, visibleRSVPCount).map((guest, index) => (
            <motion.div
              key={guest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderBottom: '1px solid #ECECEC',
                '&:last-child': { borderBottom: 'none' }
              }}>
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    backgroundColor: guest.avatarColor || '#F0F0F0',
                    color: COLORS.text.inverse,
                    fontWeight: 600,
                    fontSize: '16px',
                  }}
                >
                  {guest.avatarSvg ? (
                    <Box
                      dangerouslySetInnerHTML={{ __html: guest.avatarSvg }}
                      sx={{
                        width: '100%',
                        height: '100%',
                        '& svg': { width: '100%', height: '100%' }
                      }}
                    />
                  ) : (
                    guest.initials
                  )}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{
                    fontSize: '16px',
                    lineHeight: '1.5em',
                    color: '#141414'
                  }}>
                    {guest.name}
                  </Typography>
                  {guest.guestCount > 1 && (
                    <Typography variant="caption" sx={{
                      fontSize: '14px',
                      lineHeight: '1.5em',
                      color: COLORS.text.subtle
                    }}>
                      +{guest.guestCount - 1} guest{guest.guestCount > 2 ? 's' : ''}
                    </Typography>
                  )}
                </Box>
              </Box>
            </motion.div>
          ))}

          {filteredGuests.length > 10 && (
            <Box sx={{ p: 1, borderTop: '1px solid #ECECEC', width: '100%', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {visibleRSVPCount < filteredGuests.length ? (
                <Button
                  onClick={() => setVisibleRSVPCount(prev => Math.min(prev + 5, filteredGuests.length))}
                  fullWidth
                  sx={{
                    color: COLORS.text.subtle,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    py: 1,
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  View More Guests
                  <KeyboardArrowDown sx={{ ml: 0.5 }} />
                </Button>
              ) : null}

              {visibleRSVPCount > 10 && (
                <Button
                  onClick={() => setVisibleRSVPCount(10)}
                  fullWidth
                  sx={{
                    color: COLORS.text.subtle,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    py: 1,
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  Collapse
                  <KeyboardArrowDown sx={{ ml: 0.5, transform: 'rotate(180deg)' }} />
                </Button>
              )}
            </Box>
          )}
        </>
      )}
    </Stack>
  );



  return (
    <Paper
      sx={{
        backgroundColor: COLORS.bg.white,
        borderRadius: 1, // 16px
        overflow: 'hidden',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #EBEBEB' }}>
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
                borderBottom: index === activeTab ? '2px solid #DE3F5E' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: index === activeTab ? 600 : 400,
                  fontSize: '16px',
                  lineHeight: '1.26em',
                  textAlign: 'center',
                  color: index === activeTab ? themeColor : COLORS.text.strong,
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
                    backgroundColor: themeColor,
                    color: COLORS.text.inverse,
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
                    color: COLORS.text.strong,
                    height: 24,
                    minWidth: 24,
                    '& .MuiChip-label': {
                      px: 0.75,
                      fontSize: '12px',
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
                    color: COLORS.text.strong,
                    height: 24,
                    minWidth: 24,
                    '& .MuiChip-label': {
                      px: 0.75,
                      fontSize: '12px',
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

      {/* Search Bar - Only show on going and maybe tabs */}
      {(activeTab === 1 || activeTab === 2) && (
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: COLORS.bg.white,
              border: '1px solid #BCBCBC',
              borderRadius: RADII.sm,
              px: 2,
              py: '8px',
              gap: 1.5,
              minHeight: '50px',
              '&:focus-within': {
                borderColor: themeColor,
                boxShadow: '0 0 0 2px rgba(222, 63, 94, 0.1)',
              },
            }}
          >
            <Search sx={{ color: COLORS.text.faint, fontSize: '20px' }} />
            <input
              type="text"
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '16px',
                color: '#141414',
              }}
            />
            {searchQuery && (
              <IconButton
                size="small"
                onClick={() => setSearchQuery('')}
                sx={{ color: COLORS.text.subtle, p: 0.5 }}
              >
                <Close sx={{ fontSize: '18px' }} />
              </IconButton>
            )}
          </Box>
        </Box>
      )}

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

      {/* GIF Picker Modal */}
      <GifPicker
        open={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={handleGifSelect}
      />
    </Paper>
  );
} 