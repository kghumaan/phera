'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
  /**
   * When this returns true at the moment a save completes, the PREVIEW_REFRESH
   * broadcast is skipped (CHANGES_SAVED still fires). Used so a saved real-design
   * edit doesn't trigger a full DB refetch in the preview iframe and clobber an
   * active, non-destructive template preview overlay.
   */
  shouldSkipPreviewRefresh?: () => boolean;
}

export function useAutoSave({ onSave, debounceMs = 1500, enabled = true, shouldSkipPreviewRefresh }: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatusLocal] = useState<SaveStatus>('idle');
  const { setStatus: setGlobalStatus } = useAutoSaveStatus();

  // Sync local status to both local state and global context
  const setSaveStatus = useCallback((s: SaveStatus) => {
    setSaveStatusLocal(s);
    setGlobalStatus(s);
  }, [setGlobalStatus]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const onSaveRef = useRef(onSave);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  // Always keep the refs up to date with the latest values
  onSaveRef.current = onSave;
  const shouldSkipPreviewRefreshRef = useRef(shouldSkipPreviewRefresh);
  shouldSkipPreviewRefreshRef.current = shouldSkipPreviewRefresh;

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
    // If a save is in flight, mark as pending so we re-save after completion
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!isMountedRef.current || isSavingRef.current) return;
      isSavingRef.current = true;
      pendingSaveRef.current = false;
      setSaveStatus('saving');

      try {
        await onSaveRef.current();
        if (!isMountedRef.current) return;
        setSaveStatus('saved');

        // Send broadcast messages for preview refresh
        // Skip PREVIEW_REFRESH if another save is pending (avoids stale DB data flash)
        try {
          const channel = new BroadcastChannel('phera-design-sync');
          // Skip PREVIEW_REFRESH if another save is pending (avoids stale DB
          // flash) OR while a non-destructive preview overlay is active (a
          // refetch would discard it).
          if (!pendingSaveRef.current && !shouldSkipPreviewRefreshRef.current?.()) {
            channel.postMessage({ type: 'PREVIEW_REFRESH' });
          }
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
        // If changes were made during the save, trigger another save cycle
        if (pendingSaveRef.current && isMountedRef.current) {
          pendingSaveRef.current = false;
          debouncedSave();
        }
      }
    }, debounceMs);
  }, [debounceMs, setSaveStatus]); // Stable! No longer depends on onSave

  return { saveStatus, debouncedSave };
}
