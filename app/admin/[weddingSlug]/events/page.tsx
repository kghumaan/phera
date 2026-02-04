'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import {
  Add,
  Edit,
  Delete,
  ArrowUpward,
  ArrowDownward,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { weddingService, WeddingEvent, CarouselSlide } from '@/lib/supabase/wedding-service';
import { EVENT_TEMPLATES, EventTemplate } from '@/components/admin/EventTemplates';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MobilePreviewFrame from '@/components/admin/MobilePreviewFrame';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING, ENHANCED_CONTAINER_MAX_WIDTH, SECONDARY_BUTTON_SX } from '@/lib/constants/form-styles';
import { toast } from 'sonner';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

// Available gradient backgrounds
const GRADIENT_BACKGROUNDS = [
  { value: 'GradientYellow.png', label: 'Yellow (Haldi)' },
  { value: 'GradientJaggo.png', label: 'Jaggo' },
  { value: 'GradientCottonCandy.png', label: 'Cotton Candy (Anand Karaj)' },
  { value: 'GradientPoolParty.png', label: 'Pool Party' },
  { value: 'GradientReception.png', label: 'Reception' },
];

// Available carousel images organized by event
const CAROUSEL_IMAGES = {
  haldi: [1, 2, 3, 4].map(n => `/images/carousel/haldi/${n}.png`),
  jaggo: [1, 2, 3, 4, 5].map(n => `/images/carousel/jaggo/${n}.png`),
  anand_karaj: [1, 2, 3].map(n => `/images/carousel/anand_karaj/${n}.png`),
  pool_party: [1, 2, 3].map(n => `/images/carousel/pool_party/${n}.png`),
  reception: [1, 2, 3].map(n => `/images/carousel/reception/${n}.png`),
};

// Get all available images as flat array
const ALL_IMAGES = Object.values(CAROUSEL_IMAGES).flat();

