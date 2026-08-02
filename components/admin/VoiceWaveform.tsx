'use client';

import React, { useEffect, useRef } from 'react';
import { Box, alpha } from '@mui/material';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface VoiceWaveformProps {
    stream: MediaStream;
    isActive: boolean;
    color?: string;
    barCount?: number;
}

export default function VoiceWaveform({
    stream,
    isActive,
    color = COLORS.brand.primary,
    barCount = 40
}: VoiceWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        if (!isActive || !stream) return;

        let audioContext: AudioContext;
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            source.connect(analyser);

            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;

            const draw = () => {
                if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const width = canvas.width;
                const height = canvas.height;

                analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);

                ctx.clearRect(0, 0, width, height);

                const barWidth = (width / barCount) * 0.8;
                const gap = (width / barCount) * 0.2;

                // Draw centered bars
                for (let i = 0; i < barCount; i++) {
                    // Map index to frequency data (logarithmic-ish or just subset)
                    const dataIndex = Math.floor((i / barCount) * dataArrayRef.current.length * 0.6);
                    const value = dataArrayRef.current[dataIndex];

                    // Calculate bar height (centered)
                    const barHeight = Math.max(4, (value / 255) * height);
                    const x = i * (barWidth + gap);
                    const y = (height - barHeight) / 2;

                    ctx.fillStyle = color;

                    // Rounded bars
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
                    } else {
                        ctx.rect(x, y, barWidth, barHeight);
                    }
                    ctx.fill();
                }

                animationRef.current = requestAnimationFrame(draw);
            };

            draw();

            return () => {
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
                if (audioContext) audioContext.close();
            };
        } catch (err) {
            console.error('Waveform visualization error:', err);
        }
    }, [isActive, stream, color, barCount]);

    return (
        <Box
            sx={{
                width: '100%',
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(color, 0.03),
                borderRadius: RADII.md,
                overflow: 'hidden',
                px: 2
            }}
        >
            <canvas
                ref={canvasRef}
                width={300}
                height={60}
                style={{ width: '100%', height: '100%' }}
            />
        </Box>
    );
}
