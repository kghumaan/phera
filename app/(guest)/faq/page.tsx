'use client';

import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails, Button } from '@mui/material';
import { motion } from 'framer-motion';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import AppHeader from '@/components/shared/AppHeader';
import { ExpandMore } from '@mui/icons-material';
import { Stack, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// FAQ data
const faqData = [
  {
    question: "Can I bring a plus-one?",
    answer: "Plus-ones are only available if you were given that option during RSVP. The hotel has limited capacity, so we've had to be very selective with plus-ones. If you have questions about bringing someone, reach out to us directly!",
  },
  {
    question: "Do I need a visa for Thailand?",
    answer: "It depends on your passport! Many countries get visa-free entry for 30 days (including US and Indian citizens). Check with the Thai embassy or consulate for your specific requirements.",
  },
  {
    question: "What if I need to change my RSVP?",
    answer: "Just log back into the website with your email and tap on your RSVP status to change it, or message us directly.",
  },
  {
    question: "What would you like as wedding gifts?",
    answer: "Your presence is the greatest present! If you'd like to give something, we have a honeymoon fund and new home fund you can contribute to (link below). We're not doing physical gifts since we're all traveling.",
    button: { text: "Registry", link: "/registry" },
  },
  {
    question: "Where can I shop for Indian outfits?",
    answer: "Check our dress code page for our favorite stores and online retailers! Many brands ship internationally. Can't find something? Just reach out - we're happy to help!",
    button: { text: "events & Dress code", link: "/events" },
  },
  {
    question: "Can I arrive earlier or leave later?",
    answer: "Absolutely! We're covering Jan 4-5 nights, but you can extend your stay. Book additional nights ASAP as the hotel fills up quickly during this time. Use the link below or email vidhi@thepalayana.com and CC booking@thepalayana.com if you’d prefer to stay in the same room we assign to you for the 4th and 5th.",
    button: { text: "Booking Link", link: "https://bit.ly/45TiuuI" },
  },
  {
    question: "How much spending money should I bring?",
    answer: "For tips, local shopping, and any extra resort services (spa, room service), $200-300 equivalent should be plenty for the weekend.",
  }
];

export default function FAQPage() {
  const router = useRouter();

  return (
    <OptimizedBackground 
      src="/images/backgrounds/lavendar.png"
      className="min-h-screen"
    >
      {/* Header */}
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
        <Container maxWidth="sm">
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
                fontFamily: 'Outfit',
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
            <Box sx={{ width: 48 }} /> {/* Spacer */}
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ pb: 4, pt: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* FAQ Accordions */}
          <Box>
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
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
                      margin: 0, // Prevent MUI from adding extra margins
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ color: '#000' }} />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        margin: '12px 0',
                      },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Outfit',
                        fontWeight: 600,
                        color: '#141414',
                        fontSize: '1.1rem',
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#666',
                        lineHeight: 1.6,
                      }}
                    >
                      {faq.answer}
                    </Typography>
                    {faq.button && (
                      <Button
                        variant="outlined"
                        href={faq.button.link}
                        fullWidth={true}
                        sx={{
                          mt: 2,
                          borderRadius: '16px',
                          borderColor: '#DE3F5E',
                          color: '#DE3F5E',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '6.25%',
                          fontFamily: 'Outfit',
                          px: 4,
                          py: 1.5,
                        }}
                      >
                        {faq.button.text}
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </Container>
    </OptimizedBackground>
  );
} 