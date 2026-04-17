'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
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
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

// Curated background options — 3 rows of 5
const BACKGROUNDS = [
  // Row 1
  'pro-bg-mesh-2.webp',
  'paisley-cream.webp',
  'royal-purple.webp',
  'ivory-linen.webp',
  'burgundy-silk.webp',
  // Row 2
  'paisley-blue.webp',
  'GradientReception.webp',
  'GradientYellow.webp',
  'GradientPoolParty.webp',
  'GradientJaggo.webp',
  // Row 3
  'GradientCottonCandy.webp',
  'aquarium.webp',
  'rose-quartz.webp',
  'marble-gold.webp',
  'pearl.webp',
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

// Event-specific default content for the "More Details" carousel
interface EventDefaults {
  dressCodeHeading: string;
  dressCodeBody: string;
  womenOutfits: string[];
  menOutfits: string[];
  whatIsHeading: string;
  whatIsBody: string;
  collageWomen: string;
  collageMen: string;
  collageCelebration: string;
}

function getEventDefaults(eventName: string): EventDefaults {
  const lower = eventName.toLowerCase().trim();

  if (lower.includes('sangeet') || lower.includes('reception')) {
    return {
      dressCodeHeading: 'Cocktail Glam',
      dressCodeBody: 'Dress to impress—think sharp suits, elegant gowns, or chic lehengas and sherwanis in jewel tones and standout embellishments.',
      womenOutfits: ['Evening Gowns', 'Embellished Sarees', 'Fusion Co-ord Sets', 'Cocktail Lehengas'],
      menOutfits: ['Tuxedos & Dinner Suits', 'Tailored Sherwanis', 'Patterned Nehru Jackets', ''],
      whatIsHeading: 'What is a Sangeet?',
      whatIsBody: 'Evening kicks off with a high-energy Sangeet of choreographed dances, then flows into a formal Reception of dinner, toasts, and first dances—a perfect blend of party and polish.',
      collageWomen: '/images/collage/Dress Codes-9-Reception Women.png',
      collageMen: '/images/collage/Dress Codes-10-Reception Men.png',
      collageCelebration: '/images/collage/Dress Codes-17-Reception 1.png',
    };
  }

  if (lower.includes('mehendi') || lower.includes('mehndi')) {
    return {
      dressCodeHeading: 'Vibrant & Festive',
      dressCodeBody: 'Think bright colors, floral prints, and comfortable elegance—perfect for a relaxed afternoon of henna, music, and celebration.',
      womenOutfits: ['Floral Anarkalis', 'Printed Sharara Sets', 'Bandhani Sarees', 'Mirror-work Lehengas'],
      menOutfits: ['Linen Kurta Pajamas', 'Printed Nehru Jackets', 'Embroidered Bundis', ''],
      whatIsHeading: 'What is a Mehndi?',
      whatIsBody: 'The Mehndi ceremony is a colorful pre-wedding celebration where intricate henna designs are applied to the bride\'s hands and feet, accompanied by music, dancing, and joyful festivities.',
      collageWomen: '/images/collage/Dress Codes-16-Mehendi 1.png',
      collageMen: '/images/collage/Dress Codes-11 1.png',
      collageCelebration: '/images/collage/Dress Codes-12 1.png',
    };
  }

  if (lower.includes('haldi')) {
    return {
      dressCodeHeading: 'Yellow & Bright',
      dressCodeBody: 'Embrace shades of yellow, marigold, and sunshine—expect turmeric splashes, so wear something you don\'t mind getting colorful!',
      womenOutfits: ['Yellow Sarees', 'Floral Kurta Sets', 'Cotton Anarkalis', 'Bandhani Dupattas'],
      menOutfits: ['Yellow Kurtas', 'White Linen Sets', 'Printed Nehru Jackets', ''],
      whatIsHeading: 'What is a Haldi?',
      whatIsBody: 'The Haldi ceremony is a joyful pre-wedding ritual where turmeric paste is applied to the bride and groom for blessings of prosperity and radiance—expect laughter, music, and a lot of yellow!',
      collageWomen: '/images/collage/Dress Codes-3-Haldi Women.png',
      collageMen: '/images/collage/Dress Codes-4-Haldi Men.png',
      collageCelebration: '/images/collage/Dress Codes-14-Haldi 1.png',
    };
  }

  if (lower.includes('jaggo')) {
    return {
      dressCodeHeading: 'Party Ready',
      dressCodeBody: 'Bring your energy and your best party look—bold colors, statement pieces, and dancing shoes are a must for this late-night celebration.',
      womenOutfits: ['Sequin Sarees', 'Party Lehengas', 'Indo-Western Gowns', 'Embellished Sharara Sets'],
      menOutfits: ['Velvet Sherwanis', 'Tuxedo Suits', 'Statement Kurtas', ''],
      whatIsHeading: 'What is a Jaggo?',
      whatIsBody: 'The Jaggo is a lively nighttime procession full of music, dancing, and decorated pots—a high-energy celebration that lights up the streets before the wedding day.',
      collageWomen: '/images/collage/Dress Codes-1-Jaggo Women.png',
      collageMen: '/images/collage/Dress Codes-2-Jaggo Men.png',
      collageCelebration: '/images/collage/Dress Codes-13-Jaggo (1) 1.png',
    };
  }

  if (lower.includes('anand karaj') || lower.includes('wedding') || lower.includes('ceremony') || lower.includes('vivah') || lower.includes('shaadi')) {
    return {
      dressCodeHeading: 'Traditional Elegance',
      dressCodeBody: 'This is the main event—dress in your finest traditional attire. Rich fabrics, intricate embroidery, and timeless silhouettes set the tone.',
      womenOutfits: ['Heavy Sarees', 'Bridal Lehengas', 'Silk Anarkalis', 'Designer Sharara Sets'],
      menOutfits: ['Classic Sherwanis', 'Bandhgala Suits', 'Silk Kurta Sets', ''],
      whatIsHeading: 'What is the Ceremony?',
      whatIsBody: 'The wedding ceremony is the sacred heart of the celebration—where vows are exchanged, traditions are honored, and two families come together in love and commitment.',
      collageWomen: '/images/collage/Dress Codes-5-Anand Karaj Women.png',
      collageMen: '/images/collage/Dress Codes-6-Anand Karaj Men.png',
      collageCelebration: '/images/collage/Dress Codes-15-Varmala 1.png',
    };
  }

  if (lower.includes('pool') || lower.includes('beach')) {
    return {
      dressCodeHeading: 'Resort Chic',
      dressCodeBody: 'Keep it fun, fresh, and sun-ready—think resort wear, tropical prints, and effortlessly cool vibes by the water.',
      womenOutfits: ['Maxi Dresses', 'Sarong Sets', 'Tropical Print Kaftans', 'Linen Co-ord Sets'],
      menOutfits: ['Linen Shirts & Shorts', 'Printed Camp Collar Shirts', 'Resort Kurtas', ''],
      whatIsHeading: 'What is a Pool Party?',
      whatIsBody: 'A fun, relaxed pre-wedding celebration by the pool—enjoy cocktails, music, and sunshine with the wedding party before the big day festivities begin.',
      collageWomen: '/images/collage/Dress Codes-7-Pool Party Women.png',
      collageMen: '/images/collage/Dress Codes-8-Pool Party Men.png',
      collageCelebration: '/images/collage/Dress Codes-18-Pool Party 1.png',
    };
  }

  if (lower.includes('choora') || lower.includes('chura') || lower.includes('chuda')) {
    return {
      dressCodeHeading: 'Elegant & Intimate',
      dressCodeBody: 'A close-knit ceremony calls for graceful traditional wear—think soft colors, delicate embroidery, and understated elegance.',
      womenOutfits: ['Pastel Sarees', 'Embroidered Suits', 'Silk Anarkalis', 'Phulkari Dupattas'],
      menOutfits: ['Silk Kurta Pajamas', 'Pastel Nehru Jackets', 'Embroidered Bundis', ''],
      whatIsHeading: 'What is a Choora?',
      whatIsBody: 'The Choora ceremony is a beautiful tradition where the bride\'s maternal uncle presents her with a set of red and white bangles, symbolizing good luck and new beginnings.',
      collageWomen: '/images/collage/Dress Codes-5-Anand Karaj Women.png',
      collageMen: '/images/collage/Dress Codes-6-Anand Karaj Men.png',
      collageCelebration: '/images/collage/Dress Codes-11 1.png',
    };
  }

  if (lower.includes('baraat')) {
    return {
      dressCodeHeading: 'Bold & Celebratory',
      dressCodeBody: 'Join the groom\'s grand procession in style—think vibrant colors, festive energy, and outfits made for dancing in the streets.',
      womenOutfits: ['Bright Lehengas', 'Festive Sarees', 'Embellished Sharara Sets', 'Statement Anarkalis'],
      menOutfits: ['Bold Sherwanis', 'Jodhpuri Suits', 'Embroidered Kurtas', ''],
      whatIsHeading: 'What is a Baraat?',
      whatIsBody: 'The Baraat is the groom\'s wedding procession—a high-energy parade with music, dancing, and celebration as the groom makes his grand entrance to the ceremony venue.',
      collageWomen: '/images/collage/Dress Codes-9-Reception Women.png',
      collageMen: '/images/collage/Dress Codes-10-Reception Men.png',
      collageCelebration: '/images/collage/Dress Codes-15-Varmala 1.png',
    };
  }

  // Generic fallback for any other event
  return {
    dressCodeHeading: 'Dress Code',
    dressCodeBody: 'Use this space to communicate anything you want about this event to your guests.',
    womenOutfits: ['Evening Gowns', 'Embellished Sarees', 'Fusion Co-ord Sets', 'Cocktail Lehengas'],
    menOutfits: ['Tuxedos & Dinner Suits', 'Tailored Sherwanis', 'Patterned Nehru Jackets', ''],
    whatIsHeading: `About ${eventName}`,
    whatIsBody: 'Use this space to share details about this event—what to expect, the vibe, and anything your guests should know.',
    collageWomen: '/images/collage/Dress Codes-9-Reception Women.png',
    collageMen: '/images/collage/Dress Codes-10-Reception Men.png',
    collageCelebration: '/images/collage/Dress Codes-17-Reception 1.png',
  };
}

function buildDefaultSlides(eventName: string): CarouselSlide[] {
  const defaults = getEventDefaults(eventName);

  return [
    {
      type: 'three_lines',
      top_label: eventName.toUpperCase(),
      main_heading: defaults.dressCodeHeading,
      body_text: defaults.dressCodeBody,
    },
    { type: 'image', src: defaults.collageWomen },
    {
      type: 'two_sections',
      section1_header: 'Women',
      section1_items: defaults.womenOutfits,
      section2_header: 'Men',
      section2_items: defaults.menOutfits,
    },
    { type: 'image', src: defaults.collageMen },
    {
      type: 'three_lines',
      top_label: 'The Celebration',
      main_heading: defaults.whatIsHeading,
      body_text: defaults.whatIsBody,
    },
    { type: 'image', src: defaults.collageCelebration },
  ];
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
        section1_items: ['Evening Gowns', 'Embellished Sarees', 'Fusion Co-ord Sets', 'Cocktail Lehengas'],
        section2_header: 'Men',
        section2_items: ['Tuxedos & Dinner Suits', 'Tailored Sherwanis', 'Patterned Nehru Jackets', ''],
      };
  }
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.sm,
    bgcolor: COLORS.bg.white,
    '& fieldset': { borderColor: COLORS.text.faint },
    '&:hover fieldset': { borderColor: COLORS.text.faint },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
  },
  '& .MuiInputLabel-root': { color: '#524344', fontSize: '0.875rem', '&.Mui-focused': { color: COLORS.brand.primary } },
  '& .MuiInputBase-input': { color: COLORS.text.strong, fontSize: '0.9rem' },
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
  const { setStatus: setGlobalSaveStatus } = useAutoSaveStatus();
  // activeTab: 'look-feel' or slide index (0, 1, 2, ...)
  const [activeTab, setActiveTab] = useState<'look-feel' | number>('look-feel');
  const [gradientBackground, setGradientBackground] = useState<string>('pro-bg-mesh-2.webp');
  const [fontColor, setFontColor] = useState<string>(COLORS.bg.white);
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

        const defaultSlides = buildDefaultSlides(scheduleItem.name);

        if (eventId) {
          // Load existing event
          const events = await weddingService.getWeddingEvents(weddingId);
          const event = events.find((e) => e.id === eventId);
          if (event) {
            // Only use gradient_background if it's a valid filename (not a hex color)
            const bg = event.gradient_background;
            const isValidBg = bg && !bg.startsWith('#') && bg.endsWith('.webp');
            setGradientBackground(isValidBg ? bg : 'pro-bg-mesh-2.webp');
            setFontColor(event.text_color || COLORS.bg.white);
            const existingSlides = event.carousel_slides || [];
            setSlides(existingSlides.length > 0 ? existingSlides : defaultSlides);
            setLinkedEventId(event.id);
          }
        } else {
          // Auto-create a wedding_event for this schedule item
          // Append schedule item ID suffix to ensure slug uniqueness
          const baseSlug = scheduleItem.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          const slug = `${baseSlug}-${scheduleItem.id.slice(-6)}`;

          // Schedule item's gradient_background is a hex color for the event card accent,
          // not a background image filename — always default to the first background preset
          const newEvent = await weddingService.createEvent({
            wedding_id: weddingId,
            name: scheduleItem.name,
            slug: slug,
            time: scheduleItem.time || '',
            date: '',
            dress_code: scheduleItem.dress_code || '',
            gradient_background: 'pro-bg-mesh-2.webp',
            order_index: 0,
          });

          if (newEvent) {
            // Link the schedule item to the new event
            await weddingService.updateScheduleItem(scheduleItem.id, {
              linked_event_id: newEvent.id,
            });
            setLinkedEventId(newEvent.id);
            setGradientBackground(newEvent.gradient_background || 'pro-bg-mesh-2.webp');
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
    setGlobalSaveStatus('saving');
    try {
      await weddingService.updateEvent(linkedEventId, {
        carousel_slides: slides as any,
        gradient_background: gradientBackground,
        text_color: fontColor,
      });
      setGlobalSaveStatus('saved');
      setTimeout(() => setGlobalSaveStatus('idle'), 2000);
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving carousel:', err);
      setGlobalSaveStatus('error');
      setTimeout(() => setGlobalSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }, [linkedEventId, slides, gradientBackground, fontColor, onSaved, onClose, setGlobalSaveStatus]);

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

  const textColor = fontColor;
  const isImageSlide = slides[previewSlideIndex]?.type === 'image';

  // Preview area background — uses the wedding's main background
  const previewBgUrl = weddingBackground || '/images/backgrounds/blue-clouds.webp';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: RADII.dialog,
          height: '90vh',
          maxHeight: 800,
          maxWidth: 1100,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header — event name left, Save and Close + X right */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', p: '20px' }}>
        <Typography sx={{ fontWeight: 600, fontSize: '24px', color: COLORS.text.strong }}>
          {scheduleItem.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Button
            variant="outlined"
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderColor: COLORS.brand.primary,
              color: COLORS.brand.primary,
              borderRadius: RADII.sm,
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
          <IconButton onClick={onClose} sx={{ p: 0, color: COLORS.text.strong }}>
            <Close sx={{ fontSize: 24 }} />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ height: '1px', bgcolor: COLORS.border.faint, width: '100%' }} />

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <CircularProgress sx={{ color: COLORS.brand.primary }} />
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
              <Typography sx={{ fontSize: '14px', fontWeight: 400, color: COLORS.text.subtle }}>
                {'+ '}
                <Box component="span" sx={{ textDecoration: 'underline' }}>Add Slide</Box>
              </Typography>
              <Box sx={{ height: '2px', width: '100%', bgcolor: COLORS.bg.white }} />
            </Box>
          </Box>

          {/* Content area — left editor + right preview */}
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Vertical divider */}
            <Box sx={{ width: '1px', bgcolor: COLORS.border.faint, flexShrink: 0 }} />

            {/* Left panel — editor */}
            <Box sx={{ flex: 1, overflow: 'auto', p: '20px', bgcolor: COLORS.bg.white }}>
              {activeTab === 'look-feel' ? (
                <BackgroundPicker
                  selected={gradientBackground}
                  onSelect={setGradientBackground}
                  fontColor={fontColor}
                  onFontColorChange={setFontColor}
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

            {/* Right panel — live preview (uses wedding's main background) */}
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
                  borderRadius: RADII.lg,
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

              {/* CTA preview — matches what guests see on the schedule card */}
              {slides.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'underline' }}>
                    More Details
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
                    {'>'}
                  </Typography>
                </Box>
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
        color: active ? COLORS.brand.primary : COLORS.text.subtle,
      }}>
        {label}
      </Typography>
      <Box sx={{
        height: '2px',
        width: '100%',
        bgcolor: active ? COLORS.brand.primary : COLORS.bg.white,
      }} />
    </Box>
  );
}

