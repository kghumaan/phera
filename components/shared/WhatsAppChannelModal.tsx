'use client';

import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
                  backgroundColor: '#25D366',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                </svg>
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
                variant="body1"
                sx={{
                  fontFamily: 'Outfit',
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
                        backgroundColor: '#25D366',
                        borderRadius: '50%',
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Outfit',
                        fontWeight: 400,
                        fontSize: 14,
                        color: '#666',
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
                  {/* QR Code Placeholder */}
                  <Box
                    sx={{
                      width: 160,
                      height: 160,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Outfit',
                        fontSize: 12,
                        color: '#999',
                        textAlign: 'center',
                      }}
                    >
                      Scan with phone to<br />join community
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'Outfit',
                      fontSize: 12,
                      color: '#666',
                    }}
                  >
                    Or click the button below
                  </Typography>
                </Stack>
              ) : (
                <Button
                  variant="outlined"
                  onClick={handleAppStoreClick}
                  sx={{
                    borderColor: '#000',
                    color: '#000',
                    borderRadius: '12px',
                    px: 3,
                    py: 1.5,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    fontFamily: 'Outfit',
                    width: '100%',
                    maxWidth: 320,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderColor: '#000',
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
                    backgroundColor: '#25D366',
                    color: '#fff',
                    borderRadius: '16px',
                    px: 4,
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontFamily: 'Outfit',
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
    </Dialog>
  );
};

export default WhatsAppChannelModal;
