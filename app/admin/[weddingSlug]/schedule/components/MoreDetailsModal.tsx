'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  TextField,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  Add,
  Delete,
  TextFields,
  Image as ImageIcon,
  Checkroom,
  ArrowForward,
  CloudUpload,
} from '@mui/icons-material';
import { ScheduleItem, CarouselSlide, weddingService } from '@/lib/supabase/wedding-service';
import { SlideContent, DiamondIndicators } from '@/components/guest/EventDetailCarousel';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';

// All available background filenames (derived from thumbs directory)
const BACKGROUNDS = [
  'GradientReception.webp',
  'pearl.webp',
  'GradientYellow.webp',
  'GradientJaggo.webp',
  'GradientPoolParty.webp',
  'GradientCottonCandy.webp',
  'rose-quartz.webp',
  'marble-gold.webp',
  'jade.webp',
  'lavender.webp',
  'sunset.webp',
  'lotus-petals.webp',
  'handmade-paper-floral.webp',
  'pressed-flowers-subtle.webp',
  'aquamarine.webp',
  'amethyst-lavender.webp',
  'aquarium.webp',
  'aventurine-green.webp',
  'bamboo-sage.webp',
  'blue-clouds.webp',
  'citrine-quartz.webp',
  'moonstone-shimmer.webp',
  'ocean-waves.webp',
  'periwinkle-pink-sunset.webp',
  'pressed-flowers-faded.webp',
  'pressed-flowers-textured.webp',
  'sage-watercolor.webp',
  'sandstone-beige.webp',
  'tropical-sage.webp',
  'watercolor-blue-sky.webp',
];

const COLLAGE_PRESETS = [
  'Dress Codes-1-Jaggo Women.png',
  'Dress Codes-2-Jaggo Men.png',
  'Dress Codes-3-Haldi Women.png',
  'Dress Codes-4-Haldi Men.png',
  'Dress Codes-5-Anand Karaj Women.png',
  'Dress Codes-6-Anand Karaj Men.png',
  'Dress Codes-7-Pool Party Women.png',
  'Dress Codes-8-Pool Party Men.png',
  'Dress Codes-9-Reception Women.png',
  'Dress Codes-10-Reception Men.png',
  'Dress Codes-11 1.png',
  'Dress Codes-12 1.png',
  'Dress Codes-13-Jaggo (1) 1.png',
  'Dress Codes-14-Haldi 1.png',
  'Dress Codes-15-Varmala 1.png',
  'Dress Codes-16-Mehendi 1.png',
  'Dress Codes-17-Reception 1.png',
  'Dress Codes-18-Pool Party 1.png',
];

type SlideType = 'three_lines' | 'image' | 'two_sections';

const SLIDE_TYPE_OPTIONS: { type: SlideType; label: string; icon: React.ReactNode }[] = [
  { type: 'three_lines', label: 'Text Slide', icon: <TextFields sx={{ fontSize: 20 }} /> },
  { type: 'image', label: 'Picture Collage', icon: <ImageIcon sx={{ fontSize: 20 }} /> },
  { type: 'two_sections', label: 'Outfit List', icon: <Checkroom sx={{ fontSize: 20 }} /> },
];

// Backgrounds that need dark text because they are light/pale
const LIGHT_BACKGROUNDS = new Set([
  'GradientYellow.webp',
  'pearl.webp',
  'GradientCottonCandy.webp',
  'marble-gold.webp',
  'sandstone-beige.webp',
  'citrine-quartz.webp',
  'pressed-flowers-faded.webp',
  'handmade-paper-floral.webp',
  'pressed-flowers-subtle.webp',
  'pressed-flowers-textured.webp',
  'watercolor-blue-sky.webp',
  'periwinkle-pink-sunset.webp',
  'moonstone-shimmer.webp',
]);

function getTextColor(bg: string): string {
  return LIGHT_BACKGROUNDS.has(bg) ? '#1a1a1a' : '#FFFFFF';
}

function makeEmptySlide(type: SlideType): CarouselSlide {
  switch (type) {
    case 'three_lines':
      return { type: 'three_lines', top_label: '', main_heading: '', body_text: '' };
    case 'image':
      return { type: 'image', src: '' };
    case 'two_sections':
      return {
        type: 'two_sections',
        section1_header: 'Women',
        section1_items: ['Evening Gowns', 'Embroidered Sarees', 'Fusion Co-ord Sets', 'Cocktail Lehengas'],
        section2_header: 'Men',
        section2_items: ['Tuxedos & Dinner Suits', 'Tailored Sherwanis', 'Patterned Nehru Jackets', ''],
      };
  }
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    bgcolor: 'white',
    '& fieldset': { borderColor: '#BCBCBC' },
    '&:hover fieldset': { borderColor: '#999' },
    '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
  },
  '& .MuiInputLabel-root': { color: '#524344', fontSize: '0.875rem' },
  '& .MuiInputBase-input': { color: '#1a1a1a', fontSize: '0.9rem' },
};

