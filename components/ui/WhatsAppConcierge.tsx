'use client';

import React from 'react';
import { Box, Paper, Stack, Avatar, Typography, alpha } from '@mui/material';
import { ArrowBack, Verified, Check } from '@mui/icons-material';

export interface Message {
    type: 'guest' | 'bot';
    text: React.ReactNode;
    time: string;
    hasCheck?: boolean;
}

export interface WhatsAppConciergeProps {
    sx?: any;
    messages?: Message[];
    hideNotch?: boolean;
}

const defaultMessages: Message[] = [
    {
        type: 'guest',
        text: "Hey! Any good Italian spots around here for dinner?",
        time: "12:15 PM",
        hasCheck: true,
    },
    {
        type: 'bot',
        text: <>In Jaipur? Absolutely! Check out <strong>Bar Palladio</strong>—it's stunning and has great gnocchi. Or for something cozy, <strong>Caffe Palladio</strong> has a great garden vibe! 🌿</>,
        time: "12:16 PM",
    },
    {
        type: 'guest',
        text: "Perfect. Also, I need to buy another pair of Indian traditional shoes. Can you recommend a shop?",
        time: "12:18 PM",
        hasCheck: true,
    },
    {
        type: 'bot',
        text: <>You're in the right city! Head to <strong>Mojari</strong> or just wander through <strong>Johri Bazaar</strong>. They have hundreds of beautiful hand-stitched pairs! ✨</>,
        time: "12:19 PM",
    },
    {
        type: 'guest',
        text: "Got it. Remind me, which day is the actual wedding ceremony? Saturday or Sunday?",
        time: "12:22 PM",
        hasCheck: true,
    },
    {
        type: 'bot',
        text: <>It's on Saturday—the third and final day! 🌺 Make sure to wear something light and pastel to follow the <strong>Morning Garden</strong> dress code. You're going to look amazing!</>,
        time: "12:23 PM",
    }
];

const WhatsAppConcierge: React.FC<WhatsAppConciergeProps> = ({ sx = {}, messages = defaultMessages, hideNotch = false }) => {
    return (
        <Paper
            elevation={20}
            sx={{
                p: 0,
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
            {!hideNotch && (
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
            )}

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

                {messages.map((msg, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            alignSelf: msg.type === 'guest' ? 'flex-end' : 'flex-start',
                            bgcolor: msg.type === 'guest' ? '#E7FFDB' : 'white',
                            p: { xs: 1.25, md: 1.5 },
                            borderRadius: msg.type === 'guest' ? '12px 0px 12px 12px' : '0px 12px 12px 12px',
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
                                [msg.type === 'guest' ? 'right' : 'left']: -8,
                                width: 0,
                                height: 0,
                                borderTop: `12px solid ${msg.type === 'guest' ? '#E7FFDB' : 'white'}`,
                                [msg.type === 'guest' ? 'borderRight' : 'borderLeft']: '12px solid transparent',
                            }}
                        />

                        <Typography
                            variant="body2"
                            sx={{ color: '#111b21', fontSize: { xs: '0.85rem', md: '1rem' }, lineHeight: 1.4 }}
                        >
                            {msg.text}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                mt: 0.5,
                                color: '#667781',
                                fontSize: { xs: '0.65rem', md: '0.75rem' },
                                gap: 0.5,
                                textAlign: msg.type === 'guest' ? 'right' : 'left'
                            }}
                        >
                            {msg.time} {msg.hasCheck && <Check sx={{ fontSize: { xs: '0.8rem', md: '1rem' }, color: '#53bdeb' }} />}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
};

export default WhatsAppConcierge;
