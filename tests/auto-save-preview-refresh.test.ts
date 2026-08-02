import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────

vi.mock('@/lib/contexts/AutoSaveContext', () => ({
  useAutoSaveStatus: () => ({ setStatus: vi.fn() }),
}));

const posted: Array<{ type: string }> = [];

class MockBroadcastChannel {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  postMessage(msg: { type: string }) {
    posted.push(msg);
  }
  close() {}
}

// happy-dom may or may not define BroadcastChannel; force our capturing one.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).BroadcastChannel = MockBroadcastChannel;

import { useAutoSave } from '@/lib/hooks/useAutoSave';

// ─── Tests ───────────────────────────────────────────────────────────

describe('useAutoSave — PREVIEW_REFRESH gating during a preview overlay', () => {
  beforeEach(() => {
    posted.length = 0;
  });

  it('still broadcasts PREVIEW_REFRESH when no preview is active', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({ onSave, debounceMs: 5, enabled: true }),
    );

    act(() => result.current.debouncedSave());

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(posted.some((m) => m.type === 'CHANGES_SAVED')).toBe(true));
    expect(posted.some((m) => m.type === 'PREVIEW_REFRESH')).toBe(true);
  });

  it('skips PREVIEW_REFRESH (but still sends CHANGES_SAVED) while a preview overlay is active', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({
        onSave,
        debounceMs: 5,
        enabled: true,
        shouldSkipPreviewRefresh: () => true,
      }),
    );

    act(() => result.current.debouncedSave());

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(posted.some((m) => m.type === 'CHANGES_SAVED')).toBe(true));
    expect(posted.some((m) => m.type === 'PREVIEW_REFRESH')).toBe(false);
  });
});