const subtitleCapsSx = {
  fontSize: '16px',
  fontWeight: 600,
  letterSpacing: '0.32px',
  textTransform: 'uppercase' as const,
  color: '#141414',
};

function getSlideTypeLabel(slide: CarouselSlide): string {
  switch (slide.type) {
    case 'three_lines':
      return 'Text Slide';
    case 'image':
      return 'Picture Collage';
    case 'two_sections':
      return 'Outfit List';
    default:
      return slide.type;
  }
}

interface MoreDetailsModalProps {
  open: boolean;
  onClose: () => void;
  weddingId: string;
  scheduleItem: ScheduleItem;
  onSaved: () => void;
  weddingBackground?: string;
}

export default function MoreDetailsModal({
  open,
  onClose,
  weddingId,
  scheduleItem,
  onSaved,
  weddingBackground,
}: MoreDetailsModalProps) {
  // activeTab: 'look-feel' or slide index (0, 1, 2, ...)
  const [activeTab, setActiveTab] = useState<'look-feel' | number>('look-feel');
  const [gradientBackground, setGradientBackground] = useState<string>('GradientReception.webp');
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);


  // Load existing event data
  useEffect(() => {
    if (!open) return;

    const loadEventData = async () => {
      setLoading(true);
      try {
        let eventId = scheduleItem.linked_event_id;

        const defaultSlides: CarouselSlide[] = [
          {
            type: 'three_lines',
            top_label: scheduleItem.name.toUpperCase(),
            main_heading: 'Cocktail Glam',
            body_text: 'Dress to impress—think sharp suits, elegant gowns, or chic lehengas and sherwanis in jewel tones and standout embellishments.',
          },
          { type: 'image', src: '' },
          {
            type: 'two_sections',
            section1_header: 'Women',
            section1_items: ['Evening Gowns', 'Embroidered Sarees', 'Fusion Co-ord Sets', 'Cocktail Lehengas'],
            section2_header: 'Men',
            section2_items: ['Tuxedos & Dinner Suits', 'Tailored Sherwanis', 'Patterned Nehru Jackets', ''],
          },
          { type: 'image', src: '' },
          {
            type: 'three_lines',
            top_label: '',
            main_heading: '',
            body_text: '',
          },
          { type: 'image', src: '' },
        ];

        if (eventId) {
          // Load existing event
          const events = await weddingService.getWeddingEvents(weddingId);
          const event = events.find((e) => e.id === eventId);
          if (event) {
            setGradientBackground(event.gradient_background || 'GradientReception.webp');
            const existingSlides = event.carousel_slides || [];
            setSlides(existingSlides.length > 0 ? existingSlides : defaultSlides);
            setLinkedEventId(event.id);
          }
        } else {
          // Auto-create a wedding_event for this schedule item
          const slug = scheduleItem.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          const newEvent = await weddingService.createEvent({
            wedding_id: weddingId,
            name: scheduleItem.name,
            slug: slug,
            time: scheduleItem.time || '',
            date: '', // schedule items don't have their own date
            dress_code: scheduleItem.dress_code || '',
            gradient_background: scheduleItem.gradient_background || 'GradientReception.webp',
            order_index: 0,
          });

          if (newEvent) {
            // Link the schedule item to the new event
            await weddingService.updateScheduleItem(scheduleItem.id, {
              linked_event_id: newEvent.id,
            });
            setLinkedEventId(newEvent.id);
            setGradientBackground(newEvent.gradient_background || 'GradientReception.webp');
            setSlides(defaultSlides);
          }
        }
      } catch (err) {
        console.error('Error loading event data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
    setActiveTab('look-feel');
    setPreviewSlideIndex(0);
  }, [open, scheduleItem, weddingId]);

  const handleSave = useCallback(async () => {
    if (!linkedEventId) return;
    setSaving(true);
    try {
      await weddingService.updateEvent(linkedEventId, {
        carousel_slides: slides as any,
        gradient_background: gradientBackground,
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving carousel:', err);
    } finally {
      setSaving(false);
    }
  }, [linkedEventId, slides, gradientBackground, onSaved, onClose]);

  const addSlide = (type?: SlideType) => {
    const newSlide = type ? makeEmptySlide(type) : makeEmptySlide('three_lines');
    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    const newIndex = newSlides.length - 1;
    setActiveTab(newIndex);
    setPreviewSlideIndex(newIndex);
  };

  const deleteSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);

    if (newSlides.length === 0) {
      setActiveTab('look-feel');
      setPreviewSlideIndex(0);
    } else {
      const newActiveIndex = index >= newSlides.length ? newSlides.length - 1 : index;
      setActiveTab(newActiveIndex);
      setPreviewSlideIndex(newActiveIndex);
    }
  };

  const updateSlide = (index: number, updates: Partial<CarouselSlide>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setSlides(newSlides);
  };

  const selectedSlideIndex = typeof activeTab === 'number' ? activeTab : null;
  const selectedSlide = selectedSlideIndex !== null ? slides[selectedSlideIndex] || null : null;

  const textColor = getTextColor(gradientBackground);
  const isImageSlide = slides[previewSlideIndex]?.type === 'image';

  // Preview area background
  const previewBgUrl = weddingBackground || '/images/backgrounds/blue-clouds.webp';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          height: '90vh',
          maxHeight: 800,
          maxWidth: 1100,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header — event name left, Save and Close + X right */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', p: '20px' }}>
        <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#1a1a1a' }}>
          {scheduleItem.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Button
            variant="outlined"
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderColor: '#DE3F5E',
              color: '#DE3F5E',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '16px',
              px: 2,
              py: 1,
              '&:hover': { borderColor: '#C8365A', bgcolor: 'rgba(222,63,94,0.04)' },
            }}
          >
            {saving ? 'Saving...' : 'Save and Close'}
          </Button>
          <IconButton onClick={onClose} sx={{ p: 0, color: '#1a1a1a' }}>
            <Close sx={{ fontSize: 24 }} />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ height: '1px', bgcolor: '#eee', width: '100%' }} />

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <CircularProgress sx={{ color: '#DE3F5E' }} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Tab bar — full width across both panels */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            py: '8px',
            overflowX: 'auto',
            flexShrink: 0,
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            <TabItem
              label="Look & Feel"
              active={activeTab === 'look-feel'}
              onClick={() => setActiveTab('look-feel')}
            />
            {slides.map((slide, i) => (
              <TabItem
                key={i}
                label={getSlideTypeLabel(slide)}
                active={activeTab === i}
                onClick={() => { setActiveTab(i); setPreviewSlideIndex(i); }}
              />
            ))}
            {/* + Add Slide */}
            <Box
              onClick={() => addSlide()}
              sx={{
                px: '20px',
                py: '10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                '&:hover': { opacity: 0.7 },
              }}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#6a6a6a' }}>
                {'+ '}
                <Box component="span" sx={{ textDecoration: 'underline' }}>Add Slide</Box>
              </Typography>
              <Box sx={{ height: '2px', width: '100%', bgcolor: 'white' }} />
            </Box>
          </Box>

          {/* Content area — left editor + right preview */}
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Vertical divider */}
            <Box sx={{ width: '1px', bgcolor: '#eee', flexShrink: 0 }} />

            {/* Left panel — editor */}
            <Box sx={{ flex: 1, overflow: 'auto', p: '20px', bgcolor: 'white' }}>
              {activeTab === 'look-feel' ? (
                <BackgroundPicker
                  selected={gradientBackground}
                  onSelect={setGradientBackground}
                  onStartEditing={() => {
                    if (slides.length > 0) {
                      setActiveTab(0);
                      setPreviewSlideIndex(0);
                    }
                  }}
                  hasSlides={slides.length > 0}
                />
              ) : selectedSlide ? (
                <SlideEditor
                  slide={selectedSlide}
                  slideIndex={selectedSlideIndex!}
                  totalSlides={slides.length}
                  onUpdateSlide={updateSlide}
                  onDeleteSlide={deleteSlide}
                  onSave={handleSave}
                  onNextSlide={() => {
                    const next = selectedSlideIndex! + 1;
                    if (next < slides.length) {
                      setActiveTab(next);
                      setPreviewSlideIndex(next);
                    }
                  }}
                  saving={saving}
                  weddingId={weddingId}
                />
              ) : null}
            </Box>

            {/* Right panel — live preview */}
            <Box sx={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              backgroundImage: `url(${previewBgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              p: '24px',
              position: 'relative',
            }}>
              {/* Phone frame with click zones */}
              <Card
                sx={{
                  width: 333,
                  height: 600,
                  borderRadius: '16px',
                  boxShadow: 'none',
                  border: '3px solid white',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundImage: gradientBackground
                    ? `url(/images/backgrounds/${gradientBackground})`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <CardContent
                  sx={{
                    p: isImageSlide ? 0 : 2,
                    '&:last-child': { pb: isImageSlide ? 0 : undefined },
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                  }}
                >
                  {slides.length > 0 ? (
                    <Box sx={{
                      width: '100%',
                      height: '100%',
                      ...(isImageSlide
                        ? {}
                        : { transform: 'scale(0.8)', transformOrigin: 'center center' }),
                    }}>
                      <SlideContent
                        slide={slides[previewSlideIndex]}
                        textColor={textColor}
                        gradientBackground={gradientBackground}
                        isGradientSlide={true}
                      />
                    </Box>
                  ) : (
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Add slides to see preview
                    </Typography>
                  )}
                </CardContent>

                {/* Invisible click zones for navigation */}
                {slides.length > 1 && (
                  <>
                    <Box
                      onClick={() => setPreviewSlideIndex((i) => Math.max(0, i - 1))}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '40%',
                        height: '100%',
                        cursor: previewSlideIndex > 0 ? 'pointer' : 'default',
                        zIndex: 5,
                      }}
                    />
                    <Box
                      onClick={() => setPreviewSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '40%',
                        height: '100%',
                        cursor: previewSlideIndex < slides.length - 1 ? 'pointer' : 'default',
                        zIndex: 5,
                      }}
                    />
                  </>
                )}
              </Card>

              {/* Diamond indicators */}
              {slides.length > 0 && (
                <DiamondIndicators total={slides.length} current={previewSlideIndex} activeColor="#DE3F5E" />
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Dialog>
  );
}

// --- Sub-components ---

function TabItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: '20px',
        py: '10px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <Typography sx={{
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        color: active ? '#DE3F5E' : '#6a6a6a',
      }}>
        {label}
      </Typography>
      <Box sx={{
        height: '2px',
        width: '100%',
        bgcolor: active ? '#DE3F5E' : 'white',
      }} />
    </Box>
  );
}

function BackgroundPicker({
  selected,
  onSelect,
  onStartEditing,
  hasSlides,
}: {
  selected: string;
  onSelect: (bg: string) => void;
  onStartEditing: () => void;
  hasSlides: boolean;
}) {
  return (
    <Stack sx={{ gap: '32px', flex: 1 }}>
      <Stack sx={{ gap: '16px' }}>
        <Typography sx={subtitleCapsSx}>
          Background Image
        </Typography>

        <Box sx={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 2 },
        }}>
          {/* Chunk backgrounds into columns of 3 for horizontal scroll */}
          {(() => {
            const cols: string[][] = [];
            for (let i = 0; i < BACKGROUNDS.length; i += 3) {
              cols.push(BACKGROUNDS.slice(i, i + 3));
            }
            return cols.map((col, ci) => (
              <Box key={ci} sx={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
                {col.map((bg) => {
                  const thumbName = bg.replace('.webp', '.thumb.webp');
                  const isSelected = selected === bg;
                  return (
                    <Box
                      key={bg}
                      onClick={() => onSelect(bg)}
                      sx={{
                        width: 106,
                        height: 106,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected ? '4px solid #DE3F5E' : '2px solid transparent',
                        transition: 'border-color 0.15s',
                        '&:hover': { borderColor: isSelected ? '#DE3F5E' : '#ccc' },
                        backgroundImage: `url(/images/backgrounds/thumbs/${thumbName})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  );
                })}
              </Box>
            ));
          })()}
        </Box>
      </Stack>

      {hasSlides && (
        <Button
          variant="contained"
          onClick={onStartEditing}
          endIcon={<ArrowForward sx={{ fontSize: 20 }} />}
          sx={{
            bgcolor: '#DE3F5E',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '16px',
            pl: 2,
            pr: 1.5,
            py: 1,
            alignSelf: 'flex-start',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#C8365A', boxShadow: 'none' },
          }}
        >
          Start Editing
        </Button>
      )}
    </Stack>
  );
}

