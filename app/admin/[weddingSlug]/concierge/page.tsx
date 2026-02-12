'use client';

import { Box, Button, Typography, Container, Stack } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useState, use } from 'react';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';

export default function ConciergePage({ params }: { params: Promise<{ weddingSlug: string }> }) {
    const { weddingSlug } = use(params);
    const { isPro } = usePlan();
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    return (
        <Container maxWidth="xl">
            <Stack spacing={4}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                        Phera Concierge
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                        Personalized WhatsApp assistance for your wedding guests
                    </Typography>
                </Box>

                {!isPro ? (
                    <Box
                        sx={{
                            p: { xs: 4, md: 8 },
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            bgcolor: 'white',
                            gap: 3,
                        }}
                    >
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                bgcolor: '#DE3F5E15',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <LockOutlined sx={{ fontSize: 28, color: '#DE3F5E' }} />
                        </Box>

                        <Box sx={{ maxWidth: 480 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: '#1a1a1a' }}>
                                A personal concierge for every guest
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6a6a6a', lineHeight: 1.7 }}>
                                Phera Concierge provides your guests with a dedicated WhatsApp line for real-time assistance — from directions and transport to event schedules and special requests. Give your guests the VIP experience they deserve.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            onClick={() => setUpgradeModalOpen(true)}
                            sx={{
                                bgcolor: '#DE3F5E',
                                color: 'white',
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                '&:hover': { bgcolor: '#c73552' },
                            }}
                        >
                            Upgrade to Pro
                        </Button>
                    </Box>
                ) : (
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
                )}
            </Stack>

            <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </Container>
    );
}
