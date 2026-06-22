'use client';

import { useCallback, useMemo, useRef } from 'react';

/**
 * Streaming text-to-speech queue.
 *
 * Instead of waiting for the whole reply and speaking it in one shot, callers
 * feed sentences as the model streams them (`enqueue`) and call `end()` when the
 * turn is done. The queue fetches each sentence's audio, plays them gaplessly in
 * order, and prefetches the next clip while the current one plays — so the agent
 * starts talking on the first sentence instead of after the full generation.
 * That's the single biggest "it flows like a person" win, independent of which
 * TTS voice the server uses.
 *
 * Audio comes from /api/agent/tts (Cartesia → Groq). If a clip fails to fetch
 * or play, that sentence falls back to the browser voice so nothing is dropped.
 */

/** Browser speech-synthesis fallback for a single sentence. */
function speakViaBrowser(text: string, onDone: () => void) {
  let settled = false;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const finish = () => {
    if (settled) return;
    settled = true;
    if (watchdog) clearTimeout(watchdog);
    onDone();
  };
  try {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) {
      finish();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.08; // slightly brisk, matching the Cartesia pace
    utterance.pitch = 1.0;
    utterance.onend = finish;
    utterance.onerror = finish;
    // Browsers sometimes drop onend/onerror (cancel races, long text, backgrounded
    // tab); without this the queue would stall. ~90ms/char + buffer, capped.
    watchdog = setTimeout(finish, Math.min(30_000, 4_000 + text.length * 90));
    synth.speak(utterance);
  } catch {
    finish();
  }
}

/** Strip light markdown so the voice doesn't read "asterisk" etc. */
function stripForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ') // code fences
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1') // links / images → label
    .replace(/[*_#>~]/g, '') // emphasis / headings / quotes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pull complete sentences out of a streaming buffer. Splits on sentence-ending
 * punctuation (followed by whitespace/end) or a newline. Returns the finished
 * sentences plus the unfinished remainder to carry forward. With `flushAll`,
 * whatever is left is emitted as a final sentence.
 */
export function drainSentences(buffer: string, flushAll: boolean): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  let buf = buffer;
  for (;;) {
    // Terminator(s) plus any trailing closing quote/bracket, before whitespace
    // or end-of-buffer — so `"yes."` stays whole. Newlines also end a sentence.
    const m = buf.match(/[.!?]+["')\]]*(?=\s|$)|\n/);
    if (!m || m.index === undefined) break;
    const end = m.index + m[0].length;
    const sentence = buf.slice(0, end).trim();
    if (sentence) sentences.push(sentence);
    buf = buf.slice(end);
  }
  if (flushAll) {
    if (buf.trim()) sentences.push(buf.trim());
    buf = '';
  }
  return { sentences, rest: buf };
}

export interface SpeechQueue {
  /** Queue a sentence to be spoken (no-op when speech is disabled). */
  enqueue: (text: string) => void;
  /** Signal the reply is complete — resolves idle once the queue drains. */
  end: () => void;
  /** Stop everything immediately (switching away / muting). */
  cancel: () => void;
}

export function useSpeechQueue({
  getEnabled,
  onSpeakingChange,
  onIdle,
}: {
  /** Whether replies should be spoken right now (voice mode or speak toggle). */
  getEnabled: () => boolean;
  /** Fired true when audio starts, false when it stops. */
  onSpeakingChange: (speaking: boolean) => void;
  /** Fired once the queue is fully drained after end() (resume listening). */
  onIdle: () => void;
}): SpeechQueue {
  const queueRef = useRef<string[]>([]);
  const endedRef = useRef(true);
  const playingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prefetchRef = useRef<Promise<string | null> | null>(null);
  const generationRef = useRef(0); // bumped on cancel to abandon in-flight work

  const fetchClip = useCallback(async (text: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/agent/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return null;
      return URL.createObjectURL(await res.blob());
    } catch {
      return null;
    }
  }, []);

  const settleIfDrained = useCallback(() => {
    if (!playingRef.current && queueRef.current.length === 0 && endedRef.current) {
      onSpeakingChange(false);
      onIdle();
    }
  }, [onSpeakingChange, onIdle]);

  const pump = useCallback(async () => {
    if (playingRef.current) return;
    const gen = generationRef.current;
    const next = queueRef.current.shift();
    if (next === undefined) {
      settleIfDrained();
      return;
    }
    playingRef.current = true;
    onSpeakingChange(true);

    // Use the prefetched clip if we have one, else fetch now.
    const url = prefetchRef.current ? await prefetchRef.current : await fetchClip(next);
    prefetchRef.current = null;
    if (gen !== generationRef.current) {
      if (url) URL.revokeObjectURL(url);
      return; // cancelled mid-fetch
    }
    // Warm the next clip while this one plays — gapless playback.
    const upcoming = queueRef.current[0];
    if (upcoming) prefetchRef.current = fetchClip(upcoming);

    const advance = () => {
      playingRef.current = false;
      if (gen === generationRef.current) void pump();
    };

    if (!url) {
      speakViaBrowser(next, advance); // clip failed → browser voice for this line
      return;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      advance();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      speakViaBrowser(next, advance);
    };
    void audio.play().catch(() => {
      URL.revokeObjectURL(url);
      speakViaBrowser(next, advance);
    });
  }, [fetchClip, onSpeakingChange, settleIfDrained]);

  const enqueue = useCallback(
    (text: string) => {
      if (!getEnabled()) return;
      const clean = stripForSpeech(text);
      if (!clean) return;
      endedRef.current = false;
      queueRef.current.push(clean);
      void pump();
    },
    [getEnabled, pump]
  );

  const end = useCallback(() => {
    endedRef.current = true;
    settleIfDrained(); // nothing queued → resume immediately
  }, [settleIfDrained]);

  const cancel = useCallback(() => {
    generationRef.current += 1;
    queueRef.current = [];
    endedRef.current = true;
    prefetchRef.current = null;
    playingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* noop */
    }
    onSpeakingChange(false);
  }, [onSpeakingChange]);

  return useMemo(() => ({ enqueue, end, cancel }), [enqueue, end, cancel]);
}
