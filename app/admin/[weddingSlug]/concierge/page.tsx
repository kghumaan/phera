'use client';

import { Box, Typography, Container, Stack } from '@mui/material';
import { use } from 'react';

export default function ConciergePage({ params }: { params: Promise<{ weddingSlug: string }> }) {
    const { weddingSlug } = use(params);

    return (
        <Container maxWidth="xl">
            <Stack spacing={4}>
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
                        Phera Concierge
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#4a4a4a', fontSize: '1.1rem' }}>
                        Personalized WhatsApp assistance for your wedding guests.
                    </Typography>
                </Box>

                <Box
                    sx={{
                        p: 8,
                        border: '2px dashed rgba(0, 0, 0, 0.1)',
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                    }}
                >
                    <Typography sx={{ color: '#6a6a6a', fontStyle: 'italic' }}>
                        This screen is currently blank. Content coming soon.
                    </Typography>
                </Box>
            </Stack>
        </Container>
    );
}
