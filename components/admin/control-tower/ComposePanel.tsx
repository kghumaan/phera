'use client';

import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Stack,
  Autocomplete, Tabs, Tab, Collapse,
} from '@mui/material';
import { InfoAlert, SuccessAlert, ErrorAlert } from '@/components/shared/Alert';
import SendIcon from '@mui/icons-material/Send';
import CampaignIcon from '@mui/icons-material/Campaign';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface Guest {
  id: string;
  name: string;
  phone: string | null;
}

interface ComposePanelProps {
  weddingSlug: string;
  guests: Guest[];
  partner1Name?: string;
  partner2Name?: string;
  weddingDate?: string;
  venue?: string;
  provider?: 'whapi' | 'meta';
  onSent?: () => void;
}

// Template options for the dropdown
const TEMPLATE_OPTIONS = [
  { key: 'SAVE_THE_DATE', label: 'Save the Date', category: 'MARKETING', description: 'Initial announcement with wedding date and location. Best sent 6-10 months before.' },
  { key: 'RSVP_REQUEST', label: 'RSVP Request', category: 'MARKETING', description: 'Ask guests to confirm attendance with link to RSVP. Send after save-the-date.' },
  { key: 'MULTI_EVENT_INVITE', label: 'Multi-Event Invite', category: 'MARKETING', description: 'Carousel of events with RSVP link. For weddings with 3+ events.' },
  { key: 'LOGISTICS_INTRO', label: 'Logistics Introduction', category: 'MARKETING', description: 'Introduce Phera as coordination assistant. Opens line for travel/hotel questions.' },
  { key: 'NUDGE', label: 'Gentle Nudge', category: 'MARKETING', description: 'Follow-up for guests who haven\'t responded to RSVP.' },
  { key: 'TRAVEL_REQUEST', label: 'Travel Details Request', category: 'UTILITY', description: 'Ask confirmed guests to share flight/travel details for airport pickups.' },
  { key: 'RSVP_CONFIRMATION', label: 'RSVP Confirmation', category: 'UTILITY', description: 'Confirm RSVP receipt and list events they\'re attending.' },
  { key: 'SCHEDULE_REMINDER', label: 'Schedule Reminder', category: 'UTILITY', description: 'Send personalized itinerary 2 weeks before wedding.' },
  { key: 'DAY_BEFORE_SUMMARY', label: 'Day-Before Summary', category: 'UTILITY', description: 'Tomorrow\'s events summary with times and locations.' },
  { key: 'THANK_YOU', label: 'Thank You', category: 'MARKETING', description: 'Post-wedding gratitude message.' },
  { key: 'CULTURAL_GUIDE', label: 'Cultural Guide', category: 'UTILITY', description: 'For non-Indian guests: dress codes, etiquette, ceremony overview.' },
];

const TARGET_FILTERS = [
  { value: 'all', label: 'All Guests', icon: <GroupsIcon sx={{ fontSize: 16 }} /> },
  { value: 'not_contacted', label: 'Not Contacted', icon: <PersonIcon sx={{ fontSize: 16 }} /> },
  { value: 'save_the_date_sent', label: 'Save the Date Sent' },
  { value: 'rsvp_requested', label: 'RSVP Requested' },
  { value: 'rsvp_confirmed', label: 'RSVP Confirmed' },
  { value: 'unresponsive', label: 'Unresponsive' },
];

// Template preview text (English) — uses partner names as {{1}}/{{2}}
const TEMPLATE_PREVIEWS: Record<string, (p: { partner1: string; partner2: string; date: string; venue: string; url: string }) => string> = {
  SAVE_THE_DATE: (p) => `Save the date for ${p.partner1} & ${p.partner2}'s wedding celebration! ${p.date} in ${p.venue}. More details coming soon.`,
  RSVP_REQUEST: (p) => `${p.partner1} & ${p.partner2} would love for you to join their wedding celebration on ${p.date} at ${p.venue}. View details: ${p.url}`,
  MULTI_EVENT_INVITE: (p) => `Here are the events for ${p.partner1} & ${p.partner2}'s wedding celebration. Swipe through to see each event and RSVP!`,
  LOGISTICS_INTRO: (p) => `${p.partner1} & ${p.partner2} have asked us to help coordinate their wedding on ${p.date}. We'll make sure you have everything you need.`,
  NUDGE: (p) => `Just checking in! We're helping coordinate ${p.partner1} & ${p.partner2}'s wedding and want to make sure everything is sorted for you.`,
  TRAVEL_REQUEST: (p) => `As ${p.partner1} & ${p.partner2}'s wedding approaches, we'd love to help with your travel. Could you share your flight/travel details?`,
  RSVP_CONFIRMATION: (p) => `We've noted that you'll be joining ${p.partner1} & ${p.partner2}'s wedding. We'll be in touch closer to the date.`,
  SCHEDULE_REMINDER: (p) => `A reminder that ${p.partner1} & ${p.partner2}'s wedding events are on ${p.date}. Attached is your personalized itinerary.`,
  DAY_BEFORE_SUMMARY: (p) => `Tomorrow is the big day for ${p.partner1} & ${p.partner2}! Here's what's happening...`,
  THANK_YOU: (p) => `Thank you so much for celebrating with ${p.partner1} & ${p.partner2}! It meant the world to have you there.`,
  CULTURAL_GUIDE: (p) => `We've prepared a cultural guide for ${p.partner1} & ${p.partner2}'s wedding in ${p.venue}. Dress codes, etiquette, and practical tips.`,
};

