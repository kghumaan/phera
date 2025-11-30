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
  Alert,
  Snackbar,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  Save,
} from '@mui/icons-material';
import { weddingService, WeddingEvent } from '@/lib/supabase/wedding-service';
import { EVENT_TEMPLATES, EventTemplate } from '@/components/admin/EventTemplates';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_PAPER_SX, ENHANCED_SECTION_SPACING, ENHANCED_CONTAINER_MAX_WIDTH } from '@/lib/constants/form-styles';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

export default function EventsPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<WeddingEvent> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('info');

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const showToast = (message: string, severity: 'error' | 'success' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        const eventsData = await weddingService.getWeddingEvents(wedding.id);
        setEvents(eventsData);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      const errorMessage = 'Failed to load events';
      setError(errorMessage);
      showToast(errorMessage, 'error');
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
      carousel_images: [],
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
      carousel_images: [],
      gradient_background: '',
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

  const handleSaveEvent = async () => {
    if (!currentEvent) return;

    try {
      setError(null);

      // Validation with field-level error tracking
      const newFieldErrors: Record<string, boolean> = {};
      if (!currentEvent.name) newFieldErrors.name = true;
      if (!currentEvent.date) newFieldErrors.date = true;
      if (!currentEvent.dress_code) newFieldErrors.dress_code = true;
      
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        const errorMessage = 'Please fill in required fields';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        return;
      }
      
      setFieldErrors({});

      // Generate slug from name if not provided
      if (!currentEvent.slug) {
        currentEvent.slug = currentEvent.name.toLowerCase().replace(/\s+/g, '-');
      }

      if (currentEvent.id) {
        await weddingService.updateEvent(currentEvent.id, currentEvent);
      } else {
        await weddingService.createEvent(currentEvent);
      }

      await loadData();
      // Close dialog and show success message
      setEditDialogOpen(false);
      setCurrentEvent(null);
      setSuccess(true);
      showToast('Changes saved!', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving event:', err);
      const errorMessage = 'Failed to save event';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await weddingService.deleteEvent(eventId);
      await loadData();
      setSuccess(true);
      showToast('Event deleted successfully', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error deleting event:', err);
      const errorMessage = 'Failed to delete event';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const updateCurrentEvent = (field: string, value: any) => {
    setCurrentEvent(prev => prev ? { ...prev, [field]: value } : null);
    // Clear field error when user starts typing
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

  if (loading) {
    return (
      <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
        <LoadingSpinner message="Loading events..." />
      </Container>
    );
  }

  return (
    <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Wedding Events
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
            Add events from templates or create custom ones
          </Typography>
        </Box>


        {/* Action Buttons */}
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
              '&:hover': {
                bgcolor: '#C8365A',
              },
            }}
          >
            Add from Template
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddCustom}
            sx={{
              borderColor: '#DE3F5E',
              color: '#DE3F5E',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#C8365A',
                bgcolor: 'rgba(222, 63, 94, 0.05)',
              },
            }}
          >
            Create Custom Event
          </Button>
        </Stack>

        {/* Events List */}
        <Stack spacing={2}>
          {events.map((event) => (
            <Paper key={event.id} sx={{ 
              p: 3,
              borderRadius: '16px',
              bgcolor: '#fafafa',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }
            }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <IconButton size="small">
                  <DragIndicator />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {event.dress_code_emoji} {event.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                    {event.date} @ {event.time} • {event.dress_code}
                  </Typography>
                </Box>
                <IconButton onClick={() => handleEdit(event)} sx={{ color: '#1a1a1a' }}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDeleteEvent(event.id)} color="error">
                  <Delete />
                </IconButton>
              </Stack>
            </Paper>
          ))}

          {events.length === 0 && (
            <Paper sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: '16px',
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}>
              <Typography sx={{ color: '#6a6a6a' }}>
                No events yet. Add your first event from a template or create a custom one.
              </Typography>
            </Paper>
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
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>Choose an Event Template</DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {EVENT_TEMPLATES.map((template) => (
                <Grid size={{ xs: 12, sm: 6 }} key={template.slug}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderRadius: '12px',
                      bgcolor: 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
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
            <Button onClick={() => setTemplateDialogOpen(false)} sx={{ color: '#6a6a6a' }}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: 'white',
            }
          }}
        >
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>{currentEvent?.id ? 'Edit Event' : 'New Event'}</DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
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

              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>Outfit Ideas - Women</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {((currentEvent?.outfit_ideas_women as string[]) || []).map((idea, idx) => (
                  <Chip
                    key={idx}
                    label={idea}
                    onDelete={() => removeOutfitIdea('women', idx)}
                    sx={{ 
                      mb: 1,
                      bgcolor: '#f5f5f5',
                      color: '#1a1a1a',
                      '& .MuiChip-deleteIcon': {
                        color: '#6a6a6a',
                        '&:hover': {
                          color: '#DE3F5E',
                        },
                      },
                    }}
                  />
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
                    ...textFieldSx,
                    minWidth: '200px',
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                    },
                    '& .MuiInputBase-input': {
                      color: '#1a1a1a',
                    },
                  }}
                />
              </Stack>

              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>Outfit Ideas - Men</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {((currentEvent?.outfit_ideas_men as string[]) || []).map((idea, idx) => (
                  <Chip
                    key={idx}
                    label={idea}
                    onDelete={() => removeOutfitIdea('men', idx)}
                    sx={{ 
                      mb: 1,
                      bgcolor: '#f5f5f5',
                      color: '#1a1a1a',
                      '& .MuiChip-deleteIcon': {
                        color: '#6a6a6a',
                        '&:hover': {
                          color: '#DE3F5E',
                        },
                      },
                    }}
                  />
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
                    ...textFieldSx,
                    minWidth: '200px',
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                    },
                    '& .MuiInputBase-input': {
                      color: '#1a1a1a',
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
            </Stack>
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#6a6a6a' }}>Cancel</Button>
            <Button 
              variant="contained" 
              startIcon={<Save />} 
              onClick={handleSaveEvent}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#C8365A',
                },
              }}
            >
              Save Event
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Notification */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}

