'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import { TravelSection } from '@/lib/supabase/wedding-service';
import TravelSectionCard from './TravelSectionCard';
import InlineTravelForm from './InlineTravelForm';

interface SortableTravelWrapperProps {
  section: TravelSection;
  onEdit: () => void;
  onDelete: () => void;
  onEditDetails?: () => void;
  isViewOnly?: boolean;
  isEditing?: boolean;
  editFormProps?: {
    onSave: (updates: Partial<TravelSection>) => void;
    onCancel: () => void;
    onMoreDetails?: () => void;
    isSaving?: boolean;
  };
}

export default function SortableTravelWrapper({
  section,
  onEdit,
  onDelete,
  onEditDetails,
  isViewOnly,
  isEditing,
  editFormProps,
}: SortableTravelWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const dragHandleProps = isViewOnly ? {} : { ...attributes, ...listeners };

  return (
    <Box ref={setNodeRef} style={style}>
      {isEditing && editFormProps ? (
        <InlineTravelForm
          section={section}
          onSave={editFormProps.onSave}
          onCancel={editFormProps.onCancel}
          onMoreDetails={editFormProps.onMoreDetails}
          isSaving={editFormProps.isSaving}
        />
      ) : (
        <TravelSectionCard
          section={section}
          onEdit={onEdit}
          onDelete={onDelete}
          onEditDetails={onEditDetails}
          dragHandleProps={dragHandleProps}
          isViewOnly={isViewOnly}
        />
      )}
    </Box>
  );
}
