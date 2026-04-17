'use client';

import {
  Drawer,
  Modal,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useMemo } from 'react';
import type { TravelSectionData } from './TravelSectionsDisplay';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface TravelDetailPanelProps {
  section: TravelSectionData | null;
  open: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export default function TravelDetailPanel({
  section,
  open,
  onClose,
  primaryColor = COLORS.brand.primary,
}: TravelDetailPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Parse CTA from more_details
  const { bodyHtml, ctaText, ctaUrl } = useMemo(() => {
    if (!section?.more_details) return { bodyHtml: '', ctaText: '', ctaUrl: '' };
    const ctaRegex = /<div class="phera-cta" data-text="([^"]*)" data-url="([^"]*)"><\/div>/;
    const match = section.more_details.match(ctaRegex);
    if (match) {
      return {
        bodyHtml: section.more_details.replace(ctaRegex, '').trim(),
        ctaText: match[1].replace(/&quot;/g, '"'),
        ctaUrl: match[2].replace(/&quot;/g, '"'),
      };
    }
    return { bodyHtml: section.more_details, ctaText: '', ctaUrl: '' };
  }, [section?.more_details]);

  if (!section) return null;

  const content = (
    <Box
      sx={{
        width: isMobile ? '100%' : 400,
        maxWidth: '100vw',
        height: '100%',
        bgcolor: COLORS.bg.white,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
          {section.title}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: COLORS.text.subtle }}>
          <Close />
        </IconButton>
      </Box>

      {/* Body */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2.5,
        }}
      >
        {section.type === 'hotel' && (section.address || section.phone) && (
          <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            {section.address && (
              <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 0.5 }}>
                {section.address}
              </Typography>
            )}
            {section.phone && (
              <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                {section.phone}
              </Typography>
            )}
            {section.price_level && (
              <Typography variant="body2" sx={{ color: primaryColor, mt: 0.5 }}>
                {'$'.repeat(section.price_level)}
              </Typography>
            )}
          </Box>
        )}

        {bodyHtml && (
          <Box
            sx={{
              '& p': { margin: '0 0 12px 0', color: COLORS.text.strong, lineHeight: 1.7, fontSize: '0.925rem' },
              '& ul': { paddingLeft: '20px', margin: '0 0 12px 0', listStyleType: 'disc' },
              '& li': { color: COLORS.text.strong, lineHeight: 1.7, fontSize: '0.925rem', mb: 0.5, display: 'list-item' },
              '& li p': { margin: 0 },
              '& a': { color: primaryColor, textDecoration: 'underline' },
              '& strong': { fontWeight: 600 },
            }}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        )}

        {ctaText && ctaUrl && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <ActionButton
              onClick={() => {
                window.open(ctaUrl, '_blank', 'noopener,noreferrer');
              }}
              variant="contained"
              sx={{
                bgcolor: primaryColor,
                color: COLORS.text.inverse,
                borderRadius: '32px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1,
                fontSize: '0.9rem',
                '&:hover': { bgcolor: primaryColor, opacity: 0.9 },
              }}
            >
              {ctaText}
            </ActionButton>
          </Box>
        )}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Box
          sx={{
            bgcolor: COLORS.bg.white,
            borderRadius: RADII.lg,
            maxHeight: '80vh',
            width: '100%',
            maxWidth: 500,
            overflow: 'hidden',
          }}
        >
          {content}
        </Box>
      </Modal>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{
        BackdropProps: {
          sx: { backgroundColor: 'rgba(0,0,0,0.3)' },
        },
      }}
      PaperProps={{
        sx: {
          width: 400,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        },
      }}
    >
      {content}
    </Drawer>
  );
}
