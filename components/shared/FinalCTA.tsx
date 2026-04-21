'use client';

import { Box, Container, Typography, Stack, Button, Paper } from '@mui/material';
import Link from 'next/link';
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
                        Your wedding, beautifully handled.
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
                        Hundreds of guests, days of events, people flying in from everywhere — all coordinated over WhatsApp so you can focus on the celebration.
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{ justifyContent: 'center' }}
                    >
                        <Button
                            component={Link}
                            href="/auth/login"
                            variant="contained"
                            size="large"
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
                            Get Started
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
}
