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
  IconButton,
  Tooltip,
  Chip,
  alpha,
} from '@mui/material';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { Add, AutoAwesome, Mic, Stop, Close, UploadFile } from '@mui/icons-material';
import { useState, useEffect, useCallback, useRef } from 'react';
import ConciergeKnowledgeEntry from './ConciergeKnowledgeEntry';
import VoiceWaveform from '@/components/admin/VoiceWaveform';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

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

const SUPPORTED_DOC_TYPES = [
  '.txt', '.csv', '.md',
  '.pdf',
  '.doc', '.docx',
  '.rtf',
];
const SUPPORTED_DOC_MIMES = [
  'text/plain', 'text/csv', 'text/markdown',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
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

  // Voice recording state
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceElapsed, setVoiceElapsed] = useState(0);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ─── Voice recording ───────────────────────────────────────────

  const startRecording = useCallback(async () => {
    setVoiceError(null);
    setVoiceElapsed(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setActiveStream(stream);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setActiveStream(null);

        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 25 * 1024 * 1024) {
          setVoiceError('Recording too long — please keep it under 2-3 minutes.');
          setVoiceState('idle');
          return;
        }

        setVoiceState('transcribing');
        try {
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const formData = new FormData();
          formData.append('audio', blob, `voice-note.${ext}`);

          const res = await fetch('/api/concierge/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Server error (${res.status})`);
          }

          const data = await res.json();
          if (data.transcript) {
            setNewContent((prev) => prev ? `${prev}\n\n${data.transcript}` : data.transcript);
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setVoiceError(err instanceof Error ? err.message : 'Transcription failed. Please try again.');
        } finally {
          setVoiceState('idle');
        }
      };

      mediaRecorder.start(1000);
      setVoiceState('recording');
      timerRef.current = setInterval(() => setVoiceElapsed((prev) => prev + 1), 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setVoiceError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        setVoiceError('Could not access microphone. Please check your device settings.');
      }
      setVoiceState('idle');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── File upload ───────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';

    if (!SUPPORTED_DOC_MIMES.includes(file.type) && !file.name.match(/\.(txt|csv|md|rtf)$/i)) {
      setVoiceError(`Unsupported file type. Supported: ${SUPPORTED_DOC_TYPES.join(', ')}`);
      return;
    }

    setUploading(true);
    setVoiceError(null);

    try {
      // Show filename immediately
      setUploadedFileName(file.name);

      // For plain text files, read in background and append to content
      if (file.type.startsWith('text/') || file.name.match(/\.(txt|csv|md|rtf)$/i)) {
        const text = await file.text();
        if (text.trim()) {
          setNewContent((prev) => prev ? `${prev}\n\n${text.trim()}` : text.trim());
        }
      }
      // For PDF/DOC/DOCX — just show file attached, don't try to parse
    } catch (err) {
      console.error('File upload error:', err);
      setVoiceError('Could not read the file. Please try a different format.');
      setUploadedFileName(null);
    } finally {
      setUploading(false);
    }
  };

  // ─── CRUD handlers ─────────────────────────────────────────────

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
        <CircularProgress size={28} sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Description */}
      <Typography variant="body2" sx={{ color: COLORS.text.subtle, lineHeight: 1.6 }}>
        Supplementary data for the Concierge — local tips, insider info, and anything beyond your wedding details. Prioritized over the AI&apos;s defaults.
      </Typography>

      {/* Action buttons row + Add form */}
      {!isViewOnly && (
        <Box>
          {!showAddForm ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                startIcon={<Add />}
                onClick={() => setShowAddForm(true)}
                sx={{
                  textTransform: 'none',
                  color: COLORS.brand.primary,
                  fontWeight: 600,
                  borderRadius: RADII.md,
                  border: '1px dashed #DE3F5E40',
                  px: 2.5,
                  py: 1,
                  '&:hover': { bgcolor: '#DE3F5E08', borderColor: COLORS.brand.primary },
                }}
              >
                Add Knowledge
              </Button>
              {venueLoaded && venueLocation && !hasAutoEntries && (
                <PrimaryActionButton
                  startIcon={<AutoAwesome />}
                  onClick={handleGenerate}
                  loading={generating}
                  sx={{
                    px: 2.5,
                    py: 1,
                    '&.Mui-disabled': { bgcolor: '#DE3F5E80', color: 'rgba(255,255,255,0.8)' },
                  }}
                >
                  Generate with AI
                </PrimaryActionButton>
              )}
              {venueLoaded && venueLocation && hasAutoEntries && (
                <Button
                  size="small"
                  startIcon={generating ? <CircularProgress size={14} sx={{ color: COLORS.text.subtle }} /> : <AutoAwesome sx={{ fontSize: 16 }} />}
                  onClick={() => setConfirmRegenerate(true)}
                  disabled={generating}
                  sx={{
                    textTransform: 'none',
                    color: COLORS.text.subtle,
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    '&:hover': { color: COLORS.brand.primary, bgcolor: '#DE3F5E08' },
                  }}
                >
                  {generating ? 'Regenerating...' : 'Regenerate with AI'}
                </Button>
              )}
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 1,
                border: '1px solid rgba(0,0,0,0.15)',
                bgcolor: COLORS.bg.white,
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    label="Title"
                    placeholder="e.g., Restaurant Recommendations"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    fullWidth
                    sx={ENHANCED_TEXT_FIELD_SX}
                  />
                  <FormControl sx={{ minWidth: 160, flexShrink: 0, mt: 1 }}>
                    <InputLabel sx={{ color: COLORS.text.muted, fontWeight: 500, '&.Mui-focused': { color: COLORS.brand.primary } }}>Category</InputLabel>
                    <Select
                      value={newCategory}
                      label="Category"
                      onChange={(e) => setNewCategory(e.target.value)}
                      sx={{
                        bgcolor: COLORS.bg.white,
                        borderRadius: RADII.md,
                        color: COLORS.text.strong,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand.primary },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.brand.primary, borderWidth: '2px' },
                        '& .MuiSelect-select': {
                          py: { xs: 1.5, md: 1.75, lg: 2 },
                          fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
                        },
                      }}
                    >
                      {CATEGORIES.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Content field with voice + upload controls */}
                <Box>
                  <TextField
                    label="Content"
                    placeholder="Type, speak, or upload a document..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    sx={ENHANCED_TEXT_FIELD_SX}
                  />
                  {/* Voice + Upload toolbar below content */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
                    {voiceState === 'idle' && (
                      <>
                        <Tooltip title="Speak to add content">
                          <IconButton
                            onClick={startRecording}
                            sx={{
                              color: COLORS.text.subtle,
                              border: '1px solid rgba(0,0,0,0.15)',
                              borderRadius: RADII.md,
                              width: 48,
                              height: 48,
                              '&:hover': { color: COLORS.brand.primary, borderColor: COLORS.brand.primary, bgcolor: alpha(COLORS.brand.primary, 0.04) },
                            }}
                          >
                            <Mic sx={{ fontSize: 28 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={`Upload a document (${SUPPORTED_DOC_TYPES.join(', ')})`}>
                          <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            sx={{
                              color: COLORS.text.subtle,
                              border: '1px solid rgba(0,0,0,0.15)',
                              borderRadius: RADII.md,
                              width: 48,
                              height: 48,
                              '&:hover': { color: COLORS.brand.primary, borderColor: COLORS.brand.primary, bgcolor: alpha(COLORS.brand.primary, 0.04) },
                            }}
                          >
                            {uploading ? <CircularProgress size={24} /> : <UploadFile sx={{ fontSize: 28 }} />}
                          </IconButton>
                        </Tooltip>
                        <input
                          ref={fileInputRef}
                          type="file"
                          hidden
                          accept={SUPPORTED_DOC_TYPES.join(',')}
                          onChange={handleFileUpload}
                        />
                        {uploadedFileName && (
                          <Chip
                            label={uploadedFileName}
                            size="small"
                            onDelete={() => setUploadedFileName(null)}
                            sx={{ bgcolor: COLORS.bg.subtle, color: COLORS.text.muted, fontWeight: 500 }}
                          />
                        )}
                        {!uploadedFileName && (
                          <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
                            Speak or upload a file
                          </Typography>
                        )}
                      </>
                    )}

                    {voiceState === 'recording' && (
                      <>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: COLORS.brand.primary,
                            flexShrink: 0,
                            animation: 'pulse 1.2s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                              '50%': { opacity: 0.5, transform: 'scale(1.3)' },
                            },
                          }}
                        />
                        {activeStream && (
                          <Box sx={{ width: 120 }}>
                            <VoiceWaveform stream={activeStream} isActive={voiceState === 'recording'} barCount={30} />
                          </Box>
                        )}
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.brand.primary, fontVariantNumeric: 'tabular-nums' }}>
                          {formatTime(voiceElapsed)}
                        </Typography>
                        <PrimaryActionButton
                          size="small"
                          startIcon={<Stop sx={{ fontSize: 16 }} />}
                          onClick={stopRecording}
                          sx={{
                            borderRadius: RADII.sm,
                            fontSize: '0.8rem',
                            py: 0.5,
                            px: 1.5,
                            minWidth: 'auto',
                          }}
                        >
                          Stop
                        </PrimaryActionButton>
                      </>
                    )}

                    {voiceState === 'transcribing' && (
                      <>
                        <CircularProgress size={16} sx={{ color: COLORS.brand.primary }} />
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: COLORS.text.subtle }}>
                          Transcribing...
                        </Typography>
                      </>
                    )}
                  </Box>

                  {/* Voice/upload error */}
                  {voiceError && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Typography sx={{ fontSize: '0.75rem', color: COLORS.accent.danger }}>{voiceError}</Typography>
                      <IconButton size="small" onClick={() => setVoiceError(null)} sx={{ color: COLORS.text.faint, p: 0.25 }}>
                        <Close sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTitle('');
                      setNewContent('');
                      setNewCategory('other');
                      setVoiceError(null);
                    }}
                    sx={{ textTransform: 'none', color: COLORS.text.subtle, borderRadius: RADII.sm }}
                  >
                    Cancel
                  </Button>
                  <PrimaryActionButton
                    size="small"
                    onClick={handleAdd}
                    disabled={!newTitle.trim() || !newContent.trim()}
                    loading={saving}
                    sx={{ borderRadius: RADII.sm }}
                  >
                    Add
                  </PrimaryActionButton>
                </Box>
              </Stack>
            </Paper>
          )}
        </Box>
      )}

      {/* Generation status messages */}
      {!isViewOnly && venueLoaded && generating && (
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
          <CircularProgress size={22} sx={{ color: COLORS.brand.primary }} />
          <Typography variant="body2" sx={{ color: COLORS.text.muted, fontWeight: 500 }}>
            Generating city guide for {venueLocation}...
          </Typography>
        </Paper>
      )}
      {!isViewOnly && venueLoaded && !generating && !venueLocation && (
        <Typography variant="body2" sx={{ color: COLORS.text.faint, fontStyle: 'italic' }}>
          Add your venue location in the Details tab to auto-generate a city guide for your guests.
        </Typography>
      )}
      {generateError && (
        <Typography variant="body2" sx={{ color: COLORS.accent.danger, fontSize: '0.8rem' }}>
          {generateError}
        </Typography>
      )}

      {/* Entries List */}
      {entries.length === 0 && !showAddForm ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.07)',
            bgcolor: COLORS.bg.white,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: COLORS.text.faint, mb: 1 }}>
            No knowledge bank entries yet.
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
            Add restaurant recommendations, local tips, and more to help your concierge answer guest questions.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {[...entries].reverse().map((entry) => (
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
        PaperProps={{ sx: { borderRadius: RADII.lg, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: COLORS.text.strong }}>
          Regenerate with AI?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: COLORS.text.muted }}>
            This will replace all AI-generated entries. Manual entries won't be affected.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmRegenerate(false)}
            sx={{ textTransform: 'none', color: COLORS.text.subtle, borderRadius: RADII.sm }}
          >
            Cancel
          </Button>
          <PrimaryActionButton
            onClick={handleGenerate}
            loading={generating}
            sx={{ borderRadius: RADII.sm }}
          >
            Regenerate
          </PrimaryActionButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
