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
  Tabs,
  Tab,
  Card,
  CardContent,
  InputLabel,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import {
  Add,
  Edit,
  Delete,
  Save,
  DragIndicator,
  ArrowUpward,
  ArrowDownward,
  ChevronLeft,
  ChevronRight,
  AutoAwesome,
  Check,
  AccessTime,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { weddingService, ScheduleItem, WeddingEvent, CarouselSlide } from '@/lib/supabase/wedding-service';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING, SECONDARY_BUTTON_SX } from '@/lib/constants/form-styles';
import { parseISO } from 'date-fns';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';

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

// Slide type options - includes legacy types for backwards compatibility
const SLIDE_TYPES = [
  { value: 'three_lines', label: 'Header + Title + Description' },
  { value: 'ritual', label: 'Ritual/Ceremony' },
  { value: 'dress_code', label: 'Dress Code' },
  { value: 'outfit_ideas', label: 'Outfit Ideas' },
  { value: 'two_sections', label: 'Two Sections (e.g. Women/Men)' },
  { value: 'image', label: 'Single Image' },
];

// Sortable Item Component
function SortableItem({ item, events, onEdit, onDelete }: {
  item: ScheduleItemWithEvent;
  events: WeddingEvent[];
  onEdit: () => void;
  onDelete: () => void;
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
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        bgcolor: 'white',
        borderRadius: '12px',
        p: 2,
        border: '1px solid #eee',
        boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : 'none',
        '&:hover': { borderColor: '#ddd' }
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: '#999', display: 'flex' }}>
          <DragIndicator />
        </Box>

        <Stack spacing={0.5} sx={{ minWidth: 80 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#DE3F5E', letterSpacing: '0.05em' }}>
            {item.time}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </Typography>
              {item.location && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <StreamlineIcon name="map-pin" size={14} color="#000" />
                  <Typography variant="caption" sx={{ color: '#000' }}>
                    {item.location}
                  </Typography>
                </Stack>
              )}
            </Stack>
            {item.description && (
              <Typography variant="caption" sx={{ color: '#000', display: 'block', fontSize: '0.75rem', mt: 0.5, lineHeight: 1.4 }}>
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
  const minutes = ['00', '15', '30', '45'];

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

        <Typography variant="body2" sx={{ fontWeight: 600, color: '#999' }}>:</Typography>

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
  const router = useRouter();
  const { isViewOnly } = useAdminRole();
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

  // Tab state for edit dialog
  const [editTab, setEditTab] = useState(0);

  // Slide editing state
  const [currentSlides, setCurrentSlides] = useState<CarouselSlide[]>([]);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(null);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  const [dayFieldErrors, setDayFieldErrors] = useState<Record<string, boolean>>({});
  const [itemFieldErrors, setItemFieldErrors] = useState<Record<string, boolean>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showPrepopulateSuccess, setShowPrepopulateSuccess] = useState(false);
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
    if (isViewOnly) return;
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
        setShowPrepopulateSuccess(true);
        await loadData();
        if (weddingId) {
          await weddingService.markUnpublishedChanges(weddingId);
          const channel = new BroadcastChannel('phera-design-sync');
          channel.postMessage({ type: 'PREVIEW_REFRESH' });
          channel.close();
        }
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
    if (isViewOnly) return;
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
    if (isViewOnly) return;
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
        showToast('Day updated successfully!', 'success');
      } else {
        await weddingService.createSchedule(currentDay);
        showToast('Day added successfully!', 'success');
      }
      setEditDialogOpen(false);
      await loadData();
      if (weddingId) {
        await weddingService.markUnpublishedChanges(weddingId);
        const channel = new BroadcastChannel('phera-design-sync');
        channel.postMessage({ type: 'PREVIEW_REFRESH' });
        channel.close();
      }
    } catch (err) {
      console.error('Error saving day:', err);
      showToast('Failed to save day', 'error');
    }
  };

  const handleDeleteDay = async (id: string) => {
    if (isViewOnly) return;
    if (!confirm('Are you sure you want to delete this day and all its events?')) return;
    try {
      await weddingService.deleteSchedule(id);
      showToast('Day deleted successfully!', 'success');
      await loadData();
      if (weddingId) {
        await weddingService.markUnpublishedChanges(weddingId);
        const channel = new BroadcastChannel('phera-design-sync');
        channel.postMessage({ type: 'PREVIEW_REFRESH' });
        channel.close();
      }
    } catch (err) {
      console.error('Error deleting day:', err);
      showToast('Failed to delete day', 'error');
    }
  };

  const handleAddItem = (dayId: string) => {
    if (isViewOnly) return;
    setCurrentItem({
      schedule_id: dayId,
      wedding_id: weddingId,
      name: '',
      time: '11:00 AM',
      description: '',
      location: '',
      order_index: 0,
    });
    setStartTime({ hour: '11', minute: '00', period: 'AM' });
    setEndTime(null);
    setHasEndTime(false);
    setCurrentSlides([]);
    setSelectedSlideIndex(null);
    setPreviewSlideIndex(0);
    setEditTab(0);
    setItemFieldErrors({});
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (isViewOnly) return;
    if (!currentItem) return;

    if (!currentItem.name) {
      setItemFieldErrors({ name: true });
      showToast('Event name is required', 'error');
      return;
    }

    const formatTimePart = (t: typeof startTime) => `${t.hour}:${t.minute} ${t.period}`;
    const timeDisplay = hasEndTime && endTime
      ? `${formatTimePart(startTime)} - ${formatTimePart(endTime)}`
      : formatTimePart(startTime);

    const itemToSave = {
      ...currentItem,
      time: timeDisplay,
      carousel_slides: currentSlides,
    };

    try {
      if (currentItem.id) {
        await weddingService.updateScheduleItem(currentItem.id, itemToSave);
        showToast('Event updated successfully!', 'success');
      } else {
        // Find max order_index for this day
        const day = scheduleData.find(d => d.id === currentItem.schedule_id);
        const orderIndex = day ? day.events.length : 0;
        await weddingService.createScheduleItem({ ...itemToSave, order_index: orderIndex });
        showToast('Event added successfully!', 'success');
      }
      setItemDialogOpen(false);
      await loadData();
      if (weddingId) {
        await weddingService.markUnpublishedChanges(weddingId);
        const channel = new BroadcastChannel('phera-design-sync');
        channel.postMessage({ type: 'PREVIEW_REFRESH' });
        channel.close();
      }
    } catch (err) {
      console.error('Error saving event:', err);
      showToast('Failed to save event', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (isViewOnly) return;
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await weddingService.deleteScheduleItem(id);
      showToast('Event deleted successfully!', 'success');
      await loadData();
      if (weddingId) {
        await weddingService.markUnpublishedChanges(weddingId);
        const channel = new BroadcastChannel('phera-design-sync');
        channel.postMessage({ type: 'PREVIEW_REFRESH' });
        channel.close();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('Failed to delete event', 'error');
    }
  };

  const handleDragEnd = async (event: DragEndEvent, dayId: string) => {
    if (isViewOnly) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const day = scheduleData.find(d => d.id === dayId);
    if (!day) return;

    const oldIndex = day.events.findIndex(item => item.id === active.id);
    const newIndex = day.events.findIndex(item => item.id === over.id);

    const newEvents = arrayMove(day.events, oldIndex, newIndex);

    // Update state immediately for UI
    setScheduleData(prev => prev.map(d =>
      d.id === dayId ? { ...d, events: newEvents } : d
    ));

    // Persist to Supabase
    try {
      await weddingService.reorderScheduleItems(
        newEvents.map((item, index) => ({ id: item.id, order_index: index }))
      );
      if (weddingId) {
        await weddingService.markUnpublishedChanges(weddingId);
        const channel = new BroadcastChannel('phera-design-sync');
        channel.postMessage({ type: 'PREVIEW_REFRESH' });
        channel.close();
      }
    } catch (err) {
      console.error('Error reordering items:', err);
      showToast('Failed to save new order', 'error');
      await loadData();
    }
  };

  const handleAddSlide = () => {
    if (isViewOnly) return;
    const newSlide: CarouselSlide = {
      type: 'three_lines',
      top_label: '',
      main_heading: '',
      body_text: '',
    };
    setCurrentSlides([...currentSlides, newSlide]);
    setSelectedSlideIndex(currentSlides.length);
  };

  const handleUpdateSlide = (index: number, updates: Partial<CarouselSlide>) => {
    if (isViewOnly) return;
    const newSlides = [...currentSlides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setCurrentSlides(newSlides);
  };

  const handleDeleteSlide = (index: number) => {
    if (isViewOnly) return;
    const newSlides = currentSlides.filter((_, i) => i !== index);
    setCurrentSlides(newSlides);
    if (selectedSlideIndex === index) setSelectedSlideIndex(null);
    else if (selectedSlideIndex !== null && selectedSlideIndex > index) setSelectedSlideIndex(selectedSlideIndex - 1);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (isViewOnly) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentSlides.length) return;

    const newSlides = [...currentSlides];
    const [moved] = newSlides.splice(index, 1);
    newSlides.splice(newIndex, 0, moved);
    setCurrentSlides(newSlides);
    if (selectedSlideIndex === index) setSelectedSlideIndex(newIndex);
  };

  if (loading) return <LoadingSpinner />;

  const isEmpty = scheduleData.length === 0;

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
              Wedding Schedule
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Plan the timeline for your celebration
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
          <Box sx={{ bgcolor: 'rgba(222, 63, 94, 0.04)', borderRadius: '16px', p: 6, border: '1px dashed #DE3F5E', textAlign: 'center' }}>
            <Stack spacing={3} alignItems="center">
              <Box sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(222, 63, 94, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AutoAwesome sx={{ color: '#DE3F5E', fontSize: 32 }} />
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                  Design Your Wedding Schedule
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', maxWidth: 500, mx: 'auto' }}>
                  {!weddingDate
                    ? "We don't know your wedding dates yet! Please set them in the Wedding Details section so we can organize your schedule."
                    : "Your wedding dates are set! Use our template to get started with common wedding events, adjusted to your dates."
                  }
                </Typography>
              </Box>

              {!weddingDate ? (
                <Button
                  variant="contained"
                  onClick={() => router.push(`/admin/${weddingSlug}/details`)}
                  sx={{
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(222, 63, 94, 0.2)',
                    '&:hover': { bgcolor: '#C8365A' },
                  }}
                >
                  Add Wedding Dates
                </Button>
              ) : (
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    startIcon={prepopulating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                    onClick={handlePrepopulate}
                    disabled={prepopulating}
                    sx={{
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      '&:hover': { bgcolor: '#C8365A' },
                    }}
                  >
                    {prepopulating ? 'Prepopulating...' : 'Use Template'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddDay}
                    sx={{
                      ...SECONDARY_BUTTON_SX,
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    Start from Scratch
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>
        )}

        {/* Prepopulation Success Dialog */}
        <Dialog
          open={showPrepopulateSuccess}
          onClose={() => setShowPrepopulateSuccess(false)}
          PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
        >
          <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
            <Box sx={{
              width: 56,
              height: 56,
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}>
              <Check sx={{ color: '#10B981', fontSize: 32 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              Schedule Ready!
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', mb: 2 }}>
              Your wedding schedule has been prepopulated from our template.
              This is just a starting point — feel free to edit times, locations, and details to make it your own!
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              onClick={() => setShowPrepopulateSuccess(false)}
              variant="contained"
              sx={{
                bgcolor: '#1a1a1a',
                color: 'white',
                px: 4,
                py: 1.2,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#333' }
              }}
            >
              Got it, thanks!
            </Button>
          </DialogActions>
        </Dialog>



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

                          // Reset tab and initialize slides
                          setEditTab(0);
                          // Try to get slides from linked event (by ID first, then fuzzy name match)
                          let linkedEvent = events.find(e => e.id === item.linked_event_id);

                          // If no linked event by ID, try fuzzy matching by name
                          if (!linkedEvent && item.name) {
                            const normalizedName = item.name.toLowerCase().trim();
                            // Exact match first
                            linkedEvent = events.find(e =>
                              e.name.toLowerCase().trim() === normalizedName ||
                              e.slug?.toLowerCase() === normalizedName.replace(/\s+/g, '-')
                            );
                            // Partial/fuzzy match
                            if (!linkedEvent) {
                              linkedEvent = events.find(e => {
                                const eventNameLower = e.name.toLowerCase().trim();
                                const eventSlug = e.slug?.toLowerCase() || '';
                                return normalizedName.includes(eventNameLower) ||
                                  eventNameLower.includes(normalizedName) ||
                                  normalizedName.includes(eventSlug) ||
                                  eventSlug.includes(normalizedName.replace(/\s+/g, '-'));
                              });
                            }
                          }

                          const slides = (item as any).carousel_slides || linkedEvent?.carousel_slides || [];
                          setCurrentSlides(slides);
                          // Also store the linked event ID if we found one by name matching
                          if (linkedEvent && !item.linked_event_id) {
                            setCurrentItem({ ...item, linked_event_id: linkedEvent.id });
                          }
                          setSelectedSlideIndex(null);
                          setPreviewSlideIndex(0);

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

      {/* Item Dialog - Wider with Tabs */}
      <Dialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', bgcolor: 'white', minHeight: '70vh' } }}
      >
        <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600, pb: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {currentItem?.id ? 'Edit Event' : 'New Event'}
            </Typography>
            {/* Major Event Toggle at top */}
            <FormControlLabel
              control={
                <Switch
                  checked={!!currentItem?.is_major_event}
                  onChange={(e: any) => setCurrentItem({ ...currentItem, is_major_event: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#DE3F5E',
                      '&:hover': { backgroundColor: 'rgba(222, 63, 94, 0.08)' },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#DE3F5E',
                    },
                  }}
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Major Event</Typography>}
              sx={{ mr: 0 }}
            />
          </Stack>
          <Tabs
            value={editTab}
            onChange={(_, newValue) => setEditTab(newValue)}
            sx={{
              mt: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: '#666',
                '&.Mui-selected': { color: '#DE3F5E' },
              },
              '& .MuiTabs-indicator': { backgroundColor: '#DE3F5E' },
            }}
          >
            <Tab label="Basic Details" />
            <Tab label="More Details" />
          </Tabs>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'white', pt: 3 }}>
          {/* Tab 0: Basic Details */}
          {editTab === 0 && (
            <Stack spacing={3} sx={{ maxWidth: 600 }}>
              {/* Time Picker Section */}
              <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: '12px', border: '1px solid #eee' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <AccessTime sx={{ color: '#DE3F5E', fontSize: 20 }} />
                  <Typography variant="subtitle2">Time</Typography>
                </Stack>
                <Stack spacing={3}>
                  <DigitalTimePicker label="Start Time" value={startTime} onChange={setStartTime} />
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
                      sx={{ alignSelf: 'flex-start', borderColor: '#eee', color: '#666', textTransform: 'none', borderRadius: '8px' }}
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
                    setItemFieldErrors(prev => { const n = { ...prev }; delete n.name; return n; });
                  }
                }}
                error={itemFieldErrors.name}
                sx={textFieldSx}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
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
          )}

          {/* Tab 1: More Details - Background & Slides */}
          {editTab === 1 && (
            <Box sx={{ display: 'flex', gap: 3, minHeight: 450 }}>
              {/* Left side: Settings & Slide List */}
              <Box sx={{ width: 350, flexShrink: 0 }}>
                {/* Background Theme */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Background Theme</Typography>
                  <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {BACKGROUND_OPTIONS.map((option) => {
                      const isSelected = currentItem?.gradient_background === option.value;
                      return (
                        <Box
                          key={option.label || 'none'}
                          onClick={() => setCurrentItem({ ...currentItem, gradient_background: isSelected ? null : option.value })}
                          sx={{
                            width: 48, height: 48, borderRadius: '12px', cursor: 'pointer',
                            border: '2px solid', borderColor: isSelected ? '#DE3F5E' : 'transparent',
                            position: 'relative', overflow: 'hidden',
                            ...(option.value ? {
                              backgroundImage: `url(/images/backgrounds/${option.value})`,
                              backgroundSize: 'cover', backgroundPosition: 'center',
                            } : {
                              bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: isSelected ? '2px solid #DE3F5E' : '1px solid #ddd'
                            }),
                            '&:hover': { borderColor: isSelected ? '#DE3F5E' : '#999' }
                          }}
                        >
                          {!option.value && <Typography variant="caption" sx={{ color: '#666', fontSize: '0.65rem' }}>None</Typography>}
                          {isSelected && (
                            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check sx={{ color: '#DE3F5E', fontSize: 18 }} />
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>

                {/* Slides List */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2">Event Slides</Typography>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={handleAddSlide}
                      sx={{ color: '#DE3F5E', textTransform: 'none', fontWeight: 600 }}
                    >
                      Add Slide
                    </Button>
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 2 }}>
                    These slides appear when guests click &quot;Learn More&quot;
                  </Typography>

                  {currentSlides.length > 0 ? (
                    <Stack spacing={1} sx={{ maxHeight: 280, overflowY: 'auto' }}>
                      {currentSlides.map((slide, index) => (
                        <Paper
                          key={index}
                          onClick={() => setSelectedSlideIndex(index)}
                          sx={{
                            p: 1.5, borderRadius: '10px', cursor: 'pointer',
                            bgcolor: selectedSlideIndex === index ? 'rgba(222, 63, 94, 0.08)' : '#f9f9f9',
                            border: selectedSlideIndex === index ? '2px solid #DE3F5E' : '1px solid #eee',
                            '&:hover': { bgcolor: selectedSlideIndex === index ? 'rgba(222, 63, 94, 0.08)' : '#f5f5f5' },
                          }}
                        >
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.85rem' }}>
                                Slide {index + 1}: {SLIDE_TYPES.find(t => t.value === slide.type)?.label || slide.type}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6a6a6a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {slide.type === 'three_lines' && (slide.main_heading || slide.top_label || 'No content')}
                                {slide.type === 'two_sections' && `${slide.section1_header || 'Section 1'} / ${slide.section2_header || 'Section 2'}`}
                                {slide.type === 'image' && (slide.src ? 'Image uploaded' : 'No image')}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMoveSlide(index, 'up'); }} disabled={index === 0} sx={{ p: 0.5 }}>
                                <ArrowUpward sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMoveSlide(index, 'down'); }} disabled={index === currentSlides.length - 1} sx={{ p: 0.5 }}>
                                <ArrowDownward sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteSlide(index); }} sx={{ p: 0.5, color: '#666', '&:hover': { color: '#d32f2f' } }}>
                                <Delete sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '12px', bgcolor: '#f9f9f9', border: '1px dashed #ddd' }}>
                      <ImageIcon sx={{ fontSize: 32, color: '#ccc', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: '#6a6a6a' }}>No slides yet</Typography>
                    </Paper>
                  )}
                </Box>
              </Box>

              {/* Right side: Slide Editor / Preview */}
              <Box sx={{ flex: 1, bgcolor: '#f5f5f5', borderRadius: '16px', p: 3, display: 'flex', flexDirection: 'column' }}>
                {selectedSlideIndex !== null && currentSlides[selectedSlideIndex] ? (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Edit Slide {selectedSlideIndex + 1}</Typography>

                    <Stack spacing={2} sx={{ flex: 1 }}>
                      {/* Slide Type Selector */}
                      <FormControl fullWidth size="small">
                        <InputLabel>Slide Type</InputLabel>
                        <Select
                          value={currentSlides[selectedSlideIndex].type || 'three_lines'}
                          onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { type: e.target.value as any })}
                          label="Slide Type"
                          sx={{ bgcolor: 'white', borderRadius: '8px' }}
                        >
                          {SLIDE_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Common text field styling */}
                      {(() => {
                        const textFieldStyles = {
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                          '& .MuiInputBase-input': { color: '#1a1a1a' },
                          '& .MuiInputBase-inputMultiline': { color: '#1a1a1a' },
                        };
                        const slide = currentSlides[selectedSlideIndex];

                        return (
                          <>
                            {/* Three Lines Type Fields */}
                            {slide.type === 'three_lines' && (
                              <>
                                <TextField
                                  label="Top Label (small header)"
                                  fullWidth
                                  size="small"
                                  value={slide.top_label || ''}
                                  onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { top_label: e.target.value })}
                                  placeholder="e.g., THE CELEBRATION"
                                  sx={textFieldStyles}
                                />
                                <TextField
                                  label="Main Heading (large italic)"
                                  fullWidth
                                  size="small"
                                  value={slide.main_heading || ''}
                                  onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { main_heading: e.target.value })}
                                  placeholder="e.g., Sangeet & Reception"
                                  sx={textFieldStyles}
                                />
                                <TextField
                                  label="Body Text"
                                  fullWidth
                                  size="small"
                                  multiline
                                  rows={3}
                                  value={slide.body_text || ''}
                                  onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { body_text: e.target.value })}
                                  placeholder="Description text..."
                                  sx={textFieldStyles}
                                />
                              </>
                            )}

                            {/* Dress Code Type Fields */}
                            {slide.type === 'dress_code' && (
                              <>
                                <TextField
                                  label="Subtitle (small header)"
                                  fullWidth
                                  size="small"
                                  value={slide.subtitle || ''}
                                  onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { subtitle: e.target.value })}
                                  placeholder="e.g., DRESS CODE"
                                  sx={textFieldStyles}
                                />
                                <TextField
                                  label="Heading (main title)"
                                  fullWidth
                                  size="small"
                                  value={slide.heading || ''}
                                  onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { heading: e.target.value })}
                                  placeholder="e.g., Shades of Yellow"
                                  sx={textFieldStyles}
                                />
                                <TextField
                                  label="Description"
                                  fullWidth
                                  size="small"
                                  multiline
                                  rows={3}
                                  value={slide.description || ''}
                                  onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { description: e.target.value })}
                                  placeholder="Dress code details..."
                                  sx={textFieldStyles}
                                />
                              </>
                            )}

                            {/* Ritual Type Fields */}
                            {slide.type === 'ritual' && (
                              <>
                                <TextField
                                  label="Subtitle (small header)"
                                  fullWidth
                                  size="small"
                                  value={slide.subtitle || ''}
                                  onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { subtitle: e.target.value })}
                                  placeholder="e.g., THE CEREMONY"
                                  sx={textFieldStyles}
                                />
                                <TextField
                                  label="Heading (ritual name)"
                                  fullWidth
                                  size="small"
                                  value={slide.heading || ''}
                                  onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { heading: e.target.value })}
                                  placeholder="e.g., The Anand Karaj"
                                  sx={textFieldStyles}
                                />
                                <TextField
                                  label="Description"
                                  fullWidth
                                  size="small"
                                  multiline
                                  rows={3}
                                  value={slide.description || ''}
                                  onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { description: e.target.value })}
                                  placeholder="Ritual description..."
                                  sx={textFieldStyles}
                                />
                              </>
                            )}

                            {/* Outfit Ideas Type Fields (legacy - uses women/men arrays) */}
                            {slide.type === 'outfit_ideas' && (
                              <>
                                <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '8px' }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#1a1a1a' }}>Women&apos;s Outfit Ideas</Typography>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={4}
                                    value={(slide.women || []).join('\n')}
                                    onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, {
                                      women: e.target.value.split('\n').filter((item: any) => item.trim())
                                    })}
                                    placeholder="Yellow Anarkali&#10;Lehenga in gold tones&#10;Yellow Saree"
                                    sx={textFieldStyles}
                                  />
                                </Box>
                                <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '8px' }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#1a1a1a' }}>Men&apos;s Outfit Ideas</Typography>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={4}
                                    value={(slide.men || []).join('\n')}
                                    onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, {
                                      men: e.target.value.split('\n').filter((item: any) => item.trim())
                                    })}
                                    placeholder="Yellow Kurta with white pajama&#10;Yellow Nehru jacket"
                                    sx={textFieldStyles}
                                  />
                                </Box>
                              </>
                            )}

                            {/* Two Sections Type Fields (custom headers) */}
                            {slide.type === 'two_sections' && (
                              <>
                                <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '8px' }}>
                                  <TextField
                                    label="Section 1 Header"
                                    fullWidth
                                    size="small"
                                    value={slide.section1_header || ''}
                                    onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { section1_header: e.target.value })}
                                    sx={{ ...textFieldStyles, mb: 1.5 }}
                                  />
                                  <TextField
                                    label="Section 1 Items (one per line)"
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={3}
                                    value={(slide.section1_items || []).join('\n')}
                                    onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, {
                                      section1_items: e.target.value.split('\n').filter((item: any) => item.trim())
                                    })}
                                    placeholder="Item 1&#10;Item 2"
                                    sx={textFieldStyles}
                                  />
                                </Box>
                                <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '8px' }}>
                                  <TextField
                                    label="Section 2 Header"
                                    fullWidth
                                    size="small"
                                    value={slide.section2_header || ''}
                                    onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, { section2_header: e.target.value })}
                                    sx={{ ...textFieldStyles, mb: 1.5 }}
                                  />
                                  <TextField
                                    label="Section 2 Items (one per line)"
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={3}
                                    value={(slide.section2_items || []).join('\n')}
                                    onChange={(e: any) => handleUpdateSlide(selectedSlideIndex, {
                                      section2_items: e.target.value.split('\n').filter((item: any) => item.trim())
                                    })}
                                    placeholder="Item 1&#10;Item 2"
                                    sx={textFieldStyles}
                                  />
                                </Box>
                              </>
                            )}

                            {/* Image Type Fields */}
                            {slide.type === 'image' && (
                              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: '8px' }}>
                                <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>Slide Image</Typography>
                                <ImageUpload
                                  value={slide.src || ''}
                                  onChange={(url) => handleUpdateSlide(selectedSlideIndex, { src: url || undefined })}
                                  path={getWeddingImagePath(weddingId || '', 'events')}
                                  label="Slide Image"
                                  aspectRatio="3/4"
                                />
                              </Box>
                            )}
                          </>
                        );
                      })()}
                    </Stack>
                  </>
                ) : (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    {currentSlides.length > 0 ? (
                      <>
                        {/* Carousel Preview */}
                        <Typography variant="subtitle2" sx={{ mb: 2, color: '#666' }}>Carousel Preview</Typography>
                        <Card sx={{
                          width: '100%', maxWidth: 280, height: 380,
                          borderRadius: '16px', overflow: 'hidden', position: 'relative',
                          backgroundImage: currentItem?.gradient_background ? `url(/images/backgrounds/${currentItem.gradient_background})` : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                          backgroundSize: 'cover', backgroundPosition: 'center',
                        }}>
                          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', p: 3 }}>
                            {currentSlides[previewSlideIndex]?.type === 'three_lines' && (
                              <>
                                {currentSlides[previewSlideIndex].top_label && (
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', mb: 1 }}>
                                    {currentSlides[previewSlideIndex].top_label}
                                  </Typography>
                                )}
                                {currentSlides[previewSlideIndex].main_heading && (
                                  <Typography variant="h3" sx={{ fontSize: '1.5rem', color: '#333', mb: 1 }}>
                                    {currentSlides[previewSlideIndex].main_heading}
                                  </Typography>
                                )}
                                {currentSlides[previewSlideIndex].body_text && (
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
                                    {currentSlides[previewSlideIndex].body_text}
                                  </Typography>
                                )}
                              </>
                            )}
                            {currentSlides[previewSlideIndex]?.type === 'two_sections' && (
                              <Stack spacing={2} sx={{ width: '100%' }}>
                                <Box>
                                  <Typography variant="caption" sx={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', mb: 0.5 }}>
                                    {currentSlides[previewSlideIndex].section1_header || 'WOMEN'}
                                  </Typography>
                                  {(currentSlides[previewSlideIndex].section1_items || []).slice(0, 3).map((item, i) => (
                                    <Typography variant="body2" key={i} sx={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#333' }}>{item}</Typography>
                                  ))}
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', mb: 0.5 }}>
                                    {currentSlides[previewSlideIndex].section2_header || 'MEN'}
                                  </Typography>
                                  {(currentSlides[previewSlideIndex].section2_items || []).slice(0, 3).map((item, i) => (
                                    <Typography variant="body2" key={i} sx={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#333' }}>{item}</Typography>
                                  ))}
                                </Box>
                              </Stack>
                            )}
                            {currentSlides[previewSlideIndex]?.type === 'image' && currentSlides[previewSlideIndex].src && (
                              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                <Image
                                  src={currentSlides[previewSlideIndex].src!}
                                  alt="Slide"
                                  fill
                                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                                />
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                        {/* Navigation */}
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                          <IconButton
                            size="small"
                            onClick={() => setPreviewSlideIndex(Math.max(0, previewSlideIndex - 1))}
                            disabled={previewSlideIndex === 0}
                            sx={{ bgcolor: 'white' }}
                          >
                            <ChevronLeft />
                          </IconButton>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {previewSlideIndex + 1} / {currentSlides.length}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setPreviewSlideIndex(Math.min(currentSlides.length - 1, previewSlideIndex + 1))}
                            disabled={previewSlideIndex === currentSlides.length - 1}
                            sx={{ bgcolor: 'white' }}
                          >
                            <ChevronRight />
                          </IconButton>
                        </Stack>
                        <Typography variant="caption" sx={{ color: '#999', mt: 1 }}>
                          Click a slide on the left to edit
                        </Typography>
                      </>
                    ) : (
                      <>
                        <ImageIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.2 }} />
                        <Typography variant="body2">Add slides to your event to provide more details</Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 3 }}>
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
              px: 4,
              '&:hover': { bgcolor: '#C8365A' },
            }}
          >
            Save Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Persistence Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ borderRadius: '12px', fontWeight: 600 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
