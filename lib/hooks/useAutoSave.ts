'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave({ onSave, debounceMs = 1500, enabled = true }: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const onSaveRef = useRef(onSave);
  const isSavingRef = useRef(false);

  // Always keep the ref up to date with the latest onSave
  onSaveRef.current = onSave;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const debouncedSave = useCallback(() => {
    // Don't save if disabled (e.g., auth not ready)
    if (!enabledRef.current) return;
    // Don't reset timer if a save is already in flight
    if (isSavingRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!isMountedRef.current || isSavingRef.current) return;
      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        await onSaveRef.current();
        if (!isMountedRef.current) return;
        setSaveStatus('saved');

        // Send broadcast messages for preview refresh
        try {
          const channel = new BroadcastChannel('phera-design-sync');
          channel.postMessage({ type: 'PREVIEW_REFRESH' });
          channel.postMessage({ type: 'CHANGES_SAVED' });
          channel.close();
        } catch {
          // BroadcastChannel not supported
        }

        savedTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) setSaveStatus('idle');
        }, 2000);
      } catch (err) {
        console.error('Auto-save error:', err);
        if (isMountedRef.current) {
          setSaveStatus('error');
          savedTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) setSaveStatus('idle');
          }, 3000);
        }
      } finally {
        isSavingRef.current = false;
      }
    }, debounceMs);
  }, [debounceMs]); // Stable! No longer depends on onSave

  return { saveStatus, debouncedSave };
}
