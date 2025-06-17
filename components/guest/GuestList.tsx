'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  SearchOutlined,
  FavoriteOutlined,
  ChatBubbleOutlineRounded,
} from '@mui/icons-material';
import { getAttendees } from '@/lib/supabase/rsvp-service';

interface GuestItem {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  status: 'going' | 'maybe' | 'not-going';
  guestCount: number;
}

interface GuestListProps {
  weddingId: string;
}

export default function GuestList({ weddingId }: GuestListProps) {
  const theme = useTheme();
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<GuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchGuests();
  }, [weddingId]);

  useEffect(() => {
    filterGuests();
  }, [guests, searchQuery, activeTab]);

  const fetchGuests = async () => {
    try {
      const attendees = await getAttendees(weddingId);
      
      // Convert RSVP data to guest format
      const guestData = attendees.map((rsvp, index) => ({
        id: rsvp.id || `${rsvp.guest_id}-${index}`, // Use RSVP ID or create unique key
        name: rsvp.guest?.name || 'Unknown Guest',
        initials: rsvp.guest?.initials || '??',
        avatarColor: rsvp.guest?.avatar_color || '#666',
        status: rsvp.attending ? 'going' : 'not-going' as 'going' | 'maybe' | 'not-going',
        guestCount: rsvp.guest_count || 1,
      }));

      setGuests(guestData);
    } catch (error) {
      console.error('Error fetching guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGuests = () => {
    let filtered = guests;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(guest =>
        guest.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status tab
    if (activeTab === 0) {
      filtered = filtered.filter(guest => guest.status === 'going');
    } else if (activeTab === 1) {
      filtered = filtered.filter(guest => guest.status === 'maybe');
    }

    setFilteredGuests(filtered);
  };

  const handleBoop = (guestId: string) => {
    // Add haptic feedback or visual feedback
    console.log(`Booped guest ${guestId}! 💕`);
  };

  const getStatusCounts = () => {
    const going = guests.filter(g => g.status === 'going').length;
    const maybe = guests.filter(g => g.status === 'maybe').length;
    return { going, maybe };
  };

  const { going, maybe } = getStatusCounts();

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
        <Typography sx={{ color: '#666', fontFamily: 'var(--font-playfair)' }}>Loading guests...</Typography>
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
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography 
          variant="h6" 
          fontWeight={600} 
          mb={2}
          sx={{ 
            fontFamily: 'var(--font-instrument-serif)', 
            color: '#800020' 
          }}
        >
          Guest List
        </Typography>

        {/* Search */}
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
      </Box>

      {/* Status Tabs */}
      <Box sx={{ px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>👍 Going</span>
                                  <Chip
                    label={`(${going})`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(128, 0, 32, 0.1)',
                      color: '#800020',
                      fontSize: '0.75rem',
                      height: 20,
                    }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>🤔 Maybe</span>
                  <Chip
                    label={`(${maybe})`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(128, 0, 32, 0.1)',
                      color: '#800020',
                      fontSize: '0.75rem',
                      height: 20,
                    }}
                  />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Guest List */}
      <Stack spacing={0} sx={{ px: 3, pb: 3, mt: 2 }}>
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
                {/* Avatar */}
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

                {/* Guest Info */}
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

                {/* Actions */}
                <Stack direction="row" spacing={1}>
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
                </Stack>
              </Box>
            </motion.div>
          ))
        )}
      </Stack>
    </Paper>
  );
} 