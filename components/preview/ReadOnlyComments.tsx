'use client';

import { Box, Typography, Paper, Stack, Avatar, Chip, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, memo } from 'react';
import { COLORS, RADII } from '@/lib/theme/tokens';

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to generate avatar color
const getAvatarColor = (name: string, index: number): string => {
  const colors = [
    '#E91E63', COLORS.accent.info, COLORS.accent.warning, COLORS.accent.success, COLORS.side.both,
    '#00BCD4', '#FF5722', '#607D8B', '#795548', '#3F51B5',
    '#F44336', '#009688', '#FFC107', '#E91E63', '#673AB7',
  ];
  return colors[index % colors.length];
};

// Mock comment data
const mockComments = [
  {
    id: 'mock-1',
    guest: {
      name: 'Priya Sharma',
      initials: 'PS',
      avatar_color: '#E91E63',
    },
    message: "Can't wait to celebrate this special day with you both! So excited! 💃✨",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'mock-2',
    guest: {
      name: 'Rahul Patel',
      initials: 'RP',
      avatar_color: COLORS.accent.info,
    },
    message: "So excited to celebrate with you both! Can't wait for the festivities! 🎉",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    id: 'mock-3',
    guest: {
      name: 'Anjali Desai',
      initials: 'AD',
      avatar_color: COLORS.accent.warning,
    },
    message: 'This is going to be the wedding of the year! Already planning my outfit 💃',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
  },
];

// Mock guest data with mixed Indian/Punjabi/American names
const mockGoingGuests = [
  'Arjun Singh', 'Sarah Johnson', 'Kiran Kaur', 'Michael Chen', 'Meera Patel',
  'Emily Williams', 'Harpreet Singh', 'David Brown', 'Riya Shah', 'James Anderson',
  'Simran Kaur', 'Jessica Martinez', 'Aman Sharma', 'Jennifer Lee', 'Rajesh Kumar',
  'Christopher Davis', 'Pooja Mehta', 'Matthew Wilson', 'Harmeet Kaur', 'Ryan Taylor',
  'Neha Gupta', 'Ashley Johnson', 'Vikram Malhotra', 'Amanda White', 'Sandeep Singh',
  'Daniel Garcia', 'Kavita Reddy', 'Kevin Thompson', 'Divya Nair', 'Joshua Miller',
  'Priyanka Chopra', 'Brandon Martinez', 'Ananya Iyer', 'Tyler Lewis', 'Shreya Venkat',
  'Andrew Harris', 'Radha Krishnan', 'Nicholas Young', 'Lakshmi Menon', 'Jordan King',
  'Amrita Das', 'Anthony Scott',
];

const mockMaybeGuests = [
  'Deepak Verma', 'Rachel Green', 'Manpreet Singh', 'Steven Moore', 'Kavya Nair',
  'Lauren Adams', 'Gurpreet Kaur', 'Robert Clark', 'Isha Joshi', 'Justin Walker',
];

