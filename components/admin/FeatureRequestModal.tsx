'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    CircularProgress,
    Stack,
    alpha
} from '@mui/material';
import { Close, CheckCircleOutline } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import { useAuth } from '@/lib/contexts/AuthContext';

interface FeatureRequestModalProps {
    open: boolean;
    onClose: () => void;
    weddingId?: string;
    variant?: 'feature' | 'custom';
}

const COPY = {
    feature: {
        title: "Want a feature you don't see?",
        description: "We're a new product that's always looking for feedback! Feel free to request anything that you would like to see, and we'll get back to you ASAP!",
        placeholder: "Tell us what you're thinking...",
        success: "We've received your request and will look into it ASAP.",
    },
    custom: {
        title: 'Want something custom?',
        description: "Are there elements in your wedding branding that you want to include? Anything custom we can help with? Reach out to us and we'll happily add it for you.",
        placeholder: 'Any requests?',
        success: "We're excited to make something special for you. We'll be in touch soon!",
    },
};

export default function FeatureRequestModal({ open, onClose, weddingId, variant = 'feature' }: FeatureRequestModalProps) {
    const copy = COPY[variant];
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim() || !user) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/feature-request/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    weddingId: weddingId,
                    content: content,
                    userEmail: user.email
                }),
            });

            const result = await response.json();
            if (response.ok) {
                setIsSubmitted(true);
            } else {
                console.error('Error submitting feedback:', result.error || result.details);
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setContent('');
        setIsSubmitted(false);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    p: { xs: 1, md: 2 },
                    bgcolor: 'white',
                    overflow: 'visible'
                }
            }}
        >
            <IconButton
                onClick={handleClose}
                sx={{
                    position: 'absolute',
                    right: 16,
                    top: 16,
                    color: '#666',
                    bgcolor: 'rgba(0,0,0,0.03)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' }
                }}
            >
                <Close />
            </IconButton>

            <DialogContent>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    {!isSubmitted ? (
                        <Stack spacing={4} alignItems="center">
                            <Box>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 800,
                                        color: '#1a1a1a',
                                        mb: 1.5,
                                        fontSize: { xs: '1.75rem', md: '2.25rem' }
                                    }}
                                >
                                    {copy.title}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: '#666',
                                        fontSize: '1.05rem',
                                        lineHeight: 1.6,
                                        maxWidth: '450px',
                                        mx: 'auto'
                                    }}
                                >
                                    {copy.description}
                                </Typography>
                            </Box>

                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder={copy.placeholder}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={isSubmitting}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                        bgcolor: '#f8f9fa',
                                        fontSize: '1.1rem',
                                        color: '#1a1a1a',
                                        '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                        '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.12)' },
                                        '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
                                    },
                                    '& ::placeholder': {
                                        color: '#666',
                                        opacity: 1,
                                    }
                                }}
                            />

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleSubmit}
                                disabled={isSubmitting || !content.trim()}
                                sx={{
                                    bgcolor: '#DE3F5E',
                                    color: 'white',
                                    borderRadius: '100px',
                                    py: 2,
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    textTransform: 'none',
                                    boxShadow: '0 8px 16px rgba(222, 63, 94, 0.2)',
                                    '&:hover': {
                                        bgcolor: '#c23450',
                                        boxShadow: '0 10px 20px rgba(222, 63, 94, 0.3)',
                                    },
                                    '&.Mui-disabled': { bgcolor: '#f0f0f0', color: '#999' }
                                }}
                            >
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Request'}
                            </Button>
                        </Stack>
                    ) : (
                        <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    bgcolor: alpha('#28c840', 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 1
                                }}
                            >
                                <CheckCircleOutline sx={{ fontSize: 48, color: '#28c840' }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                                    Thank you!
                                </Typography>
                                <Typography sx={{ color: '#666' }}>
                                    {copy.success}
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                onClick={handleClose}
                                sx={{
                                    borderRadius: '100px',
                                    px: 4,
                                    py: 1.5,
                                    mt: 2,
                                    color: '#1a1a1a',
                                    borderColor: 'rgba(0,0,0,0.1)',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': {
                                        borderColor: 'rgba(0,0,0,0.2)',
                                        bgcolor: 'rgba(0,0,0,0.02)'
                                    }
                                }}
                            >
                                Close
                            </Button>
                        </Stack>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
}
