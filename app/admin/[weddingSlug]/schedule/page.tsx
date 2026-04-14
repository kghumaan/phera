'use client';

import { Box, Typography, Stack, Button } from '@mui/material';
import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { weddingService, ScheduleItem } from '@/lib/supabase/wedding-service';
import { parseISO, eachDayOfInterval, format } from 'date-fns';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ContinueButton from '@/components/admin/ContinueButton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import ExamplesSection from './components/ExamplesSection';
import DayCard from './components/DayCard';
import MoreDetailsModal from './components/MoreDetailsModal';

interface DayWithItems {
  id: string;
  wedding_id: string | null;
  day_name: string;
  date: string;
  order_index: number;
  events: ScheduleItem[];
}

interface ActiveForm {
  dayId: string;
  type: 'minor' | 'major';
  editingItemId?: string;
}

const EXAMPLES_DISMISSED_KEY = 'schedule-examples-dismissed';

export default function SchedulePage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();
  const { isViewOnly } = useAdminRole();
  const { setStatus: setGlobalSaveStatus } = useAutoSaveStatus();

  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [weddingDate, setWeddingDate] = useState<Date | null>(null);
  const [weddingDateEnd, setWeddingDateEnd] = useState<Date | null>(null);
  const [weddingBackground, setWeddingBackground] = useState<string | undefined>(undefined);
  const [scheduleData, setScheduleData] = useState<DayWithItems[]>([]);

  const [showExamples, setShowExamples] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(EXAMPLES_DISMISSED_KEY) !== 'true';
  });
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({
    open: false, message: '', onConfirm: () => {},
  });
  const [moreDetailsItem, setMoreDetailsItem] = useState<ScheduleItem | null>(null);

  const showStatus = useCallback((status: 'saving' | 'saved' | 'error') => {
    setGlobalSaveStatus(status);
    if (status === 'saved') setTimeout(() => setGlobalSaveStatus('idle'), 2000);
    if (status === 'error') setTimeout(() => setGlobalSaveStatus('idle'), 3000);
  }, [setGlobalSaveStatus]);

  const syncPreview = useCallback(async (wId: string) => {
    await weddingService.markUnpublishedChanges(wId);
    const channel = new BroadcastChannel('phera-design-sync');
    channel.postMessage({ type: 'PREVIEW_REFRESH' });
    channel.close();
  }, []);

  // Normalize date string to ISO yyyy-MM-dd (handles legacy "Monday - January 5, 2025" format)
  const normalizeDateStr = useCallback((d: string): string => {
    // Already ISO?
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    try {
      const cleaned = d.replace(/\s*-\s*/, ', ');
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, 'yyyy-MM-dd');
      }
    } catch { /* ignore */ }
    return d;
  }, []);

  // Guard against concurrent ensureDaysExist calls (React StrictMode, fast re-renders)
  const ensureDaysRunning = useRef(false);

  // Sync schedule days with the wedding date range.
  // - Reassigns dates on existing days when the range shifts
  // - Creates new days if the range grew
  // - Never deletes days — extras keep their events
  const ensureDaysExist = useCallback(async (
    wId: string,
    dateStart: Date,
    dateEnd: Date | null,
    existingDays: DayWithItems[]
  ) => {
    if (ensureDaysRunning.current) return false;
    ensureDaysRunning.current = true;

    try {
      const endDate = dateEnd || dateStart;
      const allDates = eachDayOfInterval({ start: dateStart, end: endDate });

      // Sort existing days by order_index so we reassign in order
      const sorted = [...existingDays].sort((a, b) => a.order_index - b.order_index);

      // Check if existing days already match the new date range
      const existingDateSet = new Set(sorted.map(d => normalizeDateStr(d.date)));
      const newDateStrs = allDates.map(d => format(d, 'yyyy-MM-dd'));
      const alreadyInSync = newDateStrs.every(d => existingDateSet.has(d)) && sorted.length >= allDates.length;
      if (alreadyInSync) return false;

      let changed = false;

      // Reassign dates on existing days that overlap with the new range
      for (let i = 0; i < Math.min(sorted.length, allDates.length); i++) {
        const newDateStr = format(allDates[i], 'yyyy-MM-dd');
        const newDayName = format(allDates[i], 'EEEE');
        const existingNorm = normalizeDateStr(sorted[i].date);

        if (existingNorm !== newDateStr) {
          await weddingService.updateSchedule(sorted[i].id, {
            date: newDateStr,
            day_name: newDayName,
            order_index: i,
          });
          changed = true;
        } else if (sorted[i].order_index !== i) {
          await weddingService.updateSchedule(sorted[i].id, { order_index: i });
          changed = true;
        }
      }

      // If the range grew, create new days for the extra dates
      for (let i = sorted.length; i < allDates.length; i++) {
        const dateStr = format(allDates[i], 'yyyy-MM-dd');
        const dayName = format(allDates[i], 'EEEE');
        await weddingService.createSchedule({
          wedding_id: wId,
          day_name: dayName,
          date: dateStr,
          order_index: i,
        });
        changed = true;
      }

      return changed;
    } finally {
      ensureDaysRunning.current = false;
    }
  }, [normalizeDateStr]);

  const loadData = useCallback(async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (!wedding) return;

      setWeddingId(wedding.id);
      const wDate = wedding.wedding_date ? parseISO(wedding.wedding_date) : null;
      const wDateEnd = wedding.wedding_date_end ? parseISO(wedding.wedding_date_end) : null;
      setWeddingDate(wDate);
      setWeddingDateEnd(wDateEnd);
      setWeddingBackground(wedding.background_image || undefined);

      let scheduleResult = await weddingService.getWeddingSchedule(wedding.id);

      // Auto-generate missing days
      if (wDate) {
        const created = await ensureDaysExist(wedding.id, wDate, wDateEnd, scheduleResult as DayWithItems[]);
        if (created) {
          scheduleResult = await weddingService.getWeddingSchedule(wedding.id);
        }
      }

      // Deduplicate days that map to the same ISO date (legacy vs new format)
      const byIsoDate = new Map<string, DayWithItems>();
      for (const day of scheduleResult as DayWithItems[]) {
        const iso = normalizeDateStr(day.date);
        const existing = byIsoDate.get(iso);
        if (existing) {
          // Merge events from the duplicate into the first occurrence
          existing.events = [...existing.events, ...day.events];
          // Prefer the ISO-formatted date string
          if (/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
            existing.date = day.date;
          }
        } else {
          byIsoDate.set(iso, { ...day });
        }
      }

      // Sort by date
      const sorted = [...byIsoDate.values()].sort((a, b) =>
        normalizeDateStr(a.date).localeCompare(normalizeDateStr(b.date))
      );
      setScheduleData(sorted);
    } catch (err) {
      console.error('Error loading schedule:', err);
      showStatus('error');
    } finally {
      setLoading(false);
    }
  }, [weddingSlug, ensureDaysExist, showStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDismissExamples = () => {
    setShowExamples(false);
    localStorage.setItem(EXAMPLES_DISMISSED_KEY, 'true');
  };

  const handleSaveItem = async (dayId: string, formData: any) => {
    if (isViewOnly || !weddingId) return;

    setSavingForm(true);
    showStatus('saving');
    try {
      if (formData.id) {
        const { id, ...updates } = formData;
        await weddingService.updateScheduleItem(id, updates);
      } else {
        const day = scheduleData.find(d => d.id === dayId);
        const orderIndex = day ? day.events.length : 0;
        await weddingService.createScheduleItem({
          ...formData,
          schedule_id: dayId,
          order_index: orderIndex,
          time: formData.time || '',
        });
      }
      await loadData();
      await syncPreview(weddingId);
      setActiveForm(null);
      showStatus('saved');
    } catch (err) {
      console.error('Error saving event:', err);
      showStatus('error');
    } finally {
      setSavingForm(false);
    }
  };

  const handleEditItem = (item: ScheduleItem) => {
    if (isViewOnly) return;
    const day = scheduleData.find(d => d.events.some(e => e.id === item.id));
    if (!day) return;
    setActiveForm({
      dayId: day.id,
      type: item.is_major_event ? 'major' : 'minor',
      editingItemId: item.id,
    });
  };

  const handleDeleteItem = async (id: string) => {
    if (isViewOnly) return;
    setConfirmDialog({
      open: true,
      message: 'Are you sure you want to delete this event?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        showStatus('saving');
        try {
          await weddingService.deleteScheduleItem(id);
          await loadData();
          if (weddingId) await syncPreview(weddingId);
          showStatus('saved');
        } catch (err) {
          console.error('Error deleting event:', err);
          showStatus('error');
        }
      },
    });
  };

  const handleMoreDetails = useCallback(async (itemOrNew: ScheduleItem | { dayId: string; formData: any }) => {
    if (isViewOnly || !weddingId) return;

    // Check if this is an existing schedule item (has 'id' field)
    if ('id' in itemOrNew && typeof itemOrNew.id === 'string' && (itemOrNew as ScheduleItem).schedule_id) {
      // Existing item — open modal directly
      setMoreDetailsItem(itemOrNew as ScheduleItem);
    } else {
      // New item from inline form — auto-save then open modal
      const { dayId, formData } = itemOrNew as { dayId: string; formData: any };
      if (!formData || !formData.name) {
        return;
      }
      setSavingForm(true);
      showStatus('saving');
      try {
        const day = scheduleData.find(d => d.id === dayId);
        const orderIndex = day ? day.events.length : 0;
        const created = await weddingService.createScheduleItem({
          ...formData,
          is_major_event: true,
          schedule_id: dayId,
          order_index: orderIndex,
          time: formData.time || '',
        });
        await loadData();
        setActiveForm(null);
        setMoreDetailsItem(created as unknown as ScheduleItem);
        await syncPreview(weddingId);
        showStatus('saved');
      } catch (err) {
        console.error('Error auto-saving event:', err);
        showStatus('error');
      } finally {
        setSavingForm(false);
      }
    }
  }, [isViewOnly, weddingId, showStatus, scheduleData, loadData, syncPreview]);

  const handleDragEnd = async (event: DragEndEvent, dayId: string) => {
    if (isViewOnly) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const day = scheduleData.find(d => d.id === dayId);
    if (!day) return;

    const oldIndex = day.events.findIndex(item => item.id === active.id);
    const newIndex = day.events.findIndex(item => item.id === over.id);
    const newEvents = arrayMove(day.events, oldIndex, newIndex);

    // Optimistic update
    setScheduleData(prev => prev.map(d =>
      d.id === dayId ? { ...d, events: newEvents } : d
    ));

    try {
      await weddingService.reorderScheduleItems(
        newEvents.map((item, index) => ({ id: item.id, order_index: index }))
      );
      if (weddingId) await syncPreview(weddingId);
    } catch (err) {
      console.error('Error reordering:', err);
      showStatus('error');
      await loadData();
    }
  };

  if (loading) return <LoadingSpinner />;

  // No wedding date set
  if (!weddingDate) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={ENHANCED_SECTION_SPACING}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
              Wedding Schedule
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Plan the timeline for your celebration
            </Typography>
          </Box>
          <Box sx={{
            bgcolor: 'rgba(222, 63, 94, 0.04)',
            borderRadius: '16px',
            p: 6,
            border: '1px dashed #DE3F5E',
            textAlign: 'center',
          }}>
            <Stack spacing={3} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                Set your wedding dates first
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', maxWidth: 400 }}>
                We need your wedding dates to auto-generate your schedule days.
                Head to Wedding Details to set them.
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push(`/admin/${weddingSlug}/details`)}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  px: 4, py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#C8365A' },
                }}
              >
                Add Wedding Dates
              </Button>
            </Stack>
          </Box>
        </Stack>
        <ContinueButton weddingSlug={weddingSlug} currentSection="schedule" weddingId={weddingId} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        {/* Header */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
            Wedding Schedule
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Plan the timeline for your celebration
          </Typography>
        </Box>

        {/* Examples Section */}
        {showExamples && <ExamplesSection onDismiss={handleDismissExamples} />}

        {/* Day Cards */}
        <Stack spacing={3}>
          {scheduleData.map((day) => (
            <DayCard
              key={day.id}
              dayId={day.id}
              date={day.date}
              events={day.events}
              activeForm={activeForm}
              savingForm={savingForm}
              onSetActiveForm={setActiveForm}
              onSaveItem={handleSaveItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onDragEnd={handleDragEnd}
              onToast={() => {}}
              onMoreDetails={handleMoreDetails}
              isViewOnly={isViewOnly}
            />
          ))}
        </Stack>
      </Stack>

      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />

      {moreDetailsItem && weddingId && (
        <MoreDetailsModal
          open={!!moreDetailsItem}
          onClose={() => setMoreDetailsItem(null)}
          weddingId={weddingId}
          scheduleItem={moreDetailsItem}
          weddingBackground={weddingBackground}
          onSaved={async () => {
            await loadData();
            if (weddingId) await syncPreview(weddingId);
          }}
        />
      )}

      <ContinueButton weddingSlug={weddingSlug} currentSection="schedule" weddingId={weddingId} />
    </Box>
  );
}
