'use client';

import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails, Button, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import { ExpandMore } from '@mui/icons-material';
import { Stack, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useWedding } from '@/lib/contexts/WeddingContext';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { weddingService, WeddingFAQ } from '@/lib/supabase/wedding-service';

export default function FAQPage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user, hasRSVPed, rsvpResponse } = useAuth();
  const { wedding } = useWedding();

  const shouldShowWhatsApp = hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [faqs, setFaqs] = useState<WeddingFAQ[]>([]);

  useEffect(() => {
    if (!wedding?.id) return;
    weddingService.getFAQs(wedding.id).then(setFaqs);
  }, [wedding?.id]);

  return (
    <OptimizedBackground
      src={wedding?.background_image || undefined}
      useAppDefault={!wedding?.background_image}
      className="min-h-screen"
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
            showBackButton={true}
            backHref={`/${weddingSlug}/details`}
          />
        </Box>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            pt: 2,
            pb: 2,
          }}
        >
          <Container
            maxWidth={false}
            sx={{
              maxWidth: { xs: 361, md: 600, lg: 700 },
              px: { xs: 2, md: 3 },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <IconButton
                onClick={() => router.back()}
                sx={{
                  color: '#000',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 400,
                  fontSize: 18,
                  lineHeight: 1.5,
                  letterSpacing: '5.56%',
                  textTransform: 'uppercase',
                  color: '#141414',
                }}
              >
                Q + A
              </Typography>

              {shouldShowWhatsApp ? (
                <IconButton
                  onClick={() => setWhatsAppModalOpen(true)}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#000',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#333',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516" />
                  </svg>
                </IconButton>
              ) : (
                <Box sx={{ width: 32, height: 32 }} />
              )}
            </Stack>
          </Container>
        </Box>
      )}

      {/* Main Content */}
      <Container
        maxWidth={false}
        sx={{
          maxWidth: { xs: '100%', md: 800, lg: 900 },
          px: { xs: 2, md: 4 },
          pb: 4,
          pt: { xs: 10, md: 14 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box>
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                style={{ marginBottom: '18px' }}
              >
                <Accordion
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    '&:before': {
                      display: 'none',
                    },
                    '&.Mui-expanded': {
                      margin: 0,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ color: '#000' }} />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        margin: { xs: '12px 0', md: '18px 0' },
                      },
                      minHeight: { xs: 'auto', md: '64px' },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: '#141414',
                        fontSize: { xs: '1.1rem', md: '1.25rem' },
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        lineHeight: 1.6,
                      }}
                    >
                      {faq.answer}
                    </Typography>
                    {faq.button_text && faq.button_link && (
                      <Button
                        variant="outlined"
                        href={faq.button_link}
                        fullWidth={true}
                        sx={{
                          mt: 2,
                          borderRadius: '16px',
                          borderColor: wedding?.primary_color || '#DE3F5E',
                          color: wedding?.primary_color || '#DE3F5E',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '6.25%',
                          px: 4,
                          py: 1.5,
                        }}
                      >
                        {faq.button_text}
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            ))}

            {faqs.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  No FAQs available yet.
                </Typography>
              </Box>
            )}
          </Box>
        </motion.div>
      </Container>

      <WhatsAppChannelModal
        open={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
    </OptimizedBackground>
  );
}
