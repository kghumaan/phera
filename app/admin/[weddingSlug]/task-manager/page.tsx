'use client';

import React, { useState, use, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  IconButton,
  TextField,
  alpha,
  ClickAwayListener,
} from '@mui/material';
import {
  ViewKanban,
  Mic,
  LockOutlined,
  Add,
  Close,
  DragIndicator,
  LocalOfferOutlined,
} from '@mui/icons-material';
import { Chip } from '@mui/material';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlan } from '@/lib/contexts/PlanContext';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import UpgradeModal from '@/components/admin/UpgradeModal';
import VoiceRecorder from '@/components/admin/VoiceRecorder';
import { weddingService, type Task, type Column } from '@/lib/supabase/wedding-service';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { PrimaryActionButton, ActionButton } from '@/components/admin/ActionButton';
import { COLORS, PALETTE, RADII } from '@/lib/theme/tokens';
import { PageHeading } from '@/components/shared/PageHeading';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { id: Column; label: string; color: string; bg: string }[] = [
  // Palette stops: To Do = sky blue, Doing = butter yellow, Done = success.
  { id: 'todo', label: 'To Do', color: PALETTE.skyBlue[700], bg: PALETTE.skyBlue[50] },
  { id: 'doing', label: 'Doing', color: PALETTE.butterYellow[600], bg: PALETTE.butterYellow[50] },
  { id: 'done', label: 'Done', color: COLORS.accent.successText, bg: COLORS.accent.successBg },
];

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagSelector({
  availableTags,
  selectedTags,
  onToggle,
  onAddCustom,
}: {
  availableTags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
  onAddCustom: (tag: string) => void;
}) {
  const [customTag, setCustomTag] = useState('');

  const handleAddCustom = () => {
    const tag = customTag.trim();
    if (!tag) return;
    onAddCustom(tag);
    setCustomTag('');
  };

  return (
    <Box>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS.text.faint, textTransform: 'uppercase', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LocalOfferOutlined sx={{ fontSize: 14 }} /> Tags
      </Typography>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5, mb: 1 }}>
        {availableTags.map(tag => {
          const isSelected = selectedTags.includes(tag);
          return (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onClick={() => onToggle(tag)}
              sx={{
                height: 28,
                fontSize: '0.875rem',
                cursor: 'pointer',
                bgcolor: isSelected ? alpha(COLORS.brand.primary, 0.1) : 'rgba(0,0,0,0.03)',
                color: isSelected ? COLORS.brand.primary : COLORS.text.subtle,
                border: `1px solid ${isSelected ? alpha(COLORS.brand.primary, 0.2) : 'transparent'}`,
                '&:hover': { bgcolor: isSelected ? alpha(COLORS.brand.primary, 0.15) : 'rgba(0,0,0,0.06)' },
              }}
            />
          );
        })}
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <TextField
          size="small"
          placeholder="Add custom tag..."
          value={customTag}
          onChange={e => setCustomTag(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); } }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '6px', bgcolor: COLORS.bg.white, height: 30,
              '& fieldset': { borderColor: COLORS.border.default },
              '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.4)' },
              '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
            },
            '& .MuiInputBase-input': { fontSize: '0.875rem', py: 0.5, px: 1 },
          }}
        />
        <IconButton size="small" onClick={handleAddCustom} disabled={!customTag.trim()} sx={{ color: COLORS.brand.primary, p: 0.25 }}>
          <Add sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Box>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onDelete,
  onEdit,
  isEditing,
  editDraft,
  onEditChange,
  onEditSave,
  onEditCancel,
  availableTags,
  onAddCustomTag,
}: {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  isEditing: boolean;
  editDraft: { title: string; description: string; tags: string[] } | null;
  onEditChange: (field: string, value: string | string[]) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  availableTags: string[];
  onAddCustomTag: (tag: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isEditing });

  if (isEditing && editDraft) {
    return (
      <ClickAwayListener onClickAway={onEditCancel}>
        <Paper
          ref={setNodeRef}
          elevation={0}
          sx={{
            p: 1.5, mb: 1, borderRadius: RADII.sm,
            border: '1px solid rgba(0,0,0,0.1)', bgcolor: COLORS.bg.white,
          }}
        >
          <Stack spacing={1}>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Title"
              value={editDraft.title}
              onChange={e => onEditChange('title', e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') onEditCancel(); }}
              sx={ENHANCED_TEXT_FIELD_SX}
            />
            <TextField
              fullWidth
              size="small"
              label="Description"
              value={editDraft.description}
              onChange={e => onEditChange('description', e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') onEditCancel(); }}
              sx={ENHANCED_TEXT_FIELD_SX}
            />
            <TagSelector
              availableTags={availableTags}
              selectedTags={editDraft.tags}
              onToggle={tag => {
                const next = editDraft.tags.includes(tag)
                  ? editDraft.tags.filter(t => t !== tag)
                  : [...editDraft.tags, tag];
                onEditChange('tags', next);
              }}
              onAddCustom={tag => {
                onAddCustomTag(tag);
                if (!editDraft.tags.includes(tag)) onEditChange('tags', [...editDraft.tags, tag]);
              }}
            />
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <IconButton size="small" onClick={() => onDelete(task.id)} sx={{ color: COLORS.text.subtle }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
              <PrimaryActionButton
                size="small"
                onClick={onEditSave}
                disabled={!editDraft.title.trim()}
                sx={{
                  fontSize: '0.875rem', py: 0.5, px: 2, borderRadius: RADII.sm,
                }}
              >
                Save
              </PrimaryActionButton>
            </Stack>
          </Stack>
        </Paper>
      </ClickAwayListener>
    );
  }

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        p: 1.5, mb: 1, borderRadius: RADII.sm,
        border: '1px solid rgba(0,0,0,0.07)',
        bgcolor: isDragging ? 'rgba(0,0,0,0.03)' : COLORS.bg.white,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex', flexDirection: 'column', gap: 0.5,
        cursor: 'pointer',
        '&:hover .task-actions': { opacity: 1 },
        '&:hover': { borderColor: COLORS.border.default },
      }}
      onClick={() => onEdit(task.id)}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', width: '100%' }}>
        <Box
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          sx={{ pt: 0.25, color: COLORS.border.default, flexShrink: 0, cursor: 'grab', '&:hover': { color: COLORS.text.faint } }}
        >
          <DragIndicator sx={{ fontSize: 16 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: COLORS.text.strong, lineHeight: 1.4 }}>
            {task.title}
          </Typography>
          {task.description && (
            <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, mt: 0.5, lineHeight: 1.5 }}>
              {task.description}
            </Typography>
          )}
        </Box>
        <IconButton
          className="task-actions"
          size="small"
          onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          sx={{ opacity: 0, transition: 'opacity 0.15s', p: 0.25, flexShrink: 0, color: COLORS.text.faint, '&:hover': { color: COLORS.brand.primary } }}
        >
          <Close sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
      {task.tags && task.tags.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ ml: 3.2, mt: 0.5 }}>
          {task.tags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                height: 24, fontSize: '0.875rem', fontWeight: 600,
                bgcolor: alpha(COLORS.brand.primary, 0.08), color: COLORS.brand.primary,
                border: `1px solid ${alpha(COLORS.brand.primary, 0.1)}`,
                '& .MuiChip-label': { px: 1.2 },
              }}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

