'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Stack, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { useParams } from 'next/navigation';
import CommunicationTimeline from '@/components/admin/communication/CommunicationTimeline';
import ConversationThread from '@/components/admin/communication/ConversationThread';
import { OutreachEvent } from '@/lib/types/outreach';

export default function CommunicationPage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;
  const [events, setEvents] = useState<OutreachEvent[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [guestEvents, setGuestEvents] = useState<OutreachEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`/api/outreach/events?weddingId=${weddingSlug}&limit=100`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [weddingSlug]);

  const handleGuestClick = async (guestId: string) => {
    setSelectedGuestId(guestId);
    try {
      const res = await fetch(`/api/outreach/events?weddingId=${weddingSlug}&guestId=${guestId}`);
      const data = await res.json();
      setGuestEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch guest events:', err);
    }
  };

  const handleExport = () => {
    const csv = ['Timestamp,Event Type,Template,Channel,Details']
      .concat(
        events.map((e) =>
          `${new Date(e.created_at).toISOString()},${e.event_type},${e.template_name || ''},${e.channel},${JSON.stringify(e.details || {})}`
        )
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${weddingSlug}-communication-log.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = search
    ? events.filter(
        (e) =>
          e.event_type.includes(search.toLowerCase()) ||
          e.template_name?.toLowerCase().includes(search.toLowerCase())
      )
    : events;

  return (
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
          Communication Log
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            borderColor: '#DE3F5E',
            color: '#DE3F5E',
          }}
        >
          Export CSV
        </Button>
      </Stack>

      <TextField
        placeholder="Search by event type or template..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        size="small"
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            bgcolor: 'white',
            borderRadius: '12px',
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Timeline */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.07)',
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'auto',
          }}
        >
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>Loading...</Typography>
            </Box>
          ) : (
            <CommunicationTimeline events={filteredEvents} onGuestClick={handleGuestClick} />
          )}
        </Paper>

        {/* Conversation Thread */}
        {selectedGuestId && (
          <Box sx={{ width: 400 }}>
            <ConversationThread guestName={`Guest ${selectedGuestId.slice(0, 8)}`} events={guestEvents} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
