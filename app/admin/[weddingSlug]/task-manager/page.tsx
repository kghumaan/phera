'use client';

import React, { useState, use, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
  IconButton,
  TextField,
  alpha,
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
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

// Types are moved to wedding-service.ts

// ─── Default tasks ────────────────────────────────────────────────────────────

const defaultTasks: Task[] = [];

const COLUMNS: { id: Column; label: string; color: string; bg: string }[] = [
  { id: 'todo', label: 'To Do', color: '#5C6BC0', bg: '#EEF0FC' },
  { id: 'doing', label: 'Doing', color: '#E6890A', bg: '#FFF4E0' },
  { id: 'done', label: 'Done', color: '#2E7D32', bg: '#E8F5E9' },
];

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.07)',
        bgcolor: isDragging ? 'rgba(0,0,0,0.03)' : 'white',
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        '&:hover .task-actions': { opacity: 1 },
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', width: '100%' }}>
        {/* Drag handle */}
        <Box
          {...attributes}
          {...listeners}
          sx={{ pt: 0.25, color: '#ccc', flexShrink: 0, '&:hover': { color: '#999' } }}
        >
          <DragIndicator sx={{ fontSize: 16 }} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a', lineHeight: 1.4 }}>
            {task.title}
          </Typography>
          {task.description && (
            <Typography sx={{ fontSize: '0.775rem', color: '#7a7a7a', mt: 0.5, lineHeight: 1.5 }}>
              {task.description}
            </Typography>
          )}
        </Box>

        {/* Delete */}
        <IconButton
          className="task-actions"
          size="small"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          sx={{ opacity: 0, transition: 'opacity 0.15s', p: 0.25, flexShrink: 0, color: '#bbb', '&:hover': { color: '#DE3F5E' } }}
        >
          <Close sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ ml: 3.2, mt: 0.5 }}>
          {task.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: alpha('#DE3F5E', 0.08),
                color: '#DE3F5E',
                border: `1px solid ${alpha('#DE3F5E', 0.1)}`,
                '& .MuiChip-label': { px: 1.2 }
              }}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