const mockGuestCounts = {
  going: mockGoingGuests.length,
  maybe: mockMaybeGuests.length,
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

function ReadOnlyComments() {
  const tabs = ['Activity', 'Going', 'Maybe'];
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Paper
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: 1,
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
                py: 1.25,
                px: 1,
                borderBottom: activeTab === index ? '2px solid #DE3F5E' : '2px solid #EBEBEB',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(222, 63, 94, 0.05)',
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: activeTab === index ? 600 : 400,
                  fontSize: '14px',
                  lineHeight: '1.26em',
                  textAlign: 'center',
                  color: activeTab === index ? '#DE3F5E' : '#000000',
                }}
              >
                {tab}
              </Typography>

              {/* Count chips */}
              {index === 1 && (
                <Chip
                  label={mockGuestCounts.going}
                  size="small"
                  sx={{
                    backgroundColor: '#D6D6D6',
                    color: '#000000',
                    height: 20,
                    minWidth: 20,
                    '& .MuiChip-label': {
                      px: 0.75,
                      fontSize: '14px',
                      fontWeight: 600,
                    },
                  }}
                />
              )}
              {index === 2 && (
                <Chip
                  label={mockGuestCounts.maybe}
                  size="small"
                  sx={{
                    backgroundColor: '#D6D6D6',
                    color: '#000000',
                    height: 20,
                    minWidth: 20,
                    '& .MuiChip-label': {
                      px: 0.75,
                      fontSize: '14px',
                      fontWeight: 600,
                    },
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Tab Content */}
      <Box sx={{ px: 2, pb: 1.5, mt: 1.5 }}>
        <Stack spacing={3}>
          {/* Preview Notice */}
          {/* <Box
            sx={{
              backgroundColor: 'rgba(222, 63, 94, 0.05)',
              border: '1px solid rgba(222, 63, 94, 0.2)',
              borderRadius: 1,
              px: 2,
              py: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                color: COLORS.brand.primary,
                textAlign: 'center',
              }}
            >
              Preview: Showing sample {activeTab === 0 ? 'comments' : activeTab === 1 ? 'going guests' : 'maybe guests'}
            </Typography>
          </Box> */}

          {/* Activity Tab - Comments List */}
          {activeTab === 0 && (
            <Stack spacing={0}>
              {mockComments.map((comment, index) => (
                <Box key={comment.id}>
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, py: 3 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: comment.guest.avatar_color,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        }}
                      >
                        {/* @ts-ignore */}
                        {(comment.guest as any).avatar_svg ? (
                          <Box
                            dangerouslySetInnerHTML={{ __html: (comment.guest as any).avatar_svg }}
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
                            sx={{
                              fontWeight: 600,
                              fontSize: '14px',
                              lineHeight: '1.5em',
                              color: '#141414',
                            }}
                          >
                            {comment.guest.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: '14px',
                              lineHeight: '1.5em',
                              color: '#858585',
                            }}
                          >
                            {formatTimeAgo(comment.created_at)}
                          </Typography>
                        </Box>

                        {/* Comment Content */}
                        {comment.message && (
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: '14px',
                              lineHeight: '1.5em',
                              color: '#141414',
                              mb: (comment as any).gif_url ? 1 : 1,
                            }}
                          >
                            {comment.message}
                          </Typography>
                        )}

                        {/* Comment GIF */}
                        {(comment as any).gif_url && (
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
                              src={(comment as any).gif_preview_url || (comment as any).gif_url}
                              alt={(comment as any).gif_title || 'GIF'}
                              width={160}
                              height={120}
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                              }}
                              unoptimized
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Divider - show for all comments except the last one */}
                    {index < mockComments.length - 1 && (
                      <Divider sx={{ borderColor: COLORS.border.light }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}

          {/* Going Tab - Guest List */}
          {activeTab === 1 && (
            <Stack spacing={0}>
              {mockGoingGuests.map((guestName, index) => (
                <Box key={`going-${index}`}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2.5 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: getAvatarColor(guestName, index),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        }}
                      >
                        <Box sx={{ width: '100%', height: '100%' }} />
                      </Avatar>

                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '1.5em',
                          color: '#141414',
                        }}
                      >
                        {guestName}
                      </Typography>
                    </Box>

                    {/* Divider - show for all guests except the last one */}
                    {index < mockGoingGuests.length - 1 && (
                      <Divider sx={{ borderColor: COLORS.border.light }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}

          {/* Maybe Tab - Guest List */}
          {activeTab === 2 && (
            <Stack spacing={0}>
              {mockMaybeGuests.map((guestName, index) => (
                <Box key={`maybe-${index}`}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2.5 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: getAvatarColor(guestName, index + mockGoingGuests.length),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        }}
                      >
                        <Box sx={{ width: '100%', height: '100%' }} />
                      </Avatar>

                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '1.5em',
                          color: '#141414',
                        }}
                      >
                        {guestName}
                      </Typography>
                    </Box>

                    {/* Divider - show for all guests except the last one */}
                    {index < mockMaybeGuests.length - 1 && (
                      <Divider sx={{ borderColor: COLORS.border.light }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>
    </Paper >
  );
}

export default memo(ReadOnlyComments);
