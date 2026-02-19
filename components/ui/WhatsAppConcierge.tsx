'use client';

import React from 'react';
import { Box, Paper, Stack, Avatar, Typography, alpha } from '@mui/material';
import { ArrowBack, Verified, Check } from '@mui/icons-material';

interface WhatsAppConciergeProps {
    sx?: any;
}

const WhatsAppConcierge: React.FC<WhatsAppConciergeProps> = ({ sx = {} }) => {
    return (
        <Paper
            elevation={20}
            sx={{
                p: 0,
                borderRadius: { xs: '24px', md: '48px' },
                bgcolor: '#EFE7DE', // WhatsApp chat bg
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                backgroundSize: 'cover',
                display: 'flex',
                flexDirection: 'column',
                ...sx,
            }}
        >
            {/* Dynamic Island / Notch */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: { xs: '80px', md: '120px' },
                    height: { xs: '20px', md: '28px' },
                    bgcolor: '#1a1a1a',
                    borderBottomLeftRadius: { xs: '12px', md: '14px' },
                    borderBottomRightRadius: { xs: '12px', md: '14px' },
                    zIndex: 20,
                }}
            />

            {/* Custom WhatsApp Header */}
            <Box
                sx={{
                    bgcolor: '#202C33', // Dark header
                    color: 'primary.contrastText',
                    pt: { xs: 5, md: 7 }, // Increased space for notch
                    pb: { xs: 1.5, md: 2 },
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    zIndex: 10,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={0} sx={{ mr: 1.5, color: 'white' }}>
                    <ArrowBack sx={{ fontSize: { xs: '1.5rem', md: '2.2rem' } }} />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, md: 2 }} sx={{ flexGrow: 1 }}>
                    <Avatar src="/Phera Logomark.jpg" sx={{ width: { xs: 40, md: 56 }, height: { xs: 40, md: 56 } }} />
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 600,
                                    color: 'white',
                                    lineHeight: 1.2,
                                    fontSize: { xs: '1.1rem', md: '1.4rem' },
                                }}
                            >
                                Phera
                            </Typography>
                            <Verified sx={{ fontSize: { xs: '1.1rem', md: '1.4rem' }, color: '#2979FF' }} />
                        </Stack>
                        <Typography
                            variant="caption"
                            sx={{ color: '#8696a0', fontSize: { xs: '0.75rem', md: '0.9rem' } }}
                        >
                            online
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Chat Area */}
            <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ p: { xs: 1.5, md: 2 }, flexGrow: 1, overflowY: 'auto' }}>
                {/* Date Separator */}
                <Box
                    sx={{
                        alignSelf: 'center',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        px: { xs: 1, md: 1.5 },
                        py: 0.5,
                        borderRadius: '8px',
                        mb: { xs: 1, md: 2 },
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#54656F',
                            fontWeight: 500,
                            bgcolor: '#FFF',
                            px: { xs: 0.75, md: 1 },
                            py: 0.5,
                            borderRadius: '8px',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.1)',
                            fontSize: { xs: '0.6rem', md: '0.75rem' },
                        }}
                    >
                        Today
                    </Typography>
                </Box>

                {/* Chat Bubble Guest (Right/Green) */}
                <Box
                    sx={{
                        alignSelf: 'flex-end',
                        bgcolor: '#E7FFDB',
                        p: { xs: 1.5, md: 2 },
                        borderRadius: '12px 0px 12px 12px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                        position: 'relative',
                    }}
                >
                    {/* Triangle */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: -8,
                            width: 0,
                            height: 0,
                            borderTop: '12px solid #E7FFDB',
                            borderRight: '12px solid transparent',
                        }}
                    />

                    <Typography
                        variant="body2"
                        sx={{ color: '#111b21', fontSize: { xs: '0.95rem', md: '1.2rem' }, lineHeight: 1.4 }}
                    >
                        Hey! Any good Italian spots around here for dinner?
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, color: '#667781', fontSize: { xs: '0.7rem', md: '0.85rem' }, gap: 0.5 }}
                    >
                        12:15 PM <Check sx={{ fontSize: { xs: '0.9rem', md: '1.2rem' }, color: '#53bdeb' }} />
                    </Typography>
                </Box>

                {/* Chat Bubble Bot (Left/White) */}
                <Box
                    sx={{
                        alignSelf: 'flex-start',
                        bgcolor: 'white',
                        p: { xs: 1.5, md: 2 },
                        borderRadius: '0px 12px 12px 12px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                        position: 'relative',
                    }}
                >
                    {/* Triangle */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: -8,
                            width: 0,
                            height: 0,
                            borderTop: '12px solid white',
                            borderLeft: '12px solid transparent',
                        }}
                    />

                    <Typography
                        variant="body2"
                        sx={{ color: '#111b21', fontSize: { xs: '0.95rem', md: '1.2rem' }, lineHeight: 1.4 }}
                    >
                        In Jaipur? Absolutely! Check out <strong>Bar Palladio</strong>—it's stunning and has great gnocchi. Or for something cozy, <strong>Caffe Palladio</strong> has a great garden vibe! 🌿
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ display: 'block', mt: 0.5, color: '#667781', textAlign: 'right', fontSize: { xs: '0.7rem', md: '0.85rem' } }}
                    >
                        12:16 PM
                    </Typography>
                </Box>

                {/* Chat Bubble Guest (Right/Green) */}
                <Box
                    sx={{
                        alignSelf: 'flex-end',
                        bgcolor: '#E7FFDB',
                        p: { xs: 1.5, md: 2 },
                        borderRadius: '12px 0px 12px 12px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                        position: 'relative',
                    }}
                >
                    {/* Triangle */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: -8,
                            width: 0,
                            height: 0,
                            borderTop: '12px solid #E7FFDB',
                            borderRight: '12px solid transparent',
                        }}
                    />

                    <Typography
                        variant="body2"
                        sx={{ color: '#111b21', fontSize: { xs: '0.95rem', md: '1.2rem' }, lineHeight: 1.4 }}
                    >
                        Perfect. Also, I need to buy another pair of Indian traditional shoes. Can you recommend a shop?
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, color: '#667781', fontSize: { xs: '0.7rem', md: '0.85rem' }, gap: 0.5 }}
                    >
                        12:18 PM <Check sx={{ fontSize: { xs: '0.9rem', md: '1.2rem' }, color: '#53bdeb' }} />
                    </Typography>
                </Box>

                {/* Chat Bubble Bot (Left/White) */}
                <Box
                    sx={{
                        alignSelf: 'flex-start',
                        bgcolor: 'white',
                        p: { xs: 1.5, md: 2 },
                        borderRadius: '0px 12px 12px 12px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                        position: 'relative',
                    }}
                >
                    {/* Triangle */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: -8,
                            width: 0,
                            height: 0,
                            borderTop: '12px solid white',
                            borderLeft: '12px solid transparent',
                        }}
                    />

                    <Typography
                        variant="body2"
                        sx={{ color: '#111b21', fontSize: { xs: '0.95rem', md: '1.2rem' }, lineHeight: 1.4 }}
                    >
                        You're in the right city! Head to <strong>Mojari</strong> or just wander through <strong>Johri Bazaar</strong>. They have hundreds of beautiful hand-stitched pairs! ✨
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ display: 'block', mt: 0.5, color: '#667781', textAlign: 'right', fontSize: { xs: '0.7rem', md: '0.85rem' } }}
                    >
                        12:19 PM
                    </Typography>
                </Box>

                {/* Chat Bubble Guest (Right/Green) */}
                <Box
                    sx={{
                        alignSelf: 'flex-end',
                        bgcolor: '#E7FFDB',
                        p: { xs: 1.5, md: 2 },
                        borderRadius: '12px 0px 12px 12px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                        position: 'relative',
                    }}
                >
                    {/* Triangle */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: -8,
                            width: 0,
                            height: 0,
                            borderTop: '12px solid #E7FFDB',
                            borderRight: '12px solid transparent',
                        }}
                    />

                    <Typography
                        variant="body2"
                        sx={{ color: '#111b21', fontSize: { xs: '0.95rem', md: '1.2rem' }, lineHeight: 1.4 }}
                    >
                        Got it. Remind me, which day is the actual wedding ceremony? Saturday or Sunday?
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, color: '#667781', fontSize: { xs: '0.7rem', md: '0.85rem' }, gap: 0.5 }}
                    >
                        12:22 PM <Check sx={{ fontSize: { xs: '0.9rem', md: '1.2rem' }, color: '#53bdeb' }} />
                    </Typography>
                </Box>

                {/* Chat Bubble Bot (Left/White) */}
                <Box
                    sx={{
                        alignSelf: 'flex-start',
                        bgcolor: 'white',
                        p: { xs: 1.5, md: 2 },
                        borderRadius: '0px 12px 12px 12px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                        position: 'relative',
                    }}
                >
                    {/* Triangle */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: -8,
                            width: 0,
                            height: 0,
                            borderTop: '12px solid white',
                            borderLeft: '12px solid transparent',
                        }}
                    />

                    <Typography
                        variant="body2"
                        sx={{ color: '#111b21', fontSize: { xs: '0.95rem', md: '1.2rem' }, lineHeight: 1.4 }}
                    >
                        It's on Saturday—the third and final day! 🌺 Make sure to wear something light and pastel to follow the <strong>Morning Garden</strong> dress code. You're going to look amazing!
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ display: 'block', mt: 0.5, color: '#667781', textAlign: 'right', fontSize: { xs: '0.7rem', md: '0.85rem' } }}
                    >
                        12:23 PM
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
};

export default WhatsAppConcierge;
