'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, IconButton, alpha, Typography } from '@mui/material';
import { DesktopWindows, PhoneAndroid } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminPreviewPanelProps {
    weddingSlug: string;
    refreshKey?: number; // Optional key to force iframe refresh
}

/**
 * Persistent preview panel for admin pages
 * Shows the wedding website preview with desktop/mobile toggle
 */
export default function AdminPreviewPanel({ weddingSlug, refreshKey = 0 }: AdminPreviewPanelProps) {
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const iframeRefLine = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Refresh iframe when refreshKey changes
    useEffect(() => {
        if (iframeRefLine.current && refreshKey > 0) {
            iframeRefLine.current.src = iframeRefLine.current.src;
        }
    }, [refreshKey]);

    // Scroll to top when view mode changes
    useEffect(() => {
        if (iframeRefLine.current?.contentWindow) {
            try {
                iframeRefLine.current.contentWindow.scrollTo(0, 0);
            } catch (e) {
                // Ignore cross-origin errors if any
            }
        }
    }, [viewMode]);

    // Track container dimensions for scaling and stable transitions
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
                setContainerHeight(entry.contentRect.height);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Scaling logic for desktop
    const DESKTOP_WIDTH = 1280;
    const desktopScale = useMemo(() => {
        if (!containerWidth || viewMode !== 'desktop') return 1;
        const frameWidth = containerWidth * 0.94;
        return frameWidth / DESKTOP_WIDTH;
    }, [containerWidth, viewMode]);

    // Calculate specific pixel height for desktop to avoid 'auto' transition jump
    const desktopHeight = useMemo(() => {
        if (!containerWidth) return 0;
        const frameWidth = containerWidth * 0.94;
        return frameWidth / (16 / 10);
    }, [containerWidth]);

    // Mobile height: 85% of container height
    const mobileHeight = containerHeight * 0.85;

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#f8f7f5', // Off-white background
            }}
        >
            {/* Toggle Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 2,
                    px: 2,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 0.5,
                        bgcolor: 'white',
                        borderRadius: '12px',
                        p: 0.5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                >
                    <IconButton
                        onClick={() => setViewMode('desktop')}
                        size="small"
                        sx={{
                            bgcolor: viewMode === 'desktop' ? alpha('#DE3F5E', 0.1) : 'transparent',
                            color: viewMode === 'desktop' ? '#DE3F5E' : '#666',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': {
                                bgcolor: viewMode === 'desktop' ? alpha('#DE3F5E', 0.15) : alpha('#000', 0.04),
                            },
                        }}
                        title="Desktop View"
                    >
                        <DesktopWindows sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton
                        onClick={() => setViewMode('mobile')}
                        size="small"
                        sx={{
                            bgcolor: viewMode === 'mobile' ? alpha('#DE3F5E', 0.1) : 'transparent',
                            color: viewMode === 'mobile' ? '#DE3F5E' : '#666',
                            borderRadius: '8px',
                            px: 2,
                            '&:hover': {
                                bgcolor: viewMode === 'mobile' ? alpha('#DE3F5E', 0.15) : alpha('#000', 0.04),
                            },
                        }}
                        title="Mobile View"
                    >
                        <PhoneAndroid sx={{ fontSize: 20 }} />
                    </IconButton>
                </Box>
            </Box>

            <Box
                ref={containerRef}
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    p: 0,
                }}
            >
                <motion.div
                    animate={{
                        width: viewMode === 'desktop' ? '94%' : 375,
                        height: viewMode === 'desktop' ? desktopHeight : mobileHeight,
                        borderRadius: viewMode === 'desktop' ? '12px' : '40px',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: viewMode === 'desktop' ? 'white' : '#ebebeb', // Match bezel color for mobile
                        overflow: 'hidden',
                        boxShadow: viewMode === 'desktop'
                            ? '0 20px 50px rgba(0, 0, 0, 0.15)'
                            : '0 10px 40px rgba(0, 0, 0, 0.25)',
                        border: viewMode === 'desktop'
                            ? '1px solid rgba(0, 0, 0, 0.08)'
                            : '12px solid #ebebeb', // Light mobile border
                        position: 'relative',
                    }}
                >
                    {viewMode === 'desktop' ? (
                        <>
                            {/* Browser Header/Title Bar */}
                            <Box
                                sx={{
                                    height: 32,
                                    bgcolor: '#f1f1f1',
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 1.5,
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', gap: 0.75 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff5f57' }} />
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#febc2e' }} />
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#28c840' }} />
                                </Box>
                                <Box
                                    sx={{
                                        flex: 1,
                                        height: 20,
                                        bgcolor: 'white',
                                        borderRadius: '4px',
                                        mx: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 1,
                                    }}
                                >
                                    <Typography sx={{ fontSize: '0.6rem', color: '#999', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        phera.app/preview/{weddingSlug}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Iframe Content with Scaling */}
                            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                <iframe
                                    ref={iframeRefLine}
                                    src={`/preview/${weddingSlug}`}
                                    style={{
                                        width: DESKTOP_WIDTH,
                                        height: `${100 / desktopScale}%`,
                                        border: 'none',
                                        transform: `scale(${desktopScale})`,
                                        transformOrigin: 'top left',
                                    }}
                                    title="Wedding Preview - Desktop"
                                />
                            </Box>
                        </>
                    ) : (
                        <>
                            {/* Phone notch (subtle color) */}
                            <Box
                                sx={{
                                    width: 100,
                                    height: 20,
                                    bgcolor: '#ebebeb',
                                    borderRadius: '0 0 14px 14px',
                                    mx: 'auto',
                                    mt: 0,
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    borderTop: 'none',
                                    position: 'relative',
                                    zIndex: 2,
                                }}
                            />
                            {/* Phone screen */}
                            <Box
                                sx={{
                                    flex: 1,
                                    bgcolor: '#ebebeb', // Background matches bezel to hide gaps
                                    borderRadius: '24px 24px 0 0',
                                    overflow: 'hidden',
                                    mt: -2.2, // Pull up to meet the notch and overlap its border
                                    position: 'relative',
                                }}
                            >
                                <iframe
                                    ref={iframeRefLine}
                                    src={`/preview/${weddingSlug}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        backgroundColor: 'white',
                                    }}
                                    title="Wedding Preview - Mobile"
                                />
                            </Box>
                        </>
                    )}
                </motion.div>
            </Box>

            {/* Preview Note */}
            <Box sx={{ py: 1.5, textAlign: 'center' }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: '#8a8a8a',
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                    }}
                >
                    Live preview of your wedding website
                </Typography>
            </Box>
        </Box>
    );
}
