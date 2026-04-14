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
    /**
     * Render the chat at a tighter size — useful when the component sits inside
     * a small phone mockup so the header avatar, fonts, and bubble padding
     * don't visually dominate the screen.
     */
    dense?: boolean;
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

const WhatsAppConcierge: React.FC<WhatsAppConciergeProps> = ({ sx = {}, messages = defaultMessages, hideNotch = false, dense = false }) => {
    // Sizing tokens — when `dense`, render at the xs (mobile) sizes regardless
    // of viewport so the chrome doesn't overpower a phone-mockup container.
    const D = {
        headerPt: dense ? 5 : { xs: 5, md: 7 },
        headerPb: dense ? 1.25 : { xs: 1.5, md: 2 },
        backIcon: dense ? '1.25rem' : { xs: '1.5rem', md: '2.2rem' },
        avatar: dense ? 32 : { xs: 40, md: 56 },
        nameSize: dense ? '0.95rem' : { xs: '1.1rem', md: '1.4rem' },
        verifiedSize: dense ? '0.95rem' : { xs: '1.1rem', md: '1.4rem' },
        statusSize: dense ? '0.65rem' : { xs: '0.75rem', md: '0.9rem' },
        chatSpacing: dense ? 1 : { xs: 1.5, md: 2 },
        chatPad: dense ? 1.25 : { xs: 1.5, md: 2 },
        bubblePad: dense ? 1 : { xs: 1.25, md: 1.5 },
        bubbleFont: dense ? '0.75rem' : { xs: '0.85rem', md: '1rem' },
        timeFont: dense ? '0.6rem' : { xs: '0.65rem', md: '0.75rem' },
        checkSize: dense ? '0.7rem' : { xs: '0.8rem', md: '1rem' },
        dateFont: dense ? '0.55rem' : { xs: '0.6rem', md: '0.75rem' },
        notchWidth: dense ? '70px' : { xs: '80px', md: '120px' },
        notchHeight: dense ? '18px' : { xs: '20px', md: '28px' },
        notchRadius: dense ? '10px' : { xs: '12px', md: '14px' },
    };

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
                        width: D.notchWidth,
                        height: D.notchHeight,
                        bgcolor: '#1a1a1a',
                        borderBottomLeftRadius: D.notchRadius,
                        borderBottomRightRadius: D.notchRadius,
                        zIndex: 20,
                    }}
                />
            )}

            {/* Custom WhatsApp Header */}
            <Box
                sx={{
                    bgcolor: '#202C33',
                    color: 'primary.contrastText',
                    pt: D.headerPt,
                    pb: D.headerPb,
                    px: dense ? 1.25 : 2,
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    zIndex: 10,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={0} sx={{ mr: dense ? 1 : 1.5, color: 'white' }}>
                    <ArrowBack sx={{ fontSize: D.backIcon }} />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={dense ? 1 : { xs: 1.5, md: 2 }} sx={{ flexGrow: 1 }}>
                    <Avatar src="/Phera Logomark.jpg" sx={{ width: D.avatar, height: D.avatar }} />
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 600,
                                    color: 'white',
                                    lineHeight: 1.2,
                                    fontSize: D.nameSize,
                                }}
                            >
                                Phera
                            </Typography>
                            <Verified sx={{ fontSize: D.verifiedSize, color: '#2979FF' }} />
                        </Stack>
                        <Typography
                            variant="caption"
                            sx={{ color: '#8696a0', fontSize: D.statusSize }}
                        >
                            online
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Chat Area */}
            <Stack spacing={D.chatSpacing} sx={{ p: D.chatPad, flexGrow: 1, overflowY: 'auto' }}>
                {/* Date Separator */}
                <Box
                    sx={{
                        alignSelf: 'center',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        px: dense ? 0.75 : { xs: 1, md: 1.5 },
                        py: 0.5,
                        borderRadius: '8px',
                        mb: dense ? 0.75 : { xs: 1, md: 2 },
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#54656F',
                            fontWeight: 500,
                            bgcolor: '#FFF',
                            px: dense ? 0.6 : { xs: 0.75, md: 1 },
                            py: 0.5,
                            borderRadius: '8px',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.1)',
                            fontSize: D.dateFont,
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
                            p: D.bubblePad,
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
                                [msg.type === 'guest' ? 'right' : 'left']: dense ? -6 : -8,
                                width: 0,
                                height: 0,
                                borderTop: `${dense ? 9 : 12}px solid ${msg.type === 'guest' ? '#E7FFDB' : 'white'}`,
                                [msg.type === 'guest' ? 'borderRight' : 'borderLeft']: `${dense ? 9 : 12}px solid transparent`,
                            }}
                        />

                        <Typography
                            variant="body2"
                            sx={{ color: '#111b21', fontSize: D.bubbleFont, lineHeight: 1.4 }}
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
                                fontSize: D.timeFont,
                                gap: 0.5,
                                textAlign: msg.type === 'guest' ? 'right' : 'left'
                            }}
                        >
                            {msg.time} {msg.hasCheck && <Check sx={{ fontSize: D.checkSize, color: '#53bdeb' }} />}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
};

export default WhatsAppConcierge;
