'use client';

import { Box, Typography, Button, Container, useMediaQuery, useTheme } from '@mui/material';
import { Monitor, Home } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

export default function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const router = useRouter();

    if (isMobile) {
        return (
            <OptimizedBackground useAppDefault={true} className="min-h-screen">
                <Container maxWidth="sm">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100vh',
                            textAlign: 'center',
                            gap: 3,
                            p: 4
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: 'rgba(222, 63, 94, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 1
                            }}
                        >
                            <Monitor sx={{ fontSize: 40, color: '#DE3F5E' }} />
                        </Box>

                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a' }}>
                            Desktop Experience Required
                        </Typography>

                        <Typography sx={{ color: '#666', fontSize: '1.1rem', lineHeight: 1.6 }}>
                            The admin dashboard is optimized for larger screens to provide the best editing experience for your wedding website.
                        </Typography>

                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Home />}
                            onClick={() => router.push('/')}
                            sx={{
                                bgcolor: '#DE3F5E',
                                color: 'white',
                                borderRadius: '32px',
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                boxShadow: '0 4px 12px rgba(222, 63, 94, 0.3)',
                                '&:hover': {
                                    bgcolor: '#C8365A',
                                    boxShadow: '0 6px 16px rgba(222, 63, 94, 0.4)',
                                },
                            }}
                        >
                            Return to Home
                        </Button>
                    </Box>
                </Container>
            </OptimizedBackground>
        );
    }

    return <>{children}</>;
}
