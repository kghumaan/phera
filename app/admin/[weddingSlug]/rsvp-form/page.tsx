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
  CheckCircleOutline,
  HelpOutline,
  CancelOutlined,
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
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;

const FIXED_STEPS = [
  'Basic Information',
  'Account Creation',
  'RSVP',
  'Plus One Details',
  'Dietary Restrictions',
  'Team Bride/Groom',
  'Music Request',
  'Comment',
];

const OPTIONAL_FIXED_STEPS = new Set(['Team Bride/Groom', 'Music Request', 'Comment']);

const FIXED_STEP_DESCRIPTIONS: Record<string, string> = {
  'Basic Information': 'Collects guest name, email, and phone number',
  'Account Creation': 'Lets guests create a password for their account',
  'RSVP': 'Guest confirms attendance: attending, not attending, or maybe',
  'Plus One Details': 'This step is only shown to guests whose PIN allows a plus-one. You can configure this in Pin Management.',
  'Dietary Restrictions': 'Food preferences and dietary restriction details',
  'Team Bride/Groom': 'Guest picks whose side they\'re celebrating',
  'Music Request': 'Song request — what should the DJ play?',
  'Comment': 'A personal message and optional GIF for the couple',
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
        bgcolor: COLORS.bg.white,
        borderRadius: RADII.md,
        p: 2,
        border: isSelected ? '1.5px solid #DE3F5E' : '1px solid #eee',
        boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : 'none',
        cursor: 'pointer',
        '&:hover': { borderColor: isSelected ? COLORS.brand.primary : COLORS.border.default, bgcolor: isSelected ? alpha(COLORS.brand.primary, 0.02) : COLORS.bg.muted },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        {isCustom ? (
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: COLORS.text.faint, display: 'flex' }}>
            <DragIndicator />
          </Box>
        ) : !isOptionalFixed ? (
          <Lock sx={{ color: COLORS.brand.primary, fontSize: 20, opacity: 0.6 }} />
        ) : null}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: isCustom ? 600 : 500, color: COLORS.text.strong }}>
              {isCustom ? item.step.step_title : item.name}
            </Typography>
            {isCustom && (
              <Chip
                label={`${item.step.questions.length} question${item.step.questions.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: alpha(COLORS.brand.primary, 0.1),
                  color: COLORS.brand.primary,
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>
          {/* Subtext description for fixed steps when selected */}
          {!isCustom && isSelected && description && (
            <Typography variant="caption" sx={{ color: COLORS.text.subtle, mt: 0.5, display: 'block' }}>
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
              color: COLORS.brand.primary,
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
              sx={{ color: COLORS.text.muted, '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="medium"
              onClick={onDelete}
              disabled={isDeleting}
              sx={{ color: COLORS.brand.primary, '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
            >
              {isDeleting ? <CircularProgress size={18} sx={{ color: COLORS.brand.primary }} /> : <Delete fontSize="small" />}
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
              sx={{ color: COLORS.brand.primary, '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
            >
              {isDeleting ? <CircularProgress size={18} sx={{ color: COLORS.brand.primary }} /> : <Delete fontSize="small" />}
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
    borderRadius: RADII.md,
    bgcolor: COLORS.border.faint,
    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.4)' },
  },
  '& .Mui-disabled': {
    WebkitTextFillColor: COLORS.text.faint,
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: COLORS.text.faint,
    WebkitTextFillColor: COLORS.text.faint,
    opacity: 1,
  },
};

const PREVIEW_SELECT_SX = {
  borderRadius: RADII.md,
  bgcolor: COLORS.border.faint,
  '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.2)' },
  '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.4)' },
  '& .Mui-disabled': { WebkitTextFillColor: COLORS.text.faint },
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
          renderValue={() => <Typography sx={{ color: COLORS.text.faint, fontSize: '0.875rem' }}>Select an option</Typography>}
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
            endAdornment: <CalendarToday sx={{ color: COLORS.text.faint, fontSize: 18 }} />,
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
  const { showStatus } = useAutoSaveStatus();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [customSteps, setCustomSteps] = useState<RSVPCustomQuestionStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [hiddenFixedSteps, setHiddenFixedSteps] = useState<Set<string>>(new Set());
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);

  // Confirmation messages state
  const [confirmationMessages, setConfirmationMessages] = useState<Record<string, { heading: string; body: string }>>({
    yes: { heading: '', body: '' },
    no: { heading: '', body: '' },
    maybe: { heading: '', body: '' },
  });
  const [savingMessages, setSavingMessages] = useState(false);
  const [selectedConfirmation, setSelectedConfirmation] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<RSVPCustomQuestionStep | null>(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [dialogQuestions, setDialogQuestions] = useState<CustomQuestion[]>([emptyQuestion()]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(0);

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
        // Normalize legacy combined step name into the two new separate steps
        const rawHidden = (wedding.hidden_rsvp_steps || []) as string[];
        const normalized = rawHidden.flatMap((s: string) =>
          s === 'Music Request & Comment' ? ['Music Request', 'Comment'] : [s]
        );
        setHiddenFixedSteps(new Set(normalized));
        const msgs = (wedding as any).rsvp_confirmation_messages;
        if (msgs) {
          setConfirmationMessages({
            yes: { heading: msgs.yes?.heading || '', body: msgs.yes?.body || '' },
            no: { heading: msgs.no?.heading || '', body: msgs.no?.body || '' },
            maybe: { heading: msgs.maybe?.heading || '', body: msgs.maybe?.body || '' },
          });
        }
      }
    } catch (err) {
      console.error('Error loading RSVP form config:', err);
      showStatus('error', 'Failed to load RSVP form configuration');
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
    setSelectedConfirmation(null); // Deselect confirmation row
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
    setDialogOpen(true);
  };

  const handleOpenEdit = (step: RSVPCustomQuestionStep) => {
    setEditingStep(step);
    setDialogTitle(step.step_title);
    setDialogDescription(step.description || '');
    setDialogQuestions(step.questions.length > 0 ? [...step.questions] : [emptyQuestion()]);
    setActiveQuestionIndex(null);
    setDialogOpen(true);
  };

  const handleSaveStep = async () => {
    if (!dialogTitle.trim()) {
      showStatus('error', 'Title is required');
      return;
    }
    const validQuestions = dialogQuestions.filter(q => q.label.trim());
    if (validQuestions.length === 0) {
      showStatus('error', 'At least one question is required');
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
      showStatus('saved', editingStep ? 'Step updated' : 'Step added');

      // Notify preview to re-fetch custom questions
      const channel = new BroadcastChannel('phera-design-sync');
      channel.postMessage({ type: 'RSVP_CUSTOM_QUESTIONS_UPDATED' });
      channel.close();
    } catch (err) {
      console.error('Error saving step:', err);
      showStatus('error', 'Failed to save step');
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
          showStatus('saved', 'Step deleted');

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
          showStatus('error', 'Failed to delete step');
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
          showStatus('saved', 'Step hidden');

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
          showStatus('error', 'Failed to hide step');
        } finally {
          setDeletingStepId(null);
        }
      },
    });
  };

  const handleSaveConfirmationMessages = async () => {
    setSavingMessages(true);
    try {
      await weddingService.updateRsvpConfirmationMessages(weddingSlug, confirmationMessages);
      showStatus('saved', 'Confirmation messages saved');
    } catch (err) {
      console.error('Error saving confirmation messages:', err);
      showStatus('error', 'Failed to save confirmation messages');
    } finally {
      setSavingMessages(false);
    }
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
      showStatus('error', 'Failed to reorder steps');
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
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
            RSVP Form
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
            Customize the steps in your guest RSVP flow. Drag custom steps to reorder them. Click any step to preview it.
          </Typography>
        </Box>

        {/* Step List */}
        <Paper sx={{ borderRadius: RADII.lg, bgcolor: COLORS.bg.muted, p: 3 }}>
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
                color: COLORS.brand.primary,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: RADII.md,
                '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.08) },
              }}
            >
              Add Custom Step
            </Button>
          )}
        </Paper>

        {/* Confirmation Messages */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
            Confirmation Messages
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
            Customize the messages guests see after submitting their RSVP. Click a response to preview it.
          </Typography>
        </Box>

        <Paper sx={{ borderRadius: RADII.lg, bgcolor: COLORS.bg.muted, p: 3 }}>
          <Stack spacing={1.5}>
            {[
              { key: 'yes', label: 'Attending', description: 'Shown when a guest confirms they are attending', icon: CheckCircleOutline, color: COLORS.brand.primary },
              { key: 'maybe', label: 'Maybe', description: 'Shown when a guest is undecided', icon: HelpOutline, color: COLORS.text.strong },
              { key: 'no', label: 'Not Attending', description: 'Shown when a guest declines', icon: CancelOutlined, color: '#9e9e9e' },
            ].map(({ key, label, description, icon: Icon, color }) => {
              const isSelected = selectedConfirmation === key;
              return (
                <Box
                  key={key}
                  onClick={() => {
                    setSelectedConfirmation(isSelected ? null : key);
                    setSelectedStepId(null);
                    const iframe = document.querySelector('iframe') as HTMLIFrameElement | null;
                    if (iframe?.contentWindow) {
                      iframe.contentWindow.postMessage(
                        { type: 'SHOW_RSVP_CONFIRMATION', response: key },
                        '*'
                      );
                    }
                  }}
                  sx={{
                    bgcolor: COLORS.bg.white,
                    borderRadius: RADII.md,
                    p: 2,
                    border: isSelected ? '1.5px solid #DE3F5E' : '1px solid #eee',
                    cursor: 'pointer',
                    '&:hover': { borderColor: isSelected ? COLORS.brand.primary : COLORS.border.default, bgcolor: isSelected ? alpha(COLORS.brand.primary, 0.02) : COLORS.bg.muted },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Icon sx={{ color, fontSize: 20 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: COLORS.text.strong }}>
                        {label}
                      </Typography>
                      {isSelected && (
                        <Typography variant="caption" sx={{ color: COLORS.text.subtle, mt: 0.5, display: 'block' }}>
                          {description}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {/* Inline edit fields */}
                  {isSelected && (
                    <Stack spacing={2} sx={{ mt: 2 }} onClick={(e) => e.stopPropagation()}>
                      <TextField
                        label="Heading"
                        value={confirmationMessages[key]?.heading || ''}
                        onChange={(e) => setConfirmationMessages(prev => ({
                          ...prev,
                          [key]: { ...prev[key], heading: e.target.value },
                        }))}
                        fullWidth
                        placeholder={
                          key === 'yes' ? "e.g., Yay! We can't wait to celebrate with you!"
                          : key === 'maybe' ? 'e.g., Thanks for letting us know!'
                          : "e.g., We'll miss you!"
                        }
                        disabled={isViewOnly}
                        sx={textFieldSx}
                      />
                      <TextField
                        label="Message"
                        value={confirmationMessages[key]?.body || ''}
                        onChange={(e) => setConfirmationMessages(prev => ({
                          ...prev,
                          [key]: { ...prev[key], body: e.target.value },
                        }))}
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder={
                          key === 'yes' ? 'e.g., Check out the rest of the website for travel tips, event details, dress codes, etc.'
                          : key === 'maybe' ? 'e.g., We understand you need to figure some things out. Let us know by the RSVP deadline!'
                          : "e.g., We're sad you can't make it, but we understand. Your account is still ready if anything changes!"
                        }
                        disabled={isViewOnly}
                        sx={textFieldSx}
                      />
                      {!isViewOnly && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <PrimaryActionButton
                            onClick={(e) => { e.stopPropagation(); handleSaveConfirmationMessages(); }}
                            loading={savingMessages}
                            size="small"
                            sx={{ px: 3 }}
                          >
                            Save
                          </PrimaryActionButton>
                        </Box>
                      )}
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>
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
        PaperProps={{ sx: { borderRadius: RADII.lg, bgcolor: COLORS.bg.subtle } }}
      >
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: COLORS.bg.subtle }}>
          <Stack spacing={2.5}>
            {/* Title & Description */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: RADII.md,
                border: '1px solid rgba(0,0,0,0.07)',
                bgcolor: COLORS.bg.white,
              }}
            >
              <Stack spacing={2.5}>
                <TextField
                  value={dialogTitle}
                  onChange={e => setDialogTitle(e.target.value)}
                  label="Section Title *"
                  placeholder="e.g. Travel Preferences"
                  fullWidth
                  sx={textFieldSx}
                />
                <TextField
                  value={dialogDescription}
                  onChange={e => setDialogDescription(e.target.value)}
                  label="Section Description"
                  placeholder="e.g. Help us plan your travel arrangements"
                  fullWidth
                  multiline
                  minRows={2}
                  sx={textFieldSx}
                />
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
                    borderRadius: RADII.md,
                    border: isActive ? '1.5px solid #DE3F5E' : '1px solid rgba(0,0,0,0.07)',
                    bgcolor: COLORS.bg.white,
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
                          <TextField
                            value={q.label}
                            onChange={e => handleQuestionChange(qIndex, 'label', e.target.value)}
                            fullWidth
                            label="Question *"
                            placeholder="e.g. What's your favorite song?"
                            sx={textFieldSx}
                          />
                        </Box>
                        <Box sx={{ minWidth: 180 }}>
                          <FormControl fullWidth>
                            <InputLabel sx={{ color: COLORS.text.muted, fontWeight: 500, '&.Mui-focused': { color: COLORS.brand.primary, fontWeight: 600 } }}>Type *</InputLabel>
                            <Select
                              value={q.type}
                              onChange={e => handleQuestionChange(qIndex, 'type', e.target.value)}
                              label="Type *"
                              sx={{
                                borderRadius: RADII.md,
                                bgcolor: COLORS.bg.white,
                                '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                                '&:hover fieldset': { borderColor: COLORS.brand.primary },
                                '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary, borderWidth: '2px' },
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
                                    sx: { fontSize: '0.875rem', color: COLORS.text.strong },
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveOption(qIndex, optIndex)}
                                  sx={{ color: COLORS.text.faint, '&:hover': { color: COLORS.accent.danger } }}
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </Stack>
                            ))}
                            <Button
                              size="small"
                              onClick={() => handleAddOption(qIndex)}
                              sx={{ color: COLORS.brand.primary, textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start', ml: 3.5 }}
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
                                sx={{ color: COLORS.text.subtle, '&:hover': { color: COLORS.accent.danger } }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                              <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(0,0,0,0.12)', mx: 1 }} />
                            </>
                          )}
                          <Typography variant="body2" sx={{ color: COLORS.text.muted, fontSize: '0.8125rem' }}>
                            Required
                          </Typography>
                          <Switch
                            checked={q.required}
                            onChange={e => handleQuestionChange(qIndex, 'required', e.target.checked)}
                            size="small"
                            sx={{
                              '& .MuiSwitch-switchBase': { color: COLORS.text.faint },
                              '& .MuiSwitch-track': { bgcolor: COLORS.border.default, opacity: 1 },
                              '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.brand.primary },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: COLORS.brand.primary, opacity: 0.5 },
                            }}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  ) : (
                    /* ===== INACTIVE CARD ===== */
                    <Stack spacing={1.5}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
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
                    bgcolor: COLORS.bg.white,
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.04), borderColor: COLORS.brand.primary },
                  }}
                >
                  <AddCircleOutline sx={{ color: COLORS.brand.primary, fontSize: 28 }} />
                </IconButton>
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: COLORS.text.subtle, fontStyle: 'italic', textAlign: 'center' }}>
                Each step supports up to 3 questions. To add more, create another step.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, bgcolor: COLORS.bg.subtle }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ color: COLORS.text.subtle, textTransform: 'none', fontWeight: 600, borderRadius: RADII.md }}
          >
            Cancel
          </Button>
          <PrimaryActionButton
            onClick={handleSaveStep}
            loading={saving}
            sx={{ px: 4 }}
          >
            {editingStep ? 'Update' : 'Add Step'}
          </PrimaryActionButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel || 'Delete'}
        confirmColor={confirmDialog.confirmLabel ? COLORS.brand.primary : COLORS.accent.danger}
        isLoading={navigatingToPin}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => { setConfirmDialog(prev => ({ ...prev, open: false })); setNavigatingToPin(false); }}
      />
    </Box>
  );
}
