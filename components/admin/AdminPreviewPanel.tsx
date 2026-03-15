'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, IconButton, alpha, Typography, Button, Dialog, DialogContent, Stack, Switch, TextField, CircularProgress, Menu, MenuItem } from '@mui/material';
import { DesktopWindows, PhoneAndroid, OpenInNew, IosShare, ContentCopy, Close, Check, Publish } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { weddingService, Wedding, WeddingSettings } from '@/lib/supabase/wedding-service';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';

const SECTION_MAP: Record<string, string> = {
    '/schedule': 'Schedule',
    '/travel': 'Travel & Stay',
    '/faq': 'FAQ',
    '/registry': 'Registry',
    '/shopping': 'Shopping Guide',
    '/pins': 'Pin Entry Screen',
    '/rsvp-form': 'RSVP Form',
};

interface AdminPreviewPanelProps {
    weddingSlug: string;
    refreshKey?: number;
    weddingId?: string;
    hasUnpublishedChanges?: boolean;
    lastPublishedAt?: string | null;
    onPublished?: () => void;
    currentAdminPath?: string | null;
    websiteLayout?: string | null;
}

interface PinCode {
    pin: string;
    type: string;
}

export default function AdminPreviewPanel({
    weddingSlug,
    refreshKey = 0,
    weddingId,
    hasUnpublishedChanges: externalHasChanges,
    lastPublishedAt: externalLastPublished,
    onPublished,
    currentAdminPath,
    websiteLayout,
}: AdminPreviewPanelProps) {
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');
    const iframeRefLine = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const { isViewOnly } = useAdminRole();

    // Publish state
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);
    const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(externalHasChanges ?? true);
    const [lastPublishedAt, setLastPublishedAt] = useState(externalLastPublished ?? null);

    // Published Modal State
    const [showPublishedModal, setShowPublishedModal] = useState(false);

    // Share Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [wedding, setWedding] = useState<Wedding | null>(null);
    const [settings, setSettings] = useState<WeddingSettings | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    // Derive active section from admin path
    const sectionLabel = currentAdminPath ? SECTION_MAP[currentAdminPath] ?? null : null;
    const sectionSlug = sectionLabel && currentAdminPath ? currentAdminPath.replace('/', '') : null;
    const isPinsPage = sectionSlug === 'pins';
    const isRsvpFormPage = sectionSlug === 'rsvp-form';

    // Determine if desktop should use vertical scroll (postMessage) or multi-page (URL navigation)
    const isDesktopVerticalScroll = websiteLayout === 'vertical_scroll' || websiteLayout === 'infinite_scroll';

    // Desktop Vertical Scroll: section navigation via NAVIGATE_TO_SECTION postMessage (VerticalScrollLayout)
    // Desktop Multi-Page / Mobile: navigate iframe to section route (e.g. /preview/slug/faq)
    // Pins: always base URL (pin entry handled via SET_PREVIEW_MODE postMessage)
    // RSVP Form: always shows the RSVP form preview route regardless of viewport
    const iframeSrc = useMemo(() => {
        if (isRsvpFormPage) return `/preview/${weddingSlug}/rsvp-form`;
        if (isPinsPage) return `/preview/${weddingSlug}`;
        // For mobile or desktop multi-page, navigate to section URL directly
        if (sectionSlug && (viewMode === 'mobile' || !isDesktopVerticalScroll)) {
            return `/preview/${weddingSlug}/${sectionSlug}`;
        }
        return `/preview/${weddingSlug}`;
    }, [viewMode, sectionSlug, isPinsPage, isRsvpFormPage, weddingSlug, isDesktopVerticalScroll]);

    // View Site dropdown
    const [viewSiteAnchor, setViewSiteAnchor] = useState<null | HTMLElement>(null);

    // Sync with external props
    useEffect(() => {
        if (externalHasChanges !== undefined) setHasUnpublishedChanges(externalHasChanges);
    }, [externalHasChanges]);
    useEffect(() => {
        if (externalLastPublished !== undefined) setLastPublishedAt(externalLastPublished);
    }, [externalLastPublished]);

    // Listen for CHANGES_SAVED broadcasts to update publish button visibility
    useEffect(() => {
        const channel = new BroadcastChannel('phera-design-sync');
        channel.onmessage = (event) => {
            if (event.data?.type === 'CHANGES_SAVED') {
                setHasUnpublishedChanges(true);
            }
        };
        return () => channel.close();
    }, []);

    const showPublishButton = hasUnpublishedChanges || !lastPublishedAt;

    const handlePublish = async () => {
        if (isViewOnly || !weddingId) return;
        setIsPublishing(true);
        try {
            const success = await weddingService.publishWedding(weddingId);
            if (success) {
                setPublishSuccess(true);
                setHasUnpublishedChanges(false);
                setLastPublishedAt(new Date().toISOString());
                onPublished?.();
                setShowPublishedModal(true);
                setTimeout(() => setPublishSuccess(false), 2500);
            }
        } catch (error) {
            console.error('Error publishing:', error);
        } finally {
            setIsPublishing(false);
        }
    };

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
        if (isViewOnly || !wedding) return;
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

    const liveUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://phera.io'}/${weddingSlug}`;

    const publicUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/${weddingSlug}`
        : `https://phera.app/${weddingSlug}`;

    const previewUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/preview/${weddingSlug}`
        : `https://phera.app/preview/${weddingSlug}`;

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
                // Ignore cross-origin errors
            }
        }
    }, [viewMode]);

    // Send postMessage to iframe when section changes (only for vertical scroll layout — multi-page uses URL navigation)
    useEffect(() => {
        if (sectionSlug && !isPinsPage && isDesktopVerticalScroll && viewMode === 'desktop' && iframeRefLine.current?.contentWindow) {
            try {
                iframeRefLine.current.contentWindow.postMessage(
                    { type: 'NAVIGATE_TO_SECTION', section: sectionSlug },
                    '*'
                );
            } catch (e) { }
        }
    }, [sectionSlug, isPinsPage, isDesktopVerticalScroll, viewMode]);

    // Re-send NAVIGATE_TO_SECTION after preview refreshes (only for vertical scroll layout)
    useEffect(() => {
        const channel = new BroadcastChannel('phera-design-sync');
        channel.onmessage = (event) => {
            if (event.data?.type === 'PREVIEW_REFRESH' && sectionSlug && !isPinsPage && isDesktopVerticalScroll && viewMode === 'desktop') {
                // Delay to allow preview to refetch data and re-render new sections
                setTimeout(() => {
                    if (iframeRefLine.current?.contentWindow) {
                        try {
                            iframeRefLine.current.contentWindow.postMessage(
                                { type: 'NAVIGATE_TO_SECTION', section: sectionSlug },
                                '*'
                            );
                        } catch (e) { }
                    }
                }, 1500);
            }
        };
        return () => channel.close();
    }, [sectionSlug, isPinsPage, isDesktopVerticalScroll, viewMode]);

    // Send preview mode to iframe when pin page status changes
    const handleIframeLoad = useCallback(() => {
        if (iframeRefLine.current?.contentWindow) {
            const mode = isPinsPage ? 'pin_entry' : 'rsvp_submitted';
            iframeRefLine.current.contentWindow.postMessage(
                { type: 'SET_PREVIEW_MODE', mode },
                '*'
            );
        }
    }, [isPinsPage]);

    useEffect(() => {
        if (iframeRefLine.current?.contentWindow) {
            const mode = isPinsPage ? 'pin_entry' : 'rsvp_submitted';
            iframeRefLine.current.contentWindow.postMessage(
                { type: 'SET_PREVIEW_MODE', mode },
                '*'
            );
        }
    }, [isPinsPage]);

    // Track container dimensions
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

    const DESKTOP_WIDTH = 1280;
    const desktopScale = useMemo(() => {
        if (!containerWidth || viewMode !== 'desktop') return 1;
        const frameWidth = containerWidth * 0.94;
        return frameWidth / DESKTOP_WIDTH;
    }, [containerWidth, viewMode]);

    const desktopHeight = useMemo(() => {
        if (!containerWidth) return 0;
        const frameWidth = containerWidth * 0.94;
        return frameWidth / (16 / 10);
    }, [containerWidth]);

    // iPhone aspect ratio (roughly 9:19.5) — fit within available space
    const MOBILE_ASPECT = 19.5 / 12;
    const mobileWidth = useMemo(() => {
        if (!containerHeight || !containerWidth) return 420;
        const maxH = containerHeight * 0.92;
        const maxW = containerWidth * 0.85;
        // Width from fitting height
        const wFromH = maxH / MOBILE_ASPECT;
        // Use the smaller of the two to ensure it fits, but don't go below 340
        return Math.max(Math.min(wFromH, maxW, 420), 360);
    }, [containerHeight, containerWidth]);
    const mobileHeight = mobileWidth * MOBILE_ASPECT;

    return (
        <Box
            data-tour="tour-preview"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#f8f7f5',
            }}
        >
            {/* Toggle Header with Publish Button */}
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
                <motion.div
                    layout
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        justifyContent: showPublishButton ? 'space-between' : 'center',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <motion.div layout>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1.5,
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
                    </motion.div>

                    <AnimatePresence>
                        {showPublishButton && (
                            <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                <Button
                                    variant="contained"
                                    onClick={handlePublish}
                                    disabled={isPublishing || publishSuccess}
                                    startIcon={
                                        isPublishing ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : publishSuccess ? (
                                            <Check sx={{ fontSize: 18 }} />
                                        ) : (
                                            <Publish sx={{ fontSize: 18 }} />
                                        )
                                    }
                                    sx={{
                                        bgcolor: publishSuccess ? '#10B981' : '#DE3F5E',
                                        color: 'white',
                                        borderRadius: '14px',
                                        px: 2.5,
                                        py: 1,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        boxShadow: publishSuccess
                                            ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                                            : '0 4px 12px rgba(222, 63, 94, 0.3)',
                                        '&:hover': {
                                            bgcolor: publishSuccess ? '#059669' : '#c23450',
                                        },
                                        '&.Mui-disabled': {
                                            bgcolor: publishSuccess ? '#10B981' : '#DE3F5E',
                                            color: 'white',
                                            opacity: 0.8,
                                        },
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {isPublishing ? 'Publishing...' : publishSuccess ? 'Published!' : 'Publish'}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </Box>

            <Box
                ref={containerRef}
                sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible',
                    p: 0,
                    position: 'relative',
                }}
            >
                <motion.div
                    animate={{
                        width: viewMode === 'desktop' ? '94%' : mobileWidth,
                        height: viewMode === 'desktop' ? desktopHeight : mobileHeight,
                        borderRadius: viewMode === 'desktop' ? '12px' : '40px',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: viewMode === 'desktop' ? '-80px' : '-15px',
                        backgroundColor: viewMode === 'desktop' ? 'white' : '#ebebeb',
                        boxShadow: viewMode === 'desktop'
                            ? '0 20px 50px rgba(0, 0, 0, 0.15)'
                            : '0 10px 40px rgba(0, 0, 0, 0.25)',
                        border: viewMode === 'desktop'
                            ? '1px solid rgba(0, 0, 0, 0.08)'
                            : '12px solid #ebebeb',
                        position: 'relative',
                    }}
                >
                    {viewMode === 'desktop' ? (
                        <>
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
                            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                <iframe
                                    key={iframeSrc}
                                    ref={iframeRefLine}
                                    src={iframeSrc}
                                    onLoad={handleIframeLoad}
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
                            <Box
                                sx={{
                                    flex: 1,
                                    bgcolor: '#ebebeb',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    mt: -2.2,
                                    position: 'relative',
                                    WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                                }}
                            >
                                <iframe
                                    key={iframeSrc}
                                    ref={iframeRefLine}
                                    src={iframeSrc}
                                    onLoad={handleIframeLoad}
                                    style={{
                                        width: '125%',
                                        height: '125%',
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

            </Box>

            {/* Bottom Bar: View Site, hint text, Share */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    px: 2,
                    gap: 1,
                    flexShrink: 0,
                }}
            >
                <Button
                    variant="text"
                    onClick={(e) => {
                        if (sectionLabel) {
                            setViewSiteAnchor(e.currentTarget);
                        } else {
                            window.open(previewUrl, '_blank');
                        }
                    }}
                    startIcon={<OpenInNew sx={{ fontSize: 20 }} />}
                    sx={{
                        color: '#1a1a1a',
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(8px)',
                        px: 2,
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' },
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    View Site
                </Button>
                <Menu
                    anchorEl={viewSiteAnchor}
                    open={Boolean(viewSiteAnchor)}
                    onClose={() => setViewSiteAnchor(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    slotProps={{ paper: { sx: { borderRadius: '12px', mt: -1 } } }}
                >
                    <MenuItem onClick={() => {
                        const url = sectionSlug === 'pins'
                            ? `${previewUrl}?view=pin_entry`
                            : `${previewUrl}/${sectionSlug}`;
                        window.open(url, '_blank');
                        setViewSiteAnchor(null);
                    }}>
                        {sectionLabel}
                    </MenuItem>
                    <MenuItem onClick={() => { window.open(previewUrl, '_blank'); setViewSiteAnchor(null); }}>
                        Home
                    </MenuItem>
                </Menu>
                <Typography
                    variant="caption"
                    sx={{
                        color: '#9a9a9a',
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        flexShrink: 1,
                        minWidth: 0,
                    }}
                >
                    To see the exact version your guests will see, click &quot;View Site&quot;.
                </Typography>
                <Button
                    variant="text"
                    onClick={handleShareClick}
                    startIcon={<IosShare sx={{ fontSize: 20 }} />}
                    sx={{
                        color: '#1a1a1a',
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(8px)',
                        px: 2,
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' },
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    Share
                </Button>
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
                                            color: '#DE3F5E',
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
                                            color: '#DE3F5E',
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
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
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

            {/* Published Modal */}
            <Dialog
                open={showPublishedModal}
                onClose={() => setShowPublishedModal(false)}
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
                        onClick={() => setShowPublishedModal(false)}
                        sx={{ position: 'absolute', right: 16, top: 16, color: '#666' }}
                    >
                        <Close />
                    </IconButton>

                    <Stack spacing={3} sx={{ mt: 2, pb: 2, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{
                            fontWeight: 700,
                            color: '#1a1a1a',
                            fontSize: { xs: '1.75rem', md: '2.5rem' }
                        }}>
                            Your website is published!
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
                            Start sharing this with your friends and family — we&apos;ll collect your RSVPs.
                        </Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            value={liveUrl}
                            InputProps={{
                                readOnly: true,
                                sx: {
                                    borderRadius: '12px',
                                    bgcolor: '#f8f9fa',
                                    '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                                    color: '#666',
                                }
                            }}
                        />
                        <Stack direction="row" spacing={3} justifyContent="center">
                            <Button
                                startIcon={copiedStates['published-url'] ? <Check sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
                                onClick={() => copyToClipboard(liveUrl, 'published-url')}
                                sx={{
                                    textTransform: 'none',
                                    color: '#DE3F5E',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                }}
                            >
                                {copiedStates['published-url'] ? 'Copied!' : 'Copy Link'}
                            </Button>
                            <Button
                                startIcon={<OpenInNew sx={{ fontSize: 18 }} />}
                                href={liveUrl}
                                target="_blank"
                                sx={{
                                    textTransform: 'none',
                                    color: '#DE3F5E',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                }}
                            >
                                Open in New Tab
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
