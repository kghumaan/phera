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

import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING, ENHANCED_CONTAINER_MAX_WIDTH, SECONDARY_BUTTON_SX } from '@/lib/constants/form-styles';
import { toast } from 'sonner';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';

import StreamlineIcon, { StreamlineIconName } from '@/components/ui/StreamlineIcon';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

// Available gradient backgrounds
const GRADIENT_BACKGROUNDS = [
  { value: 'GradientYellow.png', label: 'Yellow (Haldi)' },
  { value: 'GradientJaggo.png', label: 'Jaggo' },
  { value: 'GradientCottonCandy.png', label: 'Cotton Candy (Anand Karaj)' },
  { value: 'GradientPoolParty.png', label: 'Pool Party' },
  { value: 'GradientReception.png', label: 'Reception' },
];

// Slide type options
const SLIDE_TYPES = [
  { value: 'three_lines', label: 'Header + Title + Description' },
  { value: 'two_sections', label: 'Two Sections (Women/Men style)' },
  { value: 'image', label: 'Full Image' },
];

import { AVAILABLE_ICONS } from '@/lib/constants/icons';

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
      carousel_slides: template.carousel_slides || [],
      text_color: '#FFFFFF',
      gradient_background: template.gradient_background?.replace('/images/backgrounds/', '') || 'GradientYellow.png',
      outfit_example_url: null,
      dress_code_icon: template.dress_code_icon,
    });
    setFieldErrors({});
    setShowDressCodeDetails(true); // Show dress code details since templates have this info
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
      dress_code_icon: 'flower',
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
        await weddingService.createEvent(currentEvent as any); // Type assertion needed for optional fields
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
                <Stack direction="row" spacing={2} alignItems="stretch">
                  <FormControl sx={{ minWidth: 80, '& .MuiInputBase-root': { height: '56px' } }}>
                    <InputLabel id="event-icon-select-label">Icon</InputLabel>
                    <Select
                      labelId="event-icon-select-label"
                      label="Icon"
                      value={currentEvent.dress_code_icon || ''}
                      onChange={(e) => updateCurrentEvent('dress_code_icon', e.target.value)}
                      renderValue={(selected) => {
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {selected && <StreamlineIcon name={selected as any} size={20} color="#1a1a1a" />}
                          </Box>
                        );
                      }}
                      sx={{
                        borderRadius: '16px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#DE3F5E',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#DE3F5E',
                        },
                        '& .MuiSelect-select': {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: 'white',
                            borderRadius: '16px',
                            mt: 1,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                            maxHeight: 300,
                            '& .MuiMenuItem-root': {
                              p: 1.5,
                              m: 0.5,
                              borderRadius: '8px',
                              color: '#1a1a1a',
                              '&:hover': {
                                bgcolor: 'rgba(222, 63, 94, 0.04)',
                              },
                              '&.Mui-selected': {
                                bgcolor: 'rgba(222, 63, 94, 0.08) !important',
                                color: '#DE3F5E',
                                fontWeight: 600,
                              },
                            },
                          }
                        }
                      }}
                    >
                      <MenuItem value="">
                        <Typography variant="body2" sx={{ color: '#6a6a6a' }}>None</Typography>
                      </MenuItem>
                      {AVAILABLE_ICONS.map((icon) => (
                        <MenuItem key={icon.name} value={icon.name}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <StreamlineIcon name={icon.name} size={20} />
                            <Typography variant="body2">{icon.label}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Event Title *"
                    fullWidth
                    value={currentEvent.name || ''}
                    onChange={(e) => updateCurrentEvent('name', e.target.value)}
                    error={fieldErrors.name}
                    sx={textFieldSx}
                  />
                </Stack>

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
                        },
                        actionBar: {
                          actions: ['cancel', 'accept'],
                          sx: {
                            '& .MuiButton-root': {
                              color: '#DE3F5E',
                              fontWeight: 700,
                            }
                          }
                        },
                        calendarHeader: {
                          sx: {
                            '& .MuiPickersCalendarHeader-label': { color: '#000000', fontWeight: 700 },
                            '& .MuiSvgIcon-root': { color: '#000000' }
                          }
                        },
                        day: {
                          sx: {
                            color: '#000000 !important',
                            fontWeight: 500,
                            '&.Mui-selected': {
                              backgroundColor: '#DE3F5E !important',
                              color: '#ffffff !important',
                            },
                            '&.Mui-selected:hover': {
                              backgroundColor: '#DE3F5E !important',
                              opacity: 0.9,
                            },
                            '&.MuiPickersDay-today': {
                              borderColor: '#DE3F5E !important',
                              color: '#DE3F5E',
                            }
                          }
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
                        },
                        actionBar: {
                          actions: ['cancel', 'accept'],
                          sx: {
                            '& .MuiButton-root': {
                              color: '#DE3F5E',
                              fontWeight: 700,
                            }
                          }
                        },
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

                {/* Event Detail Slides Section - Always visible */}
                <Box sx={{ pt: 3, borderTop: '1px solid #eee' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Event Detail Slides</Typography>
                      <Typography variant="body2" sx={{ color: '#6a6a6a', fontSize: '0.85rem' }}>
                        These slides appear when guests click &quot;Learn More&quot; on this event
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={handleAddSlide}
                      sx={{
                        borderColor: '#DE3F5E',
                        color: '#DE3F5E',
                        borderRadius: '8px',
                        textTransform: 'none',
                        '&:hover': { borderColor: '#C8365A', bgcolor: 'rgba(222, 63, 94, 0.04)' },
                      }}
                    >
                      Add Slide
                    </Button>
                  </Stack>

                  {/* Slides List */}
                  {((currentEvent.carousel_slides as CarouselSlide[]) || []).length > 0 ? (
                    <Stack spacing={1}>
                      {((currentEvent.carousel_slides as CarouselSlide[]) || []).map((slide, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            bgcolor: '#f9f9f9',
                            border: '1px solid #eee',
                          }}
                        >
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                Slide {index + 1}: {SLIDE_TYPES.find(t => t.value === slide.type)?.label || slide.type}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                                {slide.type === 'three_lines' && (slide.main_heading || slide.top_label || 'No content')}
                                {slide.type === 'two_sections' && `${slide.section1_header || 'Section 1'} / ${slide.section2_header || 'Section 2'}`}
                                {slide.type === 'image' && (slide.src ? 'Image uploaded' : 'No image')}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <IconButton
                                size="small"
                                onClick={() => handleMoveSlide(index, 'up')}
                                disabled={index === 0}
                                sx={{ color: '#666' }}
                              >
                                <ArrowUpward fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleMoveSlide(index, 'down')}
                                disabled={index === ((currentEvent.carousel_slides as CarouselSlide[]) || []).length - 1}
                                sx={{ color: '#666' }}
                              >
                                <ArrowDownward fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleEditSlide(index)}
                                sx={{ color: '#DE3F5E' }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSlide(index)}
                                sx={{ color: '#666', '&:hover': { color: '#d32f2f' } }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '12px', bgcolor: '#f9f9f9', border: '1px dashed #ddd' }}>
                      <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                        No slides yet. Add slides to show event details to guests.
                      </Typography>
                    </Paper>
                  )}
                </Box>

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
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          {event.dress_code_icon && (
                            <StreamlineIcon name={event.dress_code_icon as StreamlineIconName} size={24} color="#DE3F5E" />
                          )}
                          <Typography variant="h6" sx={{ fontWeight: 500, fontSize: 18, color: '#000' }}>
                            {event.dress_code || 'No Dress Code Set'}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontSize: 14, color: '#858585' }}>
                          {event.date} @ {event.time}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          onClick={() => handleEdit(event)}
                          size="small"
                          sx={{
                            color: '#000',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteEvent(event.id)}
                          size="small"
                          sx={{
                            color: '#000',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.05)', color: '#d32f2f' }
                          }}
                        >
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
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    {template.dress_code_icon && (
                      <StreamlineIcon name={template.dress_code_icon as StreamlineIconName} size={28} color="#DE3F5E" />
                    )}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.1rem' }}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                        {template.dress_code}
                      </Typography>
                    </Box>
                  </Stack>
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
                value={currentSlide?.type || 'three_lines'}
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
                {SLIDE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Three Lines Type: Top Label + Main Heading + Body Text */}
            {currentSlide?.type === 'three_lines' && (
              <>
                <TextField
                  label="Top Label (small header)"
                  fullWidth
                  value={currentSlide?.top_label || ''}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, top_label: e.target.value })}
                  placeholder="e.g., THE CELEBRATION"
                  sx={textFieldSx}
                />
                <TextField
                  label="Main Heading (large italic)"
                  fullWidth
                  value={currentSlide?.main_heading || ''}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, main_heading: e.target.value })}
                  placeholder="e.g., Sangeet & Reception"
                  sx={textFieldSx}
                />
                <TextField
                  label="Body Text"
                  fullWidth
                  multiline
                  rows={4}
                  value={currentSlide?.body_text || ''}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, body_text: e.target.value })}
                  placeholder="Description text..."
                  sx={textFieldSx}
                />
              </>
            )}

            {/* Two Sections Type: Women/Men style lists */}
            {currentSlide?.type === 'two_sections' && (
              <>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '12px' }}>
                  <TextField
                    label="Section 1 Header"
                    fullWidth
                    value={currentSlide?.section1_header || 'WOMEN'}
                    onChange={(e) => setCurrentSlide({ ...currentSlide, section1_header: e.target.value })}
                    sx={{ ...textFieldSx, mb: 2 }}
                  />
                  <TextField
                    label="Section 1 Items (one per line)"
                    fullWidth
                    multiline
                    rows={4}
                    value={(currentSlide?.section1_items || []).join('\n')}
                    onChange={(e) => setCurrentSlide({
                      ...currentSlide,
                      section1_items: e.target.value.split('\n').filter(item => item.trim())
                    })}
                    placeholder="Evening Gowns&#10;Embellished Sarees&#10;Fusion Co-Ord Sets"
                    sx={textFieldSx}
                  />
                </Box>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '12px' }}>
                  <TextField
                    label="Section 2 Header"
                    fullWidth
                    value={currentSlide?.section2_header || 'MEN'}
                    onChange={(e) => setCurrentSlide({ ...currentSlide, section2_header: e.target.value })}
                    sx={{ ...textFieldSx, mb: 2 }}
                  />
                  <TextField
                    label="Section 2 Items (one per line)"
                    fullWidth
                    multiline
                    rows={4}
                    value={(currentSlide?.section2_items || []).join('\n')}
                    onChange={(e) => setCurrentSlide({
                      ...currentSlide,
                      section2_items: e.target.value.split('\n').filter(item => item.trim())
                    })}
                    placeholder="Tuxedos & Dinner Suits&#10;Tailored Sherwanis&#10;Patterned Nehru Jackets"
                    sx={textFieldSx}
                  />
                </Box>
              </>
            )}

            {/* Image Type */}
            {currentSlide?.type === 'image' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Slide Image</Typography>
                <ImageUpload
                  value={currentSlide?.src || ''}
                  onChange={(url) => setCurrentSlide({ ...currentSlide, src: url })}
                  path={getWeddingImagePath(weddingId!, 'slides')}
                  label="Slide Image"
                  aspectRatio="3/4"
                />
              </Box>
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
