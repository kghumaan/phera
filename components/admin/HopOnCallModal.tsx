'use client';

/**
 * "Hop on a call" modal — sibling to FeatureRequestModal in the admin
 * top nav. The only thing the user types is a phone number; we lift
 * their name + email + account id from the AuthContext and pipe the
 * whole thing through `/api/contact/submit`, the same endpoint the
 * marketing-site contact form uses, so it lands in `contact_submissions`
 * and triggers the same email alert.
 */

import React, { useState } from 'react';
import {
    DialogContent,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Stack,
    alpha,
} from '@mui/material';
import { PheraDialog } from '@/components/shared/Dialog';
import { Close, CheckCircleOutline } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface HopOnCallModalProps {
    open: boolean;
    onClose: () => void;
}

function buildMessage(args: {
    phone: string;
    name?: string | null;
    email?: string | null;
    userId?: string | null;
}): string {
    const lines = ['User is looking to hop on a call. Please reach out.'];
    lines.push(`Phone: ${args.phone}`);
    if (args.name) lines.push(`Name: ${args.name}`);
    if (args.email) lines.push(`Email: ${args.email}`);
    if (args.userId) lines.push(`Account ID: ${args.userId}`);
    return lines.join('\n');
}

export default function HopOnCallModal({ open, onClose }: HopOnCallModalProps) {
    const { user } = useAuth();
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        const trimmed = phone.trim();
        if (!trimmed) return;

        // Bare-minimum sanity: at least 8 digits somewhere in the input.
        // Backend already validates required fields; this keeps the UX
        // honest before round-tripping.
        const digits = trimmed.replace(/\D/g, '');
        if (digits.length < 8) {
            setError('That phone number looks too short.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const fallbackName = user?.email ? user.email.split('@')[0] : 'Phera User';
            const name = user?.name?.trim() || fallbackName;
            const email = user?.email || `${user?.id || 'unknown'}@phera.io`;

            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    phone: trimmed,
                    message: buildMessage({
                        phone: trimmed,
                        name: user?.name,
                        email: user?.email,
                        userId: user?.id,
                    }),
                }),
            });

            const result = await response.json().catch(() => ({}));
            if (response.ok) {
                setIsSubmitted(true);
            } else {
                setError(result?.error || 'Could not send your request — please try again.');
            }
        } catch (err) {
            console.error('HopOnCallModal submit failed:', err);
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setPhone('');
        setIsSubmitted(false);
        setError(null);
        onClose();
    };

    return (
        <PheraDialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { p: { xs: 1, md: 2 }, overflow: 'visible' } }}
        >
            <IconButton
                onClick={handleClose}
                sx={{
                    position: 'absolute',
                    right: 16,
                    top: 16,
                    color: COLORS.text.subtle,
                    bgcolor: 'rgba(0,0,0,0.03)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
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
                                        color: COLORS.text.strong,
                                        mb: 1.5,
                                        fontSize: { xs: '1.75rem', md: '2.25rem' },
                                    }}
                                >
                                    Want to hop on a call?
                                </Typography>
                                <Typography
                                    sx={{
                                        color: COLORS.text.subtle,
                                        fontSize: '1.05rem',
                                        lineHeight: 1.6,
                                        maxWidth: '450px',
                                        mx: 'auto',
                                    }}
                                >
                                    We&apos;d love to talk through anything on your mind — questions, feedback, or just to say hi. Drop your number and we&apos;ll be in touch shortly.
                                </Typography>
                            </Box>

                            <TextField
                                fullWidth
                                placeholder="+1 555 123 4567"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    if (error) setError(null);
                                }}
                                disabled={isSubmitting}
                                type="tel"
                                inputMode="tel"
                                autoFocus
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: RADII.lg,
                                        bgcolor: COLORS.bg.muted,
                                        fontSize: '1.1rem',
                                        color: COLORS.text.strong,
                                        '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                        '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.12)' },
                                        '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
                                    },
                                    '& ::placeholder': {
                                        color: COLORS.text.subtle,
                                        opacity: 1,
                                    },
                                }}
                            />

                            {error && (
                                <Typography sx={{ color: COLORS.accent.dangerText, fontSize: '0.95rem' }}>
                                    {error}
                                </Typography>
                            )}

                            <PrimaryActionButton
                                fullWidth
                                onClick={handleSubmit}
                                loading={isSubmitting}
                                disabled={!phone.trim()}
                                sx={{
                                    borderRadius: '100px',
                                    py: 2,
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    boxShadow: '0 8px 16px rgba(222, 63, 94, 0.2)',
                                    '&:hover': {
                                        bgcolor: COLORS.brand.primaryHover,
                                        boxShadow: '0 10px 20px rgba(222, 63, 94, 0.3)',
                                    },
                                    '&.Mui-disabled': { bgcolor: COLORS.border.faint, color: COLORS.text.faint },
                                }}
                            >
                                Request a call
                            </PrimaryActionButton>
                        </Stack>
                    ) : (
                        <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    bgcolor: alpha(COLORS.accent.success, 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 1,
                                }}
                            >
                                <CheckCircleOutline sx={{ fontSize: 48, color: COLORS.accent.success }} />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.text.strong, mb: 1 }}>
                                    Got it!
                                </Typography>
                                <Typography sx={{ color: COLORS.text.subtle }}>
                                    We&apos;ve got your number — we&apos;ll reach out shortly.
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
                                    color: COLORS.text.strong,
                                    borderColor: 'rgba(0,0,0,0.1)',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': {
                                        borderColor: 'rgba(0,0,0,0.2)',
                                        bgcolor: 'rgba(0,0,0,0.02)',
                                    },
                                }}
                            >
                                Close
                            </Button>
                        </Stack>
                    )}
                </Box>
            </DialogContent>
        </PheraDialog>
    );
}
