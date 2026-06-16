'use client';

import { useCallback, useRef, useState } from 'react';

export type VoiceInputState = 'idle' | 'recording' | 'transcribing';

/**
 * Tap-to-record voice input for the planner chat. Records via MediaRecorder,
 * transcribes through the existing Groq Whisper route, and hands the text
 * back for review (it lands in the input field — the user still hits send).
 */
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceInputState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Safari records mp4; everyone else webm/opus
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 25 * 1024 * 1024) {
          setError('Recording too long — keep it under a couple of minutes.');
          setState('idle');
          return;
        }
        setState('transcribing');
        try {
          const formData = new FormData();
          const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          formData.append('audio', new File([blob], `voice.${extension}`, { type: mimeType }));
          const res = await fetch('/api/concierge/transcribe', { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok || !data.transcript) {
            setError(data.error ?? 'Could not transcribe that — try again.');
          } else {
            onTranscript(data.transcript.trim());
          }
        } catch {
          setError('Could not transcribe that — try again.');
        } finally {
          setState('idle');
        }
      };

      recorder.start(1000);
      setState('recording');
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied — allow it in your browser settings.'
          : 'Could not access the microphone.'
      );
      setState('idle');
    }
  }, [onTranscript]);

  const toggle = useCallback(() => {
    if (state === 'recording') stop();
    else if (state === 'idle') void start();
  }, [state, start, stop]);

  return { state, error, toggle };
}
