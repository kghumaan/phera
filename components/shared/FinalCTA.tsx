'use client';

import { Box, Container, Typography, Stack, Paper } from '@mui/material';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS, FONTS } from '@/lib/theme/tokens';

export default function FinalCTA() {
    return (
        <Container maxWidth="lg" sx={{ pb: { xs: 3, md: 10 }, pt: 6 }}>
            <Paper
                sx={{
                    p: { xs: 3, md: 8 },
                    borderRadius: { xs: '24px', md: '40px' },
                    background: 'linear-gradient(135deg, rgba(222, 63, 94, 0.05) 0%, rgba(255, 142, 83, 0.05) 100%)',
                    border: '1px solid rgba(222, 63, 94, 0.1)',
                    color: COLORS.text.strong,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography
                        variant="h2"
                        sx={{ fontFamily: FONTS.display, fontStyle: 'italic', mb: { xs: 2, md: 3 }, color: COLORS.text.strong, fontSize: { xs: '2.5rem', md: '3rem' }, lineHeight: 1.15 }}
                    >
                        We built this because we lived it.
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: { xs: 2, md: 3 },
                            color: COLORS.text.muted,
                            maxWidth: '640px',
                            mx: 'auto',
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            lineHeight: 1.5,
                        }}
                    >
                        Phera started while we were planning our own wedding — chasing 300 guests, drowning in spreadsheets, fielding 4 a.m. WhatsApps. We wanted a tool that took the stress out and made the months before the wedding feel as good as the day itself.
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: { xs: 3, md: 5 },
                            color: COLORS.text.muted,
                            maxWidth: '640px',
                            mx: 'auto',
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            lineHeight: 1.5,
                        }}
                    >
                        If there&apos;s something you need and we don&apos;t have it yet, just reach out. We&apos;ll build it.
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{ justifyContent: 'center' }}
                    >
                        <ActionButton
                            href="/auth/login"
                            variant="contained"
                            size="large"
                            keepBackgroundOnLoad
                            sx={{
                                bgcolor: COLORS.brand.primary,
                                color: COLORS.text.inverse,
                                px: { xs: 3, md: 5 },
                                py: { xs: 1, md: 1.5 },
                                borderRadius: '32px',
                                fontSize: { xs: '0.85rem', md: '1.1rem' },
                                fontWeight: 'bold',
                                textTransform: 'none',
                                '&:hover': { bgcolor: COLORS.brand.primaryHover },
                            }}
                        >
                            Get Started for Free
                        </ActionButton>
                        <ActionButton
                            href="/contact"
                            variant="outlined"
                            size="large"
                            keepBackgroundOnLoad
                            sx={{
                                borderColor: COLORS.brand.primary,
                                color: COLORS.brand.primary,
                                px: { xs: 3, md: 5 },
                                py: { xs: 1, md: 1.5 },
                                borderRadius: '32px',
                                fontSize: { xs: '0.85rem', md: '1.1rem' },
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: COLORS.brand.primaryHover,
                                    bgcolor: 'rgba(222, 63, 94, 0.05)',
                                },
                            }}
                        >
                            Contact Us
                        </ActionButton>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
}
