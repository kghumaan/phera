'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  alpha,
  Collapse,
} from '@mui/material';
import { PrimaryActionButton, ActionButton } from './ActionButton';
import { Mic, Stop, Close, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import VoiceWaveform from './VoiceWaveform';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ExtractedTask {
  title: string;
  description: string;
  tag: string;
}

interface VoiceRecorderProps {
  onTasksExtracted: (tasks: ExtractedTask[]) => void;
}

type RecordingState = 'idle' | 'recording' | 'uploading' | 'extracting';

export default function VoiceRecorder({ onTasksExtracted }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [pendingTasks, setPendingTasks] = useState<ExtractedTask[] | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
    setPendingTasks(null);
    setElapsed(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setActiveStream(stream);

      // Determine supported MIME type (Safari uses mp4, others use webm)
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
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Check size (25MB limit for Groq free tier)
        if (blob.size > 25 * 1024 * 1024) {
          setError('Recording too long — please keep it under 2-3 minutes.');
          setState('idle');
          return;
        }

        await uploadAndExtract(blob, mimeType);
      };

      mediaRecorder.start(1000); // Collect chunks every second
      setState('recording');

      // Timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        setError('Could not access microphone. Please check your device settings.');
      }
      setState('idle');
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
    setActiveStream(null);
  }, []);

  const uploadAndExtract = async (blob: Blob, mimeType: string) => {
    setState('uploading');

    try {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const formData = new FormData();
      formData.append('audio', blob, `voice-note.${ext}`);

      setState('extracting');

      const res = await fetch('/api/admin/tasks/voice', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setTranscript(data.transcript);

      if (data.tasks && data.tasks.length > 0) {
        setPendingTasks(data.tasks);
      } else {
        setError('No actionable tasks found in your voice note. Try being more specific about what needs to be done.');
      }

      setState('idle');
    } catch (err) {
      console.error('Upload/extraction error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('idle');
    }
  };

  const handleConfirmTasks = () => {
    if (pendingTasks) {
      onTasksExtracted(pendingTasks);
      setPendingTasks(null);
      setTranscript(null);
    }
  };

  const handleDismiss = () => {
    setPendingTasks(null);
    setTranscript(null);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isProcessing = state === 'uploading' || state === 'extracting';

  return (
    <>
      {/* Main button */}
      {state === 'idle' && !pendingTasks && (
        <ActionButton
          variant="outlined"
          startIcon={<Mic />}
          onClick={startRecording}
          sx={{
            borderColor: COLORS.brand.primary,
            color: COLORS.brand.primary,
            px: 2.5,
            py: 1,
            borderRadius: RADII.md,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9rem',
            '&:hover': { borderColor: '#c73552', bgcolor: alpha(COLORS.brand.primary, 0.04) },
          }}
        >
          Voice Input
        </ActionButton>
      )}

      {/* Recording state */}
      {state === 'recording' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: COLORS.brand.primary,
              animation: 'pulse 1.2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.5, transform: 'scale(1.3)' },
              },
            }}
          />
          {activeStream && (
            <Box sx={{ width: 140, mx: 1 }}>
              <VoiceWaveform stream={activeStream} isActive={state === 'recording'} />
            </Box>
          )}
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.brand.primary, fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(elapsed)}
          </Typography>
          <PrimaryActionButton
            startIcon={<Stop />}
            onClick={stopRecording}
            sx={{
              px: 2.5,
              py: 1,
              fontSize: '0.9rem',
            }}
          >
            Stop
          </PrimaryActionButton>
        </Box>
      )}

      {/* Processing state */}
      {isProcessing && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={18} sx={{ color: COLORS.brand.primary }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: COLORS.text.subtle }}>
            {state === 'uploading' ? 'Transcribing...' : 'Extracting tasks...'}
          </Typography>
        </Box>
      )}

      {/* Error display */}
      {error && state === 'idle' && !pendingTasks && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', color: COLORS.accent.danger }}>{error}</Typography>
          <IconButton size="small" onClick={() => setError(null)} sx={{ color: COLORS.text.faint }}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}

      {/* Results dialog */}
      <Dialog
        open={!!pendingTasks}
        onClose={handleDismiss}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: RADII.lg, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 0.5 }}>
          Voice Tasks
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontWeight: 400, mt: 0.5 }}>
            {pendingTasks?.length} task{pendingTasks?.length !== 1 ? 's' : ''} extracted from your voice note
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Collapsible transcript */}
          {transcript && (
            <Box sx={{ mb: 2 }}>
              <Box
                onClick={() => setShowTranscript(!showTranscript)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  color: COLORS.text.faint,
                  '&:hover': { color: COLORS.text.subtle },
                }}
              >
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Transcript
                </Typography>
                {showTranscript ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
              </Box>
              <Collapse in={showTranscript}>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    color: '#7a7a7a',
                    lineHeight: 1.7,
                    mt: 1,
                    p: 1.5,
                    bgcolor: COLORS.bg.subtle,
                    borderRadius: RADII.sm,
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{transcript}&rdquo;
                </Typography>
              </Collapse>
            </Box>
          )}

          {/* Task list preview */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {pendingTasks?.map((task, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.5,
                  borderRadius: RADII.sm,
                  border: '1px solid rgba(0,0,0,0.07)',
                  bgcolor: COLORS.bg.white,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: COLORS.text.strong }}>
                    {task.title}
                  </Typography>
                  {task.tag && (
                    <Box
                      sx={{
                        px: 1,
                        py: 0.2,
                        borderRadius: '6px',
                        bgcolor: alpha(COLORS.brand.primary, 0.08),
                        color: COLORS.brand.primary,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        flexShrink: 0,
                        border: `1px solid ${alpha(COLORS.brand.primary, 0.1)}`,
                      }}
                    >
                      {task.tag}
                    </Box>
                  )}
                </Box>
                {task.description && (
                  <Typography sx={{ fontSize: '0.775rem', color: '#7a7a7a', mt: 0.5, lineHeight: 1.5 }}>
                    {task.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleDismiss}
            sx={{ color: COLORS.text.faint, textTransform: 'none', fontWeight: 600, borderRadius: RADII.sm }}
          >
            Cancel
          </Button>
          <PrimaryActionButton
            onClick={handleConfirmTasks}
            sx={{
              px: 3,
              borderRadius: RADII.sm,
            }}
          >
            Add {pendingTasks?.length} Task{pendingTasks?.length !== 1 ? 's' : ''}
          </PrimaryActionButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
