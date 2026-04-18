'use client';

import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  TextField,
  DialogContent,
  DialogActions,
    FormControlLabel,
  ClickAwayListener,
} from '@mui/material';
import { useState, useEffect, use, useRef, useCallback } from 'react';
import { Delete, Check, DragIndicator } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
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

import { ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import ContinueButton from '@/components/admin/ContinueButton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraSwitch } from '@/components/shared/Switch';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraCard } from '@/components/shared/Card';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';

const SWITCH_SX = {
};

const FAQ_TEMPLATES = [
  { question: 'What is the dress code?', answer: 'Please refer to the event details for the dress code for each function.' },
  { question: 'Can I bring a plus one?', answer: 'Please check your invitation for plus one details. If you have any questions, feel free to reach out to us.' },
  { question: 'Is there parking available?', answer: 'Yes, complimentary parking is available at the venue. Details will be shared closer to the date.' },
  { question: 'What time should I arrive?', answer: 'We recommend arriving 15-30 minutes before the ceremony start time.' },
  { question: 'Are children welcome?', answer: 'We love your little ones! Please check your invitation for details about children at the event.' },
  { question: 'Will there be vegetarian/dietary options?', answer: 'Yes, we will have a variety of dietary options available. Please let us know of any allergies or restrictions in your RSVP.' },
  { question: 'Can I take photos during the ceremony?', answer: 'We kindly request an unplugged ceremony. Our photographer will capture every moment. Please feel free to take photos during the reception!' },
  { question: 'Where is the gift registry?', answer: 'Your presence is our greatest gift! If you would like to contribute, please check our registry page.' },
  { question: 'Will transportation be provided?', answer: 'Shuttle service will be available between the hotel and venue. Please check the transportation page for details.' },
  { question: 'What if I have dietary restrictions?', answer: 'Please mention any dietary restrictions or allergies when you RSVP, and we will do our best to accommodate them.' },
];

function SortableFaqRow({ faq, onEdit, onDelete, isViewOnly }: { faq: any; onEdit: () => void; onDelete: () => void; isViewOnly: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id, disabled: isViewOnly });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 3,
        borderRadius: RADII.lg,
        bgcolor: COLORS.bg.white,
        border: '1px solid #EEE',
        boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : 'none',
        cursor: 'pointer',
        '&:hover': { borderColor: COLORS.border.default, boxShadow: isDragging ? undefined : '0 2px 8px rgba(0, 0, 0, 0.06)' },
      }}
      onClick={onEdit}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        {!isViewOnly && (
          <Box
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            sx={{ cursor: 'grab', color: COLORS.text.faint, display: 'flex', mt: 0.5, flexShrink: 0 }}
          >
            <DragIndicator />
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong, fontSize: '1.1rem' }}>
            {faq.question}
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            {faq.answer}
          </Typography>
          {faq.button_text && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: COLORS.brand.primary }}>
              Button: {faq.button_text} → {faq.button_link}
            </Typography>
          )}
        </Box>
        {!isViewOnly && (
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            sx={{ color: COLORS.text.strong, flexShrink: 0 }}
          >
            <Delete fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
}

interface FaqDraft {
  id?: string;
  wedding_id: string | null;
  question: string;
  answer: string;
  button_text: string;
  button_link: string;
  order_index: number;
}

export default function FAQPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isViewOnly } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const { showStatus } = useAutoSaveStatus();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FaqDraft | null>(null);
  const [showLinkFields, setShowLinkFields] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = faqs.findIndex(f => f.id === active.id);
    const newIndex = faqs.findIndex(f => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(faqs, oldIndex, newIndex);
    setFaqs(reordered);

    // Persist new order
    try {
      await Promise.all(
        reordered.map((faq, i) =>
          weddingService.updateFAQ(faq.id, { order_index: i })
        )
      );
      await syncPreview();
    } catch (err) {
      console.error('Error reordering FAQs:', err);
      showStatus('error');
      await loadData();
    }
  };

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        const data = await weddingService.getFAQs(wedding.id);
        setFaqs(data);
      }
    } catch (err) {
      console.error('Error loading FAQs:', err);
      showStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const syncPreview = useCallback(async () => {
    if (!weddingId) return;
    await weddingService.markUnpublishedChanges(weddingId);
    const channel = new BroadcastChannel('phera-design-sync');
    channel.postMessage({ type: 'PREVIEW_REFRESH' });
    channel.close();
  }, [weddingId]);

  const startEditing = (faq: any) => {
    if (isViewOnly) return;
    setEditingId(faq.id);
    setDraft({
      id: faq.id,
      wedding_id: faq.wedding_id,
      question: faq.question,
      answer: faq.answer,
      button_text: faq.button_text || '',
      button_link: faq.button_link || '',
      order_index: faq.order_index,
    });
    setShowLinkFields(!!faq.button_text);
  };

  const startNew = () => {
    if (isViewOnly) return;
    setEditingId('__new__');
    setDraft({
      wedding_id: weddingId,
      question: '',
      answer: '',
      button_text: '',
      button_link: '',
      order_index: faqs.length,
    });
    setShowLinkFields(false);
  };

  const startFromTemplate = () => {
    if (isViewOnly) return;
    setTemplateDialogOpen(true);
  };

  const handleSelectTemplate = (template: typeof FAQ_TEMPLATES[0]) => {
    if (isViewOnly) return;
    setTemplateDialogOpen(false);
    setEditingId('__new__');
    setDraft({
      wedding_id: weddingId,
      question: template.question,
      answer: template.answer,
      button_text: '',
      button_link: '',
      order_index: faqs.length,
    });
    setShowLinkFields(false);
  };

  const cancelEditing = () => {
    if (saving) return;
    setEditingId(null);
    setDraft(null);
  };

  const handleSave = async () => {
    if (isViewOnly || !draft) return;
    if (!draft.question.trim() || !draft.answer.trim()) {
      showStatus('error', 'Please fill in question and answer');
      return;
    }

    setSaving(true);
    try {
      if (draft.id) {
        await weddingService.updateFAQ(draft.id, draft);
      } else {
        await weddingService.createFAQ(draft);
      }
      await loadData();
      await syncPreview();
      setEditingId(null);
      setDraft(null);
      showStatus('saved');
    } catch (err) {
      console.error('Error saving FAQ:', err);
      showStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (isViewOnly) return;
    setConfirmDialog({
      open: true,
      message: 'Delete this FAQ?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await weddingService.deleteFAQ(faqId);
          if (editingId === faqId) {
            setEditingId(null);
            setDraft(null);
          }
          await loadData();
          await syncPreview();
          showStatus('saved');
        } catch (err) {
          showStatus('error');
        }
      },
    });
  };

  const isTemplateAlreadyAdded = (templateQuestion: string) => {
    return faqs.some(faq => faq.question.trim().toLowerCase() === templateQuestion.trim().toLowerCase());
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 700 }}>
        <LoadingSpinner message="Loading FAQs..." />
      </Box>
    );
  }

  const isAddingNew = editingId === '__new__';

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <PageHeading
          title="Frequently Asked Questions"
          subtitle="Add common questions and answers for your guests"
        />

        <Stack spacing={2}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={faqs.map(f => f.id)} strategy={verticalListSortingStrategy}>
              {faqs.map((faq) => (
                editingId === faq.id ? (
                  <InlineFaqForm
                    key={faq.id}
                    draft={draft!}
                    setDraft={setDraft}
                    showLinkFields={showLinkFields}
                    setShowLinkFields={setShowLinkFields}
                    onSave={handleSave}
                    onCancel={cancelEditing}
                    onDelete={() => handleDelete(faq.id)}
                    saving={saving}
                  />
                ) : (
                  <SortableFaqRow
                    key={faq.id}
                    faq={faq}
                    onEdit={() => startEditing(faq)}
                    onDelete={() => handleDelete(faq.id)}
                    isViewOnly={isViewOnly}
                  />
                )
              ))}
            </SortableContext>
          </DndContext>

          {/* Inline form for new FAQ */}
          {isAddingNew && draft && (
            <InlineFaqForm
              draft={draft}
              setDraft={setDraft}
              showLinkFields={showLinkFields}
              setShowLinkFields={setShowLinkFields}
              onSave={handleSave}
              onCancel={cancelEditing}
              saving={saving}
              isNew
            />
          )}

          {faqs.length === 0 && !isAddingNew && (
            <PheraCard variant="default" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                No FAQs yet. Add your first question below.
              </Typography>
            </PheraCard>
          )}

          {/* Add buttons at bottom (like schedule) */}
          {!isViewOnly && !isAddingNew && (
            <Stack direction="row" spacing={1.5}>
              <Box
                onClick={startNew}
                sx={{
                  flex: 1,
                  bgcolor: COLORS.border.light,
                  border: '1px dashed #BCBCBC',
                  borderRadius: RADII.sm,
                  px: 2, py: 1.5,
                  cursor: 'pointer',
                  textAlign: 'center',
                  '&:hover': { bgcolor: COLORS.border.default, borderColor: COLORS.text.faint },
                }}
              >
                <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1rem', lineHeight: 1.5 }}>
                  Add Custom FAQ
                </Typography>
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Write your own question & answer
                </Typography>
              </Box>
              <Box
                onClick={startFromTemplate}
                sx={{
                  flex: 1,
                  bgcolor: COLORS.border.light,
                  border: '1px dashed #BCBCBC',
                  borderRadius: RADII.sm,
                  px: 2, py: 1.5,
                  cursor: 'pointer',
                  textAlign: 'center',
                  '&:hover': { bgcolor: COLORS.border.default, borderColor: COLORS.text.faint },
                }}
              >
                <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1rem', lineHeight: 1.5 }}>
                  Add from Template
                </Typography>
                <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Choose from common questions
                </Typography>
              </Box>
            </Stack>
          )}
        </Stack>

        {/* Template Selection Dialog */}
        <PheraDialog
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <PheraDialogTitle onClose={() => setTemplateDialogOpen(false)}>
            Choose a Template
          </PheraDialogTitle>
          <DialogContent sx={{ bgcolor: COLORS.bg.white }}>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {FAQ_TEMPLATES.map((template) => {
                const alreadyAdded = isTemplateAlreadyAdded(template.question);
                return (
                  <Paper
                    key={template.question}
                    sx={{
                      p: 2,
                      cursor: alreadyAdded ? 'default' : 'pointer',
                      borderRadius: RADII.md,
                      bgcolor: alreadyAdded ? COLORS.bg.subtle : COLORS.bg.white,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      opacity: alreadyAdded ? 0.6 : 1,
                      '&:hover': alreadyAdded ? {} : {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                    onClick={() => !alreadyAdded && handleSelectTemplate(template)}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {alreadyAdded && <Check sx={{ color: COLORS.accent.success, fontSize: 20 }} />}
                      <Typography variant="body1" sx={{ fontWeight: 500, color: alreadyAdded ? COLORS.text.subtle : COLORS.text.strong }}>
                        {template.question}
                      </Typography>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ bgcolor: COLORS.bg.white, px: 3, pb: 2 }}>
            <Button onClick={() => setTemplateDialogOpen(false)} sx={{ color: COLORS.text.subtle }}>Cancel</Button>
          </DialogActions>
        </PheraDialog>

        <ConfirmDialog
          open={confirmDialog.open}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        />

      </Stack>
      <ContinueButton weddingSlug={weddingSlug} currentSection="faq" weddingId={weddingId} />
    </Box>
  );
}

// ── Inline FAQ Form ──────────────────────────────────────────────────────────

const inlineFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.sm,
    bgcolor: COLORS.bg.white,
    '& fieldset': { borderColor: COLORS.text.faint },
    '&:hover fieldset': { borderColor: COLORS.text.faint },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
  },
  '& .MuiInputLabel-root': {
    color: COLORS.text.muted,
    fontSize: '0.875rem',
    '&.Mui-focused': { color: COLORS.brand.primary },
  },
  '& .MuiInputBase-input': {
    color: COLORS.text.strong,
    fontSize: '1rem',
  },
};

interface InlineFaqFormProps {
  draft: FaqDraft;
  setDraft: (d: FaqDraft | null) => void;
  showLinkFields: boolean;
  setShowLinkFields: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saving: boolean;
  isNew?: boolean;
}

function InlineFaqForm({
  draft,
  setDraft,
  showLinkFields,
  setShowLinkFields,
  onSave,
  onCancel,
  onDelete,
  saving,
  isNew,
}: InlineFaqFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const canSave = !!draft.question.trim() && !!draft.answer.trim();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <ClickAwayListener onClickAway={onCancel}>
      <Paper
        ref={formRef}
        sx={{
          p: 2.5,
          borderRadius: RADII.lg,
          bgcolor: COLORS.bg.white,
          border: '1px solid #EEE',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Stack spacing={2}>
          <TextField
            label="Question"
            fullWidth
            size="small"
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            autoFocus
            onKeyDown={handleKeyDown}
            sx={inlineFieldSx}
          />
          <TextField
            label="Answer"
            fullWidth
            size="small"
            multiline
            minRows={2}
            maxRows={6}
            value={draft.answer}
            onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
            onKeyDown={handleKeyDown}
            sx={inlineFieldSx}
          />

          {/* Toggle + action buttons on one row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <FormControlLabel
              control={
                <PheraSwitch
                  checked={showLinkFields}
                  onChange={(e) => {
                    setShowLinkFields(e.target.checked);
                    if (!e.target.checked) {
                      setDraft({ ...draft, button_text: '', button_link: '' });
                    }
                  }}
                  size="small"
                  sx={SWITCH_SX}
                />
              }
              label="Add a link?"
              sx={{ '& .MuiFormControlLabel-label': { color: COLORS.text.muted, fontWeight: 500, fontSize: '0.875rem' }, mr: 0 }}
            />
            {!showLinkFields && (
              <Stack direction="row" alignItems="center" spacing={1}>
                {!isNew && onDelete && (
                  <IconButton
                    size="small"
                    onClick={onDelete}
                    sx={{ color: COLORS.text.strong }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
                <PrimaryActionButton
                  onClick={onSave}
                  loading={saving}
                  disabled={!canSave}
                  sx={{
                    px: 3,
                    minWidth: 80,
                    '&.Mui-disabled': { bgcolor: COLORS.border.faint, color: COLORS.text.faint },
                  }}
                >
                  Save
                </PrimaryActionButton>
              </Stack>
            )}
          </Stack>

          {showLinkFields && (
            <>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  label="Button Text"
                  size="small"
                  value={draft.button_text}
                  onChange={(e) => setDraft({ ...draft, button_text: e.target.value })}
                  placeholder="e.g., View Registry"
                  onKeyDown={handleKeyDown}
                  sx={{ ...inlineFieldSx, flex: 1 }}
                />
                <TextField
                  label="Button Link"
                  size="small"
                  value={draft.button_link}
                  onChange={(e) => setDraft({ ...draft, button_link: e.target.value })}
                  placeholder="e.g., /registry"
                  onKeyDown={handleKeyDown}
                  sx={{ ...inlineFieldSx, flex: 1 }}
                />
              </Stack>
              <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1}>
                {!isNew && onDelete && (
                  <IconButton
                    size="small"
                    onClick={onDelete}
                    sx={{ color: COLORS.text.strong }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
                <PrimaryActionButton
                  onClick={onSave}
                  loading={saving}
                  disabled={!canSave}
                  sx={{
                    px: 3,
                    minWidth: 80,
                    '&.Mui-disabled': { bgcolor: COLORS.border.faint, color: COLORS.text.faint },
                  }}
                >
                  Save
                </PrimaryActionButton>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    </ClickAwayListener>
  );
}
