import { Box, Typography, Stack } from '@mui/material';
import { ReactNode } from 'react';

interface MobilePreviewFrameProps {
  title: string;
  backgroundImage?: string;
  children: ReactNode;
  overlay?: ReactNode; // Optional overlay content (e.g., navigation controls)
  onBackClick?: () => void; // Optional back button handler
}

/**
 * Reusable mobile phone preview frame for admin onboarding pages
 * Provides consistent phone mockup with header and customizable content area
 */
export default function MobilePreviewFrame({
  title,
  backgroundImage = '/images/backgrounds/lavendar.png',
  children,
  overlay,
  onBackClick
}: MobilePreviewFrameProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, lg: 0 },
        width: '100%',
      }}
    >
      {/* Phone Frame */}
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: 375, lg: 520 },
          mx: 'auto',
          aspectRatio: '375/667',
          backgroundColor: '#000',
          borderRadius: '40px',
          padding: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}
      >
        {/* Phone Content Area with Background */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            ...(backgroundImage.startsWith('#') || backgroundImage.startsWith('linear-gradient') || backgroundImage.startsWith('radial-gradient')
              ? { background: backgroundImage }
              : {
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }),
            borderRadius: '28px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box sx={{ pt: 1.5, pb: 1, px: 2, flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              {/* Back Button */}
              <Box
                onClick={onBackClick}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: onBackClick ? 'pointer' : 'default',
                  '&:hover': onBackClick ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  } : {},
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Box>

              {/* Title - Hidden for "Preview" */}
              {title !== 'Preview' && (
                <Typography
                  sx={{
                    fontFamily: 'Outfit',
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: 1.5,
                    letterSpacing: '5.56%',
                    textTransform: 'uppercase',
                    color: '#141414',
                  }}
                >
                  {title}
                </Typography>
              )}
              {title === 'Preview' && <Box sx={{ width: 28 }} />}

              {/* WhatsApp Button */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                </svg>
              </Box>
            </Stack>
          </Box>

          {/* Content Area - Passed as children */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
            {children}
          </Box>
        </Box>

        {/* Optional Overlay Content (e.g., navigation controls) */}
        {overlay}
      </Box>

      {/* Preview Note */}
      <Typography
        variant="caption"
        sx={{
          mt: 2,
          textAlign: 'center',
          color: '#6a6a6a',
          fontSize: '0.75rem',
          fontStyle: 'italic',
        }}
      >
        Quick preview of the published version. Final appearance may vary.
      </Typography>
    </Box>
  );
}
