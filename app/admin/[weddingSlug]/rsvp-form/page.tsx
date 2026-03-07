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
import { useState, useEffect, use } from 'react';
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  Lock,
  QuestionAnswer,
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
  'Attendance Details',
  'Plus One Details',
  'Event Preferences',
  'Personal Details',
  'Fun & Messages',
];

const INSERT_AFTER_OPTIONS = [
  'Attendance Details',
  'Plus One Details',
  'Event Preferences',
  'Personal Details',
];

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'numeric', label: 'Number' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'date', label: 'Date' },
];

function SortableStepItem({ step, onEdit, onDelete }: {
  step: RSVPCustomQuestionStep;
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
  } = useSortable({ id: step.id });

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
        '&:hover': { borderColor: '#ddd' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: '#999', display: 'flex' }}>
          <DragIndicator />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {step.step_title}
            </Typography>
            <Chip
              label={`${step.questions.length} question${step.questions.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                bgcolor: alpha('#DE3F5E', 0.1),
                color: '#DE3F5E',
                fontWeight: 600,
              }}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
            After: {step.insert_after}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
          <IconButton
            size="medium"
            onClick={onEdit}
            sx={{ color: '#000', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="medium"
            onClick={onDelete}
            sx={{ color: '#000', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)', color: '#d32f2f' } }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}

function FixedStepRow({ name }: { name: string }) {
  return (
    <Box
      sx={{
        bgcolor: '#f5f5f5',
        borderRadius: '12px',
        p: 2,
        border: '1px solid #eee',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Lock sx={{ color: '#bbb', fontSize: 20 }} />
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#6a6a6a' }}>
          {name}
        </Typography>
      </Stack>
    </Box>
  );
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
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [customSteps, setCustomSteps] = useState<RSVPCustomQuestionStep[]>([]);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<RSVPCustomQuestionStep | null>(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogInsertAfter, setDialogInsertAfter] = useState('Attendance Details');
  const [dialogQuestions, setDialogQuestions] = useState<CustomQuestion[]>([emptyQuestion()]);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({
    open: false, message: '', onConfirm: () => {},
  });

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
      }
    } catch (err) {
      console.error('Error loading RSVP form config:', err);
      toast.error('Failed to load RSVP form configuration');
    } finally {
      setLoading(false);
    }
  };

  // Build merged step list for display
  const mergedSteps = (() => {
    const result: ({ type: 'fixed'; name: string } | { type: 'custom'; step: RSVPCustomQuestionStep })[] = [];
    for (const fixedStep of FIXED_STEPS) {
      result.push({ type: 'fixed', name: fixedStep });
      const stepsAfter = customSteps
        .filter(s => s.insert_after === fixedStep)
        .sort((a, b) => a.order_index - b.order_index);
      stepsAfter.forEach(s => result.push({ type: 'custom', step: s }));
    }
    // Orphans
    const fixedSet = new Set(FIXED_STEPS);
    const orphans = customSteps.filter(s => !fixedSet.has(s.insert_after));
    orphans.forEach(s => result.push({ type: 'custom', step: s }));
    return result;
  })();

  const handleOpenAdd = () => {
    setEditingStep(null);
    setDialogTitle('');
    setDialogInsertAfter('Attendance Details');
    setDialogQuestions([emptyQuestion()]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (step: RSVPCustomQuestionStep) => {
    setEditingStep(step);
    setDialogTitle(step.step_title);
    setDialogInsertAfter(step.insert_after);
    setDialogQuestions(step.questions.length > 0 ? [...step.questions] : [emptyQuestion()]);
    setDialogOpen(true);
  };

  const handleSaveStep = async () => {
    if (!dialogTitle.trim()) {
      toast.error('Step title is required');
      return;
    }
    const validQuestions = dialogQuestions.filter(q => q.label.trim());
    if (validQuestions.length === 0) {
      toast.error('At least one question is required');
      return;
    }

    setSaving(true);
    try {
      const samePositionSteps = customSteps.filter(s =>
        s.insert_after === dialogInsertAfter && (!editingStep || s.id !== editingStep.id)
      );
      const orderIndex = editingStep ? editingStep.order_index : samePositionSteps.length;

      const stepData = {
        id: editingStep?.id || crypto.randomUUID(),
        wedding_id: weddingSlug,
        step_title: dialogTitle.trim(),
        insert_after: dialogInsertAfter,
        order_index: orderIndex,
        questions: validQuestions,
      };

      await upsertCustomQuestionStep(stepData);
      await loadData();
      setDialogOpen(false);
      toast.success(editingStep ? 'Step updated' : 'Step added');
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
        try {
          await deleteCustomQuestionStep(step.id);
          setCustomSteps(prev => prev.filter(s => s.id !== step.id));
          toast.success('Step deleted');
        } catch (err) {
          console.error('Error deleting step:', err);
          toast.error('Failed to delete step');
        }
      },
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const customOnly = customSteps;
    const oldIndex = customOnly.findIndex(s => s.id === active.id);
    const newIndex = customOnly.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(customOnly, oldIndex, newIndex);
    // Re-index within same insert_after groups
    const grouped: Record<string, RSVPCustomQuestionStep[]> = {};
    reordered.forEach(s => {
      if (!grouped[s.insert_after]) grouped[s.insert_after] = [];
      grouped[s.insert_after].push(s);
    });
    const updates: { id: string; order_index: number }[] = [];
    Object.values(grouped).forEach(group => {
      group.forEach((s, i) => {
        s.order_index = i;
        updates.push({ id: s.id, order_index: i });
      });
    });

    setCustomSteps(reordered);
    try {
      await reorderCustomQuestionSteps(updates);
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
            Customize the steps in your guest RSVP flow. Fixed steps are locked; add custom steps to collect additional info.
          </Typography>
        </Box>

        {/* Step List */}
        <Paper sx={{ borderRadius: '16px', bgcolor: '#fafafa', p: 3 }}>
          <Stack spacing={1.5}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={customSteps.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {mergedSteps.map((item, index) => {
                  if (item.type === 'fixed') {
                    return <FixedStepRow key={`fixed-${item.name}`} name={item.name} />;
                  }
                  return (
                    <SortableStepItem
                      key={item.step.id}
                      step={item.step}
                      onEdit={() => handleOpenEdit(item.step)}
                      onDelete={() => handleDeleteStep(item.step)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </Stack>

          {!isViewOnly && (
            <Button
              startIcon={<Add />}
              onClick={handleOpenAdd}
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          {editingStep ? 'Edit Custom Step' : 'Add Custom Step'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Step Title"
              value={dialogTitle}
              onChange={e => setDialogTitle(e.target.value)}
              fullWidth
              placeholder="e.g. Travel Preferences"
              sx={textFieldSx}
            />

            <FormControl fullWidth>
              <InputLabel sx={{ color: '#4a4a4a', fontWeight: 500 }}>Insert After</InputLabel>
              <Select
                value={dialogInsertAfter}
                onChange={e => setDialogInsertAfter(e.target.value)}
                label="Insert After"
                sx={{
                  borderRadius: '12px',
                  bgcolor: 'white',
                  '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                  '&:hover fieldset': { borderColor: '#DE3F5E' },
                  '&.Mui-focused fieldset': { borderColor: '#DE3F5E', borderWidth: '2px' },
                }}
              >
                {INSERT_AFTER_OPTIONS.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Questions */}
            {dialogQuestions.map((q, qIndex) => (
              <Paper key={q.id} sx={{ p: 2, borderRadius: '12px', border: '1px solid #eee' }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      Question {qIndex + 1}
                    </Typography>
                    {dialogQuestions.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => setDialogQuestions(prev => prev.filter((_, i) => i !== qIndex))}
                        sx={{ color: '#999', '&:hover': { color: '#d32f2f' } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>

                  <TextField
                    label="Question Label"
                    value={q.label}
                    onChange={e => handleQuestionChange(qIndex, 'label', e.target.value)}
                    fullWidth
                    placeholder="e.g. What hotel are you staying at?"
                    sx={textFieldSx}
                  />

                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#4a4a4a', fontWeight: 500 }}>Answer Type</InputLabel>
                    <Select
                      value={q.type}
                      onChange={e => handleQuestionChange(qIndex, 'type', e.target.value)}
                      label="Answer Type"
                      sx={{
                        borderRadius: '12px',
                        bgcolor: 'white',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: '#DE3F5E' },
                        '&.Mui-focused fieldset': { borderColor: '#DE3F5E', borderWidth: '2px' },
                      }}
                    >
                      {QUESTION_TYPES.map(t => (
                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={q.required}
                        onChange={e => handleQuestionChange(qIndex, 'required', e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#DE3F5E' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E' } }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ color: '#4a4a4a' }}>Required</Typography>}
                  />

                  {q.type === 'dropdown' && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a6a6a', mb: 1, display: 'block' }}>
                        Dropdown Options
                      </Typography>
                      <Stack spacing={1}>
                        {(q.options || []).map((opt, optIndex) => (
                          <Stack key={optIndex} direction="row" spacing={1} alignItems="center">
                            <TextField
                              value={opt}
                              onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)}
                              size="small"
                              fullWidth
                              placeholder={`Option ${optIndex + 1}`}
                              sx={textFieldSx}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveOption(qIndex, optIndex)}
                              sx={{ color: '#999', '&:hover': { color: '#d32f2f' } }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                        ))}
                        <Button
                          size="small"
                          onClick={() => handleAddOption(qIndex)}
                          sx={{ color: '#DE3F5E', textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start' }}
                        >
                          + Add Option
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Paper>
            ))}

            {dialogQuestions.length < 2 && (
              <Button
                startIcon={<Add />}
                onClick={() => setDialogQuestions(prev => [...prev, emptyQuestion()])}
                sx={{ color: '#DE3F5E', textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start' }}
              >
                Add Another Question
              </Button>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
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
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : editingStep ? 'Update' : 'Add Step'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
}
