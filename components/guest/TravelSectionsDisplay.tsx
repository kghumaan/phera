'use client';

import { Box, Typography, Stack, Button, Divider, Collapse } from '@mui/material';
import {
  Flight,
  StickyNote2,
  Home,
  Luggage,
  ExpandMore,
} from '@mui/icons-material';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { ActionButton } from '@/components/admin/ActionButton';

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
}

export default function TravelSectionsDisplay({
  sections,
  primaryColor = COLORS.brand.primary,
}: TravelSectionsDisplayProps) {
  const visibleSections = sections.filter(s => {
    if (s.visible === false) return false;
    const hasContent = !!(s.content || s.more_details || (s.type === 'hotel' && (s.address || s.phone)));
    return hasContent;
  });

  const travelSection = sections.find(s => s.type === 'travel');
  const headerImageUrl = travelSection?.image_url || null;

  return (
    <Stack spacing={4}>
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
}: {
  section: TravelSectionData;
  primaryColor: string;
}) {
  const Icon = ICON_MAP[section.type];
  const hasDetails = !!section.more_details;
  const [expanded, setExpanded] = useState(false);

  const { bodyHtml, ctaText, ctaUrl } = useMemo(() => {
    if (!section.more_details) return { bodyHtml: '', ctaText: '', ctaUrl: '' };
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
  }, [section.more_details]);

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

      {hasDetails && (
        <>
          <Button
            onClick={() => setExpanded(e => !e)}
            variant="outlined"
            endIcon={
              <ExpandMore
                sx={{
                  transition: 'transform 0.25s ease',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            }
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
            {expanded ? 'Hide Details' : 'View Details'}
          </Button>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                mt: 2.5,
                p: { xs: 2, sm: 2.5 },
                borderRadius: RADII.md,
                bgcolor: 'rgba(0,0,0,0.02)',
                border: '1px solid rgba(0,0,0,0.06)',
                textAlign: 'left',
              }}
            >
              {bodyHtml && (
                <Box
                  sx={{
                    '& p': { margin: '0 0 12px 0', color: COLORS.text.strong, lineHeight: 1.7, fontSize: '0.925rem' },
                    '& p:last-child': { marginBottom: 0 },
                    '& ul, & ol': { paddingLeft: '20px', margin: '0 0 12px 0' },
                    '& ul': { listStyleType: 'disc' },
                    '& ol': { listStyleType: 'decimal' },
                    '& li': { color: COLORS.text.strong, lineHeight: 1.7, fontSize: '0.925rem', mb: 0.5, display: 'list-item' },
                    '& li p': { margin: 0 },
                    '& h3, & h4': { color: COLORS.text.strong, fontWeight: 600, fontSize: '1rem', mt: 1.5, mb: 0.5 },
                    '& h3:first-of-type, & h4:first-of-type': { mt: 0 },
                    '& a': { color: primaryColor, textDecoration: 'underline' },
                    '& strong': { fontWeight: 600, color: COLORS.text.strong },
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
                    spinnerColor={primaryColor}
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
          </Collapse>
        </>
      )}
    </Box>
  );
}
