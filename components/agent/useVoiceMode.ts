'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// --- Minimal Web Speech API typings (not in the standard DOM lib) ---------
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Hands-free voice loop built on the browser Web Speech API.
 *
 * Recognition runs one utterance at a time with interim results, so the live
 * partial transcript is available immediately (no server round-trip) and the
 * end of speech is detected automatically. When the user finishes, the final
 * text is handed to onUtterance; the caller responds (and speaks the reply),
 * then calls restart() to listen again. Recognition is paused while the agent
 * is speaking so it never hears its own voice.
 */
export function useVoiceMode({
  onUtterance,
  getBusy,
}: {
  onUtterance: (text: string) => void;
  getBusy: () => boolean;
}) {
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Resolved synchronously on first render so callers see the real value
  // immediately (no post-mount flip). On the server it's false (no window),
  // but `supported` isn't rendered, so there's no hydration mismatch.
  const [supported, setSupported] = useState<boolean>(() => getRecognitionCtor() !== null);

  const activeRef = useRef(false);
  const speakingRef = useRef(false);
  const runningRef = useRef(false);
  const finalRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const beginListening = useCallback(() => {
    if (!activeRef.current || speakingRef.current || runningRef.current) return;
    if (getBusy()) {
      // Agent is still responding — try again shortly.
      window.setTimeout(beginListening, 300);
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    finalRef.current = '';

    recognition.onstart = () => {
      runningRef.current = true;
      setListening(true);
      setError(null);
    };
    recognition.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const chunk = result[0]?.transcript ?? '';
        if (result.isFinal) finalRef.current += chunk;
        else interimText += chunk;
      }
      setInterim((finalRef.current + interimText).trim());
    };
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        activeRef.current = false;
        setActive(false);
        setError('Microphone access denied — allow it to use voice mode.');
      }
      // 'no-speech' / 'aborted' / 'network' fall through to onend → restart.
    };
    recognition.onend = () => {
      runningRef.current = false;
      setListening(false);
      recognitionRef.current = null;
      const text = finalRef.current.trim();
      finalRef.current = '';
      if (!activeRef.current) return;
      if (text) {
        setInterim('');
        onUtterance(text); // caller responds, then calls restart()
      } else if (!speakingRef.current && !getBusy()) {
        // Nothing captured — keep the mic open.
        beginListening();
      }
    };

    try {
      recognition.start();
    } catch {
      // start() throws if a prior instance is mid-teardown — retry once.
      runningRef.current = false;
      window.setTimeout(beginListening, 250);
    }
  }, [getBusy, onUtterance]);

  const start = useCallback(() => {
    if (!getRecognitionCtor()) {
      setSupported(false);
      setError('Voice mode needs a browser with speech recognition (Chrome, Edge, or Safari).');
      return;
    }
    activeRef.current = true;
    setActive(true);
    setInterim('');
    beginListening();
  }, [beginListening]);

  const stop = useCallback(() => {
    activeRef.current = false;
    speakingRef.current = false;
    setActive(false);
    setListening(false);
    setInterim('');
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    runningRef.current = false;
    try {
      recognition?.abort();
    } catch {
      /* already stopped */
    }
  }, []);

  // Resume listening after the caller finishes responding (e.g. TTS ended).
  const restart = useCallback(() => {
    if (activeRef.current) beginListening();
  }, [beginListening]);

  // Pause/resume recognition around spoken replies so it doesn't transcribe
  // the agent's own voice.
  const setSpeaking = useCallback((value: boolean) => {
    speakingRef.current = value;
    if (value) {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
      runningRef.current = false;
      setListening(false);
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { active, listening, interim, error, supported, start, stop, restart, setSpeaking };
}
