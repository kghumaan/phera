'use client';

/**
 * WhatsApp preview from the *guest's* perspective. The couple is previewing
 * what their guest will see on their phone, so the incoming message is
 * styled as received (white bubble, left-aligned, triangle pointing left)
 * with the Phera logomark + "Phera" as the sender in the header.
 *
 * Chat background matches the landing-page concierge mockup so look + feel
 * stays consistent across marketing and the admin preview.
 */

import { Box, Stack, Typography, Avatar, Paper } from '@mui/material';
import { ArrowBack, Verified, Check } from '@mui/icons-material';
import { COLORS, FONTS, RADII } from '@/lib/theme/tokens';

// Shared WhatsApp chat-background pattern. Same URL used by
// components/ui/WhatsAppConcierge.tsx on the landing page.
const CHAT_BG_URL =
  'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")';

export interface WhatsAppPreviewProps {
  message: string;
  timestamp?: string;
  /** Compact height so multiple previews can stack inside cards without dominating. */
  dense?: boolean;
}

export function WhatsAppPreview({ message, timestamp = '12:34', dense = false }: WhatsAppPreviewProps) {
  const minHeight = dense ? 340 : 440;

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 360,
        borderRadius: RADII.lg,
        overflow: 'hidden',
        border: `1px solid ${COLORS.border.light}`,
        bgcolor: COLORS.whatsapp.bg,
        backgroundImage: CHAT_BG_URL,
        backgroundSize: 'cover',
        fontFamily: FONTS.body,
        display: 'flex',
        flexDirection: 'column',
        minHeight,
      }}
    >
      {/* WhatsApp dark header — matches landing mockup. */}
      <Box
        sx={{
          bgcolor: COLORS.whatsapp.headerDark,
          color: COLORS.text.inverse,
          px: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        <ArrowBack sx={{ fontSize: 18, color: COLORS.text.inverse }} />
        <Avatar
          src="/Phera Logomark.jpg"
          alt="Phera"
          sx={{ width: 34, height: 34, flexShrink: 0 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography
              variant="body2"
              sx={{ color: COLORS.text.inverse, fontWeight: 600, lineHeight: 1.2 }}
            >
              Phera
            </Typography>
            <Verified sx={{ fontSize: 14, color: COLORS.whatsapp.verifiedBlue }} />
          </Stack>
          <Typography
            variant="caption"
            sx={{ color: COLORS.whatsapp.headerSubtext, display: 'block', lineHeight: 1.1 }}
          >
            online
          </Typography>
        </Box>
      </Box>

      {/* Chat body. Flex column + flex-start justifies bubble to top so the
          composer can grow without the bubble floating awkwardly. */}
      <Stack
        spacing={1}
        sx={{
          flex: 1,
          p: 1.5,
          overflowY: 'auto',
        }}
      >
        {/* Incoming bubble — white, left-aligned, tail on top-left. */}
        <Box
          sx={{
            alignSelf: 'flex-start',
            maxWidth: '88%',
            bgcolor: COLORS.bg.white,
            borderRadius: '0px 12px 12px 12px',
            px: 1.25,
            py: 1,
            position: 'relative',
            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: -8,
              width: 0,
              height: 0,
              borderTop: `12px solid ${COLORS.bg.white}`,
              borderLeft: '12px solid transparent',
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: COLORS.whatsapp.bubbleText,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.45,
            }}
          >
            {message || (
              <span style={{ color: COLORS.text.faint }}>
                Your message preview will appear here.
              </span>
            )}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              mt: 0.5,
              color: COLORS.whatsapp.timestampText,
              gap: 0.5,
            }}
          >
            {timestamp} <Check sx={{ fontSize: 14, color: COLORS.whatsapp.readCheck }} />
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default WhatsAppPreview;
