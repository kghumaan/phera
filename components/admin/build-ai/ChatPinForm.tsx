'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  alpha,
  Switch,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { weddingService } from '@/lib/supabase/wedding-service';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';

interface ChatPinFormProps {
  onSave: (pin: {
    pin: string;
    name: string;
    allows_plus_one: boolean;
    skip_rsvp: boolean;
    hidden_events: string[];
  }) => void;
  onCancel?: () => void;
  weddingId: string | null;
  initialData?: any;
}

export default function ChatPinForm({ onSave, onCancel, weddingId, initialData }: ChatPinFormProps) {
  const [formData, setFormData] = useState({
    pin: initialData?.pin || '',
    name: initialData?.name || initialData?.type || '',
    allows_plus_one: initialData?.allows_plus_one || false,
    skip_rsvp: initialData?.skip_rsvp || false,
    hidden_events: initialData?.hidden_events || [] as string[],
    restrictEvents: initialData?.hidden_events?.length > 0 || false,
  });
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!weddingId) return;
    const loadEvents = async () => {
      const eventsData = await weddingService.getWeddingEvents(weddingId);
      setEvents(eventsData.map(e => ({ id: e.id, name: e.name })));
    };
    loadEvents();
  }, [weddingId]);

  const handleSave = () => {
    if (!formData.pin) return;
    const name = formData.name;
    onSave({
      pin: formData.pin,
      name,
      allows_plus_one: formData.allows_plus_one,
      skip_rsvp: formData.skip_rsvp,
      hidden_events: formData.restrictEvents ? formData.hidden_events : [],
    });
  };

  const handleEventToggle = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      hidden_events: prev.hidden_events.includes(eventId)
        ? prev.hidden_events.filter((id: string) => id !== eventId)
        : [...prev.hidden_events, eventId],
    }));
  };

  const commonFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      fontSize: '1rem',
      bgcolor: '#f5f5f5',
      fontWeight: 600,
      '& input': {
        py: 1.5,
        px: 2,
        color: '#1a1a1a !important',
        WebkitTextFillColor: '#1a1a1a !important',
      },
      '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
      '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
    },
  };

  const labelSx = {
    color: '#666',
    mb: 1,
    display: 'block',
    fontWeight: 500,
    fontSize: '0.75rem'
  };

  return (
    <Box sx={{
      bgcolor: 'white',
      p: 4,
      borderRadius: '16px',
      border: '2px solid',
      borderColor: alpha('#000', 0.12),
      width: '100%',
      maxWidth: 640,
      mt: 1,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#000000' }}>
        Add Guest PIN
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="caption" sx={labelSx}>PIN Code *</Typography>
          <TextField
            value={formData.pin}
            onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 8) })}
            fullWidth
            required
            placeholder="e.g., 1234"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            sx={commonFieldSx}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={labelSx}>Name (optional)</Typography>
          <TextField
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            placeholder="e.g., Smith Family"
            sx={commonFieldSx}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.allows_plus_one}
                onChange={(e) => setFormData({ ...formData, allows_plus_one: e.target.checked })}
                sx={{ '& .MuiSwitch-switchBase': { color: '#999' }, '& .MuiSwitch-track': { bgcolor: '#bbb' }, '& .Mui-checked': { color: '#DE3F5E' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E' } }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>Allow Plus One</Typography>
                <Tooltip title="When enabled, guests using this PIN can include plus-ones in their RSVP." arrow>
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: '#999', cursor: 'help' }} />
                </Tooltip>
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.skip_rsvp}
                onChange={(e) => setFormData({ ...formData, skip_rsvp: e.target.checked })}
                sx={{ '& .MuiSwitch-switchBase': { color: '#999' }, '& .MuiSwitch-track': { bgcolor: '#bbb' }, '& .Mui-checked': { color: '#DE3F5E' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E' } }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>Skip RSVP</Typography>
                <Tooltip title="When enabled, guests using this PIN won't need to RSVP. They'll go straight to the wedding details." arrow>
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: '#999', cursor: 'help' }} />
                </Tooltip>
              </Box>
            }
          />
        </Box>

        {events.length > 0 && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.restrictEvents}
                  onChange={(e) => setFormData({ ...formData, restrictEvents: e.target.checked, hidden_events: e.target.checked ? formData.hidden_events : [] })}
                  sx={{ '& .MuiSwitch-switchBase': { color: '#999' }, '& .MuiSwitch-track': { bgcolor: '#bbb' }, '& .Mui-checked': { color: '#DE3F5E' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E' } }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>Restrict Events</Typography>
                  <Tooltip title="When enabled, select events this PIN should NOT have access to." arrow>
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: '#999', cursor: 'help' }} />
                  </Tooltip>
                </Box>
              }
            />
            {formData.restrictEvents && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1, ml: 2 }}>
                {events.map((event) => (
                  <FormControlLabel
                    key={event.id}
                    control={
                      <Checkbox
                        checked={formData.hidden_events.includes(event.id)}
                        onChange={() => handleEventToggle(event.id)}
                        sx={{ color: '#ccc', '&.Mui-checked': { color: '#DE3F5E' } }}
                        size="small"
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.85rem', color: '#1a1a1a' }}>{event.name}</Typography>}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%' }}>
          {onCancel && (
            <SecondaryActionButton
              onClick={onCancel}
              size="small"
              fullWidth
              sx={{
                color: '#666',
                fontSize: '0.85rem',
                py: 1,
                borderRadius: '16px',
                flex: 1,
                border: '2px solid',
                borderColor: 'rgba(0,0,0,0.1)',
                '&:hover': {
                  border: '2px solid',
                  borderColor: 'rgba(0,0,0,0.2)',
                  bgcolor: 'rgba(0,0,0,0.02)'
                }
              }}
            >
              Cancel
            </SecondaryActionButton>
          )}
          <PrimaryActionButton
            onClick={handleSave}
            disabled={!formData.pin || formData.pin.length < 4}
            size="small"
            fullWidth
            sx={{
              borderRadius: '16px',
              fontSize: '0.85rem',
              py: 1,
              flex: 1,
            }}
          >
            Add PIN
          </PrimaryActionButton>
        </Box>
      </Box>
    </Box>
  );
}
