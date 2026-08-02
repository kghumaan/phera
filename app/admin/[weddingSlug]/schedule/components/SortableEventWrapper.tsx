'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import { ScheduleItem } from '@/lib/supabase/wedding-service';
import MinorEventCard from './MinorEventCard';
import MajorEventCard from './MajorEventCard';

interface SortableEventWrapperProps {
  item: ScheduleItem;
  onEdit: () => void;
  onDelete: () => void;
  onMoreDetails?: () => void;
  isViewOnly?: boolean;
}

export default function SortableEventWrapper({ item, onEdit, onDelete, onMoreDetails, isViewOnly }: SortableEventWrapperProps) {
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

  const dragHandleProps = { ...attributes, ...listeners };

  return (
    <Box ref={setNodeRef} style={style}>
      {item.is_major_event ? (
        <MajorEventCard
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onMoreDetails={onMoreDetails}
          dragHandleProps={dragHandleProps}
          isViewOnly={isViewOnly}
        />
      ) : (
        <MinorEventCard
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          dragHandleProps={dragHandleProps}
          isViewOnly={isViewOnly}
        />
      )}
    </Box>
  );
}
