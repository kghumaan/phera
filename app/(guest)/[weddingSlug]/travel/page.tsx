'use client';

import {
  Box,
  Container,
  Typography,
  IconButton,
  Stack,
  Modal,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { ArrowBack, Close } from '@mui/icons-material';
import { useWedding } from '@/lib/contexts/WeddingContext';
import { useState, useEffect } from 'react';
import { weddingService } from '@/lib/supabase/wedding-service';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import TravelSectionsDisplay, { TravelSectionData } from '@/components/guest/TravelSectionsDisplay';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { COLORS, RADII } from '@/lib/theme/tokens';

export default function TravelPage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { wedding } = useWedding();
  const primaryColor = wedding?.primary_color || COLORS.brand.primary;

  const [sections, setSections] = useState<TravelSectionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail modal state
  const [detailSection, setDetailSection] = useState<TravelSectionData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!wedding?.id) return;
      try {
        const data = await weddingService.getTravelSections(wedding.id);
        if (data.length > 0) {
          setSections(data as TravelSectionData[]);
        } else {
          // Fall back to legacy travel cards — convert to section-like format
          const cards = await weddingService.getTravelCards(wedding.id);
          if (cards.length > 0) {
            const converted: TravelSectionData[] = cards.map((card: any, i: number) => ({
              id: card.id,
              type: 'travel' as const,
              title: card.title,
              subtitle: null,
              content: Array.isArray(card.content)
                ? card.content.map((p: any) => typeof p === 'string' ? p : p?.p ?? '').join('\n\n')
                : card.content,
              image_url: card.image_url,
              icon: null,
              more_details: null,
              address: null,
              phone: null,
              price_level: null,
            }));
            setSections(converted);
          }
        }
      } catch (err) {
        console.error('Error loading travel sections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [wedding?.id]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <OptimizedBackground
        src="/images/backgrounds/pearl.webp"
        alt="Pearl Background"
        priority
      >
        <Box sx={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner message="Loading travel info..." />
        </Box>
      </OptimizedBackground>
    );
  }

  return (
    <OptimizedBackground
      src="/images/backgrounds/pearl.webp"
      alt="Pearl Background"
      priority
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100svh',
        }}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: 'transparent',
            }}
          >
            <AppHeader
              variant="transparent"
              showBackButton
              backHref={`/${weddingSlug}/details`}
            />
          </Box>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              pt: 2,
              pb: 2,
              flexShrink: 0,
            }}
          >
            <Container
              maxWidth={false}
              sx={{ maxWidth: { xs: 361, md: 600 }, px: { xs: 2, md: 3 } }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <IconButton
                  onClick={handleBack}
                  sx={{
                    color: COLORS.text.strong,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 400,
                    fontSize: 18,
                    textTransform: 'uppercase',
                    color: '#141414',
                    letterSpacing: 1,
                  }}
                >
                  Travel & Stay
                </Typography>
                <Box sx={{ width: 40 }} />
              </Stack>
            </Container>
          </Box>
        )}

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            zIndex: 2,
            py: { xs: 2, md: 8 },
            px: { xs: 2, md: 3 },
          }}
        >
          <Container
            maxWidth={false}
            sx={{ maxWidth: { xs: 400, md: 600 } }}
          >
            {sections.length > 0 ? (
              <TravelSectionsDisplay
                sections={sections}
                primaryColor={primaryColor}
                onViewDetails={(section) => {
                  setDetailSection(section);
                  setDetailOpen(true);
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography sx={{ color: COLORS.text.subtle }}>
                  Travel information coming soon.
                </Typography>
              </Box>
            )}
          </Container>
        </Box>
      </Box>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailSection(null);
        }}
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
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {detailSection && (
            <>
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
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
                    {detailSection.title}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => {
                    setDetailOpen(false);
                    setDetailSection(null);
                  }}
                  size="small"
                  sx={{ color: COLORS.text.subtle }}
                >
                  <Close />
                </IconButton>
              </Box>

              {/* Body */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
                {detailSection.type === 'hotel' && (detailSection.address || detailSection.phone) && (
                  <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {detailSection.address && (
                      <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 0.5 }}>
                        {detailSection.address}
                      </Typography>
                    )}
                    {detailSection.phone && (
                      <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                        {detailSection.phone}
                      </Typography>
                    )}
                    {detailSection.price_level && (
                      <Typography variant="body2" sx={{ color: primaryColor, mt: 0.5 }}>
                        {'$'.repeat(detailSection.price_level)}
                      </Typography>
                    )}
                  </Box>
                )}

                {detailSection.more_details && (
                  <Box
                    sx={{
                      '& p': { margin: '0 0 12px 0', color: '#333', lineHeight: 1.7, fontSize: '0.925rem' },
                      '& ul': { paddingLeft: '20px', margin: '0 0 12px 0' },
                      '& li': { color: '#333', lineHeight: 1.7, fontSize: '0.925rem', mb: 0.5 },
                      '& a': { color: primaryColor, textDecoration: 'underline' },
                      '& strong': { fontWeight: 600 },
                    }}
                    dangerouslySetInnerHTML={{ __html: detailSection.more_details }}
                  />
                )}
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </OptimizedBackground>
  );
}
