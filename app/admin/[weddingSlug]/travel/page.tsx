'use client';

import {
  Box,
  Typography,
  Stack,
  Skeleton,
  Fade,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useState, useEffect, useCallback, useRef, use } from 'react';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { weddingService, TravelSection } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import ContinueButton from '@/components/admin/ContinueButton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import SortableTravelWrapper from './components/SortableTravelWrapper';
import TravelDetailEditor from './components/TravelDetailEditor';
import TravelHeaderImage from './components/TravelHeaderImage';
import AddSectionMenu from './components/AddSectionMenu';
import { DEFAULT_SECTIONS, TRAVEL_TYPE_LABELS } from './components/travel-utils';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';

export default function TravelPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isViewOnly } = useAdminRole();
  const { showStatus } = useAutoSaveStatus();

  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [sections, setSections] = useState<TravelSection[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const creatingDefaults = useRef(false);

  // Setup notification (shown next to Add Section for 5s)
  const [showSetupNotice, setShowSetupNotice] = useState(false);

  // Inline editing state (replaces dialog)
  const [activeForm, setActiveForm] = useState<{ editingSectionId: string } | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  // Detail editor state (Tiptap modal — only modal remaining)
  const [detailSection, setDetailSection] = useState<TravelSection | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  // Header image — stored on the first 'travel'-type section
  const travelSection = sections.find(s => s.type === 'travel');
  const headerImageUrl = travelSection?.image_url || null;

  const handleHeaderImageChange = async (url: string | null) => {
    if (!travelSection || !weddingId) return;
    const result = await weddingService.updateTravelSection(travelSection.id, { image_url: url });
    if (result) {
      setSections(prev => prev.map(s => s.id === travelSection.id ? result : s));
      await syncPreview(weddingId);
    }
  };

  const syncPreview = useCallback(async (wId: string) => {
    await weddingService.markUnpublishedChanges(wId);
    const channel = new BroadcastChannel('phera-design-sync');
    channel.postMessage({ type: 'PREVIEW_REFRESH' });
    channel.close();
  }, []);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load data
  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (!wedding) return;
      setWeddingId(wedding.id);

      const data = await weddingService.getTravelSections(wedding.id);

      if (data.length === 0) {
        // First visit — create default sections (guard against double-call)
        if (creatingDefaults.current) return;
        creatingDefaults.current = true;
        await createDefaultSections(wedding.id);
      } else {
        setSections(data);
      }
    } catch (err) {
      console.error('Error loading travel sections:', err);
      showStatus('error', 'Failed to load travel sections');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSections = async (wId: string) => {
    try {
      const created: TravelSection[] = [];
      for (const def of DEFAULT_SECTIONS) {
        const result = await weddingService.createTravelSection({
          wedding_id: wId,
          type: def.type,
          title: def.title,
          subtitle: def.subtitle,
          icon: def.icon,
          order_index: def.order_index,
          content: null,
          image_url: null,
          more_details: null,
          address: null,
          phone: null,
          price_level: null,
          visible: true,
          source: 'manual',
        });
        if (result) created.push(result);
      }
      setSections(created);

      // Show the setup notice for 5 seconds
      setShowSetupNotice(true);
      setTimeout(() => setShowSetupNotice(false), 5000);

      // Trigger AI generation for Travel and Flight content + city image
      setAiGenerating(true);
      try {
        const res = await fetch('/api/travel/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weddingId: wId }),
        });

        if (res.ok) {
          const { content } = await res.json();
          const travelSection = created.find(s => s.type === 'travel');
          const flightSection = created.find(s => s.type === 'flight');

          if (travelSection) {
            const travelUpdates: Record<string, any> = { source: 'ai_generated' };
            if (content.travel_intro) travelUpdates.content = content.travel_intro;
            if (content.image_url) travelUpdates.image_url = content.image_url;
            await weddingService.updateTravelSection(travelSection.id, travelUpdates);
          }
          if (flightSection && content.flight_info) {
            await weddingService.updateTravelSection(flightSection.id, {
              content: content.flight_info,
              source: 'ai_generated',
            });
          }

          // Reload to get updated data
          const refreshed = await weddingService.getTravelSections(wId);
          setSections(refreshed);
        }
      } catch (aiErr) {
        console.error('AI generation failed:', aiErr);
      } finally {
        setAiGenerating(false);
      }
    } catch (err) {
      console.error('Error creating default sections:', err);
      showStatus('error', 'Failed to create default sections');
    }
  };

  // Save section edits (inline form)
  const handleSaveSection = async (sectionId: string, updates: Partial<TravelSection>) => {
    if (!weddingId) return;
    setSavingForm(true);
    try {
      const result = await weddingService.updateTravelSection(sectionId, updates);
      if (result) {
        setSections(prev => prev.map(s => s.id === sectionId ? result : s));
        await syncPreview(weddingId);
        showStatus('saved', 'Section saved');
        setActiveForm(null);
      } else {
        showStatus('error', 'Failed to save section');
      }
    } finally {
      setSavingForm(false);
    }
  };

  // Save more_details
  const handleSaveDetails = async (html: string) => {
    if (!detailSection || !weddingId) return;
    const result = await weddingService.updateTravelSection(detailSection.id, { more_details: html });
    if (result) {
      setSections(prev => prev.map(s => s.id === detailSection.id ? result : s));
      await syncPreview(weddingId);
      showStatus('saved', 'Details saved');
    } else {
      showStatus('error', 'Failed to save details');
    }
  };

  // Add new section — create in DB, then open inline
  const handleAddSection = async (type: string) => {
    if (isViewOnly || !weddingId) return;
    const result = await weddingService.createTravelSection({
      wedding_id: weddingId,
      type: type as TravelSection['type'],
      title: TRAVEL_TYPE_LABELS[type] || type,
      subtitle: null,
      icon: null,
      order_index: sections.length,
      content: null,
      image_url: null,
      more_details: null,
      address: null,
      phone: null,
      price_level: null,
      visible: true,
      source: 'manual',
    });
    if (result) {
      setSections(prev => [...prev, result]);
      await syncPreview(weddingId);
      showStatus('saved', 'Section added');
      setActiveForm({ editingSectionId: result.id });
    }
  };

  // Delete section
  const handleDelete = (sectionId: string) => {
    if (isViewOnly) return;
    setConfirmDialog({
      open: true,
      message: 'Delete this section? This cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        const success = await weddingService.deleteTravelSection(sectionId);
        if (success) {
          setSections(prev => prev.filter(s => s.id !== sectionId));
          if (activeForm?.editingSectionId === sectionId) setActiveForm(null);
          if (weddingId) await syncPreview(weddingId);
          showStatus('saved', 'Section deleted');
        } else {
          showStatus('error', 'Failed to delete section');
        }
      },
    });
  };

  // Drag and drop reorder
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !weddingId) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);

    setSections(reordered);

    const items = reordered.map((s, i) => ({ id: s.id, order_index: i }));
    const success = await weddingService.reorderTravelSections(items);
    if (success) {
      await syncPreview(weddingId);
    } else {
      const refreshed = await weddingService.getTravelSections(weddingId);
      setSections(refreshed);
      showStatus('error', 'Failed to reorder');
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading travel sections..." />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Travel & Stay
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Add travel information, flight details, accommodation, and hotel recommendations for your guests
          </Typography>
        </Box>

        {showSetupNotice && (
          <Fade in={showSetupNotice} timeout={400}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                bgcolor: 'rgba(222, 63, 94, 0.06)',
                color: '#DE3F5E',
                px: 2,
                py: 1,
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <AutoAwesome sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ color: '#DE3F5E', fontWeight: 500 }}>
                We&apos;ve generated some default sections for you — feel free to update or delete as you wish!
              </Typography>
            </Stack>
          </Fade>
        )}

        {/* Header image */}
        {weddingId && travelSection && (
          <TravelHeaderImage
            imageUrl={headerImageUrl}
            weddingId={weddingId}
            onChange={handleHeaderImageChange}
            isViewOnly={isViewOnly}
          />
        )}

        {/* AI generation shimmer */}
        {aiGenerating && (
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={20} width={180} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rounded" height={60} sx={{ borderRadius: '12px' }} />
            <Skeleton variant="rounded" height={60} sx={{ borderRadius: '12px' }} />
          </Stack>
        )}

        {/* Sortable sections list */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1.5}>
              {sections.map((section) => (
                <SortableTravelWrapper
                  key={section.id}
                  section={section}
                  onEdit={() => setActiveForm({ editingSectionId: section.id })}
                  onDelete={() => handleDelete(section.id)}
                  onEditDetails={() => {
                    setDetailSection(section);
                    setDetailDialogOpen(true);
                  }}
                  isViewOnly={isViewOnly}
                  isEditing={activeForm?.editingSectionId === section.id}
                  editFormProps={weddingId ? {
                    onSave: (updates) => handleSaveSection(section.id, updates),
                    onCancel: () => setActiveForm(null),
                    onMoreDetails: () => {
                      setDetailSection(section);
                      setDetailDialogOpen(true);
                    },
                    isSaving: savingForm,
                  } : undefined}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>

        {sections.length === 0 && !aiGenerating && (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <Typography sx={{ color: '#6a6a6a' }}>
              No travel sections yet. Click &ldquo;Add Section&rdquo; to get started.
            </Typography>
          </Box>
        )}

        {/* Add Section — dashed button at the bottom */}
        {!isViewOnly && (
          <AddSectionMenu onAdd={handleAddSection} />
        )}
      </Stack>

      {/* Detail editor dialog (Tiptap — only modal remaining) */}
      {detailSection && (
        <TravelDetailEditor
          open={detailDialogOpen}
          initialContent={detailSection.more_details || ''}
          onClose={() => {
            setDetailDialogOpen(false);
            setDetailSection(null);
          }}
          onSave={handleSaveDetails}
        />
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />

      <ContinueButton weddingSlug={weddingSlug} currentSection="travel" weddingId={weddingId} />
    </Box>
  );
}
