'use client';

import React from 'react';
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    Avatar,
    IconButton,
    alpha,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface AdminTopNavProps {
    weddingSlug: string;
    onMenuToggle?: () => void;
}

export default function AdminTopNav({ weddingSlug, onMenuToggle }: AdminTopNavProps) {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: '#ffffff !important',
                color: '#1a1a1a',
                borderBottom: '1px solid',
                borderColor: alpha('#000', 0.08),
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, md: 64 }, px: { xs: 1, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Mobile Menu Toggle */}
                    {isMobile && (
                        <IconButton
                            onClick={onMenuToggle}
                            sx={{
                                color: '#1a1a1a',
                                '&:hover': { bgcolor: alpha('#DE3F5E', 0.05) }
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    {/* Left: Logo */}
                    <Box
                        onClick={() => router.push(`/admin/${weddingSlug}/overview`)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            gap: 1.5,
                            ml: { xs: 0, lg: 1 },
                            '&:hover': { opacity: 0.8 },
                        }}
                    >
                        <Box sx={{ position: 'relative', width: { xs: 80, md: 110 }, height: 34 }}>
                            <Image
                                src="/logo.svg"
                                alt="Phera"
                                fill
                                style={{ objectFit: 'contain', filter: 'brightness(0)' }}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Right: User Avatar */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }}>
                            {user?.email?.split('@')[0] || 'User'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6a6a6a', display: 'block', mt: -0.5, lineHeight: 1 }}>
                            Administrator
                        </Typography>
                    </Box>
                    <Avatar
                        sx={{
                            width: 34,
                            height: 34,
                            bgcolor: '#DE3F5E',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: '2px solid white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                    >
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </Avatar>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