export default function EventsPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<WeddingEvent> | null>(null);
  const [currentSlide, setCurrentSlide] = useState<Partial<CarouselSlide> | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(-1);
  const [previewMode, setPreviewMode] = useState<'list' | 'carousel'>('list');
  const [previewEventIndex, setPreviewEventIndex] = useState(0);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null); // Kept for local usage if needed, but primary feedback is toast
  // success state removed as replaced by toast

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      setLoading(true);
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        const eventsData = await weddingService.getWeddingEvents(wedding.id);
        setEvents(eventsData);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromTemplate = (template: EventTemplate) => {
    setCurrentEvent({
      ...template,
      wedding_id: weddingId!,
      is_template: true,
      order_index: events.length,
      outfit_ideas_women: template.outfit_ideas_women,
      outfit_ideas_men: template.outfit_ideas_men,
      carousel_slides: [],
      text_color: '#141414',
      gradient_background: 'GradientYellow.png',
    });
    setFieldErrors({});
    setTemplateDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleAddCustom = () => {
    setCurrentEvent({
      wedding_id: weddingId!,
      name: '',
      slug: '',
      date: '',
      time: '',
      dress_code: '',
      dress_code_emoji: '',
      dress_code_description: '',
      outfit_ideas_women: [],
      outfit_ideas_men: [],
      ritual_name: '',
      ritual_description: '',
      carousel_slides: [],
      gradient_background: 'GradientYellow.png',
      text_color: '#141414',
      order_index: events.length,
      is_template: false,
    });
    setFieldErrors({});
    setEditDialogOpen(true);
  };

  const handleEdit = (event: WeddingEvent) => {
    setCurrentEvent(event);
    setFieldErrors({});
    setEditDialogOpen(true);
  };


  const handlePreviewEventClick = (index: number) => {
    setPreviewEventIndex(index);
    setPreviewMode('carousel');
    setPreviewSlideIndex(0);
  };

  const handleBackToEventsList = () => {
    setPreviewMode('list');
    setPreviewEventIndex(0);
    setPreviewSlideIndex(0);
  };

  const handleAddSlide = () => {
    setCurrentSlide({
      type: 'dress_code',
      title: '',
      subtitle: '',
      heading: '',
      description: '',
    });
    setCurrentSlideIndex(-1);
    setSlideDialogOpen(true);
  };

  const handleEditSlide = (index: number) => {
    const slides = (currentEvent?.carousel_slides as CarouselSlide[]) || [];
    setCurrentSlide(slides[index]);
    setCurrentSlideIndex(index);
    setSlideDialogOpen(true);
  };

  const handleSaveSlide = () => {
    if (!currentSlide || !currentEvent) return;

    const slides = [...((currentEvent.carousel_slides as CarouselSlide[]) || [])];

    if (currentSlideIndex >= 0) {
      slides[currentSlideIndex] = currentSlide as CarouselSlide;
    } else {
      slides.push(currentSlide as CarouselSlide);
    }

    setCurrentEvent({ ...currentEvent, carousel_slides: slides });
    setSlideDialogOpen(false);
    setCurrentSlide(null);
    setCurrentSlideIndex(-1);
    toast.info('Slide saved! Remember to save the event.');
  };

  const handleDeleteSlide = (index: number) => {
    if (!currentEvent) return;
    const slides = [...((currentEvent.carousel_slides as CarouselSlide[]) || [])];
    slides.splice(index, 1);
    setCurrentEvent({ ...currentEvent, carousel_slides: slides });
    toast.info('Slide deleted! Remember to save the event.');
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (!currentEvent) return;
    const slides = [...((currentEvent.carousel_slides as CarouselSlide[]) || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
    setCurrentEvent({ ...currentEvent, carousel_slides: slides });
    toast.info('Slide reordered! Remember to save the event.');
  };

  const handleSaveEvent = async () => {
    if (!currentEvent) return;

    try {
      setError(null);
      const newFieldErrors: Record<string, boolean> = {};
      if (!currentEvent.name) newFieldErrors.name = true;
      if (!currentEvent.date) newFieldErrors.date = true;
      if (!currentEvent.dress_code) newFieldErrors.dress_code = true;

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        toast.error('Please fill in required fields');
        return;
      }

      setFieldErrors({});

      if (!currentEvent.slug) {
        currentEvent.slug = (currentEvent.name || '').toLowerCase().replace(/\s+/g, '-');
      }

      if (currentEvent.id) {
        await weddingService.updateEvent(currentEvent.id, currentEvent);
      } else {
        await weddingService.createEvent(currentEvent);
      }

      await loadData();
      setEditDialogOpen(false);
      setCurrentEvent(null);
      toast.success('Event saved successfully!');
    } catch (err) {
      console.error('Error saving event:', err);
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await weddingService.deleteEvent(eventId);
      await loadData();
      toast.success('Event deleted successfully');
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error('Failed to delete event');
    }
  };

  const updateCurrentEvent = (field: string, value: any) => {
    setCurrentEvent(prev => prev ? { ...prev, [field]: value } : null);
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addOutfitIdea = (gender: 'women' | 'men', idea: string) => {
    if (!idea.trim()) return;
    const field = `outfit_ideas_${gender}`;
    const current = (currentEvent?.[field as keyof typeof currentEvent] as string[]) || [];
    updateCurrentEvent(field, [...current, idea]);
  };

  const removeOutfitIdea = (gender: 'women' | 'men', index: number) => {
    const field = `outfit_ideas_${gender}`;
    const current = (currentEvent?.[field as keyof typeof currentEvent] as string[]) || [];
    updateCurrentEvent(field, current.filter((_, i) => i !== index));
  };

  // Mobile Preview Component - Always visible showing events list or carousel
  const MobilePreview = () => {
    if (previewMode === 'list') {
      return (
        <MobilePreviewFrame title="Events & Dress Code" onBackClick={undefined}>
          {events.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Box sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '12px',
                p: 3,
                boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
              }}>
                <Typography sx={{ color: '#6a6a6a', textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
                  Add an event to see preview
                </Typography>
              </Box>
            </Box>
          ) : (
            <Stack spacing={2}>
              {events.map((event, index) => (
                <Box
                  key={event.id}
                  onClick={() => handlePreviewEventClick(index)}
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0px 0px 40px 0px rgba(0, 0, 0, 0.16)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex' }}>
                    {event.gradient_background && (
                      <Box
                        sx={{
                          width: 8,
                          flexShrink: 0,
                          backgroundImage: `url(/images/backgrounds/${event.gradient_background})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 2, py: 2, backgroundColor: '#fff' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontFamily: 'Outfit',
                            fontWeight: 600,
                            fontSize: 12,
                            lineHeight: 1.5,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            color: '#474747',
                            mb: 0.5,
                          }}
                        >
                          {event.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'Outfit',
                            fontWeight: 500,
                            fontSize: 18,
                            lineHeight: 1.3,
                            color: '#000',
                            mb: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          {event.dress_code_emoji} {event.dress_code}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'Outfit',
                            fontWeight: 300,
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: '#858585',
                          }}
                        >
                          {event.date} @ {event.time}
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 6L16 12L10 18" stroke="#858585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </MobilePreviewFrame>
      );
    }

    // Carousel preview mode
    const event = events[previewEventIndex];
    if (!event) return null;
    const slides = (event.carousel_slides as CarouselSlide[]) || [];

    return (
      <MobilePreviewFrame title={event.name} onBackClick={handleBackToEventsList}>
        {slides.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontFamily: 'Outfit', fontSize: 14, color: '#6a6a6a', textAlign: 'center' }}>
              No carousel slides for this event
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Carousel */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
              {slides.map((slide, index) => (
                <Box
                  key={index}
                  sx={{
                    display: index === previewSlideIndex ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <Card
                    sx={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: index % 2 === 0 ? 'transparent' : '#FFFFFF',
                      backgroundImage: index % 2 === 0 ? `url(/images/backgrounds/${event.gradient_background})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '12px',
                      border: index % 2 === 0 || slide.type === 'image' ? '1px solid #FFFFFF' : 'none',
                      overflow: 'hidden',
                    }}
                  >
                    <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                      {slide.type === 'image' ? (
                        <Box
                          component="img"
                          src={slide.src}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                      ) : (
                        <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
                          {slide.subtitle && (
                            <Typography sx={{ fontFamily: 'Outfit', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: event.text_color || '#141414', opacity: 0.7 }}>
                              {slide.subtitle}
                            </Typography>
                          )}
                          {slide.heading && (
                            <Typography sx={{ fontFamily: 'Instrument Serif', fontSize: 20, fontWeight: 400, fontStyle: 'italic', color: event.text_color || '#141414' }}>
                              {slide.heading}
                            </Typography>
                          )}
                          {slide.description && (
                            <Typography sx={{ fontFamily: 'Outfit', fontSize: 11, color: event.text_color || '#141414' }}>
                              {slide.description}
                            </Typography>
                          )}
                          {slide.women && slide.women.length > 0 && (
                            <Box>
                              <Typography sx={{ fontSize: 9, fontWeight: 600, color: event.text_color || '#141414' }}>Women</Typography>
                              {slide.women.map((item, i) => (
                                <Typography key={i} sx={{ fontSize: 10, color: event.text_color || '#141414' }}>{item}</Typography>
                              ))}
                            </Box>
                          )}
                          {slide.men && slide.men.length > 0 && (
                            <Box>
                              <Typography sx={{ fontSize: 9, fontWeight: 600, color: event.text_color || '#141414' }}>Men</Typography>
                              {slide.men.map((item, i) => (
                                <Typography key={i} sx={{ fontSize: 10, color: event.text_color || '#141414' }}>{item}</Typography>
                              ))}
                            </Box>
                          )}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>

            {/* Navigation */}
            {slides.length > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, py: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setPreviewSlideIndex(Math.max(0, previewSlideIndex - 1))}
                  disabled={previewSlideIndex === 0}
                  sx={{ bgcolor: 'rgba(255,255,255,0.8)', color: '#000' }}
                >
                  <ChevronLeft sx={{ color: '#000' }} />
                </IconButton>
                <Typography sx={{ fontSize: 12, color: '#000' }}>
                  {previewSlideIndex + 1} / {slides.length}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setPreviewSlideIndex(Math.min(slides.length - 1, previewSlideIndex + 1))}
                  disabled={previewSlideIndex === slides.length - 1}
                  sx={{ bgcolor: 'rgba(255,255,255,0.8)', color: '#000' }}
                >
                  <ChevronRight sx={{ color: '#000' }} />
                </IconButton>
              </Box>
            )}
          </Box>
        )}
      </MobilePreviewFrame>
    );
  };

  if (loading && events.length === 0 && !weddingId) {
    return (
      <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
        <LoadingSpinner message="Loading events..." />
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ maxWidth: '100%', px: { xs: 2, md: 4, lg: 6 } }}>
      <Grid container spacing={6}>
        {/* Left Column - Events List & Forms */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={ENHANCED_SECTION_SPACING} sx={{ pt: { xs: 6, lg: 0 } }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Events & Dress Code
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Manage your wedding events, dress codes, and carousel content
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setTemplateDialogOpen(true)}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#C8365A' },
                }}
              >
                Add from Template
              </Button>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddCustom}
                sx={SECONDARY_BUTTON_SX}
              >
                Add Custom Event
              </Button>
            </Stack>

            <Stack spacing={2}>
              {events.map((event) => (
                <Paper
                  key={event.id}
                  sx={{
                    borderRadius: '16px',
                    bgcolor: '#fff',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', color: '#474747', mb: 0.5 }}>
                          {event.name}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 500, fontSize: 20, color: '#000', mb: 0.5 }}>
                          {event.dress_code_emoji} {event.dress_code}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: 14, color: '#858585' }}>
                          {event.date} @ {event.time}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: 12, color: '#6a6a6a', mt: 1, display: 'block' }}>
                          {(event.carousel_slides as CarouselSlide[] || []).length} carousel slides
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => handleEdit(event)} size="small" sx={{ color: '#DE3F5E' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteEvent(event.id)} size="small" sx={{ color: '#DE3F5E' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              ))}

              {events.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: 'white' }}>
                  <Typography sx={{ color: '#6a6a6a' }}>
                    No events yet. Add your first event to get started.
                  </Typography>
                </Paper>
              )}
            </Stack>
          </Stack>
        </Grid>

        {/* Right Column - Fixed Mobile Preview (always visible) */}
        <Grid size={{ xs: 12, lg: 5 }} sx={{ display: { xs: 'none', lg: 'block' }, position: 'relative' }}>
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '79.17%',
              transform: 'translate(-50%, -50%)',
              width: { lg: '520px' },
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MobilePreview />
          </Box>
        </Grid>

        {/* Mobile Preview at Bottom (Mobile only) */}
        <Grid size={{ xs: 12 }} sx={{ display: { xs: 'block', lg: 'none' }, mt: 4 }}>
          <MobilePreview />
        </Grid>
      </Grid>

      {/* Template Selection Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'white',
          }
        }}
      >
        <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem', lg: '1.75rem' } }}>
          Choose an Event Template
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {EVENT_TEMPLATES.map((template) => (
              <Grid size={{ xs: 12, sm: 6 }} key={template.slug}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderRadius: '12px',
                    bgcolor: '#f5f5f5',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                      bgcolor: '#ececec',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                  onClick={() => handleAddFromTemplate(template)}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                    {template.dress_code_emoji} {template.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                    {template.dress_code}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
          <Button onClick={() => setTemplateDialogOpen(false)} sx={{ color: '#6a6a6a' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Basic Event Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'white',
          }
        }}
      >
        <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem', lg: '1.75rem' } }}>
          {currentEvent?.id ? 'Edit Event' : 'New Event'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Event Name *"
              fullWidth
              value={currentEvent?.name || ''}
              onChange={(e) => updateCurrentEvent('name', e.target.value)}
              error={fieldErrors.name}
              sx={textFieldSx}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Date *"
                  type="date"
                  fullWidth
                  value={currentEvent?.date || ''}
                  onChange={(e) => updateCurrentEvent('date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={fieldErrors.date}
                  sx={textFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Time *"
                  fullWidth
                  value={currentEvent?.time || ''}
                  onChange={(e) => updateCurrentEvent('time', e.target.value)}
                  sx={textFieldSx}
                />
              </Grid>
            </Grid>

            <TextField
              label="Dress Code *"
              fullWidth
              value={currentEvent?.dress_code || ''}
              onChange={(e) => updateCurrentEvent('dress_code', e.target.value)}
              error={fieldErrors.dress_code}
              sx={textFieldSx}
            />

            <TextField
              label="Dress Code Emoji"
              fullWidth
              value={currentEvent?.dress_code_emoji || ''}
              onChange={(e) => updateCurrentEvent('dress_code_emoji', e.target.value)}
              placeholder="e.g., 🌻"
              sx={textFieldSx}
            />

            <TextField
              label="Dress Code Description"
              fullWidth
              multiline
              rows={2}
              value={currentEvent?.dress_code_description || ''}
              onChange={(e) => updateCurrentEvent('dress_code_description', e.target.value)}
              sx={textFieldSx}
            />

            <FormControl fullWidth sx={textFieldSx}>
              <InputLabel sx={{ color: '#1a1a1a' }}>Gradient Background</InputLabel>
              <Select
                value={currentEvent?.gradient_background || 'GradientYellow.png'}
                onChange={(e) => updateCurrentEvent('gradient_background', e.target.value)}
                label="Gradient Background"
                sx={{ color: '#1a1a1a' }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'white',
                      '& .MuiMenuItem-root': {
                        color: '#1a1a1a',
                      },
                    },
                  },
                }}
              >
                {GRADIENT_BACKGROUNDS.map((bg) => (
                  <MenuItem key={bg.value} value={bg.value}>{bg.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel sx={{ color: '#1a1a1a', fontWeight: 600, mb: 1 }}>Text Color (for gradient slides)</FormLabel>
              <RadioGroup
                row
                value={currentEvent?.text_color || '#141414'}
                onChange={(e) => updateCurrentEvent('text_color', e.target.value)}
              >
                <FormControlLabel
                  value="#141414"
                  control={<Radio sx={{ color: '#1a1a1a', '&.Mui-checked': { color: '#DE3F5E' } }} />}
                  label={<span style={{ color: '#1a1a1a' }}>Black</span>}
                />
                <FormControlLabel
                  value="#FFFFFF"
                  control={<Radio sx={{ color: '#1a1a1a', '&.Mui-checked': { color: '#DE3F5E' } }} />}
                  label={<span style={{ color: '#1a1a1a' }}>White</span>}
                />
              </RadioGroup>
            </FormControl>

            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '1.125rem', md: '1.25rem', lg: '1.375rem' } }}>Outfit Ideas - Women</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {((currentEvent?.outfit_ideas_women as string[]) || []).map((idea, idx) => (
                <Chip key={idx} label={idea} onDelete={() => removeOutfitIdea('women', idx)} sx={{ bgcolor: '#f5f5f5', color: '#1a1a1a' }} />
              ))}
              <TextField
                size="small"
                placeholder="Add idea (press Enter)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addOutfitIdea('women', (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                sx={{
                  minWidth: '200px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#1a1a1a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1a1a1a',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#DE3F5E',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#4a4a4a',
                    opacity: 1,
                  },
                }}
              />
            </Stack>

            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: { xs: '1.125rem', md: '1.25rem', lg: '1.375rem' } }}>Outfit Ideas - Men</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {((currentEvent?.outfit_ideas_men as string[]) || []).map((idea, idx) => (
                <Chip key={idx} label={idea} onDelete={() => removeOutfitIdea('men', idx)} sx={{ bgcolor: '#f5f5f5', color: '#1a1a1a' }} />
              ))}
              <TextField
                size="small"
                placeholder="Add idea (press Enter)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addOutfitIdea('men', (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                sx={{
                  minWidth: '200px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#1a1a1a',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1a1a1a',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#DE3F5E',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#4a4a4a',
                    opacity: 1,
                  },
                }}
              />
            </Stack>

            <TextField
              label="Ritual/Vibe Name"
              fullWidth
              value={currentEvent?.ritual_name || ''}
              onChange={(e) => updateCurrentEvent('ritual_name', e.target.value)}
              sx={textFieldSx}
            />

            <TextField
              label="Ritual/Vibe Description"
              fullWidth
              multiline
              rows={3}
              value={currentEvent?.ritual_description || ''}
              onChange={(e) => updateCurrentEvent('ritual_description', e.target.value)}
              sx={textFieldSx}
            />

            {/* Carousel Slides Section */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #f0f0f0' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a', fontSize: { xs: '1.25rem', md: '1.5rem', lg: '1.625rem' } }}>
                Carousel Slides
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 3, fontSize: { xs: '0.875rem', md: '1rem', lg: '1.125rem' } }}>
                Add and manage slides that will appear when guests view this event
              </Typography>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddSlide}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  mb: 2,
                  fontSize: { xs: '0.875rem', md: '1rem', lg: '1.125rem' },
                  py: { xs: 1, md: 1.5, lg: 1.75 },
                  px: { xs: 2, md: 3, lg: 3.5 },
                  '&:hover': { bgcolor: '#C8365A' },
                }}
              >
                Add Slide
              </Button>

              <Stack spacing={2}>
                {((currentEvent?.carousel_slides as CarouselSlide[]) || []).map((slide, index) => (
                  <Paper key={index} sx={{ p: 2, borderRadius: '12px', bgcolor: '#fafafa' }}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                          Slide {index + 1}: {slide.type}
                        </Typography>
                        {slide.type === 'image' && slide.src && (
                          <Typography variant="body2" sx={{ color: '#6a6a6a', fontSize: 13 }}>
                            Image: {slide.src}
                          </Typography>
                        )}
                        {slide.type !== 'image' && (
                          <Stack spacing={0.5} sx={{ mt: 1 }}>
                            {slide.subtitle && (
                              <Typography variant="body2" sx={{ color: '#1a1a1a', fontSize: 12 }}>
                                <strong>Subtitle:</strong> {slide.subtitle}
                              </Typography>
                            )}
                            {slide.heading && (
                              <Typography variant="body2" sx={{ color: '#1a1a1a', fontSize: 12 }}>
                                <strong>Heading:</strong> {slide.heading}
                              </Typography>
                            )}
                            {slide.description && (
                              <Typography variant="body2" sx={{ color: '#6a6a6a', fontSize: 12 }}>
                                <strong>Description:</strong> {slide.description}
                              </Typography>
                            )}
                            {slide.women && slide.women.length > 0 && (
                              <Typography variant="body2" sx={{ color: '#6a6a6a', fontSize: 12 }}>
                                <strong>Women:</strong> {slide.women.join(', ')}
                              </Typography>
                            )}
                            {slide.men && slide.men.length > 0 && (
                              <Typography variant="body2" sx={{ color: '#6a6a6a', fontSize: 12 }}>
                                <strong>Men:</strong> {slide.men.join(', ')}
                              </Typography>
                            )}
                          </Stack>
                        )}
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleMoveSlide(index, 'up')} disabled={index === 0}>
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveSlide(index, 'down')}
                          disabled={index === ((currentEvent?.carousel_slides as CarouselSlide[]) || []).length - 1}
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditSlide(index)} sx={{ color: '#DE3F5E' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteSlide(index)} sx={{ color: '#DE3F5E' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}

                {((currentEvent?.carousel_slides as CarouselSlide[]) || []).length === 0 && (
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', bgcolor: 'white' }}>
                    <Typography sx={{ color: '#6a6a6a' }}>
                      No carousel slides yet. Add your first slide to get started.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#6a6a6a', fontSize: { xs: '0.875rem', md: '1rem', lg: '1.125rem' } }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEvent}
            sx={{
              bgcolor: '#DE3F5E',
              color: 'white',
              fontSize: { xs: '0.875rem', md: '1rem', lg: '1.125rem' },
              py: { xs: 1, md: 1.25, lg: 1.5 },
              px: { xs: 2, md: 3, lg: 3.5 },
              '&:hover': { bgcolor: '#C8365A' }
            }}
          >
            Save Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Slide Edit Dialog */}
      <Dialog
        open={slideDialogOpen}
        onClose={() => setSlideDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'white',
          }
        }}
      >
        <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem', lg: '1.75rem' } }}>
          {currentSlideIndex >= 0 ? 'Edit Slide' : 'Add Slide'}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'white' }}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={textFieldSx}>
              <InputLabel sx={{ color: '#1a1a1a' }}>Slide Type</InputLabel>
              <Select
                value={currentSlide?.type || 'dress_code'}
                onChange={(e) => setCurrentSlide({ ...currentSlide, type: e.target.value as any })}
                label="Slide Type"
                sx={{ color: '#1a1a1a' }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'white',
                      '& .MuiMenuItem-root': {
                        color: '#1a1a1a',
                      },
                    },
                  },
                }}
              >
                <MenuItem value="dress_code">Dress Code</MenuItem>
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="outfit_ideas">Outfit Ideas</MenuItem>
                <MenuItem value="ritual">Ritual/Vibe</MenuItem>
              </Select>
            </FormControl>

            {currentSlide?.type === 'image' && (
              <FormControl fullWidth sx={textFieldSx}>
                <InputLabel sx={{ color: '#1a1a1a' }}>Select Image</InputLabel>
                <Select
                  value={currentSlide?.src || ''}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, src: e.target.value })}
                  label="Select Image"
                  sx={{ color: '#1a1a1a' }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'white',
                        '& .MuiMenuItem-root': {
                          color: '#1a1a1a',
                        },
                      },
                    },
                  }}
                >
                  {ALL_IMAGES.map((img) => (
                    <MenuItem key={img} value={img}>{img}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {currentSlide?.type !== 'image' && (
              <>
                <TextField
                  label="Subtitle"
                  fullWidth
                  value={currentSlide?.subtitle || ''}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, subtitle: e.target.value })}
                  sx={textFieldSx}
                />
                <TextField
                  label="Heading"
                  fullWidth
                  value={currentSlide?.heading || ''}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, heading: e.target.value })}
                  sx={textFieldSx}
                />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={currentSlide?.description || ''}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, description: e.target.value })}
                  sx={textFieldSx}
                />
              </>
            )}

            {currentSlide?.type === 'outfit_ideas' && (
              <>
                <Typography variant="subtitle2" sx={{ color: '#1a1a1a', fontWeight: 600 }}>Women Ideas (comma separated)</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={(currentSlide?.women || []).join(', ')}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, women: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  sx={textFieldSx}
                />
                <Typography variant="subtitle2" sx={{ color: '#1a1a1a', fontWeight: 600 }}>Men Ideas (comma separated)</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={(currentSlide?.men || []).join(', ')}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, men: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  sx={textFieldSx}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
          <Button onClick={() => setSlideDialogOpen(false)} sx={{ color: '#6a6a6a' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSlide}
            sx={{
              bgcolor: '#DE3F5E',
              color: 'white',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#C8365A' },
            }}
          >
            Save Slide
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
