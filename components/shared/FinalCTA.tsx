'use client';

import { Box, Container, Typography, Stack, Button, Chip, Paper } from '@mui/material';
import Link from 'next/link';
import StreamlineIcon from '@/components/ui/StreamlineIcon';

export default function FinalCTA() {
    return (
        <Container maxWidth="lg" sx={{ pb: { xs: 3, md: 10 }, pt: 6 }}>
            <Paper
                sx={{
                    p: { xs: 3, md: 8 },
                    borderRadius: { xs: '24px', md: '40px' },
                    background: 'linear-gradient(135deg, rgba(222, 63, 94, 0.05) 0%, rgba(255, 142, 83, 0.05) 100%)',
                    border: '1px solid rgba(222, 63, 94, 0.1)',
                    color: '#1a1a1a',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography
                        variant="h2"
                        sx={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', mb: { xs: 2, md: 3 }, color: '#1a1a1a', fontSize: { xs: '1.5rem', md: '2.5rem' } }}
                    >
                        300 guests. 3 days. Zero stress.
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: { xs: 3, md: 5 },
                            color: '#4a4a4a',
                            maxWidth: '600px',
                            mx: 'auto',
                            fontSize: { xs: '0.8rem', md: '1.25rem' }
                        }}
                    >
                        Let Phera coordinate your guests while you celebrate.
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
                                bgcolor: '#DE3F5E',
                                color: 'white',
                                px: { xs: 3, md: 5 },
                                py: { xs: 1, md: 1.5 },
                                borderRadius: '32px',
                                fontSize: { xs: '0.85rem', md: '1.1rem' },
                                fontWeight: 'bold',
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#C8365A' },
                            }}
                        >
                            Get Started
                        </Button>
                    </Stack>
                    <Stack
                        direction="row"
                        spacing={3}
                        sx={{ justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}
                    >
                        <Chip
                            icon={<StreamlineIcon name="check-circle" sx={{ color: '#DE3F5E !important', width: 24, height: 24 }} />}
                            label="Less than a single shuttle bus rental"
                            sx={{
                                bgcolor: 'transparent',
                                color: '#4a4a4a',
                                border: 'none',
                                fontWeight: 500,
                                fontSize: '1.1rem',
                            }}
                        />
                        <Chip
                            icon={<StreamlineIcon name="check-circle" sx={{ color: '#DE3F5E !important', width: 24, height: 24 }} />}
                            label="DPDPA compliant"
                            sx={{
                                bgcolor: 'transparent',
                                color: '#4a4a4a',
                                border: 'none',
                                fontWeight: 500,
                                fontSize: '1.1rem',
                            }}
                        />
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
}
