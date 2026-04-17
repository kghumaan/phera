'use client';

import { useState } from 'react';
import { Box, Typography, alpha, Tooltip, Tabs, Tab } from '@mui/material';
import { Check, ViewModule, ViewStream } from '@mui/icons-material';
import { BACKGROUND_UI_OPTIONS } from '@/lib/constants/images';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

const COLOR_OPTIONS = [
  { name: 'Rose', value: COLORS.brand.primary },
  { name: 'Black', value: '#141414' },
  { name: 'Plum', value: '#59114D' },
  { name: 'Purple', value: '#AC3FBA' },
  { name: 'Ocean', value: '#004550' },
  { name: 'Sky', value: '#6290C8' },
  { name: 'Teal', value: '#489991' },
  { name: 'Maroon', value: '#941C28' },
  { name: 'Green', value: '#76B041' },
  { name: 'Forest', value: '#59814B' },
  { name: 'Orange', value: '#DF6507' },
  { name: 'Amber', value: '#FA9A00' },
];

const FONT_COLOR_OPTIONS = [
  { name: 'Black', value: '#141414' },
  { name: 'Dark Gray', value: COLORS.text.strong },
  { name: 'Charcoal', value: '#555555' },
  { name: 'White', value: COLORS.bg.white },
  { name: 'Ivory', value: '#FFFDD0' },
  { name: 'Cream', value: '#F5F5DC' },
  { name: 'Rose', value: COLORS.brand.primary },
  { name: 'Plum', value: '#59114D' },
  { name: 'Ocean', value: '#004550' },
  { name: 'Forest', value: '#59814B' },
];

interface ChatLookFeelFormProps {
  onSave: (designData: Record<string, any>) => void;
  onCancel?: () => void;
  currentValues: Record<string, any>;
}