function BackgroundPicker({
  selected,
  onSelect,
  fontColor,
  onFontColorChange,
  onStartEditing,
  hasSlides,
}: {
  selected: string;
  onSelect: (bg: string) => void;
  fontColor: string;
  onFontColorChange: (color: string) => void;
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
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}>
          {BACKGROUNDS.map((bg) => {
            const thumbName = bg.replace('.webp', '.thumb.webp');
            const isSelected = selected === bg;
            return (
              <Box
                key={bg}
                onClick={() => onSelect(bg)}
                sx={{
                  aspectRatio: '1',
                  borderRadius: RADII.lg,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isSelected ? '4px solid #DE3F5E' : '2px solid transparent',
                  transition: 'border-color 0.15s',
                  '&:hover': { borderColor: isSelected ? COLORS.brand.primary : COLORS.border.default },
                  backgroundImage: `url(/images/backgrounds/thumbs/${thumbName})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            );
          })}
        </Box>
      </Stack>

      {/* Font Color */}
      <Stack sx={{ gap: '16px' }}>
        <Typography sx={subtitleCapsSx}>
          Font Color
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {[COLORS.bg.white, COLORS.bg.subtle, '#E8D5B7', '#D4AF37', COLORS.text.strong, COLORS.text.muted, COLORS.text.subtle].map((c) => (
            <Box
              key={c}
              onClick={() => onFontColorChange(c)}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '4px',
                bgcolor: c,
                cursor: 'pointer',
                border: fontColor === c
                  ? '2px solid #DE3F5E'
                  : c === COLORS.bg.white || c === COLORS.bg.subtle
                    ? '2px solid #ddd'
                    : '2px solid transparent',
                transition: 'border-color 0.15s',
                '&:hover': { opacity: 0.85 },
              }}
            />
          ))}
        </Stack>
      </Stack>

      {hasSlides && (
        <PrimaryActionButton
          onClick={onStartEditing}
          endIcon={<ArrowForward sx={{ fontSize: 20 }} />}
          sx={{
            borderRadius: RADII.sm,
            fontSize: '16px',
            pl: 2,
            pr: 1.5,
            py: 1,
            alignSelf: 'flex-start',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          Start Editing
        </PrimaryActionButton>
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
  // Cache slide data per type so switching layouts doesn't erase content
  const typeCache = useRef<Record<string, CarouselSlide>>({});

  // Keep the cache updated with the current slide's data
  useEffect(() => {
    if (slide.type) {
      typeCache.current[slide.type] = { ...slide };
    }
  }, [slide]);

  const handleSwitchType = (newType: SlideType) => {
    if (newType === slide.type) return;
    // Save current slide data before switching
    typeCache.current[slide.type] = { ...slide };
    // Restore cached data for the target type, or create empty
    const cached = typeCache.current[newType];
    onUpdateSlide(slideIndex, cached || { ...makeEmptySlide(newType) });
  };

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
              onClick={() => handleSwitchType(opt.type)}
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
                  bgcolor: slide.type === opt.type ? '#ebebeb' : COLORS.bg.subtle,
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
              borderColor: COLORS.brand.primary,
              color: COLORS.brand.primary,
              borderRadius: RADII.sm,
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
            <PrimaryActionButton
              onClick={onNextSlide}
              endIcon={<ArrowForward sx={{ fontSize: 20 }} />}
              sx={{
                borderRadius: RADII.sm,
                fontSize: '16px',
                pl: 2,
                pr: 1.5,
                py: 1,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              Next Slide
            </PrimaryActionButton>
          )}
        </Box>
        <IconButton
          onClick={() => onDeleteSlide(slideIndex)}
          sx={{ color: COLORS.text.strong, '&:hover': { color: '#d32f2f' } }}
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
          color: COLORS.text.faint,
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
        '&::-webkit-scrollbar-thumb': { bgcolor: COLORS.border.default, borderRadius: 2 },
      }}>
        {/* Upload box — first item */}
        <Box
          onClick={() => setShowUpload(true)}
          sx={{
            flex: '0 0 169px',
            height: 300,
            borderRadius: RADII.md,
            border: '2px dashed #ccc',
            bgcolor: COLORS.bg.muted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': { borderColor: COLORS.brand.primary },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: 130 }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: RADII.dialog,
              bgcolor: '#ebebeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CloudUpload sx={{ color: COLORS.text.subtle, fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontSize: '16px', color: COLORS.text.subtle, textAlign: 'center', lineHeight: 1.5 }}>
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
                borderRadius: RADII.md,
                overflow: 'hidden',
                cursor: 'pointer',
                border: isSelected ? '4px solid #DE3F5E' : '2px solid transparent',
                '&:hover': { borderColor: isSelected ? COLORS.brand.primary : COLORS.border.default },
                backgroundImage: `url(${encodedSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                bgcolor: COLORS.bg.white,
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