// Static version for drag overlay
function TaskCardStatic({ task }: { task: Task }) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5, borderRadius: RADII.sm, border: '1px solid rgba(0,0,0,0.07)',
        bgcolor: COLORS.bg.white, display: 'flex', flexDirection: 'column', gap: 0.5,
        cursor: 'grabbing', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', width: '100%' }}>
        <Box sx={{ pt: 0.25, color: COLORS.border.default, flexShrink: 0 }}><DragIndicator sx={{ fontSize: 16 }} /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: COLORS.text.strong, lineHeight: 1.4 }}>{task.title}</Typography>
          {task.description && <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, mt: 0.5, lineHeight: 1.5 }}>{task.description}</Typography>}
        </Box>
      </Box>
      {task.tags && task.tags.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ ml: 3.2, mt: 0.5 }}>
          {task.tags.map(tag => (
            <Chip key={tag} label={tag} size="small" sx={{ height: 24, fontSize: '0.875rem', fontWeight: 600, bgcolor: alpha(COLORS.brand.primary, 0.08), color: COLORS.brand.primary, border: `1px solid ${alpha(COLORS.brand.primary, 0.1)}`, '& .MuiChip-label': { px: 1.2 } }} />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  col, tasks, onDelete, onAdd, onEdit, editingId, editDraft, onEditChange, onEditSave, onEditCancel, availableTags, onAddCustomTag,
}: {
  col: typeof COLUMNS[number];
  tasks: Task[];
  onDelete: (id: string) => void;
  onAdd: (column: Column, title: string, description?: string, tags?: string[]) => void;
  onEdit: (id: string) => void;
  editingId: string | null;
  editDraft: { title: string; description: string; tags: string[] } | null;
  onEditChange: (field: string, value: string | string[]) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  availableTags: string[];
  onAddCustomTag: (tag: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd(col.id, newTitle.trim(), newDesc.trim() || undefined, selectedTags.length > 0 ? selectedTags : undefined);
    setNewTitle('');
    setNewDesc('');
    setSelectedTags([]);
    setAdding(false);
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', bgcolor: COLORS.bg.subtle, border: '1px solid rgba(0,0,0,0.07)', borderRadius: RADII.md, p: 2 }}>
      {/* Column header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: col.color, flexShrink: 0 }} />
        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: COLORS.text.strong, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.label}</Typography>
        <Box sx={{ ml: 0.5, px: 1, borderRadius: RADII.xl, bgcolor: col.bg, fontSize: '0.875rem', fontWeight: 700, color: col.color, lineHeight: 1.6 }}>{tasks.length}</Box>
      </Box>

      {/* Tasks drop zone */}
      <Box ref={setNodeRef} sx={{ flex: 1, minHeight: 80, bgcolor: isOver ? alpha(col.color, 0.06) : 'transparent', borderRadius: 2, transition: 'background 0.15s' }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDelete}
              onEdit={onEdit}
              isEditing={editingId === task.id}
              editDraft={editingId === task.id ? editDraft : null}
              onEditChange={onEditChange}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
              availableTags={availableTags}
              onAddCustomTag={onAddCustomTag}
            />
          ))}
        </SortableContext>

        {/* Add task UI */}
        {adding ? (
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: RADII.sm, border: '1px solid rgba(0,0,0,0.1)', bgcolor: COLORS.bg.white, mb: 1 }}>
            <TextField autoFocus fullWidth label="Task title" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }} sx={{ ...ENHANCED_TEXT_FIELD_SX, mb: 1 }} />
            <TextField fullWidth label="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setAdding(false); }} sx={{ ...ENHANCED_TEXT_FIELD_SX, mb: 1.5 }} />
            <Box sx={{ mb: 2 }}>
              <TagSelector
                availableTags={availableTags}
                selectedTags={selectedTags}
                onToggle={tag => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                onAddCustom={tag => {
                  onAddCustomTag(tag);
                  if (!selectedTags.includes(tag)) setSelectedTags(prev => [...prev, tag]);
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ActionButton size="small" variant="contained" onClick={handleAdd} disabled={!newTitle.trim()} sx={{ bgcolor: col.color, color: COLORS.text.inverse, fontSize: '0.875rem', py: 0.5, px: 1.5, borderRadius: RADII.sm, '&:hover': { bgcolor: col.color, filter: 'brightness(0.9)' } }}>Add</ActionButton>
              <IconButton size="small" onClick={() => setAdding(false)} sx={{ color: COLORS.text.faint }}><Close sx={{ fontSize: 16 }} /></IconButton>
            </Box>
          </Paper>
        ) : (
          <Box onClick={() => setAdding(true)} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.75, borderRadius: RADII.sm, cursor: 'pointer', color: COLORS.text.faint, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: COLORS.text.muted } }}>
            <Add sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: '0.875rem' }}>Add a task</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Mock board (non-pro) ─────────────────────────────────────────────────────

