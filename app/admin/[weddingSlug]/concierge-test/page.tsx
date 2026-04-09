'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Send,
  RestartAlt,
  Person,
  FlightTakeoff,
  Hotel,
  VisibilityOutlined,
  Warning,
  Notes,
  Psychology,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'guest' | 'concierge';
  content: string;
  timestamp: Date;
  responseTimeMs?: number;
  provider?: string;
}

interface GuestState {
  conversation_state: string | null;
  conversation_topic: string | null;
  ai_notes: string | null;
}

interface GuestOption {
  id: string;
  name: string;
  phone: string | null;
  email: string;
}

// ─── Test Personas ──────────────────────────────────────────────────

const TEST_PERSONAS = [
  { name: 'Priya Sharma', email: 'priya.test@phera.io', phone: '+14155550101', side: 'bride' },
  { name: 'Arjun Mehta', email: 'arjun.test@phera.io', phone: '+14155550102', side: 'groom' },
  { name: 'Sarah Johnson', email: 'sarah.test@phera.io', phone: '+14155550103', side: 'bride' },
  { name: 'Ravi Patel', email: 'ravi.test@phera.io', phone: '+14155550104', side: 'groom' },
];

// ─── Preset Messages ────────────────────────────────────────────────

const PRESET_MESSAGES = [
  { label: '✈️ Flight info', message: "I'll be flying in from NYC on Jan 2nd, United flight 432" },
  { label: '🥬 Dietary', message: "We're vegetarian, is that okay?" },
  { label: '🛂 Visa pending', message: "I'm not sure if I can make it yet, my visa is still processing" },
  { label: '📞 Speak to couple', message: 'Can I speak to you guys about something personal?' },
  { label: '👗 Dress code', message: "What's the dress code for the sangeet?" },
  { label: '🏨 Hotel booked', message: 'We booked the Marriott, checking in Jan 1st' },
  { label: '✅ RSVP yes', message: "Yes we're coming! Can't wait. It'll be me and my wife, 2 people total" },
  { label: '❌ Cancel', message: "I'm so sorry but something came up and I can't make it anymore" },
  { label: '👋 Hello', message: 'Hi! Just wanted to check in about the wedding' },
  { label: '🍽️ Schedule', message: 'What events are happening and when?' },
];

// ─── Main Component ─────────────────────────────────────────────────

