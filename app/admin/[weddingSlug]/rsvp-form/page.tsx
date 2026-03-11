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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  Lock,
  CalendarToday,
  AddCircleOutline,
  Close,
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
import { weddingService } from '@/lib/supabase/wedding-service';
import {
  getCustomQuestions,
  upsertCustomQuestionStep,
  deleteCustomQuestionStep,
  reorderCustomQuestionSteps,
} from '@/lib/supabase/rsvp-service';
import { RSVPCustomQuestionStep, CustomQuestion } from '@/lib/supabase/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ContinueButton from '@/components/admin/ContinueButton';
import { toast } from 'sonner';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

const FIXED_STEPS = [
  'Basic Information',
  'Account Creation',
  'RSVP',
  'Plus One Details',
  'Dietary Restrictions',
  'Team Bride/Groom',
  'Music Request & Comment',
];

const OPTIONAL_FIXED_STEPS = new Set(['Team Bride/Groom', 'Music Request & Comment']);

const FIXED_STEP_DESCRIPTIONS: Record<string, string> = {
  'Basic Information': 'Collects guest name, email, and phone number',
  'Account Creation': 'Lets guests create a password for their account',
  'RSVP': 'Guest confirms attendance: attending, not attending, or maybe',
  'Plus One Details': 'Collects plus-one name, email, and phone if allowed by PIN',
  'Dietary Restrictions': 'Food preferences and dietary restriction details',
  'Team Bride/Groom': 'Guest picks whose side they\'re celebrating',
  'Music Request & Comment': 'Song request and a personal message to the couple',
};

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'numeric', label: 'Number' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'date', label: 'Date' },
];

type MergedItem =
  | { type: 'fixed'; id: string; name: string }
  | { type: 'custom'; id: string; step: RSVPCustomQuestionStep };

