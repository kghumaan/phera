'use client';

import { Box, Typography, Stack } from '@mui/material';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ScheduleItem } from '@/lib/supabase/wedding-service';
import SortableEventWrapper from './SortableEventWrapper';
import InlineMinorForm from './InlineMinorForm';
import InlineMajorForm from './InlineMajorForm';
import { format, parseISO } from 'date-fns';

interface ActiveForm {
  dayId: string;
  type: 'minor' | 'major';
  editingItemId?: string;
}

interface DayCardProps {
  dayId: string;
  date: string; // ISO date string
  events: ScheduleItem[];
  activeForm: ActiveForm | null;
  savingForm?: boolean;
  onSetActiveForm: (form: ActiveForm | null) => void;
  onSaveItem: (dayId: string, data: any) => void;
  onEditItem: (item: ScheduleItem) => void;
  onDeleteItem: (id: string) => void;
  onDragEnd: (event: DragEndEvent, dayId: string) => void;
  onToast?: (message: string) => void;
  onMoreDetails?: (item: ScheduleItem | { dayId: string; formData: any }) => void;
  isViewOnly?: boolean;
}

export default function DayCard({
  dayId,
  date,
  events,
  activeForm,
  savingForm,
  onSetActiveForm,
  onSaveItem,
  onEditItem,
  onDeleteItem,
  onDragEnd,
  onToast,
  onMoreDetails,
  isViewOnly,
}: DayCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Format: "SUNDAY, OCTOBER 12"
  let formattedDate = date;
  try {
    // Try ISO parse first (yyyy-MM-dd)
    let parsed = parseISO(date);
    if (isNaN(parsed.getTime())) {
      // Fallback: try parsing legacy formatted strings like "Monday - January 5, 2025"
      const cleaned = date.replace(/\s*-\s*/, ', ');
      parsed = new Date(cleaned);
    }
    if (!isNaN(parsed.getTime())) {
      formattedDate = format(parsed, 'EEEE, MMMM d').toUpperCase();
    }
  } catch {
    // fallback to raw date
  }

  const isEditingItem = activeForm?.dayId === dayId && activeForm.editingItemId;
  const isAddingNew = activeForm?.dayId === dayId && !activeForm.editingItemId;
  const isSavingThisDay = !!(savingForm && activeForm?.dayId === dayId);

  return (
    <Box sx={{ bgcolor: '#FAFAFA', borderRadius: '16px', p: 2.5 }}>
      {/* Day Header */}
      <Typography sx={{
        fontWeight: 600,
        color: '#6A6A6A',
        fontSize: '0.875rem',
        letterSpacing: 0.32,
        mb: 2,
      }}>
        {formattedDate}
      </Typography>

      {/* Events + Inline forms + Add buttons in a single stack */}
      <Stack spacing={2}>
        {/* Existing events with drag-and-drop */}
        {events.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => onDragEnd(e, dayId)}
          >
            <SortableContext
              items={events.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={1.5}>
                {events.map((item) => {
                  // If editing this item inline, show the form instead
                  if (isEditingItem && activeForm?.editingItemId === item.id) {
                    const editType = item.is_major_event ? 'major' : 'minor';
                    if (editType === 'major') {
                      return (
                        <InlineMajorForm
                          key={item.id}
                          initialData={{
                            name: item.name,
                            time: item.time,
                            location: item.location || '',
                            description: item.description || '',
                            dress_code: item.dress_code || '',
                            gradient_background: item.gradient_background || '',
                          }}
                          onSave={(data) => onSaveItem(dayId, { ...data, id: item.id })}
                          onCancel={() => onSetActiveForm(null)}
                          onToast={onToast}
                          onMoreDetails={() => onMoreDetails?.(item)}
                          isSaving={isSavingThisDay}
                        />
                      );
                    }
                    return (
                      <InlineMinorForm
                        key={item.id}
                        initialData={{
                          name: item.name,
                          time: item.time,
                          location: item.location || '',
                        }}
                        onSave={(data) => onSaveItem(dayId, { ...data, id: item.id })}
                        onCancel={() => onSetActiveForm(null)}
                        isSaving={isSavingThisDay}
                      />
                    );
                  }

                  return (
                    <SortableEventWrapper
                      key={item.id}
                      item={item}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item.id)}
                      onMoreDetails={() => onMoreDetails?.(item)}
                      isViewOnly={isViewOnly}
                    />
                  );
                })}
              </Stack>
            </SortableContext>
          </DndContext>
        )}

        {/* Inline add forms */}
        {isAddingNew && activeForm?.type === 'minor' && (
          <InlineMinorForm
            onSave={(data) => onSaveItem(dayId, data)}
            onCancel={() => onSetActiveForm(null)}
            isSaving={isSavingThisDay}
          />
        )}
        {isAddingNew && activeForm?.type === 'major' && (
          <InlineMajorForm
            onSave={(data) => onSaveItem(dayId, data)}
            onCancel={() => onSetActiveForm(null)}
            onToast={onToast}
            onMoreDetails={(formData) => onMoreDetails?.({ dayId, formData })}
            isSaving={isSavingThisDay}
          />
        )}

        {/* Add buttons */}
        {!isViewOnly && !isAddingNew && (
        <Stack direction="row" spacing={1.5}>
          <Box
            onClick={() => onSetActiveForm({ dayId, type: 'minor' })}
            sx={{
              flex: 1,
              bgcolor: '#EBEBEB',
              border: '1px dashed #BCBCBC',
              borderRadius: '8px',
              px: 2, py: 1.5,
              cursor: 'pointer',
              textAlign: 'center',
              '&:hover': { bgcolor: '#E0E0E0', borderColor: '#999' },
            }}
          >
            <Typography sx={{ fontWeight: 600, color: '#141414', fontSize: '1rem', lineHeight: 1.5 }}>
              Add Minor Event
            </Typography>
            <Typography sx={{ color: '#858585', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Events like breakfast, lunch, high-tea
            </Typography>
          </Box>
          <Box
            onClick={() => onSetActiveForm({ dayId, type: 'major' })}
            sx={{
              flex: 1,
              bgcolor: '#EBEBEB',
              border: '1px dashed #BCBCBC',
              borderRadius: '8px',
              px: 2, py: 1.5,
              cursor: 'pointer',
              textAlign: 'center',
              '&:hover': { bgcolor: '#E0E0E0', borderColor: '#999' },
            }}
          >
            <Typography sx={{ fontWeight: 600, color: '#141414', fontSize: '1rem', lineHeight: 1.5 }}>
              Add Major Event
            </Typography>
            <Typography sx={{ color: '#858585', fontSize: '0.875rem', lineHeight: 1.5 }}>
              {'Events with descriptions & dress codes'}
            </Typography>
          </Box>
        </Stack>
        )}
      </Stack>
    </Box>
  );
}
