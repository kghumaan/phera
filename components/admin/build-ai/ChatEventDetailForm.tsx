'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  alpha,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Chip,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { EVENT_TEMPLATES, EventTemplate } from '@/components/admin/EventTemplates';
import { CarouselSlide } from '@/lib/supabase/wedding-service';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ChatEventDetailFormProps {
  onSave: (event: {
    name: string;
    time: string;
    location?: string;
    dress_code?: string;
    dress_code_icon?: string;
    description?: string;
    carousel_slides: CarouselSlide[];
  }) => void;
  onCancel?: () => void;
  initialData?: any;
}

type Phase = 'template' | 'basic' | 'carousel';

export default function ChatEventDetailForm({ onSave, onCancel, initialData }: ChatEventDetailFormProps) {
  const [phase, setPhase] = useState<Phase>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    time: initialData?.time || '11:00 AM',
    location: initialData?.location || '',
    dress_code: initialData?.dress_code || '',
    dress_code_icon: initialData?.dress_code_icon || '',
    description: initialData?.description || '',
  });
  const [slides, setSlides] = useState<CarouselSlide[]>(initialData?.carousel_slides || []);

  const handleTemplateSelect = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      time: template.time || '11:00 AM',
      location: '',
      dress_code: template.dress_code,
      dress_code_icon: template.dress_code_icon,
      description: template.ritual_description,
    });
    setSlides(template.carousel_slides || []);
    setPhase('basic');
  };

  const handleCustom = () => {
    setSelectedTemplate(null);
    setPhase('basic');
  };

  const handleSave = () => {
    if (!formData.name) return;
    onSave({
      ...formData,
      carousel_slides: slides,
    });
  };

  const addSlide = (type: CarouselSlide['type']) => {
    const newSlide: CarouselSlide = { type };
    if (type === 'three_lines') {
      newSlide.top_label = '';
      newSlide.main_heading = '';
      newSlide.body_text = '';
    } else if (type === 'two_sections') {
      newSlide.section1_header = 'WOMEN';
      newSlide.section1_items = [];
      newSlide.section2_header = 'MEN';
      newSlide.section2_items = [];
    }
    setSlides(prev => [...prev, newSlide]);
  };

  const removeSlide = (index: number) => {
    setSlides(prev => prev.filter((_, i) => i !== index));
  };

  const updateSlide = (index: number, updates: Partial<CarouselSlide>) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const commonFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: RADII.md,
      fontSize: '1rem',
      bgcolor: COLORS.bg.subtle,
      fontWeight: 600,
      '& input, & textarea': {
        py: 1.5,
        px: 2,
        color: '#1a1a1a !important',
        WebkitTextFillColor: '#1a1a1a !important',
      },
      '& fieldset': { border: 'none' },
      '&.Mui-focused fieldset': { border: 'none' },
    },
  };

  const labelSx = {
    color: COLORS.text.subtle,
    mb: 1,
    display: 'block',
    fontWeight: 500,
    fontSize: '0.75rem'
  };

  // ── Phase 1: Template Selection ─────────────────────────────────────────────
  if (phase === 'template') {
    return (
      <Box sx={{
        bgcolor: COLORS.bg.white,
        p: 4,
        borderRadius: RADII.lg,
        border: '2px solid',
        borderColor: alpha(COLORS.text.strong, 0.12),
        width: '100%',
        maxWidth: 640,
        mt: 1,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: COLORS.text.strong }}>
          Choose an Event Template
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: COLORS.text.subtle }}>
          Pick a template to pre-fill details, or start from scratch.
        </Typography>

        <Box sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          mb: 2,
        }}>
          {EVENT_TEMPLATES.slice(0, 10).map((template) => (
            <Chip
              key={template.slug}
              label={template.name}
              onClick={() => handleTemplateSelect(template)}
              sx={{
                bgcolor: alpha(COLORS.brand.primary, 0.08),
                color: COLORS.brand.primary,
                fontWeight: 600,
                fontSize: '0.8rem',
                '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.15) },
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {onCancel && (
            <SecondaryActionButton onClick={onCancel} fullWidth sx={{
              color: COLORS.text.subtle, fontSize: '0.85rem', py: 1,
              borderRadius: RADII.lg, flex: 1, border: '2px solid', borderColor: 'rgba(0,0,0,0.1)',
              '&:hover': { border: '2px solid', borderColor: 'rgba(0,0,0,0.2)', bgcolor: 'rgba(0,0,0,0.02)' }
            }}>
              Cancel
            </SecondaryActionButton>
          )}
          <PrimaryActionButton
            onClick={handleCustom}
            fullWidth
            sx={{
              borderRadius: RADII.lg, fontSize: '0.85rem',
              py: 1, flex: 1,
            }}
          >
            Custom Event
          </PrimaryActionButton>
        </Box>
      </Box>
    );
  }

  // ── Phase 2: Basic Fields ───────────────────────────────────────────────────
  if (phase === 'basic') {
    return (
      <Box sx={{
        bgcolor: COLORS.bg.white,
        p: 4,
        borderRadius: RADII.lg,
        border: '2px solid',
        borderColor: alpha(COLORS.text.strong, 0.12),
        width: '100%',
        maxWidth: 640,
        mt: 1,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: COLORS.text.strong }}>
          {selectedTemplate ? `${selectedTemplate.name} Details` : 'Event Details'}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="caption" sx={labelSx}>Event Name *</Typography>
            <TextField
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Sangeet & Reception"
              sx={commonFieldSx}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={labelSx}>Time</Typography>
            <TextField
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              fullWidth
              placeholder="e.g., 6:00 PM"
              sx={commonFieldSx}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={labelSx}>Location (Optional)</Typography>
            <TextField
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              placeholder="e.g., Grand Ballroom"
              sx={commonFieldSx}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={labelSx}>Dress Code (Optional)</Typography>
            <TextField
              value={formData.dress_code}
              onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
              fullWidth
              placeholder="e.g., Festive & Bold"
              sx={commonFieldSx}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <SecondaryActionButton onClick={() => setPhase('template')} fullWidth sx={{
              color: COLORS.text.subtle, fontSize: '0.85rem', py: 1,
              borderRadius: RADII.lg, flex: 1, border: '2px solid', borderColor: 'rgba(0,0,0,0.1)',
              '&:hover': { border: '2px solid', borderColor: 'rgba(0,0,0,0.2)', bgcolor: 'rgba(0,0,0,0.02)' }
            }}>
              Back
            </SecondaryActionButton>
            {slides.length > 0 ? (
              <PrimaryActionButton
                onClick={() => setPhase('carousel')}
                disabled={!formData.name}
                fullWidth
                sx={{
                  borderRadius: RADII.lg, fontSize: '0.85rem',
                  py: 1, flex: 1,
                }}
              >
                Edit Slides ({slides.length})
              </PrimaryActionButton>
            ) : (
              <PrimaryActionButton
                onClick={handleSave}
                disabled={!formData.name}
                fullWidth
                sx={{
                  borderRadius: RADII.lg, fontSize: '0.85rem',
                  py: 1, flex: 1,
                }}
              >
                Add Event
              </PrimaryActionButton>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // ── Phase 3: Carousel Slides ────────────────────────────────────────────────
  return (
    <Box sx={{
      bgcolor: COLORS.bg.white,
      p: 4,
      borderRadius: RADII.lg,
      border: '2px solid',
      borderColor: alpha(COLORS.text.strong, 0.12),
      width: '100%',
      maxWidth: 640,
      mt: 1,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: COLORS.text.strong }}>
        Carousel Slides
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: COLORS.text.subtle }}>
        These slides appear when guests tap on the event. Edit or remove pre-filled slides.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {slides.map((slide, idx) => (
          <Box key={idx} sx={{
            p: 2,
            borderRadius: RADII.md,
            bgcolor: '#f9f9f9',
            border: '1px solid',
            borderColor: alpha(COLORS.text.strong, 0.08),
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Chip label={slide.type} size="small" sx={{ fontSize: '0.7rem', bgcolor: alpha(COLORS.brand.primary, 0.1), color: COLORS.brand.primary }} />
              <IconButton size="small" onClick={() => removeSlide(idx)} sx={{ color: COLORS.text.faint }}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>

            {slide.type === 'three_lines' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  value={slide.top_label || ''}
                  onChange={(e) => updateSlide(idx, { top_label: e.target.value })}
                  placeholder="Top label (e.g., THE CEREMONY)"
                  size="small"
                  fullWidth
                  sx={commonFieldSx}
                />
                <TextField
                  value={slide.main_heading || ''}
                  onChange={(e) => updateSlide(idx, { main_heading: e.target.value })}
                  placeholder="Main heading"
                  size="small"
                  fullWidth
                  sx={commonFieldSx}
                />
                <TextField
                  value={slide.body_text || ''}
                  onChange={(e) => updateSlide(idx, { body_text: e.target.value })}
                  placeholder="Description text"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  sx={commonFieldSx}
                />
              </Box>
            )}

            {slide.type === 'two_sections' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  value={slide.section1_header || ''}
                  onChange={(e) => updateSlide(idx, { section1_header: e.target.value })}
                  placeholder="Section 1 header (e.g., WOMEN)"
                  size="small"
                  fullWidth
                  sx={commonFieldSx}
                />
                <TextField
                  value={(slide.section1_items || []).join(', ')}
                  onChange={(e) => updateSlide(idx, { section1_items: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Section 1 items (comma-separated)"
                  size="small"
                  fullWidth
                  sx={commonFieldSx}
                />
                <TextField
                  value={slide.section2_header || ''}
                  onChange={(e) => updateSlide(idx, { section2_header: e.target.value })}
                  placeholder="Section 2 header (e.g., MEN)"
                  size="small"
                  fullWidth
                  sx={commonFieldSx}
                />
                <TextField
                  value={(slide.section2_items || []).join(', ')}
                  onChange={(e) => updateSlide(idx, { section2_items: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Section 2 items (comma-separated)"
                  size="small"
                  fullWidth
                  sx={commonFieldSx}
                />
              </Box>
            )}

            {slide.type === 'image' && (
              <TextField
                value={slide.src || ''}
                onChange={(e) => updateSlide(idx, { src: e.target.value })}
                placeholder="Image URL"
                size="small"
                fullWidth
                sx={commonFieldSx}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Add Slide Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip
          icon={<Add sx={{ fontSize: 16 }} />}
          label="Text Slide"
          onClick={() => addSlide('three_lines')}
          sx={{ cursor: 'pointer', bgcolor: alpha(COLORS.brand.primary, 0.06), '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.12) } }}
        />
        <Chip
          icon={<Add sx={{ fontSize: 16 }} />}
          label="Outfit Slide"
          onClick={() => addSlide('two_sections')}
          sx={{ cursor: 'pointer', bgcolor: alpha(COLORS.brand.primary, 0.06), '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.12) } }}
        />
        <Chip
          icon={<Add sx={{ fontSize: 16 }} />}
          label="Image Slide"
          onClick={() => addSlide('image')}
          sx={{ cursor: 'pointer', bgcolor: alpha(COLORS.brand.primary, 0.06), '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.12) } }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <SecondaryActionButton onClick={() => setPhase('basic')} fullWidth sx={{
          color: COLORS.text.subtle, fontSize: '0.85rem', py: 1,
          borderRadius: RADII.lg, flex: 1, border: '2px solid', borderColor: 'rgba(0,0,0,0.1)',
          '&:hover': { border: '2px solid', borderColor: 'rgba(0,0,0,0.2)', bgcolor: 'rgba(0,0,0,0.02)' }
        }}>
          Back
        </SecondaryActionButton>
        <PrimaryActionButton
          onClick={handleSave}
          disabled={!formData.name}
          fullWidth
          sx={{
            borderRadius: RADII.lg, fontSize: '0.85rem',
            py: 1, flex: 1,
          }}
        >
          Save Event
        </PrimaryActionButton>
      </Box>
    </Box>
  );
}
