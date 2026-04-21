'use client';

import { Box, Typography, Stack, Button, Divider } from '@mui/material';
import {
  Flight,
  StickyNote2,
  Home,
  Luggage,
} from '@mui/icons-material';
import Image from 'next/image';
import type { SvgIconComponent } from '@mui/icons-material';
import { COLORS, RADII } from '@/lib/theme/tokens';

export interface TravelSectionData {
  id: string;
  type: 'travel' | 'flight' | 'travel_note' | 'accommodation' | 'hotel';
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  icon: string | null;
  more_details: string | null;
  address: string | null;
  phone: string | null;
  price_level: number | null;
  visible?: boolean;
}

const ICON_MAP: Record<string, SvgIconComponent> = {
  flight: Flight,
  travel_note: StickyNote2,
  accommodation: Home,
  hotel: Luggage,
};

interface TravelSectionsDisplayProps {
  sections: TravelSectionData[];
  primaryColor?: string;
  onViewDetails?: (section: TravelSectionData) => void;
}

export default function TravelSectionsDisplay({
  sections,
  primaryColor = COLORS.brand.primary,
  onViewDetails,
}: TravelSectionsDisplayProps) {
  const visibleSections = sections.filter(s => {
    if (s.visible === false) return false;
    // Only show sections that have some content filled out
    const hasContent = !!(s.content || s.more_details || (s.type === 'hotel' && (s.address || s.phone)));
    return hasContent;
  });

  // Extract header image from the travel-type section
  const travelSection = sections.find(s => s.type === 'travel');
  const headerImageUrl = travelSection?.image_url || null;

  return (
    <Stack spacing={4}>
      {/* Header image — standalone, not tied to any section card */}
      {headerImageUrl && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 280,
            borderRadius: RADII.md,
            overflow: 'hidden',
          }}
        >
          <Image
            src={headerImageUrl}
            alt="Travel"
            fill
            priority
            style={{ objectFit: 'cover' }}
          />
        </Box>
      )}

      {visibleSections.map((section, index) => (
        <Box key={section.id}>
          <TextSection
            section={section}
            primaryColor={primaryColor}
            onViewDetails={onViewDetails}
          />
          {index < visibleSections.length - 1 && (
            <Divider sx={{ mt: 4, borderColor: 'rgba(0,0,0,0.06)' }} />
          )}
        </Box>
      ))}
    </Stack>
  );
}

function TextSection({
  section,
  primaryColor,
  onViewDetails,
}: {
  section: TravelSectionData;
  primaryColor: string;
  onViewDetails?: (section: TravelSectionData) => void;
}) {
  const Icon = ICON_MAP[section.type];
  const hasDetails = !!section.more_details;

  return (
    <Box sx={{ textAlign: 'center' }}>
      {Icon && (
        <Icon
          sx={{
            fontSize: 32,
            color: primaryColor,
            mb: 1,
          }}
        />
      )}

      {section.title && section.visible !== false && (
        <Typography
          variant="subtitleCaps"
          sx={{
            color: COLORS.text.strong,
            mb: 1,
            fontSize: { xs: '0.9rem', sm: '0.95rem' },
          }}
        >
          {section.title}
        </Typography>
      )}

      {section.type === 'hotel' && section.address && (
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 0.5 }}>
          {section.address}
        </Typography>
      )}

      {section.type === 'hotel' && section.phone && (
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 0.5 }}>
          {section.phone}
        </Typography>
      )}

      {section.type === 'hotel' && section.price_level && (
        <Typography variant="body2" sx={{ color: primaryColor, mb: 1 }}>
          {'$'.repeat(section.price_level)}
        </Typography>
      )}

      {section.content && (
        <Typography
          variant="body2"
          sx={{ color: COLORS.text.muted, lineHeight: 1.7, mt: 1, whiteSpace: 'pre-line' }}
        >
          {section.content}
        </Typography>
      )}

      {hasDetails && onViewDetails && (
        <Button
          onClick={() => onViewDetails(section)}
          variant="outlined"
          sx={{
            mt: 2,
            color: primaryColor,
            borderColor: primaryColor,
            textTransform: 'none',
            borderRadius: '32px',
            px: 3,
            fontWeight: 600,
            fontSize: '0.875rem',
            '&:hover': {
              borderColor: primaryColor,
              bgcolor: `${primaryColor}10`,
            },
          }}
        >
          View Details
        </Button>
      )}
    </Box>
  );
}
