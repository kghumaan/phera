'use client';

import { useCallback, useRef, useState } from 'react';

export type VoiceModeState = 'idle' | 'listening' | 'transcribing';

interface VoiceRefs {
  stream?: MediaStream;
  rec?: MediaRecorder;
  ctx?: AudioContext;
  raf?: number;
  chunks: Blob[];
  spoke: boolean;
  silenceStart?: number;
}

// Silence detection tuning.
const SPEAK_THRESHOLD = 0.018; // RMS above this counts as speech
const SILENCE_MS = 1400; // stop this long after speech ends
const MAX_UTTERANCE_MS = 20_000; // hard cap per turn

/**
 * Hands-free voice loop: listen with silence detection → transcribe (Groq
 * Whisper) → hand the text to onUtterance. The caller resumes the loop by
 * calling listenAgain() once it's done responding (e.g. after TTS playback).
 */
export function useVoiceMode({
  onUtterance,
  getBusy,
}: {
  onUtterance: (text: string) => void;
  getBusy: () => boolean;
}) {
  const [active, setActive] = useState(false);
  const [state, setState] = useState<VoiceModeState>('idle');
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(false);
  const refs = useRef<VoiceRefs>({ chunks: [], spoke: false });

  const cleanupAudio = useCallback(() => {
    const r = refs.current;
    if (r.raf) cancelAnimationFrame(r.raf);
    r.raf = undefined;
    try {
      r.ctx?.close();
    } catch {
      /* already closed */
    }
    r.ctx = undefined;
    r.stream?.getTracks().forEach((t) => t.stop());
    r.stream = undefined;
  }, []);

  const listen = useCallback(async () => {
    if (!activeRef.current) return;
    // Don't open the mic while the agent is responding; poll back shortly.
    if (getBusy()) {
      window.setTimeout(() => void listen(), 400);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      refs.current = { stream, rec, ctx, chunks: [], spoke: false };
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) refs.current.chunks.push(e.data);
      };
      rec.onstop = async () => {
        cleanupAudio();
        const blob = new Blob(refs.current.chunks, { type: mimeType });
        if (!activeRef.current) return;
        // No speech captured — just listen again.
        if (!refs.current.spoke || blob.size < 1200) {
          void listen();
          return;
        }
        setState('transcribing');
        try {
          const form = new FormData();
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          form.append('audio', new File([blob], `voice.${ext}`, { type: mimeType }));
          const res = await fetch('/api/concierge/transcribe', { method: 'POST', body: form });
          const json = await res.json();
          const text = (json.transcript ?? '').trim();
          if (text && activeRef.current) {
            setState('idle');
            onUtterance(text); // caller responds, then calls listenAgain()
          } else if (activeRef.current) {
            void listen();
          }
        } catch {
          if (activeRef.current) void listen();
        }
      };

      rec.start();
      setState('listening');
      setError(null);
      const startedAt = Date.now();
      const tick = () => {
        if (!activeRef.current || refs.current.rec !== rec || rec.state !== 'recording') return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const x = (data[i] - 128) / 128;
          sum += x * x;
        }
        const rms = Math.sqrt(sum / data.length);
        const now = Date.now();
        if (rms > SPEAK_THRESHOLD) {
          refs.current.spoke = true;
          refs.current.silenceStart = undefined;
        } else if (refs.current.spoke) {
          if (!refs.current.silenceStart) refs.current.silenceStart = now;
          else if (now - refs.current.silenceStart > SILENCE_MS) {
            rec.stop();
            return;
          }
        }
        if (now - startedAt > MAX_UTTERANCE_MS) {
          rec.stop();
          return;
        }
        refs.current.raf = requestAnimationFrame(tick);
      };
      refs.current.raf = requestAnimationFrame(tick);
    } catch (err) {
      activeRef.current = false;
      setActive(false);
      setState('idle');
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied — allow it to use voice mode.'
          : 'Could not start voice mode.'
      );
    }
  }, [cleanupAudio, getBusy, onUtterance]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setState('idle');
    try {
      refs.current.rec?.stop();
    } catch {
      /* not recording */
    }
    cleanupAudio();
  }, [cleanupAudio]);

  const start = useCallback(() => {
    activeRef.current = true;
    setActive(true);
    void listen();
  }, [listen]);

  // Resume listening after the caller finishes responding (e.g. TTS ended).
  const listenAgain = useCallback(() => {
    if (activeRef.current) void listen();
  }, [listen]);

  return { active, state, error, start, stop, listenAgain };
}
