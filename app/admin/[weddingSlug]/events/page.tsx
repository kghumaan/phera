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
  Checkbox,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { useState, useEffect, use } from 'react';
import { parseISO, format } from 'date-fns';
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
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

// Available gradient backgrounds
const GRADIENT_BACKGROUNDS = [
  { value: 'GradientYellow.png', label: 'Yellow (Haldi)' },
  { value: 'GradientJaggo.png', label: 'Jaggo' },
  { value: 'GradientCottonCandy.png', label: 'Cotton Candy (Anand Karaj)' },
  { value: 'GradientPoolParty.png', label: 'Pool Party' },
  { value: 'GradientReception.png', label: 'Reception' },
];



export default function EventsPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [weddingDates, setWeddingDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [showDressCodeDetails, setShowDressCodeDetails] = useState(false);
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
        setWeddingDates({
          start: wedding.wedding_date ? parseISO(wedding.wedding_date) : null,
          end: wedding.wedding_date_end ? parseISO(wedding.wedding_date_end) : null,
        });
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
      outfit_example_url: null,
    });
    setFieldErrors({});
    setShowDressCodeDetails(false);
    setTemplateDialogOpen(false);
    setIsEditing(true);
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
      outfit_example_url: null,
    });
    setFieldErrors({});
    setShowDressCodeDetails(false);
    setIsEditing(true);
  };

  const handleEdit = (event: WeddingEvent) => {
    setCurrentEvent(event);
    setFieldErrors({});
    setShowDressCodeDetails(!!event.dress_code || !!event.dress_code_description || !!event.outfit_example_url);
    setIsEditing(true);
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
      setIsEditing(false);
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
    // Determine what to show in preview
    const activeEvent = isEditing && currentEvent ? currentEvent : events[previewEventIndex];
    const isShowingActiveList = previewMode === 'list' && (!isEditing || !currentEvent);

    if (isShowingActiveList) {
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
                          {event.dress_code}
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

    // Carousel/Single Event preview mode
    if (!activeEvent) return null;
    const slides = (activeEvent.carousel_slides as CarouselSlide[]) || [];

    // If editing, we might want to prioritize showing the main details first
    const previewSlides: CarouselSlide[] = [];

    // Add a virtual first slide for the current event details if we're editing
    previewSlides.push({
      type: 'ritual',
      heading: activeEvent.ritual_name || 'Event Title',
      description: activeEvent.ritual_description || 'Event description will appear here.',
      subtitle: activeEvent.name || 'Event',
    });

    // Add outfit example slide if available
    if (activeEvent.outfit_example_url) {
      previewSlides.push({
        type: 'image',
        src: activeEvent.outfit_example_url,
      });
    }

    // Append regular slides
    previewSlides.push(...slides);

    return (
      <MobilePreviewFrame title={activeEvent.name || 'Event Preview'} onBackClick={isEditing ? undefined : handleBackToEventsList}>
        <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Carousel */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            {previewSlides.map((slide, index) => (
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
                    backgroundColor: slide.type === 'image' ? 'transparent' : '#FFFFFF',
                    backgroundImage: slide.type !== 'image' ? `url(/images/backgrounds/${activeEvent.gradient_background || 'GradientYellow.png'})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '12px',
                    border: '1px solid #FFFFFF',
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
                          <Typography sx={{ fontFamily: 'Outfit', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: activeEvent.text_color || '#141414', opacity: 0.7 }}>
                            {slide.subtitle}
                          </Typography>
                        )}
                        {slide.heading && (
                          <Typography sx={{ fontFamily: 'Instrument Serif', fontSize: 20, fontWeight: 400, fontStyle: 'italic', color: activeEvent.text_color || '#141414' }}>
                            {slide.heading}
                          </Typography>
                        )}
                        {slide.description && (
                          <Typography sx={{ fontFamily: 'Outfit', fontSize: 11, color: activeEvent.text_color || '#141414' }}>
                            {slide.description}
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>

          {/* Navigation */}
          {previewSlides.length > 1 && (
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
                {previewSlideIndex + 1} / {previewSlides.length}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setPreviewSlideIndex(Math.min(previewSlides.length - 1, previewSlideIndex + 1))}
                disabled={previewSlideIndex === previewSlides.length - 1}
                sx={{ bgcolor: 'rgba(255,255,255,0.8)', color: '#000' }}
              >
                <ChevronRight sx={{ color: '#000' }} />
              </IconButton>
            </Box>
          )}
        </Box>
      </MobilePreviewFrame>
    );
  };

  if (loading && events.length === 0 && !weddingId) {
    return (
      <Box sx={{ p: 4 }}>
        <LoadingSpinner message="Loading events..." />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Events & Dress Code
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            {isEditing ? 'Editing event details' : 'Manage your wedding events, dress codes, and carousel content'}
          </Typography>
        </Box>

        {isEditing && currentEvent ? (
          <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: '24px', bgcolor: 'white', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack spacing={4}>
                <TextField
                  label="Event Title *"
                  fullWidth
                  value={currentEvent.name || ''}
                  onChange={(e) => updateCurrentEvent('name', e.target.value)}
                  error={fieldErrors.name}
                  sx={textFieldSx}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MobileDatePicker
                      label="Event Date *"
                      value={currentEvent.date ? parseISO(currentEvent.date) : null}
                      onChange={(date) => updateCurrentEvent('date', date ? date.toISOString().split('T')[0] : '')}
                      minDate={weddingDates.start || undefined}
                      maxDate={weddingDates.end || undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!fieldErrors.date,
                          sx: textFieldSx
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MobileTimePicker
                      label="Event Time *"
                      value={currentEvent.time ? parseISO(`2000-01-01T${currentEvent.time}`) : null}
                      onChange={(time) => updateCurrentEvent('time', time ? format(time, 'HH:mm') : '')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          sx: textFieldSx
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Event Vibe / Subtitle"
                  fullWidth
                  value={currentEvent.ritual_name || ''}
                  onChange={(e) => updateCurrentEvent('ritual_name', e.target.value)}
                  placeholder="e.g. Traditional & Spiritual"
                  sx={textFieldSx}
                />

                <TextField
                  label="Event Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={currentEvent.ritual_description || ''}
                  onChange={(e) => updateCurrentEvent('ritual_description', e.target.value)}
                  placeholder="Give your guests more details about what to expect!"
                  sx={textFieldSx}
                />

                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showDressCodeDetails}
                        onChange={(e) => setShowDressCodeDetails(e.target.checked)}
                      />
                    }
                    label="Provide Dress Code Details?"
                  />
                </Box>

                {showDressCodeDetails && (
                  <Stack spacing={4} sx={{ pt: 2, borderTop: '1px solid #eee' }}>
                    <TextField
                      label="Dress Code Name"
                      fullWidth
                      value={currentEvent.dress_code || ''}
                      onChange={(e) => updateCurrentEvent('dress_code', e.target.value)}
                      placeholder="Shades of Yellow, Cocktail Glam, etc."
                      sx={textFieldSx}
                    />

                    <TextField
                      label="Dress Code Description"
                      fullWidth
                      multiline
                      rows={2}
                      value={currentEvent.dress_code_description || ''}
                      onChange={(e) => updateCurrentEvent('dress_code_description', e.target.value)}
                      placeholder="Briefly describe the dress code expectations."
                      sx={textFieldSx}
                    />

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Background</Typography>
                      <Grid container spacing={1}>
                        {GRADIENT_BACKGROUNDS.map((bg) => (
                          <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={bg.value}>
                            <Box
                              onClick={() => updateCurrentEvent('gradient_background', bg.value)}
                              sx={{
                                cursor: 'pointer',
                                borderRadius: '8px',
                                border: currentEvent.gradient_background === bg.value ? '3px solid #DE3F5E' : '1px solid #eee',
                                overflow: 'hidden',
                                aspectRatio: '1',
                                position: 'relative',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.05)' }
                              }}
                            >
                              <Box
                                component="img"
                                src={`/images/backgrounds/${bg.value}`}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                bgcolor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                fontSize: '10px',
                                p: 0.5,
                                textAlign: 'center'
                              }}>
                                {bg.label}
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Want to display example outfits? Upload Here</Typography>
                      <ImageUpload
                        value={currentEvent.outfit_example_url || ''}
                        onChange={(url) => updateCurrentEvent('outfit_example_url', url)}
                        path={getWeddingImagePath(weddingId!, 'outfits')}
                        label="Outfit Example"
                        aspectRatio="3/4"
                      />
                    </Box>
                  </Stack>
                )}

                <Stack direction="row" spacing={2} sx={{ pt: 4, borderTop: '1px solid #eee' }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveEvent}
                    sx={{
                      flex: 1,
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      borderRadius: '12px',
                      py: 1.5,
                      fontSize: 16,
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#C8365A' },
                    }}
                  >
                    Save Event
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false);
                      setCurrentEvent(null);
                    }}
                    sx={{
                      flex: 1,
                      borderRadius: '12px',
                      borderColor: '#eee',
                      color: '#6a6a6a',
                      '&:hover': { borderColor: '#ddd', bgcolor: '#f9f9f9' },
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </LocalizationProvider>
          </Paper>
        ) : (
          <>
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
                        <Typography variant="h6" sx={{ fontWeight: 500, fontSize: 18, color: '#000', mb: 0.5 }}>
                          {event.dress_code_emoji} {event.dress_code || 'No Dress Code Set'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: 14, color: '#858585' }}>
                          {event.date} @ {event.time}
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
          </>
        )}
      </Stack>

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
                <MenuItem value="ritual">Ritual/Vibe</MenuItem>
              </Select>
            </FormControl>

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
    </Box>
  );
}