function SlideEditor({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  onDeleteSlide,
  onSave,
  onNextSlide,
  saving,
  weddingId,
}: {
  slide: CarouselSlide;
  slideIndex: number;
  totalSlides: number;
  onUpdateSlide: (i: number, updates: Partial<CarouselSlide>) => void;
  onDeleteSlide: (i: number) => void;
  onSave: () => void;
  onNextSlide: () => void;
  saving: boolean;
  weddingId: string;
}) {
  return (
    <Stack sx={{ gap: '32px' }}>
      {/* Layout picker pills */}
      <Stack sx={{ gap: '16px' }}>
        <Typography sx={subtitleCapsSx}>
          Select a Slide Layout
        </Typography>
        <Stack direction="row" spacing={1}>
          {SLIDE_TYPE_OPTIONS.map((opt) => (
            <Box
              key={opt.type}
              onClick={() => onUpdateSlide(slideIndex, { ...makeEmptySlide(opt.type) })}
              sx={{
                px: 2,
                py: 1,
                borderRadius: '80px',
                fontSize: '16px',
                fontWeight: slide.type === opt.type ? 600 : 400,
                lineHeight: 1.5,
                cursor: 'pointer',
                bgcolor: slide.type === opt.type ? '#ebebeb' : 'transparent',
                color: '#141414',
                border: slide.type === opt.type ? '1px solid #141414' : '1px solid #d6d6d6',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: slide.type === opt.type ? '#ebebeb' : '#F5F5F5',
                },
              }}
            >
              {opt.label}
            </Box>
          ))}
        </Stack>
      </Stack>

      {/* Slide fields */}
      {slide.type === 'three_lines' && (
        <TextSlideFields
          slide={slide}
          onChange={(updates) => onUpdateSlide(slideIndex, updates)}
        />
      )}

      {slide.type === 'image' && (
        <ImageSlideFields
          slide={slide}
          onChange={(updates) => onUpdateSlide(slideIndex, updates)}
          weddingId={weddingId}
        />
      )}

      {slide.type === 'two_sections' && (
        <OutfitSlideFields
          slide={slide}
          onChange={(updates) => onUpdateSlide(slideIndex, updates)}
        />
      )}

      {/* Bottom actions: Save + Next Slide | Delete */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1 }}>
        <Box sx={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="outlined"
            onClick={onSave}
            disabled={saving}
            sx={{
              borderColor: '#DE3F5E',
              color: '#DE3F5E',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '16px',
              px: 2,
              py: 1,
              '&:hover': { borderColor: '#C8365A', bgcolor: 'rgba(222,63,94,0.04)' },
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {slideIndex < totalSlides - 1 && (
            <Button
              variant="contained"
              onClick={onNextSlide}
              endIcon={<ArrowForward sx={{ fontSize: 20 }} />}
              sx={{
                bgcolor: '#DE3F5E',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '16px',
                pl: 2,
                pr: 1.5,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#C8365A', boxShadow: 'none' },
              }}
            >
              Next Slide
            </Button>
          )}
        </Box>
        <IconButton
          onClick={() => onDeleteSlide(slideIndex)}
          sx={{ color: '#1a1a1a', '&:hover': { color: '#d32f2f' } }}
        >
          <Delete sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>
    </Stack>
  );
}

function TextSlideFields({
  slide,
  onChange,
}: {
  slide: CarouselSlide;
  onChange: (updates: Partial<CarouselSlide>) => void;
}) {
  const bodyText = slide.body_text || '';

  return (
    <Stack sx={{ gap: '16px' }}>
      {/* Top Label + Main Heading side by side */}
      <Stack direction="row" sx={{ gap: '16px' }}>
        <TextField
          label="Top Label"
          size="small"
          fullWidth
          value={slide.top_label || ''}
          onChange={(e) => onChange({ top_label: e.target.value })}
          placeholder="e.g. Sangeet"
          sx={fieldSx}
        />
        <TextField
          label="Main Heading"
          size="small"
          fullWidth
          value={slide.main_heading || ''}
          onChange={(e) => onChange({ main_heading: e.target.value })}
          placeholder="e.g. Cocktail Glam"
          sx={fieldSx}
        />
      </Stack>
      {/* Body Text with character count */}
      <Box sx={{ position: 'relative' }}>
        <TextField
          label="Body Text"
          size="small"
          fullWidth
          multiline
          rows={4}
          value={bodyText}
          onChange={(e) => onChange({ body_text: e.target.value })}
          placeholder="Dress to impress—think sharp suits, elegant gowns, or chic lehengas..."
          sx={{
            ...fieldSx,
            '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], height: 'auto' },
          }}
        />
        <Typography sx={{
          position: 'absolute',
          bottom: 8,
          right: 12,
          fontSize: '0.75rem',
          color: '#999',
        }}>
          {bodyText.length}
        </Typography>
      </Box>
    </Stack>
  );
}

function ImageSlideFields({
  slide,
  onChange,
  weddingId,
}: {
  slide: CarouselSlide;
  onChange: (updates: Partial<CarouselSlide>) => void;
  weddingId: string;
}) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <Stack sx={{ gap: '16px' }}>
      <Typography sx={subtitleCapsSx}>
        Pick a Mood Board or Upload Your Own
      </Typography>

      <Box sx={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        pb: 1,
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 2 },
      }}>
        {/* Upload box — first item */}
        <Box
          onClick={() => setShowUpload(true)}
          sx={{
            flex: '0 0 169px',
            height: 300,
            borderRadius: '12px',
            border: '2px dashed #ccc',
            bgcolor: '#fafafa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': { borderColor: '#DE3F5E' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: 130 }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '24px',
              bgcolor: '#ebebeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CloudUpload sx={{ color: '#6a6a6a', fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontSize: '16px', color: '#6a6a6a', textAlign: 'center', lineHeight: 1.5 }}>
              Recommend aspect ratio is 600 x 1080 pixels
            </Typography>
          </Box>
        </Box>

        {/* Collage presets */}
        {COLLAGE_PRESETS.map((preset) => {
          const src = `/images/collage/${preset}`;
          const encodedSrc = `/images/collage/${encodeURIComponent(preset)}`;
          const isSelected = slide.src === src;
          return (
            <Box
              key={preset}
              onClick={() => onChange({ src })}
              sx={{
                flex: '0 0 167px',
                height: 300,
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isSelected ? '4px solid #DE3F5E' : '2px solid transparent',
                '&:hover': { borderColor: isSelected ? '#DE3F5E' : '#ccc' },
                backgroundImage: `url(${encodedSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                bgcolor: 'white',
              }}
            />
          );
        })}
      </Box>

      {showUpload && (
        <ImageUpload
          value={slide.src && !slide.src.startsWith('/images/collage/') ? slide.src : null}
          onChange={(url) => {
            if (url) onChange({ src: url });
            setShowUpload(false);
          }}
          path={getWeddingImagePath(weddingId, 'carousel')}
          label="Upload Custom Image"
          aspectRatio="3/4"
          maxWidth={300}
          borderRadius={2}
        />
      )}
    </Stack>
  );
}

function OutfitSlideFields({
  slide,
  onChange,
}: {
  slide: CarouselSlide;
  onChange: (updates: Partial<CarouselSlide>) => void;
}) {
  const section1Items = slide.section1_items || [];
  const section2Items = slide.section2_items || [];

  // Ensure at least 4 slots for each section
  const padToFour = (items: string[]) => {
    const result = [...items];
    while (result.length < 4) result.push('');
    return result;
  };

  const s1 = padToFour(section1Items);
  const s2 = padToFour(section2Items);

  const updateSection1 = (index: number, value: string) => {
    const updated = [...s1];
    updated[index] = value;
    onChange({ section1_items: updated.filter((v, i) => v || i < 4) });
  };

  const updateSection2 = (index: number, value: string) => {
    const updated = [...s2];
    updated[index] = value;
    onChange({ section2_items: updated.filter((v, i) => v || i < 4) });
  };

  return (
    <Stack spacing={3}>
      {/* Section 1 */}
      <Box>
        <Typography sx={{ ...subtitleCapsSx, mb: 1.5 }}>
          {slide.section1_header || 'Women'}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {s1.map((item, i) => (
            <TextField
              key={`s1-${i}`}
              label="Outfit Type"
              size="small"
              fullWidth
              value={item}
              onChange={(e) => updateSection1(i, e.target.value)}
              placeholder="e.g. Lehenga"
              sx={fieldSx}
            />
          ))}
        </Box>
      </Box>

      {/* Section 2 */}
      <Box>
        <Typography sx={{ ...subtitleCapsSx, mb: 1.5 }}>
          {slide.section2_header || 'Men'}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {s2.map((item, i) => (
            <TextField
              key={`s2-${i}`}
              label="Outfit Type"
              size="small"
              fullWidth
              value={item}
              onChange={(e) => updateSection2(i, e.target.value)}
              placeholder="e.g. Sherwani"
              sx={fieldSx}
            />
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
