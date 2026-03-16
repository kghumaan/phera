'use client';

import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add, AutoAwesome } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import ConciergeKnowledgeEntry from './ConciergeKnowledgeEntry';

const CATEGORIES = [
  { value: 'dining', label: 'Dining' },
  { value: 'activities', label: 'Activities' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'local_tips', label: 'Local Tips' },
  { value: 'weather', label: 'Weather' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'cultural_etiquette', label: 'Cultural & Etiquette' },
  { value: 'other', label: 'Other' },
];

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  order_index: number;
  source?: string;
}

interface ConciergeKnowledgeBaseProps {
  weddingId: string;
  isViewOnly?: boolean;
}

export default function ConciergeKnowledgeBase({ weddingId, isViewOnly }: ConciergeKnowledgeBaseProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('other');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [venueLocation, setVenueLocation] = useState<string | null>(null);
  const [venueLoaded, setVenueLoaded] = useState(false);

  const hasAutoEntries = entries.some((e) => e.source === 'auto_generated');

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/concierge/knowledge?weddingId=${weddingId}`);
      const data = await res.json();
      if (res.ok) setEntries(data.entries || []);
    } catch (err) {
      console.error('Error loading knowledge base:', err);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  // Load venue location to determine if we can generate
  useEffect(() => {
    const loadVenue = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data } = await (supabase as any)
          .from('weddings')
          .select('venue_location')
          .eq('id', weddingId)
          .single();
        setVenueLocation(data?.venue_location || null);
      } catch {
        setVenueLocation(null);
      } finally {
        setVenueLoaded(true);
      }
    };
    loadVenue();
  }, [weddingId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    setConfirmRegenerate(false);
    try {
      const res = await fetch('/api/concierge/knowledge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'insufficient_data') {
          setGenerateError('Add your venue location in the Details tab to auto-generate a city guide.');
        } else {
          setGenerateError(data.error || 'Generation failed. Please try again.');
        }
        return;
      }
      // Reload all entries (includes both manual + new auto-generated)
      await loadEntries();
    } catch (err) {
      console.error('Error generating knowledge:', err);
      setGenerateError('Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/concierge/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId,
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
        }),
      });
      const data = await res.json();
      if (res.ok && data.entry) {
        setEntries((prev) => [...prev, data.entry]);
        setNewTitle('');
        setNewContent('');
        setNewCategory('other');
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error adding entry:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, updateData: Partial<KnowledgeEntry>) => {
    try {
      const res = await fetch('/api/concierge/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, weddingId, ...updateData }),
      });
      const data = await res.json();
      if (res.ok && data.entry) {
        setEntries((prev) => prev.map((e) => (e.id === id ? data.entry : e)));
      }
    } catch (err) {
      console.error('Error updating entry:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/concierge/knowledge?id=${id}&weddingId=${weddingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress size={28} sx={{ color: '#DE3F5E' }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Description */}
      <Typography variant="body2" sx={{ color: '#6a6a6a', lineHeight: 1.6 }}>
        Add local knowledge that your concierge can share with guests — restaurant recommendations, things to do, hotel tips, and more. These are included automatically in the bot's context.
      </Typography>

      {/* Generate City Guide section */}
      {!isViewOnly && venueLoaded && (
        <Box>
          {generating ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 1,
                border: '1px solid #DE3F5E20',
                bgcolor: '#DE3F5E04',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <CircularProgress size={22} sx={{ color: '#DE3F5E' }} />
              <Typography variant="body2" sx={{ color: '#4a4a4a', fontWeight: 500 }}>
                Generating city guide for {venueLocation}...
              </Typography>
            </Paper>
          ) : !venueLocation ? (
            <Typography variant="body2" sx={{ color: '#9a9a9a', fontStyle: 'italic' }}>
              Add your venue location in the Details tab to auto-generate a city guide for your guests.
            </Typography>
          ) : hasAutoEntries ? (
            <Button
              size="small"
              startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
              onClick={() => setConfirmRegenerate(true)}
              sx={{
                textTransform: 'none',
                color: '#6a6a6a',
                fontWeight: 500,
                fontSize: '0.8rem',
                '&:hover': { color: '#DE3F5E', bgcolor: '#DE3F5E08' },
              }}
            >
              Regenerate City Guide
            </Button>
          ) : (
            <Button
              startIcon={<AutoAwesome />}
              onClick={handleGenerate}
              sx={{
                textTransform: 'none',
                color: 'white',
                bgcolor: '#DE3F5E',
                fontWeight: 600,
                borderRadius: '12px',
                px: 2.5,
                py: 1,
                '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Generate City Guide
            </Button>
          )}
          {generateError && (
            <Typography variant="body2" sx={{ color: '#d32f2f', mt: 1, fontSize: '0.8rem' }}>
              {generateError}
            </Typography>
          )}
        </Box>
      )}

      {/* Add button */}
      {!isViewOnly && (
        <Box>
          {!showAddForm ? (
            <Button
              startIcon={<Add />}
              onClick={() => setShowAddForm(true)}
              sx={{
                textTransform: 'none',
                color: '#DE3F5E',
                fontWeight: 600,
                borderRadius: '12px',
                border: '1px dashed #DE3F5E40',
                px: 2.5,
                py: 1,
                '&:hover': { bgcolor: '#DE3F5E08', borderColor: '#DE3F5E' },
              }}
            >
              Add Entry
            </Button>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 1,
                border: '1px solid #DE3F5E40',
                bgcolor: 'white',
              }}
            >
              <Stack spacing={2}>
                <TextField
                  label="Title"
                  placeholder="e.g., Restaurant Recommendations"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' },
                    '& .MuiInputLabel-root': { color: '#4a4a4a', fontWeight: 500 },
                  }}
                />
                <TextField
                  label="Content"
                  placeholder="e.g., For Indian food, try Bombay Palace on 5th St..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' },
                    '& .MuiInputLabel-root': { color: '#4a4a4a', fontWeight: 500 },
                  }}
                />
                <FormControl size="small" sx={{ maxWidth: 200 }}>
                  <InputLabel sx={{ color: '#4a4a4a', fontWeight: 500 }}>Category</InputLabel>
                  <Select
                    value={newCategory}
                    label="Category"
                    onChange={(e) => setNewCategory(e.target.value)}
                    sx={{ bgcolor: 'white', borderRadius: '10px', color: '#1a1a1a' }}
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTitle('');
                      setNewContent('');
                      setNewCategory('other');
                    }}
                    sx={{ textTransform: 'none', color: '#6a6a6a', borderRadius: '10px' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleAdd}
                    disabled={!newTitle.trim() || !newContent.trim() || saving}
                    sx={{
                      textTransform: 'none',
                      bgcolor: '#DE3F5E',
                      borderRadius: '10px',
                      '&:hover': { bgcolor: '#c73552' },
                    }}
                  >
                    {saving ? <CircularProgress size={18} color="inherit" /> : 'Add'}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          )}
        </Box>
      )}

      {/* Entries List */}
      {entries.length === 0 && !showAddForm ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.07)',
            bgcolor: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#9a9a9a', mb: 1 }}>
            No knowledge base entries yet.
          </Typography>
          <Typography variant="body2" sx={{ color: '#9a9a9a' }}>
            Add restaurant recommendations, local tips, and more to help your concierge answer guest questions.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {entries.map((entry) => (
            <ConciergeKnowledgeEntry
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isViewOnly={isViewOnly}
            />
          ))}
        </Stack>
      )}

      {/* Regeneration confirmation dialog */}
      <Dialog
        open={confirmRegenerate}
        onClose={() => setConfirmRegenerate(false)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Regenerate City Guide?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#4a4a4a' }}>
            This will replace all AI-generated entries. Manual entries won't be affected.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmRegenerate(false)}
            sx={{ textTransform: 'none', color: '#6a6a6a', borderRadius: '10px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: '#DE3F5E',
              borderRadius: '10px',
              '&:hover': { bgcolor: '#c73552' },
            }}
          >
            Regenerate
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
