'use client';

import { useState, useEffect, use } from 'react';
import {
    Box,
    Typography,
    Container,
    Stack,
    TextField,
    Button,
    Switch,
    CircularProgress,
    IconButton,
} from '@mui/material';
import {
    ContentCopy,
    OpenInNew,
    Check,
    IosShare,
} from '@mui/icons-material';
import { weddingService, Wedding, WeddingSettings } from '@/lib/supabase/wedding-service';
import { toast } from 'sonner';

export default function PublishPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
    const { weddingSlug } = use(params);
    const [wedding, setWedding] = useState<Wedding | null>(null);
    const [settings, setSettings] = useState<WeddingSettings | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadData();
    }, [weddingSlug]);

    const loadData = async () => {
        try {
            const w = await weddingService.getWeddingBySlug(weddingSlug);
            setWedding(w);
            if (w) {
                setIsPublished(w.status === 'live');
                const s = await weddingService.getSettings(w.id);
                setSettings(s);
            }
        } catch (error) {
            console.error('Error loading publish data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePublish = async () => {
        if (!wedding) return;
        setIsSaving(true);
        try {
            const updated = await weddingService.updateWedding(wedding.id, {
                status: isPublished ? 'live' : 'draft',
            });
            if (updated) {
                setWedding(updated);
                toast.success(`Website ${isPublished ? 'published' : 'unpublished'} successfully!`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates((prev) => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setCopiedStates((prev) => ({ ...prev, [id]: false }));
        }, 2000);
    };

    const publicUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/${weddingSlug}`
        : `https://phera.app/${weddingSlug}`;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#DE3F5E' }} />
            </Box>
        );
    }

    return (
        <Container maxWidth="md">
            <Stack spacing={4} sx={{ py: 4 }}>
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: 'var(--font-instrument-serif)',
                            fontWeight: 700,
                            mb: 1,
                            color: '#1a1a1a',
                        }}
                    >
                        Publish Website
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#4a4a4a', fontSize: '1.1rem' }}>
                        Control when your guests can see your wedding website.
                    </Typography>
                </Box>

                <Stack spacing={4} sx={{ bgcolor: 'white', p: 4, borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            textAlign: 'center',
                            color: '#1a1a1a',
                            fontSize: { xs: '1.75rem', md: '2.5rem' },
                        }}
                    >
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
                                    color: '#666',
                                },
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
                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
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
                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
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
                            {settings?.pin_codes?.map((pin, index) => (
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
                            {(!settings?.pin_codes || settings.pin_codes.length === 0) && (
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
                                disabled={
                                    isSaving ||
                                    (wedding?.status === 'live' && isPublished) ||
                                    (wedding?.status === 'draft' && !isPublished)
                                }
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
                                    '&.Mui-disabled': { bgcolor: '#f0f0f0', color: '#999' },
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
            </Stack>
        </Container>
    );
}
