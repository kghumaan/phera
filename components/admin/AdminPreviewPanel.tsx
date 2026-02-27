'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, IconButton, alpha, Typography, Button, Dialog, DialogContent, Stack, Divider, Switch, TextField, InputAdornment, CircularProgress } from '@mui/material';
import { DesktopWindows, PhoneAndroid, OpenInNew, IosShare, ContentCopy, Close, Check } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { weddingService, Wedding, WeddingSettings } from '@/lib/supabase/wedding-service';

interface AdminPreviewPanelProps {
    weddingSlug: string;
    refreshKey?: number; // Optional key to force iframe refresh
}

interface PinCode {
    pin: string;
    type: string;
}

/**
 * Persistent preview panel for admin pages
 * Shows the wedding website preview with desktop/mobile toggle
 */
export default function AdminPreviewPanel({ weddingSlug, refreshKey = 0 }: AdminPreviewPanelProps) {
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');
    const iframeRefLine = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Share Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [wedding, setWedding] = useState<Wedding | null>(null);
    const [settings, setSettings] = useState<WeddingSettings | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const handleShareClick = async () => {
        setIsShareModalOpen(true);
        setIsLoadingModal(true);
        try {
            const w = await weddingService.getWeddingBySlug(weddingSlug);
            setWedding(w);
            if (w) {
                setIsPublished(w.status === 'live');
                const s = await weddingService.getSettings(w.id);
                setSettings(s);
            }
        } catch (error) {
            console.error('Error loading share data:', error);
        } finally {
            setIsLoadingModal(false);
        }
    };

    const handleSavePublish = async () => {
        if (!wedding) return;
        setIsSaving(true);
        try {
            const updated = await weddingService.updateWedding(wedding.id, {
                status: isPublished ? 'live' : 'draft'
            });
            if (updated) {
                setWedding(updated);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [id]: false }));
        }, 2000);
    };

    const publicUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/${weddingSlug}`
        : `https://phera.app/${weddingSlug}`;

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

    // Mobile height: constrained to reasonable bounds
    const mobileHeight = Math.min(containerHeight * 0.92, 850);

    return (
        <Box
            data-tour="tour-preview"
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
                    py: 1.5,
                    px: 2,
                    zIndex: 10,
                    position: 'relative',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5, // Increased gap
                        bgcolor: 'white',
                        borderRadius: '16px',
                        p: 0.5,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                >
                    <IconButton
                        onClick={() => setViewMode('desktop')}
                        size="medium"
                        sx={{
                            bgcolor: viewMode === 'desktop' ? alpha('#DE3F5E', 0.1) : 'transparent',
                            color: viewMode === 'desktop' ? '#DE3F5E' : '#666',
                            borderRadius: '14px',
                            px: 2.5,
                            py: 1,
                            '&:hover': {
                                bgcolor: viewMode === 'desktop' ? alpha('#DE3F5E', 0.15) : alpha('#000', 0.04),
                            },
                        }}
                        title="Desktop View"
                    >
                        <DesktopWindows sx={{ fontSize: 22 }} />
                    </IconButton>
                    <IconButton
                        onClick={() => setViewMode('mobile')}
                        size="medium"
                        sx={{
                            bgcolor: viewMode === 'mobile' ? alpha('#DE3F5E', 0.1) : 'transparent',
                            color: viewMode === 'mobile' ? '#DE3F5E' : '#666',
                            borderRadius: '14px',
                            px: 2.5,
                            py: 1,
                            '&:hover': {
                                bgcolor: viewMode === 'mobile' ? alpha('#DE3F5E', 0.15) : alpha('#000', 0.04),
                            },
                        }}
                        title="Mobile View"
                    >
                        <PhoneAndroid sx={{ fontSize: 22 }} />
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
                    overflow: 'visible', // Allow shadows to be seen
                    p: 0,
                    position: 'relative',
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
                        marginTop: viewMode === 'desktop' ? '-80px' : '-35px', // Moved up a bit more
                        backgroundColor: viewMode === 'desktop' ? 'white' : '#ebebeb',
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
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    mt: -2.2, // Pull up to meet the notch and overlap its border
                                    position: 'relative',
                                    WebkitMaskImage: '-webkit-radial-gradient(white, black)', // Fixes Safari border-radius clipping bug with transformed children
                                }}
                            >
                                <iframe
                                    ref={iframeRefLine}
                                    src={`/preview/${weddingSlug}`}
                                    style={{
                                        width: '125%', // 100% / 0.8
                                        height: '125%', // 100% / 0.8
                                        border: 'none',
                                        backgroundColor: 'white',
                                        transform: 'scale(0.8)',
                                        transformOrigin: 'top left',
                                    }}
                                    title="Wedding Preview - Mobile"
                                />
                            </Box>
                        </>
                    )}
                </motion.div>

                {/* View Site and Share Buttons - Positioned relative to the container, moving with the frame */}
                <motion.div
                    animate={{
                        width: viewMode === 'desktop' ? '92%' : 340,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                        position: 'absolute',
                        bottom: viewMode === 'mobile' ? '-10px' : '40px', // Moved down slightly
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        pointerEvents: 'none',
                        zIndex: 5,
                    }}
                >
                    <Button
                        variant="text"
                        onClick={() => window.open(publicUrl, '_blank')}
                        startIcon={<OpenInNew sx={{ fontSize: 20 }} />}
                        sx={{
                            color: '#1a1a1a',
                            textTransform: 'none',
                            fontWeight: 600,
                            pointerEvents: 'auto',
                            bgcolor: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(8px)',
                            px: 2,
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' }
                        }}
                    >
                        View Site
                    </Button>
                    <Button
                        variant="text"
                        onClick={handleShareClick}
                        startIcon={<IosShare sx={{ fontSize: 20 }} />}
                        sx={{
                            color: '#1a1a1a',
                            textTransform: 'none',
                            fontWeight: 600,
                            pointerEvents: 'auto',
                            bgcolor: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(8px)',
                            px: 2,
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' }
                        }}
                    >
                        Share
                    </Button>
                </motion.div>
            </Box>

            {/* Preview Note */}
            <Box sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: '#9a9a9a',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap', // Force one line
                    }}
                >
                    Layout and spacing may vary slightly by device to ensure a perfect guest experience.
                </Typography>
            </Box>
            {/* Share Modal */}
            <Dialog
                open={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        p: 1,
                        bgcolor: 'white',
                    }
                }}
            >
                <DialogContent>
                    <IconButton
                        onClick={() => setIsShareModalOpen(false)}
                        sx={{ position: 'absolute', right: 16, top: 16, color: '#666' }}
                    >
                        <Close />
                    </IconButton>

                    {isLoadingModal ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress sx={{ color: '#DE3F5E' }} />
                        </Box>
                    ) : (
                        <Stack spacing={4} sx={{ mt: 2, pb: 2 }}>
                            <Typography variant="h4" sx={{
                                fontWeight: 700,
                                textAlign: 'center',
                                color: '#1a1a1a',
                                mb: 1,
                                fontSize: { xs: '1.75rem', md: '2.5rem' }
                            }}>
                                Share with your guests.
                            </Typography>

                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1a1a1a' }}>
                                    Phera URL
                                </Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    value={publicUrl}
                                    InputProps={{
                                        readOnly: true,
                                        sx: {
                                            borderRadius: '12px',
                                            bgcolor: '#f8f9fa',
                                            '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                                            color: '#666'
                                        }
                                    }}
                                />
                                <Stack direction="row" spacing={3} mt={1.5}>
                                    <Button
                                        startIcon={copiedStates['url'] ? <Check sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
                                        onClick={() => copyToClipboard(publicUrl, 'url')}
                                        sx={{
                                            textTransform: 'none',
                                            color: '#DE3F5E', // Primary pink
                                            fontWeight: 600,
                                            p: 0,
                                            minWidth: 0,
                                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                        }}
                                    >
                                        {copiedStates['url'] ? 'Copied' : 'Copy Event URL'}
                                    </Button>
                                    <Button
                                        startIcon={<OpenInNew sx={{ fontSize: 18 }} />}
                                        href={publicUrl}
                                        target="_blank"
                                        sx={{
                                            textTransform: 'none',
                                            color: '#DE3F5E', // Primary pink
                                            fontWeight: 600,
                                            p: 0,
                                            minWidth: 0,
                                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                        }}
                                    >
                                        Open in a New Tab
                                    </Button>
                                </Stack>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1a1a1a' }}>
                                    Guest PINs
                                </Typography>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                    {(settings?.pin_codes as unknown as PinCode[] | undefined)?.map((pin, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                bgcolor: '#f8f9fa',
                                                border: '1px solid rgba(0,0,0,0.08)',
                                                borderRadius: '100px',
                                                pl: 2,
                                                pr: 1,
                                                py: 0.75,
                                            }}
                                        >
                                            <Stack spacing={0}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>
                                                    {pin.pin}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#666', fontSize: '10px' }}>
                                                    {pin.type}
                                                </Typography>
                                            </Stack>
                                            <IconButton
                                                size="small"
                                                onClick={() => copyToClipboard(pin.pin, `pin-${index}`)}
                                                sx={{ color: copiedStates[`pin-${index}`] ? '#28c840' : '#DE3F5E' }}
                                            >
                                                {copiedStates[`pin-${index}`] ? <Check sx={{ fontSize: 16 }} /> : <ContentCopy sx={{ fontSize: 16 }} />}
                                            </IconButton>
                                        </Box>
                                    ))}
                                    {(!settings?.pin_codes || (settings.pin_codes as any).length === 0) && (
                                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                                            No PIN codes configured yet.
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 3 }}>
                                    Publish your site before sharing.
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                            Publish your website
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#666', mt: 0.5, mr: 4 }}>
                                            Keep your site unpublished while you're building it. Publish it when you're ready for guests to visit.
                                        </Typography>
                                    </Box>
                                    <Switch
                                        checked={isPublished}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#DE3F5E' },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E' },
                                        }}
                                    />
                                </Box>

                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        disabled={isSaving || (wedding?.status === 'live' && isPublished) || (wedding?.status === 'draft' && !isPublished)}
                                        onClick={handleSavePublish}
                                        sx={{
                                            bgcolor: '#DE3F5E',
                                            color: 'white',
                                            borderRadius: '100px',
                                            py: 2,
                                            fontWeight: 700,
                                            fontSize: '1.1rem',
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: '#c23450' },
                                            '&.Mui-disabled': { bgcolor: '#f0f0f0', color: '#999' }
                                        }}
                                    >
                                        {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
                                    </Button>
                                </Box>

                                {wedding && (
                                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: '#666' }}>
                                        Current Status: <strong>{wedding.status === 'live' ? 'Published' : 'Draft'}</strong>
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Box >
    );
}
