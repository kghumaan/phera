'use client';

import { Box, Typography, Stack } from '@mui/material';
import { useState, useEffect, use, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { weddingService, ScheduleItem } from '@/lib/supabase/wedding-service';
import { parseISO, format } from 'date-fns';
import { planScheduleReconciliation } from '@/lib/schedule/reconcile-days';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ContinueButton from '@/components/admin/ContinueButton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PageHeading } from '@/components/shared/PageHeading';
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
  // - Reassigns dates on existing days when the range shifts (same duration,
  //   different dates → data is retained, only the dates are remapped)
  // - Creates new days if the range grew
  // - Deletes trailing days if the range shrank, keeping the first N days
  //   (and their events) that still fit the new, shorter range
  const ensureDaysExist = useCallback(async (
    wId: string,
    dateStart: Date,
    dateEnd: Date | null,
    existingDays: DayWithItems[]
  ) => {
    if (ensureDaysRunning.current) return false;
    ensureDaysRunning.current = true;

    try {
      const plan = planScheduleReconciliation(
        dateStart,
        dateEnd,
        existingDays.map(d => ({
          id: d.id,
          date: d.date,
          order_index: d.order_index,
          eventIds: d.events.map(e => e.id),
        })),
      );
      if (plan.inSync) return false;

      // Remap overlapping days (data retained).
      for (const u of plan.updates) {
        await weddingService.updateSchedule(u.id, {
          date: u.date,
          day_name: u.day_name,
          order_index: u.order_index,
        });
      }

      // Range grew → append new empty days.
      for (const c of plan.creates) {
        await weddingService.createSchedule({
          wedding_id: wId,
          day_name: c.day_name,
          date: c.date,
          order_index: c.order_index,
        });
      }

      // Range shrank → delete trailing days from the END. Delete each day's
      // events first in case the FK doesn't cascade (no orphaned schedule_items).
      for (const del of plan.deletes) {
        for (const eventId of del.eventIds) {
          await weddingService.deleteScheduleItem(eventId);
        }
        await weddingService.deleteSchedule(del.dayId);
      }

      return plan.updates.length > 0 || plan.creates.length > 0 || plan.deletes.length > 0;
    } finally {
      ensureDaysRunning.current = false;
    }
  }, []);

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

  const handleSaveItem = async (dayId: string, formData: Partial<ScheduleItem>) => {
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

  const handleMoreDetails = useCallback(async (itemOrNew: ScheduleItem | { dayId: string; formData: Partial<ScheduleItem> }) => {
    if (isViewOnly || !weddingId) return;

    // Check if this is an existing schedule item (has 'id' field)
    if ('id' in itemOrNew && typeof itemOrNew.id === 'string' && (itemOrNew as ScheduleItem).schedule_id) {
      // Existing item — open modal directly
      setMoreDetailsItem(itemOrNew as ScheduleItem);
    } else {
      // New item from inline form — auto-save then open modal
      const { dayId, formData } = itemOrNew as { dayId: string; formData: Partial<ScheduleItem> };
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

  // ── Drag & drop (cross-day) ──────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const sourceDayRef = useRef<string | null>(null);

  const findDay = useCallback(
    (data: DayWithItems[], id: string): DayWithItems | undefined =>
      data.find(d => d.id === id || d.events.some(e => e.id === id)),
    [],
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (isViewOnly) return;
    const id = String(event.active.id);
    const day = scheduleData.find(d => d.events.some(e => e.id === id));
    sourceDayRef.current = day?.id ?? null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (isViewOnly) return;
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setScheduleData(prev => {
      const activeDay = prev.find(d => d.events.some(e => e.id === activeId));
      if (!activeDay) return prev;
      const overDay = findDay(prev, overId);
      if (!overDay || activeDay.id === overDay.id) return prev;

      const activeItem = activeDay.events.find(e => e.id === activeId);
      if (!activeItem) return prev;

      const sourceEvents = activeDay.events.filter(e => e.id !== activeId);
      const overIsDay = overDay.id === overId;
      let insertAt = overDay.events.length;
      if (!overIsDay) {
        const idx = overDay.events.findIndex(e => e.id === overId);
        if (idx !== -1) insertAt = idx;
      }
      const targetEvents = [...overDay.events];
      targetEvents.splice(insertAt, 0, { ...activeItem, schedule_id: overDay.id });

      return prev.map(d => {
        if (d.id === activeDay.id) return { ...d, events: sourceEvents };
        if (d.id === overDay.id) return { ...d, events: targetEvents };
        return d;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const source = sourceDayRef.current;
    sourceDayRef.current = null;
    if (isViewOnly) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const nextStateRef: { value: DayWithItems[] } = { value: [] };
    setScheduleData(prev => {
      const currentDay = prev.find(d => d.events.some(e => e.id === activeId));
      if (!currentDay) { nextStateRef.value = prev; return prev; }

      // Final reorder within current day when dropping on another item in same day
      if (currentDay.events.some(e => e.id === overId) && activeId !== overId) {
        const oldIdx = currentDay.events.findIndex(e => e.id === activeId);
        const newIdx = currentDay.events.findIndex(e => e.id === overId);
        const next = prev.map(d => d.id === currentDay.id
          ? { ...d, events: arrayMove(d.events, oldIdx, newIdx) }
          : d
        );
        nextStateRef.value = next;
        return next;
      }
      nextStateRef.value = prev;
      return prev;
    });

    const nextState = nextStateRef.value;
    const targetDay = nextState.find(d => d.events.some(e => e.id === activeId));
    if (!targetDay) return;

    const crossDay = source !== null && source !== targetDay.id;
    const updates: { id: string; order_index: number; schedule_id?: string }[] = [];

    targetDay.events.forEach((item, idx) => {
      updates.push({
        id: item.id,
        order_index: idx,
        schedule_id: targetDay.id,
      });
    });

    if (crossDay) {
      const sourceDay = nextState.find(d => d.id === source);
      sourceDay?.events.forEach((item, idx) => {
        updates.push({ id: item.id, order_index: idx });
      });
    }

    try {
      await weddingService.reorderScheduleItems(updates);
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
          <PageHeading
            title="Schedule & Events"
            subtitle="Plan the timeline for your celebration"
          />
          <Box sx={{
            bgcolor: COLORS.brand.primaryWash,
            borderRadius: RADII.lg,
            p: 6,
            border: `1px dashed ${COLORS.brand.primary}`,
            textAlign: 'center',
          }}>
            <Stack spacing={3} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
                Set your wedding dates first
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle, maxWidth: 400 }}>
                We need your wedding dates to auto-generate your schedule days.
                Head to Wedding Details to set them.
              </Typography>
              <PrimaryActionButton
                href={`/admin/${weddingSlug}/details`}
                sx={{
                  px: 4, py: 1.5,
                  fontWeight: 700,
                }}
              >
                Add Wedding Dates
              </PrimaryActionButton>
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
        <PageHeading
          title="Schedule & Events"
          subtitle="Plan the timeline for your celebration"
        />

        {/* Examples Section */}
        {showExamples && <ExamplesSection onDismiss={handleDismissExamples} />}

        {/* Day Cards */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
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
                onToast={() => {}}
                onMoreDetails={handleMoreDetails}
                isViewOnly={isViewOnly}
              />
            ))}
          </Stack>
        </DndContext>
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