// Static (non-draggable) version for drag overlay
function TaskCardStatic({ task }: { task: Task }) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.07)',
        bgcolor: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        cursor: 'grabbing',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', width: '100%' }}>
        <Box sx={{ pt: 0.25, color: '#ccc', flexShrink: 0 }}>
          <DragIndicator sx={{ fontSize: 16 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a', lineHeight: 1.4 }}>
            {task.title}
          </Typography>
          {task.description && (
            <Typography sx={{ fontSize: '0.775rem', color: '#7a7a7a', mt: 0.5, lineHeight: 1.5 }}>
              {task.description}
            </Typography>
          )}
        </Box>
      </Box>
      {task.tags && task.tags.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ ml: 3.2, mt: 0.5 }}>
          {task.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: alpha('#DE3F5E', 0.08),
                color: '#DE3F5E',
                border: `1px solid ${alpha('#DE3F5E', 0.1)}`,
                '& .MuiChip-label': { px: 1.2 }
              }}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  tasks,
  onDelete,
  onAdd,
  availableTags,
}: {
  col: typeof COLUMNS[number];
  tasks: Task[];
  onDelete: (id: string) => void;
  onAdd: (column: Column, title: string, description?: string, tags?: string[]) => void;
  availableTags: string[];
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
    <Box
      sx={{
        flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
        bgcolor: '#F8F8F8',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: '12px',
        p: 2,
      }}
    >
      {/* Column header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            width: 10, height: 10, borderRadius: '50%', bgcolor: col.color, flexShrink: 0,
          }}
        />
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {col.label}
        </Typography>
        <Box
          sx={{
            ml: 0.5, px: 1, borderRadius: '20px', bgcolor: col.bg,
            fontSize: '0.72rem', fontWeight: 700, color: col.color, lineHeight: 1.6,
          }}
        >
          {tasks.length}
        </Box>
      </Box>

      {/* Tasks drop zone */}
      <Box
        ref={setNodeRef}
        sx={{
          flex: 1,
          minHeight: 80,
          bgcolor: isOver ? alpha(col.color, 0.06) : 'transparent',
          borderRadius: 2,
          transition: 'background 0.15s',
        }}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} />
          ))}
        </SortableContext>

        {/* Add task UI */}
        {adding ? (
          <Paper
            elevation={0}
            sx={{ p: 1.5, borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', bgcolor: 'white', mb: 1 }}
          >
            <TextField
              autoFocus
              fullWidth
              placeholder="Task title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={{ mb: 1, '& input': { fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a' } }}
            />
            <TextField
              fullWidth
              placeholder="Description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setAdding(false); }}
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={{ mb: 1.5, '& input': { fontSize: '0.775rem', color: '#7a7a7a' } }}
            />

            {/* Tag Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocalOfferOutlined sx={{ fontSize: 10 }} /> Tags
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
                {availableTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                      sx={{
                        height: 28,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        bgcolor: isSelected ? alpha('#DE3F5E', 0.1) : 'rgba(0,0,0,0.03)',
                        color: isSelected ? '#DE3F5E' : '#666',
                        border: `1px solid ${isSelected ? alpha('#DE3F5E', 0.2) : 'transparent'}`,
                        '&:hover': { bgcolor: isSelected ? alpha('#DE3F5E', 0.15) : 'rgba(0,0,0,0.06)' },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                sx={{
                  bgcolor: col.color, color: 'white', textTransform: 'none',
                  fontSize: '0.8rem', py: 0.5, px: 1.5, borderRadius: '8px',
                  '&:hover': { bgcolor: col.color, filter: 'brightness(0.9)' },
                }}
              >
                Add
              </Button>
              <IconButton size="small" onClick={() => setAdding(false)} sx={{ color: '#aaa' }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Paper>
        ) : (
          <Box
            onClick={() => setAdding(true)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.75,
              borderRadius: '8px', cursor: 'pointer', color: '#9a9a9a',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: '#444' },
            }}
          >
            <Add sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: '0.8rem' }}>Add a task</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Mock board (non-pro, static blurred) ─────────────────────────────────────

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
    <Box sx={{ display: 'flex', gap: 2.5 }}>
      {COLUMNS.map(col => {
        const tasks = mockTasks.filter(t => t.column === col.id);
        return (
          <Box key={col.id} sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: col.color }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {col.label}
              </Typography>
              <Box sx={{ px: 1, borderRadius: '20px', bgcolor: col.bg, fontSize: '0.72rem', fontWeight: 700, color: col.color, lineHeight: 1.6 }}>
                {tasks.length}
              </Box>
            </Box>
            {tasks.map(task => (
              <Paper key={task.id} elevation={0} sx={{ p: 1.5, mb: 1, borderRadius: '8px', border: '1px solid rgba(0,0,0,0.07)', bgcolor: 'white' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a', lineHeight: 1.4 }}>{task.title}</Typography>
                {task.description && (
                  <Typography sx={{ fontSize: '0.775rem', color: '#7a7a7a', mt: 0.5, lineHeight: 1.5 }}>{task.description}</Typography>
                )}
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
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>(['Vendors', 'Guests', 'RSVPs']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        const wedding = await weddingService.getWeddingBySlug(weddingSlug);
        if (wedding) {
          setWeddingId(wedding.id);

          // Fetch tasks
          const fetchedTasks = await weddingService.getTasks(wedding.id);
          setTasks(fetchedTasks);

          // Fetch events for tags
          const events = await weddingService.getWeddingEvents(wedding.id);
          const eventNames = events.map(e => e.name);
          setAvailableTags(prev => Array.from(new Set([...prev, ...eventNames])));
        }
      } catch (err) {
        console.error('Error initializing task manager:', err);
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [weddingSlug]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTask = tasks.find(t => t.id === activeId) ?? null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Determine target column — over could be a column id or a task id
    const overTask = tasks.find(t => t.id === over.id);
    const targetColumn = overTask ? overTask.column : (over.id as Column);

    if (activeTask.column !== targetColumn) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, column: targetColumn } : t));
    }
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (isViewOnly) return;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Determine target column
    const overTask = tasks.find(t => t.id === over.id);
    const targetColumn = overTask ? overTask.column : (over.id as Column);

    // Sync column change to DB
    if (activeTask.column !== targetColumn) {
      weddingService.updateTask(activeTask.id, { column: targetColumn });
    }

    // Handle reordering within the same column
    if (active.id !== over.id && overTask && activeTask.column === overTask.column) {
      setTasks(prev => {
        const oldIdx = prev.findIndex(t => t.id === active.id);
        const newIdx = prev.findIndex(t => t.id === over.id);
        const newTasks = arrayMove(prev, oldIdx, newIdx);

        // Sync all indices for this column to DB
        const sameColTasks = newTasks.filter(t => t.column === targetColumn);
        Promise.all(sameColTasks.map((t, idx) =>
          weddingService.updateTask(t.id, { order_index: idx })
        ));

        return newTasks;
      });
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (isViewOnly) return;
    const success = await weddingService.deleteTask(id);
    if (success) {
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } else {
      toast.error('Failed to delete task');
    }
  }, []);

  const handleAdd = useCallback(async (column: Column, title: string, description?: string, tags?: string[]) => {
    if (isViewOnly) return;
    if (!weddingId) return;

    const newTask = await weddingService.createTask({
      wedding_id: weddingId,
      title,
      description,
      column,
      tags,
      order_index: tasks.filter(t => t.column === column).length
    });

    if (newTask) {
      setTasks(prev => [...prev, newTask]);
      toast.success('Task added');
    } else {
      toast.error('Failed to add task');
    }
  }, [weddingId, tasks]);

  const handleVoiceTasks = useCallback(async (extractedTasks: { title: string; description: string; tag: string }[]) => {
    if (isViewOnly) return;
    if (!weddingId) return;

    const promises = extractedTasks.map((t, i) => weddingService.createTask({
      wedding_id: weddingId,
      title: t.title,
      description: t.description || undefined,
      column: 'todo' as Column,
      tags: t.tag ? [t.tag] : undefined,
      order_index: tasks.filter(t => t.column === 'todo').length + i
    }));

    const results = await Promise.all(promises);
    const createdTasks = results.filter((t): t is Task => t !== null);

    if (createdTasks.length > 0) {
      setTasks(prev => [...prev, ...createdTasks]);
      toast.success(`Created ${createdTasks.length} tasks`);
    } else {
      toast.error('Failed to create tasks from voice');
    }
  }, [weddingId, tasks]);

  // ── Non-pro teaser ──────────────────────────────────────────────────────────

  if (!isPro) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Task Manager
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Voice-to-tasks — speak your to-do list, we turn it into an organised board
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Mic />}
              onClick={() => setUpgradeModalOpen(true)}
              sx={{
                bgcolor: '#DE3F5E', color: 'white', px: 3, py: 1.25,
                borderRadius: '12px', fontWeight: 600, textTransform: 'none',
                fontSize: '0.9rem', flexShrink: 0, '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Upgrade to Pro
            </Button>
          </Box>

          {/* Description */}
          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.75, mb: 1.25 }}>
              Planning a wedding means a thousand things to track — and you shouldn't have to type them all out. <strong>Just speak.</strong> Ramble through everything that's on your mind, and Phera will transcribe it, extract every action item, and drop them into your board automatically. Your only job is to actually do the things.
            </Typography>
            <Stack spacing={0.6}>
              {([
                <><strong>Voice-to-tasks</strong> — speak naturally and we extract every action item</>,
                <><strong>AI-organised board</strong> across To Do, Doing, and Done columns</>,
                <><strong>Drag tasks</strong> across columns and reorder them as your priorities shift</>,
                <><strong>Follow-up reminders</strong> so nothing slips through the cracks before the big day</>,
              ] as React.ReactNode[]).map((content, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#DE3F5E', lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.65 }}>{content}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Blurred mock board */}
          <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
            <Box sx={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none' }}>
              <MockBoard />
            </Box>

            {/* Lock overlay */}
            <Box
              sx={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, bgcolor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)',
              }}
            >
              <Box
                sx={{
                  width: 56, height: 56, borderRadius: '50%', bgcolor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <LockOutlined sx={{ fontSize: 26, color: '#DE3F5E' }} />
              </Box>
              <Button
                variant="contained"
                startIcon={<ViewKanban />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  bgcolor: '#DE3F5E', color: 'white', px: 3.5, py: 1.5,
                  borderRadius: '12px', fontWeight: 600, textTransform: 'none',
                  fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
                  '&:hover': { bgcolor: '#c73552' },
                }}
              >
                Unlock Task Manager
              </Button>
            </Box>
          </Box>

        </Stack>
        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Box>
    );
  }

  // ── Pro view — full kanban ──────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={3}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
              Task Manager
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
              Voice-to-tasks — speak your to-do list, we handle the rest
            </Typography>
          </Box>
          <VoiceRecorder onTasksExtracted={handleVoiceTasks} />
        </Box>

        {/* Kanban board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                tasks={tasks.filter(t => t.column === col.id)}
                onDelete={handleDelete}
                onAdd={handleAdd}
                availableTags={availableTags}
              />
            ))}
          </Box>

          <DragOverlay>
            {activeTask ? <TaskCardStatic task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>

      </Stack>
    </Box>
  );
}