export default function ConciergeTestPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);

  // State
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [weddingData, setWeddingData] = useState<any>(null);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [selectedGuestName, setSelectedGuestName] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestState, setGuestState] = useState<GuestState>({ conversation_state: null, conversation_topic: null, ai_notes: null });
  const [flights, setFlights] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [visas, setVisas] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [toolLog, setToolLog] = useState<Array<{ tool: string; params: any; timestamp: Date }>>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load wedding data for the template message
  useEffect(() => {
    setWeddingId(weddingSlug);
    async function loadWedding() {
      const { data } = await supabase
        .from('weddings')
        .select('couple_name, wedding_date, wedding_date_display, venue_name, venue_location, slug')
        .eq('id', weddingSlug)
        .single();
      if (data) setWeddingData(data);
    }
    loadWedding();
  }, [weddingSlug]);

  // Select a test persona — upsert into guests table so the AI handler can find them
  async function selectPersona(persona: typeof TEST_PERSONAS[number]) {
    if (!weddingId) return;

    // Upsert: create if not exists, get ID if exists
    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('email', persona.email)
      .eq('wedding_id', weddingId)
      .single();

    let guestId: string;
    if (existing) {
      guestId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from('guests')
        .insert({
          name: persona.name,
          email: persona.email,
          phone: persona.phone,
          wedding_id: weddingId,
          wedding_side: persona.side,
          avatar_color: '#DE3F5E',
          auth_method: 'test',
        })
        .select('id')
        .single();

      if (error || !created) {
        console.error('Failed to create test guest:', error);
        return;
      }
      guestId = created.id;
    }

    setSelectedGuestId(guestId);
    setSelectedGuestName(persona.name);
    setGuestState({ conversation_state: null, conversation_topic: null, ai_notes: null });
    setFlights([]);
    setHotels([]);
    setVisas([]);
    setIssues([]);
    setToolLog([]);

    // Inject opening template message
    const coupleName = weddingData?.couple_name || 'the happy couple';
    const weddingDate = weddingData?.wedding_date_display || weddingData?.wedding_date || 'TBD';
    const venueName = weddingData?.venue_name || 'the venue';
    const city = weddingData?.venue_location || '';
    const siteUrl = `https://phera.io/${weddingSlug}`;

    const templateMsg: ChatMessage = {
      id: `template-${Date.now()}`,
      role: 'concierge',
      content: `🎉 You're invited to ${coupleName}'s wedding!\n\n📅 ${weddingDate}\n📍 ${venueName}${city ? `, ${city}` : ''}\n\nWe'd love for you to join us! Please let us know if you can make it.\n\n👉 RSVP here: ${siteUrl}\n\nOr just reply to this message and I can help you RSVP right now!\n\n— Phera, your wedding concierge`,
      timestamp: new Date(),
    };
    setMessages([templateMsg]);
  }

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  async function handleSend(messageText?: string) {
    const text = messageText || inputValue.trim();
    if (!text || !selectedGuestId || !weddingId) return;

    setInputValue('');
    const guestMsg: ChatMessage = {
      id: `guest-${Date.now()}`,
      role: 'guest',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, guestMsg]);
    setLoading(true);

    try {
      const startTime = performance.now();

      const res = await fetch('/api/concierge-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId,
          weddingSlug,
          guestId: selectedGuestId,
          guestName: selectedGuestName,
          message: text,
        }),
      });

      const elapsed = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (data.error) {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'concierge',
          content: `⚠️ Error: ${data.error}`,
          timestamp: new Date(),
          responseTimeMs: elapsed,
        };
        setMessages((prev) => [...prev, errMsg]);
      } else {
        const conciergeMsg: ChatMessage = {
          id: `concierge-${Date.now()}`,
          role: 'concierge',
          content: data.response,
          timestamp: new Date(),
          responseTimeMs: elapsed,
          provider: data.provider,
        };
        setMessages((prev) => [...prev, conciergeMsg]);

        // Update sidebar state
        if (data.guestState) setGuestState(data.guestState);
        if (data.flights) setFlights(data.flights);
        if (data.hotels) setHotels(data.hotels);
        if (data.visas) setVisas(data.visas);
        if (data.issues) setIssues(data.issues);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'concierge',
        content: `⚠️ Network error: ${err.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // Reset guest
  async function handleReset() {
    if (!selectedGuestId || !weddingId) return;
    const confirmed = window.confirm(`Reset all concierge data for ${selectedGuestName}? This clears notes, issues, flights, hotels, visas, and conversation history.`);
    if (!confirmed) return;

    await fetch('/api/concierge-test', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: selectedGuestId, weddingId }),
    });

    setMessages([]);
    setGuestState({ conversation_state: null, conversation_topic: null, ai_notes: null });
    setFlights([]);
    setHotels([]);
    setVisas([]);
    setIssues([]);
    setToolLog([]);
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', gap: 0, overflow: 'hidden' }}>
      {/* ─── Left: Chat Panel ────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 0,
            bgcolor: 'white',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Psychology sx={{ color: '#DE3F5E', fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 16 }}>
                Concierge Test Harness
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#9a9a9a' }}>
                Simulates WhatsApp conversations through the full AI pipeline
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.5}>
              {TEST_PERSONAS.map((persona) => (
                <Chip
                  key={persona.email}
                  icon={<Person sx={{ fontSize: 14 }} />}
                  label={persona.name.split(' ')[0]}
                  size="small"
                  onClick={() => selectPersona(persona)}
                  sx={{
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: selectedGuestName === persona.name ? 600 : 400,
                    bgcolor: selectedGuestName === persona.name ? '#DE3F5E' : 'white',
                    color: selectedGuestName === persona.name ? 'white' : '#4a4a4a',
                    border: selectedGuestName === persona.name ? 'none' : '1px solid rgba(0,0,0,0.15)',
                    '& .MuiChip-icon': {
                      color: selectedGuestName === persona.name ? 'white' : '#9a9a9a',
                    },
                    '&:hover': {
                      bgcolor: selectedGuestName === persona.name ? '#c4354f' : '#f5f5f5',
                    },
                  }}
                />
              ))}
            </Stack>

            <Tooltip title="Reset guest data">
              <span>
                <IconButton
                  onClick={handleReset}
                  disabled={!selectedGuestId}
                  sx={{ color: '#DE3F5E' }}
                >
                  <RestartAlt />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Paper>

        {/* Preset message buttons */}
        {selectedGuestId && (
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: '#FAFAFA',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
            }}
          >
            {PRESET_MESSAGES.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                size="small"
                onClick={() => handleSend(preset.message)}
                disabled={loading}
                sx={{
                  fontSize: 11,
                  height: 26,
                  cursor: 'pointer',
                  color: '#4a4a4a',
                  bgcolor: 'white',
                  border: '1px solid rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#f0f0f0' },
                }}
              />
            ))}
          </Box>
        )}

        {/* Chat messages */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 2,
            py: 2,
            bgcolor: '#F5F5F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {!selectedGuestId && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography sx={{ color: '#9a9a9a', fontSize: 14 }}>
                Select a guest above to start testing
              </Typography>
            </Box>
          )}

          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'guest' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  maxWidth: '75%',
                  px: 1.5,
                  py: 1,
                  borderRadius: msg.role === 'guest' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  bgcolor: msg.role === 'guest' ? '#DCF8C6' : 'white',
                  border: msg.role === 'concierge' ? '1px solid rgba(0,0,0,0.07)' : 'none',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: '#1a1a1a',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.content}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10,
                    color: '#9a9a9a',
                    mt: 0.5,
                    textAlign: msg.role === 'guest' ? 'right' : 'left',
                  }}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.responseTimeMs != null && (
                    <Typography component="span" sx={{ ml: 1, fontSize: 9, color: msg.responseTimeMs > 5000 ? '#ef4444' : msg.responseTimeMs > 2000 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                      {msg.responseTimeMs > 1000 ? `${(msg.responseTimeMs / 1000).toFixed(1)}s` : `${msg.responseTimeMs}ms`}
                    </Typography>
                  )}
                  {msg.provider && (
                    <Typography component="span" sx={{ ml: 0.5, fontSize: 9, color: '#9a9a9a' }}>
                      via {msg.provider}
                    </Typography>
                  )}
                </Typography>
              </Paper>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
              <CircularProgress size={16} sx={{ color: '#DE3F5E' }} />
              <Typography sx={{ fontSize: 12, color: '#9a9a9a' }}>Concierge is thinking...</Typography>
            </Box>
          )}

          <div ref={chatEndRef} />
        </Box>

        {/* Input */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderTop: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 0,
            bgcolor: 'white',
          }}
        >
          <Stack direction="row" spacing={1}>
            <TextField
              inputRef={inputRef}
              fullWidth
              size="small"
              placeholder={selectedGuestId ? 'Type a message as the guest...' : 'Select a guest first'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!selectedGuestId || loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '12px',
                  fontSize: 13,
                  color: '#1a1a1a',
                },
                '& .MuiOutlinedInput-input::placeholder': {
                  color: '#9a9a9a',
                  opacity: 1,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || !selectedGuestId || loading}
              sx={{
                minWidth: 44,
                bgcolor: '#DE3F5E',
                borderRadius: '12px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#c4354f' },
              }}
            >
              <Send sx={{ fontSize: 18 }} />
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* ─── Right: State Sidebar ────────────────────────────── */}
      <Box
        sx={{
          width: 340,
          flexShrink: 0,
          borderLeft: '1px solid rgba(0,0,0,0.07)',
          overflow: 'auto',
          bgcolor: 'white',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', mb: 2 }}>
            Live Guest State
          </Typography>

          {/* Performance Stats */}
          {(() => {
            const responseTimes = messages.filter((m) => m.role === 'concierge' && m.responseTimeMs != null).map((m) => m.responseTimeMs!);
            if (responseTimes.length === 0) return null;
            const avg = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
            const min = Math.min(...responseTimes);
            const max = Math.max(...responseTimes);
            const lastMsg = [...messages].reverse().find((m) => m.role === 'concierge' && m.provider);
            return (
              <SidebarSection icon={<Typography sx={{ fontSize: 14 }}>&#9889;</Typography>} title="Performance">
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                  <Typography sx={{ fontSize: 11, color: '#6a6a6a' }}>Avg response</Typography>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: avg > 5000 ? '#ef4444' : avg > 2000 ? '#f59e0b' : '#22c55e' }}>
                    {avg > 1000 ? `${(avg / 1000).toFixed(1)}s` : `${avg}ms`}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                  <Typography sx={{ fontSize: 11, color: '#6a6a6a' }}>Min / Max</Typography>
                  <Typography sx={{ fontSize: 11, color: '#4a4a4a' }}>
                    {min > 1000 ? `${(min / 1000).toFixed(1)}s` : `${min}ms`} / {max > 1000 ? `${(max / 1000).toFixed(1)}s` : `${max}ms`}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                  <Typography sx={{ fontSize: 11, color: '#6a6a6a' }}>Responses</Typography>
                  <Typography sx={{ fontSize: 11, color: '#4a4a4a' }}>{responseTimes.length}</Typography>
                </Stack>
                {lastMsg?.provider && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 11, color: '#6a6a6a' }}>Provider</Typography>
                    <Chip label={lastMsg.provider} size="small" sx={{ height: 18, fontSize: 9, bgcolor: '#F0F0FF', color: '#4a4a4a' }} />
                  </Stack>
                )}
              </SidebarSection>
            );
          })()}

          {/* Conversation State */}
          <SidebarSection icon={<Psychology sx={{ fontSize: 16 }} />} title="Conversation">
            <StateRow label="State" value={guestState.conversation_state} />
            <StateRow label="Topic" value={guestState.conversation_topic} />
          </SidebarSection>

          {/* AI Notes */}
          <SidebarSection icon={<Notes sx={{ fontSize: 16 }} />} title="AI Notes">
            {guestState.ai_notes ? (
              <Typography
                sx={{
                  fontSize: 11,
                  color: '#4a4a4a',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  bgcolor: '#FAFAFA',
                  p: 1,
                  borderRadius: 1,
                  lineHeight: 1.6,
                }}
              >
                {guestState.ai_notes}
              </Typography>
            ) : (
              <EmptyState text="No notes yet" />
            )}
          </SidebarSection>

          {/* Flights */}
          <SidebarSection icon={<FlightTakeoff sx={{ fontSize: 16 }} />} title={`Flights (${flights.length})`}>
            {flights.length > 0 ? (
              flights.map((f: any, i: number) => (
                <Box key={i} sx={{ fontSize: 11, color: '#4a4a4a', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a' }}>
                    {f.airline || 'Airline TBD'} {f.flight_number || ''}
                  </Typography>
                  {f.departure_airport && f.arrival_airport && (
                    <Typography sx={{ fontSize: 11, color: '#4a4a4a' }}>{f.departure_airport} → {f.arrival_airport}</Typography>
                  )}
                  {f.arrival_datetime && (
                    <Typography sx={{ fontSize: 11, color: '#4a4a4a' }}>Arrives: {new Date(f.arrival_datetime).toLocaleDateString()}</Typography>
                  )}
                </Box>
              ))
            ) : (
              <EmptyState text="No flights" />
            )}
          </SidebarSection>

          {/* Hotels */}
          <SidebarSection icon={<Hotel sx={{ fontSize: 16 }} />} title={`Hotels (${hotels.length})`}>
            {hotels.length > 0 ? (
              hotels.map((h: any, i: number) => (
                <Box key={i} sx={{ fontSize: 11, color: '#4a4a4a', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a' }}>
                    {h.hotel_name || 'Hotel TBD'} ({h.status || '?'})
                  </Typography>
                  {h.check_in && <Typography sx={{ fontSize: 11, color: '#4a4a4a' }}>Check-in: {h.check_in}</Typography>}
                  {h.check_out && <Typography sx={{ fontSize: 11, color: '#4a4a4a' }}>Check-out: {h.check_out}</Typography>}
                  {h.confirmation_number && <Typography sx={{ fontSize: 11, color: '#4a4a4a' }}>Conf#: {h.confirmation_number}</Typography>}
                </Box>
              ))
            ) : (
              <EmptyState text="No hotels" />
            )}
          </SidebarSection>

          {/* Visas */}
          <SidebarSection icon={<VisibilityOutlined sx={{ fontSize: 16 }} />} title={`Visas (${visas.length})`}>
            {visas.length > 0 ? (
              visas.map((v: any, i: number) => (
                <Box key={i} sx={{ fontSize: 11, color: '#4a4a4a' }}>
                  <Typography sx={{ fontSize: 11, color: '#4a4a4a' }}>
                    {v.visa_type || 'Visa'}: <strong>{v.status || '?'}</strong>
                  </Typography>
                </Box>
              ))
            ) : (
              <EmptyState text="No visas" />
            )}
          </SidebarSection>

          {/* Coordination Issues */}
          <SidebarSection icon={<Warning sx={{ fontSize: 16 }} />} title={`Issues (${issues.length})`}>
            {issues.length > 0 ? (
              issues.map((issue: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    p: 1,
                    mb: 0.5,
                    borderRadius: 1,
                    bgcolor: issue.priority === 'urgent' ? '#FFF3F3' : issue.priority === 'high' ? '#FFF8E1' : '#FAFAFA',
                    border: `1px solid ${issue.priority === 'urgent' ? '#FFCDD2' : issue.priority === 'high' ? '#FFE082' : 'rgba(0,0,0,0.07)'}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Chip
                      label={issue.priority}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 9,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        bgcolor: issue.priority === 'urgent' ? '#EF5350' : issue.priority === 'high' ? '#FF9800' : issue.priority === 'medium' ? '#2196F3' : '#9E9E9E',
                        color: 'white',
                      }}
                    />
                    <Chip
                      label={issue.category}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: 9, color: '#4a4a4a', borderColor: 'rgba(0,0,0,0.2)' }}
                    />
                  </Stack>
                  <Typography sx={{ fontSize: 11, fontWeight: 500, mt: 0.5, color: '#1a1a1a' }}>
                    {issue.title}
                  </Typography>
                  {issue.description && (
                    <Typography sx={{ fontSize: 10, color: '#6a6a6a', mt: 0.3 }}>
                      {issue.description}
                    </Typography>
                  )}
                </Box>
              ))
            ) : (
              <EmptyState text="No issues" />
            )}
          </SidebarSection>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function SidebarSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
        <Box sx={{ color: '#DE3F5E' }}>{icon}</Box>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{title}</Typography>
      </Stack>
      {children}
      <Divider sx={{ mt: 1.5 }} />
    </Box>
  );
}

function StateRow({ label, value }: { label: string; value: string | null }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
      <Typography sx={{ fontSize: 11, color: '#6a6a6a' }}>{label}</Typography>
      <Chip
        label={value || '—'}
        size="small"
        sx={{
          height: 20,
          fontSize: 10,
          bgcolor: value ? '#E8F5E9' : '#F5F5F5',
          color: value ? '#2E7D32' : '#9a9a9a',
          fontWeight: 500,
        }}
      />
    </Stack>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Typography sx={{ fontSize: 11, color: '#9a9a9a', fontStyle: 'italic' }}>{text}</Typography>
  );
}
