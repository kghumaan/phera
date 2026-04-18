'use client';

import {
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { PheraDialog } from '@/components/shared/Dialog';
import { Close as CloseIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import StreamlineIcon from '@/components/ui/StreamlineIcon';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface WhatsAppChannelModalProps {
  open: boolean;
  onClose: () => void;
}

const WhatsAppChannelModal = ({ open, onClose }: WhatsAppChannelModalProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  // Detect platform
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios');
      } else if (/android/.test(userAgent)) {
        setPlatform('android');
      } else {
        setPlatform('desktop');
      }
    }
  }, []);

  const handleChannelClick = async () => {
    // Track the click
    if (user) {
      try {
        await fetch('/api/whatsapp/track-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guest_id: user.id,
            source: 'header_button',
          }),
        });
      } catch (error) {
        console.error('Failed to track WhatsApp click:', error);
      }
    }

    // Open WhatsApp community
    const communityUrl = 'https://chat.whatsapp.com/L8x8m5wBBkm1PmAxFDRO6a?mode=ems_wa_t';
    window.open(communityUrl, '_blank');
    onClose();
  };

  const handleAppStoreClick = () => {
    const appStoreUrl = platform === 'ios'
      ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
      : 'https://play.google.com/store/apps/details?id=com.whatsapp';

    window.open(appStoreUrl, '_blank');
  };

  return (
    <PheraDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          m: 2,
          maxHeight: 'calc(100vh - 64px)',
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ p: 4, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Stack spacing={3} alignItems="center">
              {/* WhatsApp Icon */}
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  backgroundColor: COLORS.accent.success,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                }}
              >
                <StreamlineIcon name="whatsapp" size={32} color="white" />
              </Box>

              {/* Title */}
              {/* <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Instrument Serif',
                  fontWeight: 400,
                  fontSize: 28,
                  lineHeight: 1.3,
                  color: '#141414',
                  fontStyle: 'italic',
                }}
              >
                Wedding Updates
              </Typography> */}

              {/* Description */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 300,
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: '#474747',
                  textAlign: 'center',
                  maxWidth: 320,
                }}
              >
                Join our WhatsApp community for wedding updates, transportation details, and more.
              </Typography>

              {/* Benefits */}
              {/* <Stack spacing={1} sx={{ width: '100%', maxWidth: 320 }}>
                {[
                  'Official wedding updates only',
                  'Your number stays private',
                  'No spam or unwanted messages'
                ].map((benefit, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      textAlign: 'left',
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        backgroundColor: COLORS.accent.success,
                        borderRadius: '50%',
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 400,
                        fontSize: 14,
                        color: COLORS.text.subtle,
                      }}
                    >
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Stack> */}

              {/* Desktop: QR Code, Mobile: App Store Button */}
              {!isMobile ? (
                <Stack spacing={2} alignItems="center">
                  {/* QR Code */}
                  <Box
                    sx={{
                      width: 180,
                      height: 180,
                      backgroundColor: COLORS.bg.white,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #e0e0e0',
                      padding: 2,
                    }}
                  >
                    <QRCodeSVG
                      value="https://chat.whatsapp.com/L8x8m5wBBkm1PmAxFDRO6a?mode=ems_wa_t"
                      size={160}
                      level="H"
                      includeMargin={false}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 14,
                      color: COLORS.text.subtle,
                    }}
                  >
                    Scan with phone to join community
                  </Typography>
                </Stack>
              ) : (
                <Button
                  variant="outlined"
                  onClick={handleAppStoreClick}
                  sx={{
                    borderColor: COLORS.text.strong,
                    color: COLORS.text.strong,
                    borderRadius: RADII.md,
                    px: 3,
                    py: 1.5,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    width: '100%',
                    maxWidth: 320,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderColor: COLORS.text.strong,
                    },
                  }}
                >
                  {platform === 'ios' ? 'Download from App Store' : 'Download from Play Store'}
                </Button>
              )}

              {/* Main CTA Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%' }}
              >
                <Button
                  variant="contained"
                  onClick={handleChannelClick}
                  sx={{
                    backgroundColor: COLORS.accent.success,
                    color: COLORS.text.inverse,
                    borderRadius: RADII.lg,
                    px: 4,
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    width: '100%',
                    maxWidth: 320,
                    '&:hover': {
                      backgroundColor: '#1fb855',
                    },
                  }}
                >
                  Join Wedding Channel
                </Button>
              </motion.div>
            </Stack>
          </motion.div>
        </Box>
      </DialogContent>
    </PheraDialog>
  );
};

export default WhatsAppChannelModal;
