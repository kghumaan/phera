'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Add, Edit, Delete, Save, LocationOnOutlined } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

import { ENHANCED_TEXT_FIELD_SX, ENHANCED_CONTAINER_MAX_WIDTH, ENHANCED_SECTION_SPACING, SECONDARY_BUTTON_SX } from '@/lib/constants/form-styles';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

const editIconButtonSx = {
  color: '#DE3F5E',
  bgcolor: 'rgba(222, 63, 94, 0.08)',
  '&:hover': {
    bgcolor: 'rgba(222, 63, 94, 0.16)',
  },
};

export default function SchedulePage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState<any>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dayFieldErrors, setDayFieldErrors] = useState<Record<string, boolean>>({});
  const [itemFieldErrors, setItemFieldErrors] = useState<Record<string, boolean>>({});
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
        const data = await weddingService.getWeddingSchedule(wedding.id);
        setScheduleData(data);
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
      const errorMessage = 'Failed to load schedule';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDay = () => {
    setCurrentDay({
      wedding_id: weddingId,
      day_name: '',
      date: '',
      order_index: scheduleData.length,
    });
    setDayFieldErrors({});
    setEditDialogOpen(true);
  };

  const handleSaveDay = async () => {
    setError(null);

    // Validation with field-level error tracking
    const newFieldErrors: Record<string, boolean> = {};
    if (!currentDay?.day_name) newFieldErrors.day_name = true;
    if (!currentDay?.date) newFieldErrors.date = true;

    if (Object.keys(newFieldErrors).length > 0) {
      setDayFieldErrors(newFieldErrors);
      const errorMessage = 'Please fill in all fields';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    setDayFieldErrors({});

    try {
      if (currentDay.id) {
        await weddingService.updateSchedule(currentDay.id, currentDay);
      } else {
        await weddingService.createSchedule(currentDay);
      }
      await loadData();
      setEditDialogOpen(false);
      setCurrentDay(null);
      setSuccess(true);
      showToast('Changes saved!', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving day:', err);
      const errorMessage = 'Failed to save day';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('Delete this day and all its events?')) return;
    try {
      await weddingService.deleteSchedule(dayId);
      await loadData();
      setSuccess(true);
      showToast('Day deleted successfully', 'success');
    } catch (err) {
      const errorMessage = 'Failed to delete day';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleAddItem = (scheduleId: string) => {
    setCurrentItem({
      schedule_id: scheduleId,
      time: '',
      name: '',
      description: '',
      location: '',
      order_index: 0,
    });
    setItemFieldErrors({});
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    setError(null);

    // Validation with field-level error tracking
    const newFieldErrors: Record<string, boolean> = {};
    if (!currentItem?.time) newFieldErrors.time = true;
    if (!currentItem?.name) newFieldErrors.name = true;

    if (Object.keys(newFieldErrors).length > 0) {
      setItemFieldErrors(newFieldErrors);
      const errorMessage = 'Please fill in required fields';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    setItemFieldErrors({});

    try {
      if (currentItem.id) {
        await weddingService.updateScheduleItem(currentItem.id, currentItem);
      } else {
        await weddingService.createScheduleItem(currentItem);
      }
      await loadData();
      setItemDialogOpen(false);
      setCurrentItem(null);
      setSuccess(true);
      showToast('Changes saved!', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving item:', err);
      const errorMessage = 'Failed to save item';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await weddingService.deleteScheduleItem(itemId);
      await loadData();
      setSuccess(true);
      showToast('Event deleted successfully', 'success');
    } catch (err) {
      const errorMessage = 'Failed to delete item';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };



  if (loading) {
    return (
      <Box sx={{ maxWidth: 800 }}>
        <LoadingSpinner message="Loading schedule..." />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      {/* Schedule Form */}
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Wedding Schedule
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Build your day-by-day schedule
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddDay}
          sx={{
            bgcolor: '#DE3F5E',
            color: 'white',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            alignSelf: 'flex-start',
            '&:hover': {
              bgcolor: '#C8365A',
            },
          }}
        >
          Add Day
        </Button>

        <Stack spacing={3}>
          {scheduleData.map((day) => (
            <Paper key={day.id} sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: '#fafafa',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {day.date}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                    {day.day_name}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" sx={editIconButtonSx} onClick={() => {
                    setCurrentDay(day);
                    setDayFieldErrors({});
                    setEditDialogOpen(true);
                  }}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteDay(day.id)} color="error">
                    <Delete />
                  </IconButton>
                </Stack>
              </Stack>

              <Stack spacing={2} mb={2}>
                {day.events?.map((item: any) => (
                  <Box key={item.id} sx={{
                    pl: 2,
                    py: 1.5,
                    borderLeft: 3,
                    borderColor: '#DE3F5E',
                    bgcolor: 'rgba(222, 63, 94, 0.02)',
                    borderRadius: '0 8px 8px 0',
                  }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {item.time} - {item.name}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                            {item.description}
                          </Typography>
                        )}
                        {item.location && (
                          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                            📍 {item.location}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" sx={editIconButtonSx} onClick={() => {
                          setCurrentItem(item);
                          setItemFieldErrors({});
                          setItemDialogOpen(true);
                        }}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteItem(item.id)} color="error">
                          <Delete />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>

              <Button
                size="small"
                variant="outlined"
                startIcon={<Add />}
                onClick={() => handleAddItem(day.id)}
                sx={{
                  ...SECONDARY_BUTTON_SX,
                  alignSelf: 'flex-start',
                  px: 2.5,
                  boxShadow: 'none',
                }}
              >
                Add Event
              </Button>
            </Paper>
          ))}

          {scheduleData.length === 0 && (
            <Paper sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: '16px',
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}>
              <Typography sx={{ color: '#6a6a6a' }}>
                No schedule days yet. Add your first day to get started.
              </Typography>
            </Paper>
          )}
        </Stack>
      </Stack>

      {/* Day Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'white',
          }
        }}
      >
        <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>{currentDay?.id ? 'Edit Day' : 'New Day'}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'white' }}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Day Name *"
              fullWidth
              value={currentDay?.day_name || ''}
              onChange={(e) => {
                setCurrentDay({ ...currentDay, day_name: e.target.value });
                if (dayFieldErrors.day_name) {
                  setDayFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.day_name;
                    return newErrors;
                  });
                }
              }}
              placeholder="e.g., Sunday"
              error={dayFieldErrors.day_name}
              sx={textFieldSx}
            />
            <TextField
              label="Date *"
              type="date"
              fullWidth
              value={currentDay?.date || ''}
              onChange={(e) => {
                setCurrentDay({ ...currentDay, date: e.target.value });
                if (dayFieldErrors.date) {
                  setDayFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.date;
                    return newErrors;
                  });
                }
              }}
              InputLabelProps={{ shrink: true }}
              error={dayFieldErrors.date}
              sx={textFieldSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#6a6a6a' }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveDay}
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
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Item Dialog */}
      <Dialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'white',
          }
        }}
      >
        <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>{currentItem?.id ? 'Edit Event' : 'New Event'}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'white' }}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Time *"
              fullWidth
              value={currentItem?.time || ''}
              onChange={(e) => {
                setCurrentItem({ ...currentItem, time: e.target.value });
                if (itemFieldErrors.time) {
                  setItemFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.time;
                    return newErrors;
                  });
                }
              }}
              placeholder="e.g., 11:00 AM"
              error={itemFieldErrors.time}
              sx={textFieldSx}
            />
            <TextField
              label="Event Name *"
              fullWidth
              value={currentItem?.name || ''}
              onChange={(e) => {
                setCurrentItem({ ...currentItem, name: e.target.value });
                if (itemFieldErrors.name) {
                  setItemFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.name;
                    return newErrors;
                  });
                }
              }}
              error={itemFieldErrors.name}
              sx={textFieldSx}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={currentItem?.description || ''}
              onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
              sx={textFieldSx}
            />
            <TextField
              label="Location"
              fullWidth
              value={currentItem?.location || ''}
              onChange={(e) => setCurrentItem({ ...currentItem, location: e.target.value })}
              sx={textFieldSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
          <Button onClick={() => setItemDialogOpen(false)} sx={{ color: '#6a6a6a' }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveItem}
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
            Save
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
    </Box>
  );
}