export default function ComposePanel({ weddingSlug, guests, partner1Name = '', partner2Name = '', weddingDate = '', venue = '', provider = 'meta', onSent }: ComposePanelProps) {
  const isWhapi = provider === 'whapi';
  const [tab, setTab] = useState(0); // 0 = template campaign, 1 = direct message
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Template campaign state
  const [templateKey, setTemplateKey] = useState('');
  const [languageCode, setLanguageCode] = useState('en');
  const [imageUrl, setImageUrl] = useState('');
  const [targetFilter, setTargetFilter] = useState('not_contacted');
  const [selectedGuests, setSelectedGuests] = useState<Guest[]>([]);
  const [useCustomSelection, setUseCustomSelection] = useState(false);

  // Direct message state
  const [directGuest, setDirectGuest] = useState<Guest | null>(null);
  const [directMessage, setDirectMessage] = useState('');

  const eligibleGuests = useMemo(() => guests.filter((g) => g.phone), [guests]);

  const selectedTemplate = TEMPLATE_OPTIONS.find((t) => t.key === templateKey);

  const targetCount = useMemo(() => {
    if (useCustomSelection) return selectedGuests.length;
    if (targetFilter === 'all') return eligibleGuests.length;
    // We don't know exact status counts from guest list (no outreach_status in this data),
    // so show the full count for 'all' and let the API filter
    return eligibleGuests.length;
  }, [useCustomSelection, selectedGuests, targetFilter, eligibleGuests]);

  const previewText = useMemo(() => {
    if (!templateKey || !TEMPLATE_PREVIEWS[templateKey]) return '';
    return TEMPLATE_PREVIEWS[templateKey]({
      partner1: partner1Name || '{Partner 1}',
      partner2: partner2Name || '{Partner 2}',
      date: weddingDate || '{Wedding Date}',
      venue: venue || '{Venue}',
      url: `https://phera.io/${weddingSlug}`,
    });
  }, [templateKey, partner1Name, partner2Name, weddingDate, venue, weddingSlug]);

  const handleSendCampaign = async () => {
    if (!templateKey) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/control-tower/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: weddingSlug,
          mode: 'template',
          templateKey,
          languageCode,
          imageUrl: imageUrl || undefined,
          targetFilter: useCustomSelection ? undefined : targetFilter,
          targetGuestIds: useCustomSelection ? selectedGuests.map((g) => g.id) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', message: data.message });
        onSent?.();
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send' });
      }
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Network error' });
    }
    setSending(false);
  };

  const handleSendDirect = async () => {
    if (!directGuest || !directMessage.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/control-tower/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: weddingSlug,
          mode: 'direct',
          guestId: directGuest.id,
          message: directMessage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', message: data.message });
        setDirectMessage('');
        onSent?.();
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send' });
      }
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Network error' });
    }
    setSending(false);
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: RADII.md, border: '1px solid rgba(0,0,0,0.07)', bgcolor: COLORS.bg.white, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CampaignIcon sx={{ fontSize: 20, color: COLORS.brand.primary }} />
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: COLORS.text.strong }}>
            Compose & Send
          </Typography>
        </Box>

        {isWhapi && (
          <InfoAlert sx={{ mb: 1 }}>
            Sending via Whapi (personal number). Messages are free-form text, not templates. Sent gradually (~1 every 30s).
          </InfoAlert>
        )}

        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setResult(null); }}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': { textTransform: 'none', fontSize: 14, fontWeight: 600, minHeight: 36, py: 0.5, color: COLORS.text.subtle },
            '& .Mui-selected': { color: '#DE3F5E !important' },
            '& .MuiTabs-indicator': { bgcolor: COLORS.brand.primary },
          }}
        >
          <Tab label={isWhapi ? 'Message Campaign' : 'Template Campaign'} />
          <Tab label="Direct Message" />
        </Tabs>
      </Box>

      <Box sx={{ p: 2.5, pt: 2 }}>
        {/* ═══ Tab 0: Template Campaign ═══ */}
        {tab === 0 && (
          <Box>
            {/* Template selector */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel sx={{ color: COLORS.text.muted, fontWeight: 500 }}>Choose Template</InputLabel>
              <Select
                value={templateKey}
                label="Choose Template"
                onChange={(e) => { setTemplateKey(e.target.value); setResult(null); }}
                sx={{ bgcolor: COLORS.bg.white, borderRadius: RADII.sm, fontSize: 14, color: COLORS.text.strong, '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' } }}
              >
                <MenuItem value="" disabled><em>Select a template...</em></MenuItem>
                <MenuItem disabled sx={{ opacity: 1, fontWeight: 700, fontSize: 14, color: COLORS.text.subtle, py: 0.5 }}>
                  MARKETING (paid)
                </MenuItem>
                {TEMPLATE_OPTIONS.filter((t) => t.category === 'MARKETING').map((t) => (
                  <MenuItem key={t.key} value={t.key} sx={{ fontSize: 14 }}>
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{t.label}</Typography>
                      <Typography sx={{ fontSize: 14, color: COLORS.text.subtle }}>{t.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
                <MenuItem disabled sx={{ opacity: 1, fontWeight: 700, fontSize: 14, color: COLORS.text.subtle, py: 0.5, mt: 0.5 }}>
                  UTILITY (low cost)
                </MenuItem>
                {TEMPLATE_OPTIONS.filter((t) => t.category === 'UTILITY').map((t) => (
                  <MenuItem key={t.key} value={t.key} sx={{ fontSize: 14 }}>
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{t.label}</Typography>
                      <Typography sx={{ fontSize: 14, color: COLORS.text.subtle }}>{t.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Template info + preview */}
            <Collapse in={!!templateKey}>
              {selectedTemplate && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 0.75, mb: 1 }}>
                    <Chip
                      label={selectedTemplate.category}
                      size="small"
                      sx={{
                        height: 20, fontSize: 14, fontWeight: 600,
                        bgcolor: selectedTemplate.category === 'MARKETING' ? '#FFF3E0' : '#E3F2FD',
                        color: selectedTemplate.category === 'MARKETING' ? '#E65100' : '#1565C0',
                      }}
                    />
                    <Chip
                      label={selectedTemplate.category === 'MARKETING' ? '~$0.01/msg' : '~$0.002/msg'}
                      size="small"
                      sx={{ height: 20, fontSize: 14, bgcolor: COLORS.bg.subtle, color: COLORS.text.subtle }}
                    />
                  </Box>

                  {/* Preview */}
                  <Box sx={{ p: 1.5, bgcolor: '#F5F5F0', borderRadius: RADII.sm, border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography sx={{ fontSize: 14, color: COLORS.text.subtle, mb: 0.5, fontWeight: 600 }}>PREVIEW</Typography>
                    <Typography sx={{ fontSize: 14, color: COLORS.text.strong, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {previewText}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Collapse>

            {/* Language + Image URL */}
            <Collapse in={!!templateKey}>
              <Stack direction="row" spacing={1.5} sx={{ mb: 2, alignItems: 'flex-start' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: COLORS.text.muted, fontWeight: 500 }}>Language</InputLabel>
                  <Select
                    value={languageCode}
                    label="Language"
                    onChange={(e) => setLanguageCode(e.target.value)}
                    sx={{ bgcolor: COLORS.bg.white, borderRadius: RADII.sm, fontSize: 14, color: COLORS.text.strong, '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' } }}
                  >
                    <MenuItem value="en">English</MenuItem>
                    {templateKey !== 'CULTURAL_GUIDE' && <MenuItem value="hi">Hindi</MenuItem>}
                  </Select>
                </FormControl>
                {['SAVE_THE_DATE', 'RSVP_REQUEST', 'THANK_YOU'].includes(templateKey) && (
                  <TextField
                    size="small"
                    placeholder="Header image URL (public)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': { bgcolor: COLORS.bg.white, borderRadius: RADII.sm, fontSize: 14, color: COLORS.text.strong },
                      '& .MuiInputBase-input::placeholder': { fontSize: 14 },
                    }}
                  />
                )}
              </Stack>
            </Collapse>

            {/* Target audience */}
            <Collapse in={!!templateKey}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.text.strong, mb: 1 }}>Send to</Typography>

                {!useCustomSelection ? (
                  <Box>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      {TARGET_FILTERS.map((f) => (
                        <Chip
                          key={f.value}
                          label={f.label}
                          size="small"
                          onClick={() => setTargetFilter(f.value)}
                          sx={{
                            height: 26, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                            bgcolor: targetFilter === f.value ? COLORS.text.strong : COLORS.bg.subtle,
                            color: targetFilter === f.value ? COLORS.bg.white : COLORS.text.muted,
                            '&:hover': { bgcolor: targetFilter === f.value ? COLORS.text.strong : '#EEEEEE' },
                          }}
                        />
                      ))}
                    </Stack>
                    <Button
                      size="small"
                      onClick={() => setUseCustomSelection(true)}
                      sx={{ textTransform: 'none', fontSize: 14, color: COLORS.brand.primary, p: 0, minWidth: 0 }}
                    >
                      Or select specific guests...
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Autocomplete
                      multiple
                      size="small"
                      options={eligibleGuests}
                      getOptionLabel={(g) => `${g.name}${g.phone ? ` (${g.phone})` : ''}`}
                      value={selectedGuests}
                      onChange={(_, v) => setSelectedGuests(v)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search guests..."
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: COLORS.bg.white, borderRadius: RADII.sm, fontSize: 14 } }}
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((g, index) => (
                          <Chip {...getTagProps({ index })} key={g.id} label={g.name} size="small" sx={{ height: 22, fontSize: 14 }} />
                        ))
                      }
                      sx={{ mb: 1 }}
                    />
                    <Button
                      size="small"
                      onClick={() => { setUseCustomSelection(false); setSelectedGuests([]); }}
                      sx={{ textTransform: 'none', fontSize: 14, color: COLORS.text.subtle, p: 0, minWidth: 0 }}
                    >
                      Back to filter selection
                    </Button>
                  </Box>
                )}
              </Box>
            </Collapse>

            {/* Send button */}
            <Collapse in={!!templateKey}>
              <PrimaryActionButton
                startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                loading={sending}
                disabled={(!useCustomSelection && !targetFilter) || (useCustomSelection && selectedGuests.length === 0)}
                onClick={handleSendCampaign}
                fullWidth
                sx={{
                  borderRadius: RADII.sm, fontSize: 14,
                  py: 1,
                  '&.Mui-disabled': { bgcolor: COLORS.bg.subtle, color: COLORS.text.faint },
                }}
              >
                {`Send ${selectedTemplate?.label || 'Template'}${useCustomSelection ? ` to ${selectedGuests.length} guests` : ''}`}
              </PrimaryActionButton>
            </Collapse>
          </Box>
        )}

        {/* ═══ Tab 1: Direct Message ═══ */}
        {tab === 1 && (
          <Box>
            <Typography sx={{ fontSize: 14, color: COLORS.text.subtle, mb: 1.5 }}>
              Send a personal message to a specific guest. Free within 24hr service window (after they reply), otherwise uses a utility message.
            </Typography>

            {/* Guest selector */}
            <Autocomplete
              size="small"
              options={eligibleGuests}
              getOptionLabel={(g) => `${g.name}${g.phone ? ` (${g.phone})` : ''}`}
              value={directGuest}
              onChange={(_, v) => setDirectGuest(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Guest"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': { bgcolor: COLORS.bg.white, borderRadius: RADII.sm, fontSize: 14 },
                    '& .MuiInputLabel-root': { color: COLORS.text.muted, fontWeight: 500 },
                  }}
                />
              )}
            />

            {/* Message input */}
            <TextField
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="Type your message..."
              value={directMessage}
              onChange={(e) => setDirectMessage(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': { bgcolor: COLORS.bg.white, borderRadius: RADII.sm, fontSize: 14, color: COLORS.text.strong },
              }}
            />

            {/* Send button */}
            <PrimaryActionButton
              startIcon={<SendIcon sx={{ fontSize: 16 }} />}
              loading={sending}
              disabled={!directGuest || !directMessage.trim()}
              onClick={handleSendDirect}
              fullWidth
              sx={{
                borderRadius: RADII.sm, fontSize: 14,
                py: 1,
                '&.Mui-disabled': { bgcolor: COLORS.bg.subtle, color: COLORS.text.faint },
              }}
            >
              {directGuest ? `Send to ${directGuest.name}` : 'Send Message'}
            </PrimaryActionButton>
          </Box>
        )}

        {/* Result feedback */}
        {result && (
          result.type === 'success' ? (
            <SuccessAlert sx={{ mt: 2 }} onClose={() => setResult(null)}>
              {result.message}
            </SuccessAlert>
          ) : (
            <ErrorAlert sx={{ mt: 2 }} onClose={() => setResult(null)}>
              {result.message}
            </ErrorAlert>
          )
        )}
      </Box>
    </Paper>
  );
}
