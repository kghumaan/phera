'use client';

import {
  Box,
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
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import {
  Add,
  Edit,
  Delete,
  Save,
  DragIndicator,
  AutoAwesome,
  Check,
  AccessTime,
  ExpandMore,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { weddingService, ScheduleItem, WeddingEvent } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING, SECONDARY_BUTTON_SX } from '@/lib/constants/form-styles';
import { parseISO } from 'date-fns';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

interface ScheduleItemWithEvent extends ScheduleItem {
  linkedEvent?: WeddingEvent | null;
}

interface DayWithItems {
  id: string;
  wedding_id: string | null;
  day_name: string;
  date: string;
  order_index: number;
  events: ScheduleItemWithEvent[];
}

const BACKGROUND_OPTIONS = [
  { label: 'None', value: null, color: '#DE3F5E' },
  { label: 'Pearl White', value: 'pearl.png', color: '#B0BEC5' },
  { label: 'Sunny Yellow', value: 'GradientYellow.png', color: '#FBC02D' },
  { label: 'Crimson Red', value: 'GradientJaggo.png', color: '#C2185B' },
  { label: 'Royal Purple', value: 'GradientReception.png', color: '#7B1FA2' },
  { label: 'Pool Blue', value: 'GradientPoolParty.png', color: '#0288D1' },
];

// Sortable item component
function SortableItem({
  item,
  onEdit,
  onDelete,
  events,
}: {
  item: ScheduleItemWithEvent;
  onEdit: () => void;
  onDelete: () => void;
  events: WeddingEvent[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if this item has a linked event
  const linkedEvent = events.find(e => e.id === item.linked_event_id);
  const isMajorEvent = item.is_major_event || !!linkedEvent;
  const gradientBg = item.gradient_background || linkedEvent?.gradient_background;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        pl: 2,
        py: 1.5,
        borderLeft: 3,
        borderColor: isMajorEvent && gradientBg
          ? (BACKGROUND_OPTIONS.find(opt => opt.value === gradientBg)?.color || '#DE3F5E')
          : '#DE3F5E',
        bgcolor: isMajorEvent
          ? 'transparent'
          : 'rgba(222, 63, 94, 0.02)',
        borderRadius: isMajorEvent ? '0 12px 12px 0' : '0 8px 8px 0',
        position: 'relative',
        overflow: 'hidden',
        ...(isMajorEvent && gradientBg && {
          backgroundImage: `url(/images/backgrounds/${gradientBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }),
      }}
    >
      {/* Overlay for gradient background items */}
      {isMajorEvent && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '12px',
          }}
        />
      )}

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ position: 'relative', zIndex: 1, gap: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
          {/* Drag handle */}
          <IconButton
            {...attributes}
            {...listeners}
            size="small"
            sx={{
              cursor: 'grab',
              color: '#9a9a9a',
              '&:hover': { color: '#6a6a6a' },
              p: 0.5,
            }}
          >
            <DragIndicator fontSize="small" />
          </IconButton>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {item.time} - {item.name}
              </Typography>
              {item.location && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <StreamlineIcon name="map-pin" size={14} color="#6a6a6a" />
                  <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                    {item.location}
                  </Typography>
                </Stack>
              )}
            </Stack>
            {item.description && (
              <Typography variant="caption" sx={{ color: '#6a6a6a', display: 'block', fontSize: '0.75rem', mt: 0.5, lineHeight: 1.4 }}>
                {item.description}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
          <IconButton
            size="medium"
            onClick={onEdit}
            sx={{
              color: '#000',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="medium"
            onClick={onDelete}
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
  );
}

// Custom Digital Time Picker Component
function DigitalTimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { hour: string; minute: string; period: 'AM' | 'PM' };
  onChange: (newValue: { hour: string; minute: string; period: 'AM' | 'PM' }) => void;
}) {
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const handleChange = (field: keyof typeof value, newVal: string) => {
    onChange({ ...value, [field]: newVal });
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block', fontWeight: 500 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl size="small" sx={{ width: 80 }}>
          <Select
            value={value.hour}
            onChange={(e) => handleChange('hour', e.target.value)}
            sx={{
              bgcolor: '#f5f5f5',
              '& fieldset': { border: 'none' },
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.1rem',
              textAlign: 'center'
            }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          >
            {hours.map((h) => (
              <MenuItem key={h} value={h}>{h}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography sx={{ fontWeight: 600, color: '#999' }}>:</Typography>

        <FormControl size="small" sx={{ width: 80 }}>
          <Select
            value={value.minute}
            onChange={(e) => handleChange('minute', e.target.value)}
            sx={{
              bgcolor: '#f5f5f5',
              '& fieldset': { border: 'none' },
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          >
            {minutes.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={value.period}
          exclusive
          onChange={(_, newPeriod) => {
            if (newPeriod) handleChange('period', newPeriod);
          }}
          size="small"
          sx={{
            height: 40,
            '& .MuiToggleButton-root': {
              border: 'none',
              bgcolor: '#f5f5f5',
              color: '#999',
              px: 2,
              '&.Mui-selected': {
                bgcolor: '#DE3F5E',
                color: 'white',
                '&:hover': { bgcolor: '#C8365A' }
              }
            },
            '& .MuiToggleButtonGroup-grouped': {
              margin: 0,
              '&:first-of-type': { borderRadius: '8px 0 0 8px' },
              '&:last-of-type': { borderRadius: '0 8px 8px 0' },
              border: 'none',
            }
          }}
        >
          <ToggleButton value="AM">AM</ToggleButton>
          <ToggleButton value="PM">PM</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Box>
  );
}

// Helper to parse time string "HH:MM AA" or "HH:MM AA - HH:MM AA"
const parseTime = (timeStr: string) => {
  const defaultTime = { hour: '11', minute: '00', period: 'AM' as const };
  const defaultEndTime = { hour: '1', minute: '00', period: 'PM' as const };

  if (!timeStr) return { start: defaultTime, end: null };

  const parts = timeStr.split('-').map(p => p.trim());

  const parsePart = (str: string) => {
    const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      return {
        hour: match[1],
        minute: match[2],
        period: match[3].toUpperCase() as 'AM' | 'PM'
      };
    }
    return defaultTime;
  };

  return {
    start: parsePart(parts[0]),
    end: parts[1] ? parsePart(parts[1]) : null
  };
};

export default function SchedulePage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [prepopulating, setPrepopulating] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);
  const [weddingDateEnd, setWeddingDateEnd] = useState<Date | null>(null);
  const [scheduleData, setScheduleData] = useState<DayWithItems[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState<any>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  // Time picker state
  const [startTime, setStartTime] = useState({ hour: '11', minute: '00', period: 'AM' as 'AM' | 'PM' });
  const [endTime, setEndTime] = useState<{ hour: string; minute: string; period: 'AM' | 'PM' } | null>(null);
  const [hasEndTime, setHasEndTime] = useState(false);

  const [dayFieldErrors, setDayFieldErrors] = useState<Record<string, boolean>>({});
  const [itemFieldErrors, setItemFieldErrors] = useState<Record<string, boolean>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('info');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        setWeddingDate(wedding.wedding_date ? parseISO(wedding.wedding_date) : null);
        setWeddingDateEnd(wedding.wedding_date_end ? parseISO(wedding.wedding_date_end) : null);

        const [scheduleResult, eventsResult] = await Promise.all([
          weddingService.getWeddingSchedule(wedding.id),
          weddingService.getWeddingEvents(wedding.id),
        ]);

        setScheduleData(scheduleResult);
        setEvents(eventsResult);
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
      showToast('Failed to load schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrepopulate = async () => {
    if (!weddingId || !weddingDate) {
      showToast('Wedding date is required for prepopulation', 'error');
      return;
    }

    setPrepopulating(true);
    try {
      const success = await weddingService.prepopulateScheduleFromTemplate(
        weddingId,
        weddingDate,
        weddingDateEnd
      );

      if (success) {
        showToast('Schedule prepopulated successfully!', 'success');
        await loadData();
      } else {
        showToast('Failed to prepopulate schedule', 'error');
      }
    } catch (err) {
      console.error('Error prepopulating:', err);
      showToast('Failed to prepopulate schedule', 'error');
    } finally {
      setPrepopulating(false);
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
    const newFieldErrors: Record<string, boolean> = {};
    if (!currentDay?.day_name) newFieldErrors.day_name = true;
    if (!currentDay?.date) newFieldErrors.date = true;

    if (Object.keys(newFieldErrors).length > 0) {
      setDayFieldErrors(newFieldErrors);
      showToast('Please fill in all fields', 'error');
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
      showToast('Changes saved!', 'success');
    } catch (err) {
      console.error('Error saving day:', err);
      showToast('Failed to save day', 'error');
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('Delete this day and all its events?')) return;
    try {
      await weddingService.deleteSchedule(dayId);
      await loadData();
      showToast('Day deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete day', 'error');
    }
  };

  const handleAddItem = (scheduleId: string) => {
    const newItem = {
      schedule_id: scheduleId,
      time: '', // Will be set on save
      name: '',
      description: '',
      location: '',
      order_index: scheduleData.find(d => d.id === scheduleId)?.events.length || 0,
      is_major_event: false,
      gradient_background: null,
    };
    setCurrentItem(newItem);

    // Reset time state
    setStartTime({ hour: '11', minute: '00', period: 'AM' });
    setHasEndTime(false);
    setEndTime(null);

    setItemFieldErrors({});
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    const newFieldErrors: Record<string, boolean> = {};
    if (!currentItem?.name) newFieldErrors.name = true;

    if (Object.keys(newFieldErrors).length > 0) {
      setItemFieldErrors(newFieldErrors);
      showToast('Please fill in required fields', 'error');
      return;
    }

    // Construct time string
    let timeStr = `${startTime.hour}:${startTime.minute} ${startTime.period}`;
    if (hasEndTime && endTime) {
      timeStr += ` - ${endTime.hour}:${endTime.minute} ${endTime.period}`;
    }

    const itemToSave = {
      ...currentItem,
      time: timeStr
    };

    setItemFieldErrors({});

    try {
      if (itemToSave.id) {
        await weddingService.updateScheduleItem(itemToSave.id, itemToSave);
      } else {
        await weddingService.createScheduleItem(itemToSave);
      }
      await loadData();
      setItemDialogOpen(false);
      setCurrentItem(null);
      showToast('Changes saved!', 'success');
    } catch (err) {
      console.error('Error saving item:', err);
      showToast('Failed to save item', 'error');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await weddingService.deleteScheduleItem(itemId);
      await loadData();
      showToast('Event deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete item', 'error');
    }
  };

  const handleDragEnd = async (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const day = scheduleData.find(d => d.id === dayId);
      if (!day) return;

      const oldIndex = day.events.findIndex(item => item.id === active.id);
      const newIndex = day.events.findIndex(item => item.id === over.id);

      const newItems = arrayMove(day.events, oldIndex, newIndex);

      // Update local state immediately for optimistic UI
      setScheduleData(prev => prev.map(d =>
        d.id === dayId ? { ...d, events: newItems } : d
      ));

      // Persist to database
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order_index: index,
      }));

      const success = await weddingService.updateScheduleItemsOrder(updates);
      if (!success) {
        showToast('Failed to save order', 'error');
        await loadData(); // Reload to revert
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800 }}>
        <LoadingSpinner message="Loading schedule..." />
      </Box>
    );
  }

  const isEmpty = scheduleData.length === 0;

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              Schedule & Events
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Build your day-by-day schedule with events highlighted
            </Typography>
          </Box>
          {!isEmpty && (
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
                mt: 0.5,
                flexShrink: 0,
                '&:hover': { bgcolor: '#C8365A' },
              }}
            >
              Add Day
            </Button>
          )}
        </Stack>

        {/* Empty state with prepopulate option */}
        {isEmpty && (
          <Paper sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: '16px',
            bgcolor: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}>
            <AutoAwesome sx={{ fontSize: 48, color: '#DE3F5E', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Get Started with a Template
            </Typography>
            <Typography sx={{ color: '#6a6a6a', mb: 3 }}>
              We&apos;ll create a sample schedule based on a 3-day Indian wedding,
              adjusted to your wedding dates. You can customize everything afterwards.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={prepopulating ? null : <AutoAwesome />}
                onClick={handlePrepopulate}
                disabled={prepopulating || !weddingDate}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': { bgcolor: '#C8365A' },
                }}
              >
                {prepopulating ? 'Creating...' : 'Use Template'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddDay}
                sx={SECONDARY_BUTTON_SX}
              >
                Start from Scratch
              </Button>
            </Stack>
            {!weddingDate && (
              <Typography variant="caption" sx={{ color: '#DE3F5E', display: 'block', mt: 2 }}>
                Set your wedding date in Wedding Details first to use the template
              </Typography>
            )}
          </Paper>
        )}



        {/* Schedule Days */}
        <Stack spacing={3}>
          {scheduleData.map((day) => (
            <Paper key={day.id} sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: '#fafafa',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {day.date}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setCurrentDay(day);
                      setDayFieldErrors({});
                      setEditDialogOpen(true);
                    }}
                    sx={{
                      color: '#000',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteDay(day.id)}
                    sx={{
                      color: '#000',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.05)', color: '#d32f2f' }
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Sortable items */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, day.id)}
              >
                <SortableContext
                  items={day.events.map(e => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack spacing={1.5} mb={2}>
                    {day.events.map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        events={events}
                        onEdit={() => {
                          setCurrentItem(item);
                          // Parse and set time state
                          const { start, end } = parseTime(item.time);
                          setStartTime(start);
                          setEndTime(end || { hour: '1', minute: '00', period: 'PM' });
                          setHasEndTime(!!end);

                          setItemFieldErrors({});
                          setItemDialogOpen(true);
                        }}
                        onDelete={() => handleDeleteItem(item.id)}
                      />
                    ))}
                  </Stack>
                </SortableContext>
              </DndContext>

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
        </Stack>
      </Stack>

      {/* Day Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'white' } }}
      >
        <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>
          {currentDay?.id ? 'Edit Day' : 'New Day'}
        </DialogTitle>
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
              '&:hover': { bgcolor: '#C8365A' },
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
        PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'white' } }}
      >
        <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>
          {currentItem?.id ? 'Edit Event' : 'New Event'}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'white' }}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Time Picker Section */}
            <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: '12px', border: '1px solid #eee' }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <AccessTime sx={{ color: '#DE3F5E', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Date and Time
                </Typography>
              </Stack>

              <Stack spacing={3}>
                <DigitalTimePicker
                  label="Start Time"
                  value={startTime}
                  onChange={setStartTime}
                />

                {hasEndTime ? (
                  <Box>
                    <DigitalTimePicker
                      label="End Time"
                      value={endTime || { hour: '1', minute: '00', period: 'PM' }}
                      onChange={setEndTime}
                    />
                    <Button
                      size="small"
                      onClick={() => setHasEndTime(false)}
                      sx={{ mt: 1, color: '#666', textTransform: 'none', fontSize: '0.8rem' }}
                    >
                      Remove End Time
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => {
                      setEndTime({ hour: '1', minute: '00', period: 'PM' });
                      setHasEndTime(true);
                    }}
                    sx={{
                      alignSelf: 'flex-start',
                      borderColor: '#eee',
                      color: '#666',
                      textTransform: 'none',
                      borderRadius: '8px',
                      width: 'fit-content'
                    }}
                  >
                    Add End Time
                  </Button>
                )}
              </Stack>
            </Box>

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


            {/* Major Event Toggle and Backgrounds */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                  Appearance & Style
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!currentItem?.is_major_event}
                      onChange={(e) => setCurrentItem({ ...currentItem, is_major_event: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#DE3F5E',
                          '&:hover': {
                            backgroundColor: 'rgba(222, 63, 94, 0.08)',
                          },
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#DE3F5E',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Major Event
                    </Typography>
                  }
                  sx={{ mr: 0 }}
                />
              </Stack>

              {currentItem?.is_major_event && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#fafafa', borderRadius: '12px', border: '1px solid #eee' }}>
                  <Typography variant="caption" sx={{ color: '#666', mb: 1.5, display: 'block' }}>
                    Background Theme (Optional)
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
                    {BACKGROUND_OPTIONS.map((option) => {
                      const isSelected = currentItem?.gradient_background === option.value;
                      return (
                        <Box
                          key={option.label}
                          onClick={() => {
                            const newGradient = isSelected ? null : option.value;
                            setCurrentItem({
                              ...currentItem,
                              gradient_background: newGradient
                            });
                          }}
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: isSelected ? '#DE3F5E' : 'transparent',
                            position: 'relative',
                            overflow: 'hidden',
                            flexShrink: 0,
                            ...(option.value ? {
                              backgroundImage: `url(/images/backgrounds/${option.value})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            } : {
                              bgcolor: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: isSelected ? '2px solid #DE3F5E' : '1px solid #ddd'
                            }),
                            '&:hover': {
                              borderColor: isSelected ? '#DE3F5E' : '#999',
                            }
                          }}
                        >
                          {!option.value && (
                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                              None
                            </Typography>
                          )}
                          {isSelected && (
                            <Box sx={{
                              position: 'absolute',
                              inset: 0,
                              bgcolor: 'rgba(255,255,255,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Check sx={{ color: '#DE3F5E', fontSize: 20, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Box>
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
              '&:hover': { bgcolor: '#C8365A' },
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
    </Box >
  );
}