const mockTasks: Task[] = [
  { id: 'm1', wedding_id: '', title: 'Confirm venue final headcount', column: 'todo', order_index: 0, created_at: '' },
  { id: 'm2', wedding_id: '', title: 'Send shuttle timing to guests', description: 'Pickup from Taj at 5:30pm', column: 'todo', order_index: 1, created_at: '' },
  { id: 'm3', wedding_id: '', title: 'Book second shooter', column: 'todo', order_index: 2, created_at: '' },
  { id: 'm4', wedding_id: '', title: 'Finalise seating chart', column: 'doing', order_index: 0, created_at: '' },
  { id: 'm5', wedding_id: '', title: 'Review catering menu', column: 'doing', order_index: 1, created_at: '' },
  { id: 'm6', wedding_id: '', title: 'Send save-the-dates', column: 'done', order_index: 0, created_at: '' },
  { id: 'm7', wedding_id: '', title: 'Book honeymoon flights', column: 'done', order_index: 1, created_at: '' },
];

function MockBoard() {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2.5,
        overflowX: { xs: 'auto', md: 'visible' },
        pb: { xs: 1, md: 0 },
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
        '& > *': { minWidth: { xs: 280, md: 0 }, flex: { xs: '0 0 auto', md: 1 } },
      }}
    >
      {COLUMNS.map(col => {
        const tasks = mockTasks.filter(t => t.column === col.id);
        return (
          <Box key={col.id} sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: col.color }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: COLORS.text.strong, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.label}</Typography>
              <Box sx={{ px: 1, borderRadius: RADII.xl, bgcolor: col.bg, fontSize: '0.875rem', fontWeight: 700, color: col.color, lineHeight: 1.6 }}>{tasks.length}</Box>
            </Box>
            {tasks.map(task => (
              <Paper key={task.id} elevation={0} sx={{ p: 1.5, mb: 1, borderRadius: RADII.sm, border: '1px solid rgba(0,0,0,0.07)', bgcolor: COLORS.bg.white }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: COLORS.text.strong, lineHeight: 1.4 }}>{task.title}</Typography>
                {task.description && <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle, mt: 0.5, lineHeight: 1.5 }}>{task.description}</Typography>}
              </Paper>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TaskManagerPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { isViewOnly } = useAdminRole();
  const { showStatus } = useAutoSaveStatus();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>(['Vendors', 'Guests', 'RSVPs']);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ title: string; description: string; tags: string[] } | null>(null);

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        const wedding = await weddingService.getWeddingBySlug(weddingSlug);
        if (wedding) {
          setWeddingId(wedding.id);
          const fetchedTasks = await weddingService.getTasks(wedding.id);
          setTasks(fetchedTasks);
          const events = await weddingService.getWeddingEvents(wedding.id);
          const eventNames = events.map(e => e.name);
          setAvailableTags(prev => Array.from(new Set([...prev, ...eventNames])));
        }
      } catch (err) {
        console.error('Error initializing task manager:', err);
        showStatus('error', 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [weddingSlug]);

  // Collect all unique tags from tasks + defaults
  const allTags = Array.from(new Set([
    ...availableTags,
    ...tasks.flatMap(t => t.tags || []),
  ]));

  const handleAddCustomTag = useCallback((tag: string) => {
    setAvailableTags(prev => Array.from(new Set([...prev, tag])));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTask = tasks.find(t => t.id === activeId) ?? null;

  const handleDragStart = ({ active }: DragStartEvent) => { setActiveId(active.id as string); };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const aTask = tasks.find(t => t.id === active.id);
    if (!aTask) return;
    const overTask = tasks.find(t => t.id === over.id);
    const targetColumn = overTask ? overTask.column : (over.id as Column);
    if (aTask.column !== targetColumn) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, column: targetColumn } : t));
    }
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (isViewOnly) return;
    setActiveId(null);
    if (!over) return;
    const aTask = tasks.find(t => t.id === active.id);
    if (!aTask) return;
    const overTask = tasks.find(t => t.id === over.id);
    const targetColumn = overTask ? overTask.column : (over.id as Column);
    if (aTask.column !== targetColumn) weddingService.updateTask(aTask.id, { column: targetColumn });
    if (active.id !== over.id && overTask && aTask.column === overTask.column) {
      setTasks(prev => {
        const oldIdx = prev.findIndex(t => t.id === active.id);
        const newIdx = prev.findIndex(t => t.id === over.id);
        const newTasks = arrayMove(prev, oldIdx, newIdx);
        const sameCol = newTasks.filter(t => t.column === targetColumn);
        Promise.all(sameCol.map((t, idx) => weddingService.updateTask(t.id, { order_index: idx })));
        return newTasks;
      });
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (isViewOnly) return;
    if (editingId === id) { setEditingId(null); setEditDraft(null); }
    const success = await weddingService.deleteTask(id);
    if (success) {
      setTasks(prev => prev.filter(t => t.id !== id));
      showStatus('saved', 'Task deleted');
    } else {
      showStatus('error', 'Failed to delete task');
    }
  }, [editingId]);

  const handleAdd = useCallback(async (column: Column, title: string, description?: string, tags?: string[]) => {
    if (isViewOnly || !weddingId) return;
    const newTask = await weddingService.createTask({
      wedding_id: weddingId, title, description, column, tags,
      order_index: tasks.filter(t => t.column === column).length,
    });
    if (newTask) { setTasks(prev => [...prev, newTask]); showStatus('saved', 'Task added'); }
    else showStatus('error', 'Failed to add task');
  }, [weddingId, tasks]);

  const handleVoiceTasks = useCallback(async (extractedTasks: { title: string; description: string; tag: string }[]) => {
    if (isViewOnly || !weddingId) return;
    const promises = extractedTasks.map((t, i) => weddingService.createTask({
      wedding_id: weddingId, title: t.title, description: t.description || undefined,
      column: 'todo' as Column, tags: t.tag ? [t.tag] : undefined,
      order_index: tasks.filter(t => t.column === 'todo').length + i,
    }));
    const results = await Promise.all(promises);
    const created = results.filter((t): t is Task => t !== null);
    if (created.length > 0) {
      setTasks(prev => [...prev, ...created]);
      // Add any new tags from voice
      const voiceTags = extractedTasks.map(t => t.tag).filter(Boolean);
      if (voiceTags.length > 0) setAvailableTags(prev => Array.from(new Set([...prev, ...voiceTags])));
      showStatus('saved', `Created ${created.length} tasks`);
    } else showStatus('error', 'Failed to create tasks from voice');
  }, [weddingId, tasks]);

  // Inline edit handlers
  const handleStartEdit = useCallback((id: string) => {
    if (isViewOnly) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setEditingId(id);
    setEditDraft({ title: task.title, description: task.description || '', tags: task.tags || [] });
  }, [tasks, isViewOnly]);

  const handleEditChange = useCallback((field: string, value: string | string[]) => {
    setEditDraft(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editingId || !editDraft || !editDraft.title.trim()) return;
    await weddingService.updateTask(editingId, {
      title: editDraft.title.trim(),
      description: editDraft.description.trim() || undefined,
      tags: editDraft.tags.length > 0 ? editDraft.tags : undefined,
    });
    setTasks(prev => prev.map(t => t.id === editingId ? { ...t, title: editDraft.title.trim(), description: editDraft.description.trim() || undefined, tags: editDraft.tags.length > 0 ? editDraft.tags : undefined } : t));
    setEditingId(null);
    setEditDraft(null);
    showStatus('saved');
  }, [editingId, editDraft]);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditDraft(null);
  }, []);

  // ── Non-pro teaser ──────────────────────────────────────────────────────────
  if (!isPro && !weddingSlug.startsWith('demo-')) {
    return (
      <Box>
        <Stack spacing={3}>
          <PageHeading
            title="Task Manager"
            subtitle="Voice-to-tasks — speak your to-do list, we turn it into an organised board"
            actions={
              <PrimaryActionButton startIcon={<Mic />} onClick={() => setUpgradeModalOpen(true)} sx={{ flexShrink: 0 }}>
                Upgrade to Pro
              </PrimaryActionButton>
            }
          />
          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.75, mb: 1.25 }}>
              Planning a wedding means a thousand things to track — and you shouldn&apos;t have to type them all out. <strong>Just speak.</strong> Ramble through everything that&apos;s on your mind, and Phera will transcribe it, extract every action item, and drop them into your board automatically.
            </Typography>
            <Stack spacing={0.6}>
              {([
                <><strong>Voice-to-tasks</strong> — speak naturally and we extract every action item</>,
                <><strong>AI-organised board</strong> across To Do, Doing, and Done columns</>,
                <><strong>Drag tasks</strong> across columns and reorder them as your priorities shift</>,
                <><strong>Follow-up reminders</strong> so nothing slips through the cracks before the big day</>,
              ] as React.ReactNode[]).map((content, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: COLORS.brand.primary, lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.65 }}>{content}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
          <Box sx={{ position: 'relative', borderRadius: RADII.md, overflow: 'hidden' }}>
            <Box sx={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none' }}><MockBoard /></Box>
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: COLORS.bg.white, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockOutlined sx={{ fontSize: 26, color: COLORS.brand.primary }} />
              </Box>
              <PrimaryActionButton startIcon={<ViewKanban />} onClick={() => setUpgradeModalOpen(true)} sx={{ px: 3.5, py: 1.5, fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(222,63,94,0.35)' }}>Unlock Task Manager</PrimaryActionButton>
            </Box>
          </Box>
        </Stack>
        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Box>
    );
  }

  // ── Pro view — full kanban ──────────────────────────────────────────────────
  return (
    <Box>
      <Stack spacing={3}>
        <PageHeading
          title="Task Manager"
          subtitle="Voice-to-tasks — speak your to-do list, we handle the rest"
          actions={<VoiceRecorder onTasksExtracted={handleVoiceTasks} />}
        />

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <Box
            sx={{
              display: 'flex',
              gap: 2.5,
              alignItems: 'flex-start',
              // On mobile, make the board horizontally scrollable with a
              // readable per-column minimum width rather than squishing 4
              // columns into a phone-wide viewport.
              overflowX: { xs: 'auto', md: 'visible' },
              pb: { xs: 1, md: 0 },
              mx: { xs: -2, md: 0 },
              px: { xs: 2, md: 0 },
              '& > *': {
                minWidth: { xs: 280, md: 0 },
                flex: { xs: '0 0 auto', md: 1 },
              },
            }}
          >
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                tasks={tasks.filter(t => t.column === col.id)}
                onDelete={handleDelete}
                onAdd={handleAdd}
                onEdit={handleStartEdit}
                editingId={editingId}
                editDraft={editDraft}
                onEditChange={handleEditChange}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                availableTags={allTags}
                onAddCustomTag={handleAddCustomTag}
              />
            ))}
          </Box>
          <DragOverlay>{activeTask ? <TaskCardStatic task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      </Stack>
    </Box>
  );
}
