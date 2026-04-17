'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  Autocomplete,
  Divider,
  Alert,
  Tooltip,
} from '@mui/material';
import { Close, Add, Delete } from '@mui/icons-material';
import { PrimaryActionButton, ActionButton } from '@/components/admin/ActionButton';
import { supabase } from '@/lib/supabase/client';
import type { BroadcastDataField, BroadcastTargetType } from '@/lib/supabase/broadcasts-service';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface BroadcastComposerProps {
  open: boolean;
  onClose: () => void;
  weddingId: string;
  weddingSlug: string;
  onSent: () => void;
}

interface GuestOption {
  id: string;
  name: string;
  phone: string | null;
  tag: string | null;
}

const FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.md,
    bgcolor: COLORS.bg.white,
    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
    '&:hover fieldset': { borderColor: COLORS.brand.primary },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary, borderWidth: '2px' },
  },
  '& .MuiInputLabel-root': { color: COLORS.text.muted, fontWeight: 500 },
  '& .MuiInputLabel-root.Mui-focused': { color: COLORS.brand.primary },
  '& .MuiInputBase-input': { color: COLORS.text.strong },
};

export default function BroadcastComposer({
  open,
  onClose,
  weddingId,
  weddingSlug,
  onSent,
}: BroadcastComposerProps) {
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<BroadcastTargetType>('all');
  const [targetTags, setTargetTags] = useState<string[]>([]);
  const [targetGuestIds, setTargetGuestIds] = useState<string[]>([]);
  const [collectsData, setCollectsData] = useState(false);
  const [dataSchema, setDataSchema] = useState<BroadcastDataField[]>([]);

  const [guests, setGuests] = useState<GuestOption[]>([]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<
    | { kind: 'ok'; sent: number; failed: number }
    | { kind: 'error'; message: string }
    | null
  >(null);

  const resetState = useCallback(() => {
    setMessage('');
    setTargetType('all');
    setTargetTags([]);
    setTargetGuestIds([]);
    setCollectsData(false);
    setDataSchema([]);
    setSendResult(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetState();
    (async () => {
      const { data } = await (supabase as any)
        .from('guests')
        .select('id, name, phone, logistics_data')
        .eq('wedding_id', weddingSlug);
      setGuests(
        (data || []).map((g: any) => ({
          id: g.id,
          name: g.name,
          phone: g.phone,
          tag: g.logistics_data?.tag ?? null,
        })),
      );
    })();
  }, [open, weddingSlug, resetState]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const g of guests) if (g.tag) tags.add(g.tag);
    return Array.from(tags).sort();
  }, [guests]);

  const targetCount = useMemo(() => {
    const withPhone = guests.filter((g) => !!g.phone);
    if (targetType === 'all') return withPhone.length;
    if (targetType === 'tags') {
      return withPhone.filter((g) => g.tag && targetTags.includes(g.tag)).length;
    }
    return withPhone.filter((g) => targetGuestIds.includes(g.id)).length;
  }, [guests, targetType, targetTags, targetGuestIds]);

  const canSend =
    !sending &&
    message.trim().length > 0 &&
    targetCount > 0 &&
    (!collectsData || dataSchema.every((f) => f.key.trim() && f.label.trim()));

  const addField = () => {
    setDataSchema((prev) => [...prev, { key: '', label: '', type: 'text' }]);
  };

  const removeField = (index: number) => {
    setDataSchema((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, patch: Partial<BroadcastDataField>) => {
    setDataSchema((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/concierge/broadcasts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId,
          weddingSlug,
          message: message.trim(),
          targetType,
          targetTags,
          targetGuestIds,
          collectsData,
          dataSchema,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendResult({ kind: 'error', message: data.error || 'Send failed' });
      } else {
        setSendResult({ kind: 'ok', sent: data.sent, failed: data.failed });
        setTimeout(() => onSent(), 900);
      }
    } catch (err: any) {
      setSendResult({ kind: 'error', message: err.message || 'Network error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={sending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: RADII.lg, bgcolor: COLORS.bg.white } }}
    >
      <DialogTitle sx={{ fontWeight: 600, color: COLORS.text.strong, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        New Broadcast
        <IconButton size="small" onClick={onClose} disabled={sending} sx={{ color: COLORS.text.subtle }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important' }}>
        <Stack spacing={2.5}>
          <TextField
            label="Message"
            multiline
            minRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi everyone! Quick update on Friday's shuttle — pickup moved to 4:30 PM from the Oberoi main entrance."
            fullWidth
            helperText="Sent from your Phera WhatsApp number to each recipient."
            sx={FIELD_SX}
          />

          <Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.text.strong, mb: 1 }}>
              Target
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={targetType}
              onChange={(_, val) => val && setTargetType(val)}
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  color: COLORS.text.muted,
                  borderColor: 'rgba(0,0,0,0.12)',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(222,63,94,0.08)',
                    color: COLORS.brand.primary,
                    borderColor: COLORS.brand.primary,
                    '&:hover': { bgcolor: 'rgba(222,63,94,0.12)' },
                  },
                },
              }}
            >
              <ToggleButton value="all">Everyone</ToggleButton>
              <ToggleButton value="tags">By tag</ToggleButton>
              <ToggleButton value="specific">Specific guests</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {targetType === 'tags' && (
            <Autocomplete
              multiple
              options={availableTags}
              value={targetTags}
              onChange={(_, val) => setTargetTags(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Select tags"
                  sx={FIELD_SX}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((tag, i) => (
                  <Chip
                    {...getTagProps({ index: i })}
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{ bgcolor: 'rgba(222,63,94,0.1)', color: COLORS.brand.primary, fontWeight: 600 }}
                  />
                ))
              }
            />
          )}

          {targetType === 'specific' && (
            <Autocomplete
              multiple
              options={guests.filter((g) => !!g.phone)}
              getOptionLabel={(g) => `${g.name}${g.tag ? ` · ${g.tag}` : ''}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={guests.filter((g) => targetGuestIds.includes(g.id))}
              onChange={(_, val) => setTargetGuestIds(val.map((g) => g.id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Guests"
                  placeholder="Select guests"
                  sx={FIELD_SX}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((guest, i) => (
                  <Chip
                    {...getTagProps({ index: i })}
                    key={guest.id}
                    label={guest.name}
                    size="small"
                    sx={{ bgcolor: 'rgba(222,63,94,0.1)', color: COLORS.brand.primary, fontWeight: 600 }}
                  />
                ))
              }
            />
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: 1,
              bgcolor: COLORS.bg.subtle,
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
              This will reach <strong style={{ color: COLORS.text.strong }}>{targetCount}</strong> guest{targetCount === 1 ? '' : 's'} with a phone number.
            </Typography>
          </Box>

          <Divider />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={collectsData}
                  onChange={(e) => setCollectsData(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.brand.primary },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: COLORS.brand.primary },
                  }}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '0.9rem' }}>
                    Collect replies as data
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                    Tag replies with a name so you can view responses as a structured column.
                  </Typography>
                </Box>
              }
            />
          </Box>

          {collectsData && (
            <Stack spacing={1.25}>
              {dataSchema.length === 0 && (
                <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
                  Add at least one field to name the data you&apos;re collecting.
                </Typography>
              )}
              {dataSchema.map((field, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    label="Field name"
                    placeholder="Dietary preference"
                    value={field.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                      updateField(i, { label, key });
                    }}
                    sx={{ ...FIELD_SX, flex: 1 }}
                  />
                  <Tooltip title="Remove field">
                    <IconButton size="small" onClick={() => removeField(i)} sx={{ color: COLORS.text.subtle }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ))}
              <Box>
                <ActionButton
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addField}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: RADII.md,
                    borderColor: COLORS.brand.primary,
                    color: COLORS.brand.primary,
                    '&:hover': { borderColor: COLORS.brand.primary, bgcolor: 'rgba(222,63,94,0.04)' },
                  }}
                >
                  Add field
                </ActionButton>
              </Box>
              <Alert severity="info" sx={{ borderRadius: 1, bgcolor: 'rgba(222,63,94,0.05)', color: COLORS.text.muted, '& .MuiAlert-icon': { color: COLORS.brand.primary } }}>
                Replies will be attributed to this broadcast and shown in the Broadcasts detail + RSVPs &rsaquo; Collected Data.
              </Alert>
            </Stack>
          )}

          {sendResult?.kind === 'error' && (
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {sendResult.message}
            </Alert>
          )}
          {sendResult?.kind === 'ok' && (
            <Alert severity="success" sx={{ borderRadius: 1 }}>
              Sent to {sendResult.sent} guest{sendResult.sent === 1 ? '' : 's'}
              {sendResult.failed > 0 ? ` (${sendResult.failed} failed)` : ''}.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <PrimaryActionButton
          onClick={handleSend}
          loading={sending}
          disabled={!canSend}
          sx={{ px: 3, '&.Mui-disabled': { bgcolor: '#f0f0f0', color: COLORS.text.faint } }}
        >
          Send to {targetCount || 0}
        </PrimaryActionButton>
      </DialogActions>
    </Dialog>
  );
}