// Unified sortable item that renders both fixed and custom steps
function SortableStepRow({
  item,
  onEdit,
  onDelete,
  onClick,
  isSelected,
  isDeleting,
  onPinNavigate,
}: {
  item: MergedItem;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick: () => void;
  isSelected: boolean;
  isDeleting?: boolean;
  onPinNavigate?: () => void;
}) {
  const isCustom = item.type === 'custom';
  const isOptionalFixed = !isCustom && OPTIONAL_FIXED_STEPS.has(item.name);
  const description = !isCustom ? FIXED_STEP_DESCRIPTIONS[item.name] : undefined;
  const isPlusOne = !isCustom && item.name === 'Plus One Details';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !isCustom, // Only custom steps are draggable
  });

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
      onClick={onClick}
      sx={{
        bgcolor: 'white',
        borderRadius: '12px',
        p: 2,
        border: isSelected ? '1.5px solid #DE3F5E' : '1px solid #eee',
        boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : 'none',
        cursor: 'pointer',
        '&:hover': { borderColor: isSelected ? '#DE3F5E' : '#ddd', bgcolor: isSelected ? alpha('#DE3F5E', 0.02) : '#fafafa' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        {isCustom ? (
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: '#999', display: 'flex' }}>
            <DragIndicator />
          </Box>
        ) : !isOptionalFixed ? (
          <Lock sx={{ color: '#DE3F5E', fontSize: 20, opacity: 0.6 }} />
        ) : null}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: isCustom ? 600 : 500, color: '#1a1a1a' }}>
              {isCustom ? item.step.step_title : item.name}
            </Typography>
            {isCustom && (
              <Chip
                label={`${item.step.questions.length} question${item.step.questions.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: alpha('#DE3F5E', 0.1),
                  color: '#DE3F5E',
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>
          {/* Subtext description for fixed steps when selected */}
          {!isCustom && isSelected && description && (
            <Typography variant="caption" sx={{ color: '#6a6a6a', mt: 0.5, display: 'block' }}>
              {description}
            </Typography>
          )}
        </Box>

        {/* Plus One Details: PIN settings note */}
        {isPlusOne && onPinNavigate && (
          <Typography
            component="span"
            onClick={e => { e.stopPropagation(); onPinNavigate(); }}
            variant="caption"
            sx={{
              color: '#DE3F5E',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Shown based on PIN settings
          </Typography>
        )}

        {/* Custom step actions */}
        {isCustom && (
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <IconButton
              size="medium"
              onClick={onEdit}
              sx={{ color: '#4a4a4a', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="medium"
              onClick={onDelete}
              disabled={isDeleting}
              sx={{ color: '#DE3F5E', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
            >
              {isDeleting ? <CircularProgress size={18} sx={{ color: '#DE3F5E' }} /> : <Delete fontSize="small" />}
            </IconButton>
          </Stack>
        )}

        {/* Optional fixed step delete */}
        {isOptionalFixed && (
          <Box sx={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <IconButton
              size="medium"
              onClick={onDelete}
              disabled={isDeleting}
              sx={{ color: '#DE3F5E', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
            >
              {isDeleting ? <CircularProgress size={18} sx={{ color: '#DE3F5E' }} /> : <Delete fontSize="small" />}
            </IconButton>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

// Consistent disabled field preview styling
const PREVIEW_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    bgcolor: '#f0f0f0',
    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.2)' },
  },
  '& .Mui-disabled': {
    WebkitTextFillColor: '#888',
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: '#888',
    WebkitTextFillColor: '#888',
    opacity: 1,
  },
};

const PREVIEW_SELECT_SX = {
  borderRadius: '12px',
  bgcolor: '#f0f0f0',
  '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.2)' },
  '& .Mui-disabled': { WebkitTextFillColor: '#888' },
};

// Field preview for each question type (disabled inputs)
function FieldPreview({ type, options }: { type: CustomQuestion['type']; options?: string[] }) {
  switch (type) {
    case 'short_text':
      return (
        <TextField
          disabled
          placeholder="Short answer text"
          size="small"
          fullWidth
          sx={{ ...PREVIEW_FIELD_SX, maxWidth: 360 }}
        />
      );
    case 'long_text':
      return (
        <TextField
          disabled
          placeholder="Long answer text"
          size="small"
          fullWidth
          multiline
          rows={2}
          sx={PREVIEW_FIELD_SX}
        />
      );
    case 'numeric':
      return (
        <TextField
          disabled
          placeholder="Number"
          size="small"
          type="number"
          sx={{ ...PREVIEW_FIELD_SX, maxWidth: 200 }}
        />
      );
    case 'dropdown':
      return (
        <Select
          disabled
          displayEmpty
          value=""
          size="small"
          sx={{ ...PREVIEW_SELECT_SX, maxWidth: 280 }}
          renderValue={() => <Typography sx={{ color: '#888', fontSize: '0.875rem' }}>Select an option</Typography>}
        >
          {(options || []).map((opt, i) => (
            <MenuItem key={i} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      );
    case 'date':
      return (
        <TextField
          disabled
          placeholder="Month, day, year"
          size="small"
          InputProps={{
            endAdornment: <CalendarToday sx={{ color: '#888', fontSize: 18 }} />,
          }}
          sx={{ ...PREVIEW_FIELD_SX, maxWidth: 240 }}
        />
      );
    default:
      return null;
  }
}

const emptyQuestion = (): CustomQuestion => ({
  id: crypto.randomUUID(),
  label: '',
  type: 'short_text',
  required: false,
  options: [],
});

export default function RSVPFormPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isViewOnly } = useAdminRole();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [customSteps, setCustomSteps] = useState<RSVPCustomQuestionStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [hiddenFixedSteps, setHiddenFixedSteps] = useState<Set<string>>(new Set());
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<RSVPCustomQuestionStep | null>(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [dialogQuestions, setDialogQuestions] = useState<CustomQuestion[]>([emptyQuestion()]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; confirmLabel?: string; onConfirm: () => void }>({
    open: false, message: '', onConfirm: () => {},
  });
  const [navigatingToPin, setNavigatingToPin] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        const steps = await getCustomQuestions(weddingSlug);
        setCustomSteps(steps);
        setHiddenFixedSteps(new Set(wedding.hidden_rsvp_steps || []));
      }
    } catch (err) {
      console.error('Error loading RSVP form config:', err);
      toast.error('Failed to load RSVP form configuration');
    } finally {
      setLoading(false);
    }
  };

  // Build merged step list with stable IDs for both fixed and custom
  const mergedSteps: MergedItem[] = (() => {
    const result: MergedItem[] = [];
    for (const fixedStep of FIXED_STEPS) {
      if (hiddenFixedSteps.has(fixedStep)) continue;
      result.push({ type: 'fixed', id: `fixed-${fixedStep}`, name: fixedStep });
      const stepsAfter = customSteps
        .filter(s => s.insert_after === fixedStep)
        .sort((a, b) => a.order_index - b.order_index);
      stepsAfter.forEach(s => result.push({ type: 'custom', id: s.id, step: s }));
    }
    // Orphans (insert_after doesn't match any fixed step)
    const fixedSet = new Set(FIXED_STEPS);
    const orphans = customSteps.filter(s => !fixedSet.has(s.insert_after));
    orphans.forEach(s => result.push({ type: 'custom', id: s.id, step: s }));
    return result;
  })();

  const handleStepClick = useCallback((item: MergedItem) => {
    setSelectedStepId(item.id);
    const stepName = item.type === 'fixed' ? item.name : item.step.step_title;
    const stepId = item.type === 'custom' ? item.step.id : undefined;
    // Find the preview iframe and send name + id so the form can resolve its own index
    const iframe = document.querySelector('iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'NAVIGATE_TO_RSVP_STEP', stepName, stepId },
        '*'
      );
    }
  }, []);

  const handleOpenAdd = () => {
    setEditingStep(null);
    setDialogTitle('');
    setDialogDescription('');
    setDialogQuestions([emptyQuestion()]);
    setActiveQuestionIndex(0);
    setEditingTitle(false);
    setEditingDescription(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (step: RSVPCustomQuestionStep) => {
    setEditingStep(step);
    setDialogTitle(step.step_title);
    setDialogDescription(step.description || '');
    setDialogQuestions(step.questions.length > 0 ? [...step.questions] : [emptyQuestion()]);
    setActiveQuestionIndex(null);
    setEditingTitle(false);
    setEditingDescription(false);
    setDialogOpen(true);
  };

  const handleSaveStep = async () => {
    if (!dialogTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    const validQuestions = dialogQuestions.filter(q => q.label.trim());
    if (validQuestions.length === 0) {
      toast.error('At least one question is required');
      return;
    }

    setSaving(true);
    try {
      const insertAfter = editingStep?.insert_after || FIXED_STEPS[FIXED_STEPS.length - 1];
      const orderIndex = editingStep ? editingStep.order_index : customSteps.length;

      const stepData = {
        id: editingStep?.id || crypto.randomUUID(),
        wedding_id: weddingSlug,
        step_title: dialogTitle.trim(),
        description: dialogDescription.trim() || null,
        insert_after: insertAfter,
        order_index: orderIndex,
        questions: validQuestions,
      };

      await upsertCustomQuestionStep(stepData);
      await loadData();
      setDialogOpen(false);
      toast.success(editingStep ? 'Step updated' : 'Step added');

      // Notify preview to re-fetch custom questions
      const channel = new BroadcastChannel('phera-design-sync');
      channel.postMessage({ type: 'RSVP_CUSTOM_QUESTIONS_UPDATED' });
      channel.close();
    } catch (err) {
      console.error('Error saving step:', err);
      toast.error('Failed to save step');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStep = (step: RSVPCustomQuestionStep) => {
    setConfirmDialog({
      open: true,
      message: `Delete "${step.step_title}"? Existing guest answers for this step will be kept but hidden.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setDeletingStepId(step.id);
        try {
          await deleteCustomQuestionStep(step.id);
          const updatedCustomSteps = customSteps.filter(s => s.id !== step.id);
          setCustomSteps(updatedCustomSteps);
          toast.success('Step deleted');

          // Notify preview to re-fetch custom questions
          const channel = new BroadcastChannel('phera-design-sync');
          channel.postMessage({ type: 'RSVP_CUSTOM_QUESTIONS_UPDATED' });
          channel.close();

          // Refresh preview: navigate to first remaining step
          const updatedMerged: MergedItem[] = [];
          for (const fixedStep of FIXED_STEPS) {
            if (hiddenFixedSteps.has(fixedStep)) continue;
            updatedMerged.push({ type: 'fixed', id: `fixed-${fixedStep}`, name: fixedStep });
          }
          const firstStep = updatedMerged[0];
          if (firstStep) {
            setSelectedStepId(firstStep.id);
            const iframe = document.querySelector('iframe') as HTMLIFrameElement | null;
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage(
                { type: 'NAVIGATE_TO_RSVP_STEP', stepName: firstStep.type === 'fixed' ? firstStep.name : '' },
                '*'
              );
            }
          }
        } catch (err) {
          console.error('Error deleting step:', err);
          toast.error('Failed to delete step');
        } finally {
          setDeletingStepId(null);
        }
      },
    });
  };

  const handleDeleteFixedStep = (stepName: string) => {
    setConfirmDialog({
      open: true,
      message: `Hide "${stepName}"? This step won't appear in the guest RSVP form.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setDeletingStepId(`fixed-${stepName}`);
        try {
          const newHidden = new Set(hiddenFixedSteps);
          newHidden.add(stepName);
          await weddingService.updateHiddenRsvpSteps(weddingSlug, Array.from(newHidden));
          setHiddenFixedSteps(newHidden);
          toast.success('Step hidden');

          // Refresh preview: navigate to first remaining step
          const remainingFixed = FIXED_STEPS.filter(s => !newHidden.has(s));
          if (remainingFixed.length > 0) {
            const firstId = `fixed-${remainingFixed[0]}`;
            setSelectedStepId(firstId);
            const iframe = document.querySelector('iframe') as HTMLIFrameElement | null;
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage(
                { type: 'NAVIGATE_TO_RSVP_STEP', stepName: remainingFixed[0] },
                '*'
              );
            }
          }
        } catch (err) {
          console.error('Error hiding step:', err);
          toast.error('Failed to hide step');
        } finally {
          setDeletingStepId(null);
        }
      },
    });
  };

  const handlePinNavigate = () => {
    setConfirmDialog({
      open: true,
      message: 'Go to Pin Management?',
      confirmLabel: 'Go to Pin Management',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        setNavigatingToPin(true);
        router.push(`/admin/${weddingSlug}/pins`);
      },
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Only custom items can be dragged
    const draggedId = active.id as string;
    if (draggedId.startsWith('fixed-')) return;

    // Find positions in the merged list
    const oldMergedIndex = mergedSteps.findIndex(m => m.id === draggedId);
    const newMergedIndex = mergedSteps.findIndex(m => m.id === over.id);
    if (oldMergedIndex === -1 || newMergedIndex === -1) return;

    // Compute new merged order
    const reorderedMerged = arrayMove(mergedSteps, oldMergedIndex, newMergedIndex);

    // Derive insert_after and order_index for each custom step from the new merged order
    let lastFixedStep = FIXED_STEPS[FIXED_STEPS.length - 1]; // fallback
    const updates: { id: string; insert_after: string; order_index: number }[] = [];
    const counterByFixed: Record<string, number> = {};

    for (const item of reorderedMerged) {
      if (item.type === 'fixed') {
        lastFixedStep = item.name;
      } else {
        const insertAfter = lastFixedStep;
        const idx = counterByFixed[insertAfter] ?? 0;
        counterByFixed[insertAfter] = idx + 1;
        updates.push({ id: item.id, insert_after: insertAfter, order_index: idx });
      }
    }

    // Optimistic update: rebuild customSteps from updates
    const updatedCustomSteps = updates.map(u => {
      const existing = customSteps.find(s => s.id === u.id)!;
      return { ...existing, insert_after: u.insert_after, order_index: u.order_index };
    });
    setCustomSteps(updatedCustomSteps);

    try {
      // Persist each custom step's new insert_after + order_index
      await Promise.all(
        updates.map(u =>
          upsertCustomQuestionStep({
            ...customSteps.find(s => s.id === u.id)!,
            insert_after: u.insert_after,
            order_index: u.order_index,
          })
        )
      );
    } catch (err) {
      console.error('Error reordering:', err);
      toast.error('Failed to reorder steps');
      await loadData();
    }
  };

  const handleQuestionChange = (index: number, field: keyof CustomQuestion, value: any) => {
    setDialogQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddOption = (qIndex: number) => {
    setDialogQuestions(prev => {
      const updated = [...prev];
      updated[qIndex] = {
        ...updated[qIndex],
        options: [...(updated[qIndex].options || []), ''],
      };
      return updated;
    });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setDialogQuestions(prev => {
      const updated = [...prev];
      const opts = [...(updated[qIndex].options || [])];
      opts.splice(optIndex, 1);
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setDialogQuestions(prev => {
      const updated = [...prev];
      const opts = [...(updated[qIndex].options || [])];
      opts[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading RSVP form..." />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={4} sx={{ pt: { xs: 6, lg: 0 } }}>
        {/* Header */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            RSVP Form
          </Typography>
          <Typography variant="body2" sx={{ color: '#4a4a4a' }}>
            Customize the steps in your guest RSVP flow. Drag custom steps to reorder them. Click any step to preview it.
          </Typography>
        </Box>

        {/* Step List */}
        <Paper sx={{ borderRadius: '16px', bgcolor: '#fafafa', p: 3 }}>
          <Stack spacing={1.5}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={mergedSteps.map(m => m.id)}
                strategy={verticalListSortingStrategy}
              >
                {mergedSteps.map((item) => (
                  <SortableStepRow
                    key={item.id}
                    item={item}
                    isSelected={selectedStepId === item.id}
                    onClick={() => handleStepClick(item)}
                    onEdit={item.type === 'custom' ? () => handleOpenEdit(item.step) : undefined}
                    onDelete={
                      item.type === 'custom'
                        ? () => handleDeleteStep(item.step)
                        : item.type === 'fixed' && OPTIONAL_FIXED_STEPS.has(item.name)
                          ? () => handleDeleteFixedStep(item.name)
                          : undefined
                    }
                    isDeleting={deletingStepId === item.id}
                    onPinNavigate={item.type === 'fixed' && item.name === 'Plus One Details' ? handlePinNavigate : undefined}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </Stack>

          {!isViewOnly && (
            <Button
              startIcon={<Add />}
              onClick={handleOpenAdd}
              disabled={saving || !!deletingStepId}
              sx={{
                mt: 2,
                color: '#DE3F5E',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '12px',
                '&:hover': { bgcolor: alpha('#DE3F5E', 0.08) },
              }}
            >
              Add Custom Step
            </Button>
          )}
        </Paper>

        <ContinueButton
          weddingSlug={weddingSlug}
          currentSection="rsvp-form"
        />
      </Stack>

      {/* Add/Edit Dialog — Google Forms style */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', bgcolor: '#F8F8F8' } }}
      >
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F8F8F8' }}>
          <Stack spacing={2.5}>
            {/* Title Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.07)',
                borderTop: '4px solid #DE3F5E',
                bgcolor: 'white',
              }}
            >
              <Stack spacing={2}>
                {/* Title field */}
                <Box>
                  <Typography variant="caption" sx={{ color: '#4a4a4a', fontWeight: 500, mb: 0.5, display: 'block' }}>
                    Title <span style={{ color: '#DE3F5E' }}>*</span>
                  </Typography>
                  {editingTitle ? (
                    <TextField
                      autoFocus
                      variant="standard"
                      value={dialogTitle}
                      onChange={e => setDialogTitle(e.target.value)}
                      onBlur={() => setEditingTitle(false)}
                      placeholder="Untitled form"
                      InputProps={{
                        disableUnderline: false,
                        sx: {
                          fontSize: '1.5rem',
                          fontWeight: 600,
                          color: '#1a1a1a',
                          '&:before': { borderColor: 'rgba(0,0,0,0.12)' },
                          '&:after': { borderColor: '#DE3F5E' },
                        },
                      }}
                      fullWidth
                    />
                  ) : (
                    <Typography
                      onClick={() => setEditingTitle(true)}
                      sx={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        color: dialogTitle ? '#1a1a1a' : '#999',
                        cursor: 'text',
                        borderBottom: '1px solid transparent',
                        pb: 0.5,
                        '&:hover': { borderBottomColor: 'rgba(0,0,0,0.12)' },
                      }}
                    >
                      {dialogTitle || 'Untitled form'}
                    </Typography>
                  )}
                </Box>

                {/* Description field */}
                <Box>
                  <Typography variant="caption" sx={{ color: '#4a4a4a', fontWeight: 500, mb: 0.5, display: 'block' }}>
                    Description
                  </Typography>
                  {editingDescription ? (
                    <TextField
                      autoFocus
                      variant="standard"
                      value={dialogDescription}
                      onChange={e => setDialogDescription(e.target.value)}
                      onBlur={() => setEditingDescription(false)}
                      placeholder="Form description"
                      InputProps={{
                        disableUnderline: false,
                        sx: {
                          fontSize: '0.875rem',
                          color: '#4a4a4a',
                          '&:before': { borderColor: 'rgba(0,0,0,0.12)' },
                          '&:after': { borderColor: '#DE3F5E' },
                        },
                      }}
                      fullWidth
                      multiline
                    />
                  ) : (
                    <Typography
                      onClick={() => setEditingDescription(true)}
                      sx={{
                        fontSize: '0.875rem',
                        color: dialogDescription ? '#4a4a4a' : '#999',
                        cursor: 'text',
                        borderBottom: '1px solid transparent',
                        pb: 0.25,
                        '&:hover': { borderBottomColor: 'rgba(0,0,0,0.12)' },
                      }}
                    >
                      {dialogDescription || 'Form description'}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>

            {/* Question Cards */}
            {dialogQuestions.map((q, qIndex) => {
              const isActive = activeQuestionIndex === qIndex;

              return (
                <Paper
                  key={q.id}
                  elevation={0}
                  onClick={() => setActiveQuestionIndex(qIndex)}
                  sx={{
                    p: isActive ? 3 : 2.5,
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderLeft: isActive ? '4px solid #DE3F5E' : '1px solid rgba(0,0,0,0.07)',
                    bgcolor: 'white',
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': isActive ? {} : { borderColor: 'rgba(0,0,0,0.15)' },
                  }}
                >
                  {isActive ? (
                    /* ===== ACTIVE CARD ===== */
                    <Stack spacing={2.5}>
                      {/* Row 1: Label + Type */}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ color: '#4a4a4a', fontWeight: 500, mb: 0.5, display: 'block' }}>
                            Question <span style={{ color: '#DE3F5E' }}>*</span>
                          </Typography>
                          <TextField
                            value={q.label}
                            onChange={e => handleQuestionChange(qIndex, 'label', e.target.value)}
                            fullWidth
                            placeholder="e.g. What's your favorite song?"
                            sx={{
                              ...textFieldSx,
                              mt: 0,
                            }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 180 }}>
                          <Typography variant="caption" sx={{ color: '#4a4a4a', fontWeight: 500, mb: 0.5, display: 'block' }}>
                            Type <span style={{ color: '#DE3F5E' }}>*</span>
                          </Typography>
                          <FormControl fullWidth>
                            <Select
                              value={q.type}
                              onChange={e => handleQuestionChange(qIndex, 'type', e.target.value)}
                              size="small"
                              sx={{
                                borderRadius: '12px',
                                bgcolor: 'white',
                                '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                                '&:hover fieldset': { borderColor: '#DE3F5E' },
                                '&.Mui-focused fieldset': { borderColor: '#DE3F5E', borderWidth: '2px' },
                                '& .MuiSelect-select': { py: 1.5 },
                              }}
                            >
                              {QUESTION_TYPES.map(t => (
                                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Stack>

                      {/* Row 2: Field Preview */}
                      <Box sx={{ pl: 0.5 }}>
                        <FieldPreview type={q.type} options={q.options} />
                      </Box>

                      {/* Row 3: Dropdown options editor */}
                      {q.type === 'dropdown' && (
                        <Box sx={{ pl: 0.5 }}>
                          <Stack spacing={1}>
                            {(q.options || []).map((opt, optIndex) => (
                              <Stack key={optIndex} direction="row" spacing={1} alignItems="center">
                                <Box sx={{
                                  width: 20, height: 20, borderRadius: '50%',
                                  border: '2px solid #ccc', flexShrink: 0,
                                }} />
                                <TextField
                                  value={opt}
                                  onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)}
                                  size="small"
                                  fullWidth
                                  variant="standard"
                                  placeholder={`Option ${optIndex + 1}`}
                                  InputProps={{
                                    sx: { fontSize: '0.875rem', color: '#1a1a1a' },
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveOption(qIndex, optIndex)}
                                  sx={{ color: '#999', '&:hover': { color: '#d32f2f' } }}
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </Stack>
                            ))}
                            <Button
                              size="small"
                              onClick={() => handleAddOption(qIndex)}
                              sx={{ color: '#DE3F5E', textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start', ml: 3.5 }}
                            >
                              + Add option
                            </Button>
                          </Stack>
                        </Box>
                      )}

                      {/* Bottom row: Delete + Required */}
                      <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', pt: 1.5, mt: 0.5 }}>
                        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                          {dialogQuestions.length > 1 && (
                            <>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDialogQuestions(prev => prev.filter((_, i) => i !== qIndex));
                                  setActiveQuestionIndex(null);
                                }}
                                sx={{ color: '#6a6a6a', '&:hover': { color: '#d32f2f' } }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                              <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(0,0,0,0.12)', mx: 1 }} />
                            </>
                          )}
                          <Typography variant="body2" sx={{ color: '#4a4a4a', fontSize: '0.8125rem' }}>
                            Required
                          </Typography>
                          <Switch
                            checked={q.required}
                            onChange={e => handleQuestionChange(qIndex, 'required', e.target.checked)}
                            size="small"
                            sx={{
                              '& .MuiSwitch-switchBase': { color: '#999' },
                              '& .MuiSwitch-track': { bgcolor: '#ccc', opacity: 1 },
                              '& .MuiSwitch-switchBase.Mui-checked': { color: '#DE3F5E' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E', opacity: 0.5 },
                            }}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  ) : (
                    /* ===== INACTIVE CARD ===== */
                    <Stack spacing={1.5}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {q.label || 'Untitled question'}
                      </Typography>
                      <FieldPreview type={q.type} options={q.options} />
                    </Stack>
                  )}
                </Paper>
              );
            })}

            {/* Add Question Button */}
            {dialogQuestions.length < 3 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <IconButton
                  onClick={() => {
                    const newQ = emptyQuestion();
                    setDialogQuestions(prev => [...prev, newQ]);
                    setActiveQuestionIndex(dialogQuestions.length);
                  }}
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    '&:hover': { bgcolor: alpha('#DE3F5E', 0.04), borderColor: '#DE3F5E' },
                  }}
                >
                  <AddCircleOutline sx={{ color: '#DE3F5E', fontSize: 28 }} />
                </IconButton>
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: '#6a6a6a', fontStyle: 'italic', textAlign: 'center' }}>
                Each step supports up to 3 questions. To add more, create another step.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, bgcolor: '#F8F8F8' }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ color: '#6a6a6a', textTransform: 'none', fontWeight: 600, borderRadius: '12px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveStep}
            variant="contained"
            disabled={saving}
            sx={{
              bgcolor: '#DE3F5E',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '12px',
              px: 4,
              '&:hover': { bgcolor: '#C8365A' },
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: '#DE3F5E' }} /> : editingStep ? 'Update' : 'Add Step'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel || 'Delete'}
        confirmColor={confirmDialog.confirmLabel ? '#DE3F5E' : '#d32f2f'}
        isLoading={navigatingToPin}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => { setConfirmDialog(prev => ({ ...prev, open: false })); setNavigatingToPin(false); }}
      />
    </Box>
  );
}
