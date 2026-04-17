'use client';

import { useState, useRef, useCallback } from 'react';
import { Box, TextField, Stack, Button, Typography, Switch, CircularProgress, ClickAwayListener } from '@mui/material';
import { AttachMoney } from '@mui/icons-material';
import { TravelSection } from '@/lib/supabase/wedding-service';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.sm,
    bgcolor: COLORS.bg.white,
    '& fieldset': { borderColor: COLORS.text.faint },
    '&:hover fieldset': { borderColor: COLORS.text.faint },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
  },
  '& .MuiInputLabel-root': {
    color: '#524344',
    fontSize: '0.875rem',
    transform: 'translate(14px, 12.5px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
    },
    '&.Mui-focused': {
      color: COLORS.brand.primary,
    },
  },
  '& .MuiInputBase-input': {
    color: COLORS.text.strong,
    fontSize: '1rem',
    padding: '12.5px 14px',
  },
};

interface InlineTravelFormProps {
  section: TravelSection;
  onSave: (updates: Partial<TravelSection>) => void;
  onCancel: () => void;
  onMoreDetails?: () => void;
  isSaving?: boolean;
}

export default function InlineTravelForm({
  section,
  onSave,
  onCancel,
  onMoreDetails,
  isSaving,
}: InlineTravelFormProps) {
  const [title, setTitle] = useState(section.title || '');
  const [content, setContent] = useState(section.content || '');
  const [visible, setVisible] = useState(section.visible !== false);
  const [address, setAddress] = useState(section.address || '');
  const [phone, setPhone] = useState(section.phone || '');
  const [priceLevel, setPriceLevel] = useState<number | null>(section.price_level);
  const hasSubmitted = useRef(false);

  const isHotel = section.type === 'hotel';

  const getUpdates = useCallback(() => ({
    title,
    content,
    visible,
    address: isHotel ? address : section.address,
    phone: isHotel ? phone : section.phone,
    price_level: isHotel ? priceLevel : section.price_level,
  }), [title, content, visible, address, phone, priceLevel, isHotel, section]);

  const handleSubmit = useCallback(() => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    onSave(getUpdates());
  }, [onSave, getUpdates]);

  const handleClickAway = useCallback(() => {
    if (isSaving) return;
    handleSubmit();
  }, [isSaving, handleSubmit]);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{
        bgcolor: COLORS.bg.white,
        border: '1px solid #EEE',
        borderRadius: RADII.md,
        px: 1.5, py: 2,
        position: 'relative',
        opacity: isSaving ? 0.6 : 1,
        pointerEvents: isSaving ? 'none' : 'auto',
        transition: 'opacity 0.15s',
      }}>
        {isSaving && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <CircularProgress size={24} sx={{ color: COLORS.brand.primary }} />
          </Box>
        )}

        <Stack spacing={2}>
          {/* Title + Visibility Switch */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              label="Title"
              size="small"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              sx={{ ...fieldSx, flex: 1 }}
            />
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Switch
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase': { color: COLORS.text.faint },
                  '& .MuiSwitch-track': { bgcolor: COLORS.text.faint },
                  '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.brand.primary },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: COLORS.brand.primary },
                }}
              />
              <Typography variant="caption" sx={{ color: COLORS.text.subtle, whiteSpace: 'nowrap' }}>
                {visible ? 'Show title' : 'Hide title'}
              </Typography>
            </Stack>
          </Stack>

          {/* Content */}
          <TextField
            label="Content"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{
              ...fieldSx,
              '& .MuiInputBase-inputMultiline': { padding: 0 },
            }}
          />

          {/* Address + Phone (hotel only) */}
          {isHotel && (
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Address"
                size="small"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                sx={{ ...fieldSx, flex: 1 }}
              />
              <TextField
                label="Phone"
                size="small"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{ ...fieldSx, flex: 1 }}
              />
            </Stack>
          )}

          {/* Price Level with dollar signs (hotel only) */}
          {isHotel && (
            <Box>
              <Typography variant="body2" sx={{ color: COLORS.text.muted, fontWeight: 500, mb: 0.5 }}>
                Price Level
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <Box
                    key={level}
                    onClick={() => setPriceLevel(priceLevel === level ? null : level)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: priceLevel && level <= priceLevel ? COLORS.brand.primary : COLORS.border.default,
                      bgcolor: priceLevel && level <= priceLevel ? 'rgba(222,63,94,0.08)' : 'transparent',
                      transition: 'all 0.15s',
                      '&:hover': {
                        borderColor: COLORS.brand.primary,
                        bgcolor: 'rgba(222,63,94,0.04)',
                      },
                    }}
                  >
                    <AttachMoney sx={{
                      fontSize: 18,
                      color: priceLevel && level <= priceLevel ? COLORS.brand.primary : COLORS.text.faint,
                    }} />
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Bottom row: Buttons */}
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={handleSubmit}
              sx={{
                borderColor: COLORS.brand.primary,
                color: COLORS.brand.primary,
                borderRadius: RADII.sm,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                px: 2, py: 0.75,
                '&:hover': { borderColor: '#C8365A', bgcolor: 'rgba(222,63,94,0.04)' },
              }}
            >
              Done
            </Button>
            {onMoreDetails && (
              <PrimaryActionButton
                onClick={() => {
                  hasSubmitted.current = true;
                  onSave(getUpdates());
                  onMoreDetails();
                }}
                sx={{
                  borderRadius: RADII.sm,
                  fontSize: '1rem',
                  px: 2, py: 0.75,
                }}
              >
                Add More Details
              </PrimaryActionButton>
            )}
          </Stack>
        </Stack>
      </Box>
    </ClickAwayListener>
  );
}