function BackgroundPicker({ selected, onSelect, label }: { selected: string; onSelect: (url: string) => void; label: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 1.5, display: 'block', fontWeight: 500, fontSize: '0.75rem' }}>
        {label}
      </Typography>
      <Box sx={{
        display: 'flex',
        gap: 1.5,
        overflowX: 'auto',
        pb: 1.5,
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(COLORS.text.strong, 0.15), borderRadius: 2 },
      }}>
        {BACKGROUND_UI_OPTIONS.map((bg) => (
          <Box
            key={bg.url}
            onClick={() => onSelect(bg.url)}
            sx={{
              flexShrink: 0,
              width: 64,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.15s',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <Box sx={{
              width: 64,
              height: 96,
              borderRadius: RADII.sm,
              overflow: 'hidden',
              border: selected === bg.url ? '3px solid #DE3F5E' : '2px solid transparent',
              boxShadow: selected === bg.url ? '0 0 0 2px rgba(222,63,94,0.3)' : 'none',
              transition: 'all 0.15s',
            }}>
              <Box component="img" src={bg.thumbUrl} alt={bg.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <Typography sx={{
              fontSize: '0.6rem',
              color: selected === bg.url ? COLORS.brand.primary : COLORS.text.subtle,
              fontWeight: selected === bg.url ? 700 : 500,
              mt: 0.5,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {bg.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ColorPicker({ selected, onSelect, label, options }: { selected: string; onSelect: (hex: string) => void; label: string; options: typeof COLOR_OPTIONS }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 1.5, display: 'block', fontWeight: 500, fontSize: '0.75rem' }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {options.map((color) => (
          <Tooltip key={color.value} title={color.name} arrow>
            <Box
              onClick={() => onSelect(color.value)}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: color.value,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: selected === color.value ? '3px solid' : '2px solid',
                borderColor: selected === color.value ? alpha(color.value, 0.4) : color.value === COLORS.bg.white || color.value === '#FFFDD0' || color.value === '#F5F5DC' ? alpha(COLORS.text.strong, 0.2) : 'transparent',
                boxShadow: selected === color.value ? `0 0 0 3px ${alpha(color.value, 0.25)}` : '0 2px 4px rgba(0,0,0,0.15)',
                transition: 'all 0.15s',
                '&:hover': { transform: 'scale(1.1)' },
              }}
            >
              {selected === color.value && (
                <Check sx={{ fontSize: 16, color: color.value === COLORS.bg.white || color.value === '#FFFDD0' || color.value === '#F5F5DC' ? COLORS.text.strong : COLORS.bg.white, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}

function LayoutPicker({ selected, onSelect }: { selected: string; onSelect: (layout: string) => void }) {
  const options = [
    { value: 'multi_page', label: 'Multi-Page', description: 'Guests tap into each section to see details.', icon: ViewModule },
    { value: 'vertical_scroll', label: 'Vertical Scroll', description: 'All content flows on one page.', icon: ViewStream },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 1.5, display: 'block', fontWeight: 500, fontSize: '0.75rem' }}>
        Website Navigation Style
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.value;
          return (
            <Box
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              sx={{
                flex: 1,
                p: 2,
                borderRadius: RADII.md,
                border: '2px solid',
                borderColor: isSelected ? COLORS.brand.primary : alpha(COLORS.text.strong, 0.12),
                bgcolor: isSelected ? alpha(COLORS.brand.primary, 0.04) : COLORS.bg.white,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
                '&:hover': { borderColor: isSelected ? COLORS.brand.primary : alpha(COLORS.text.strong, 0.25) },
              }}
            >
              <Icon sx={{ fontSize: 28, color: isSelected ? COLORS.brand.primary : COLORS.text.subtle, mb: 0.5 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: isSelected ? COLORS.brand.primary : COLORS.text.strong, mb: 0.25 }}>
                {opt.label}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: COLORS.text.faint, lineHeight: 1.3 }}>
                {opt.description}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function ChatLookFeelForm({ onSave, onCancel, currentValues }: ChatLookFeelFormProps) {
  const [tab, setTab] = useState(0);
  const [designData, setDesignData] = useState({
    background_image: currentValues.background_image || BACKGROUND_UI_OPTIONS[0].url,
    primary_color: currentValues.primary_color || COLORS.brand.primary,
    font_color: currentValues.font_color || '#141414',
    button_font_color: currentValues.button_font_color || COLORS.bg.white,
    website_layout: currentValues.website_layout || 'multi_page',
    lock_screen_background: currentValues.lock_screen_background || BACKGROUND_UI_OPTIONS[0].url,
    lock_screen_primary_color: currentValues.lock_screen_primary_color || COLORS.brand.primary,
    lock_screen_font_color: currentValues.lock_screen_font_color || '#141414',
    lock_screen_button_font_color: currentValues.lock_screen_button_font_color || COLORS.bg.white,
  });

  const update = (field: string, value: string) => {
    setDesignData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(designData);
  };

  return (
    <Box sx={{
      bgcolor: COLORS.bg.white,
      p: 3,
      borderRadius: RADII.lg,
      border: '2px solid',
      borderColor: alpha(COLORS.text.strong, 0.12),
      width: '100%',
      maxWidth: 640,
      mt: 1,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: COLORS.text.strong, fontSize: '1rem' }}>
        Look & Feel
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          minHeight: 36,
          '& .MuiTab-root': {
            minHeight: 36,
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'none',
            px: 2,
          },
          '& .Mui-selected': { color: COLORS.brand.primary },
          '& .MuiTabs-indicator': { bgcolor: COLORS.brand.primary },
        }}
      >
        <Tab label="Main Website" />
        <Tab label="Lock Screen" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <BackgroundPicker
            selected={designData.background_image}
            onSelect={(url) => update('background_image', url)}
            label="Background Image"
          />
          <ColorPicker
            selected={designData.primary_color}
            onSelect={(hex) => update('primary_color', hex)}
            label="Primary Color"
            options={COLOR_OPTIONS}
          />
          <ColorPicker
            selected={designData.font_color}
            onSelect={(hex) => update('font_color', hex)}
            label="Font Color"
            options={FONT_COLOR_OPTIONS}
          />
          <ColorPicker
            selected={designData.button_font_color}
            onSelect={(hex) => update('button_font_color', hex)}
            label="Button Font Color"
            options={FONT_COLOR_OPTIONS}
          />
          <LayoutPicker
            selected={designData.website_layout}
            onSelect={(layout) => update('website_layout', layout)}
          />
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <BackgroundPicker
            selected={designData.lock_screen_background}
            onSelect={(url) => update('lock_screen_background', url)}
            label="Lock Screen Background"
          />
          <ColorPicker
            selected={designData.lock_screen_primary_color}
            onSelect={(hex) => update('lock_screen_primary_color', hex)}
            label="Lock Screen Primary Color"
            options={COLOR_OPTIONS}
          />
          <ColorPicker
            selected={designData.lock_screen_font_color}
            onSelect={(hex) => update('lock_screen_font_color', hex)}
            label="Lock Screen Font Color"
            options={FONT_COLOR_OPTIONS}
          />
          <ColorPicker
            selected={designData.lock_screen_button_font_color}
            onSelect={(hex) => update('lock_screen_button_font_color', hex)}
            label="Lock Screen Button Font Color"
            options={FONT_COLOR_OPTIONS}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2, width: '100%' }}>
        {onCancel && (
          <SecondaryActionButton
            onClick={onCancel}
            size="small"
            fullWidth
            sx={{
              color: COLORS.text.subtle,
              fontSize: '0.85rem',
              py: 1,
              borderRadius: RADII.lg,
              flex: 1,
              border: '2px solid',
              borderColor: 'rgba(0,0,0,0.1)',
              '&:hover': { border: '2px solid', borderColor: 'rgba(0,0,0,0.2)', bgcolor: 'rgba(0,0,0,0.02)' }
            }}
          >
            Skip
          </SecondaryActionButton>
        )}
        <PrimaryActionButton
          onClick={handleSave}
          size="small"
          fullWidth
          sx={{
            borderRadius: RADII.lg,
            fontSize: '0.85rem',
            py: 1,
            flex: 1,
          }}
        >
          Save Design
        </PrimaryActionButton>
      </Box>
    </Box>
  );
}
