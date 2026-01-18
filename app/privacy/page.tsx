'use client';

import {
  Box,
  Container,
  Typography,
  Stack,
  useTheme,
  alpha,
  Breadcrumbs,
} from '@mui/material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppHeader from '@/components/shared/AppHeader';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function PrivacyPage() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      <AppHeader variant="transparent" />

      <Container maxWidth="md" sx={{ pt: { xs: 12, md: 16 }, pb: 12 }}>
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <Breadcrumbs sx={{ mb: 4 }}>
            <Link href="/" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors text-sm font-medium">
              Home
            </Link>
            <Typography color="text.primary" variant="body2" sx={{ fontWeight: 500 }}>
              Privacy Policy
            </Typography>
          </Breadcrumbs>

          <Typography
            variant="h2"
            sx={{
              fontFamily: 'var(--font-instrument-serif)',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              color: '#1a1a1a',
              mb: 2,
            }}
          >
            Privacy Policy
          </Typography>

          <Typography variant="body1" sx={{ color: '#6a6a6a', mb: 6 }}>
            Last Updated: Jan 18, 2026
          </Typography>

          <Stack spacing={4} sx={{ color: '#3a3a3a' }}>
            <section>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                1. Introduction
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                Welcome to Phera. This Privacy Policy explains how Ghumaan Ventures LLC ("we," "us," or "our") collects, uses, discloses, and safeguards your information when you visit our website and use our services. We are committed to protecting your personal data and your privacy. We currently operate in the United States, Thailand, and India, and we aim to comply with applicable data protection laws in these jurisdictions.
              </Typography>
            </section>

            <section>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                2. Information We Collect
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
                We collect information that you provide directly to us, such as when you create an account, manage a wedding, upload guest lists, or communicate with us. This may include:
              </Typography>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Contact Details:</strong> Names, email addresses, and phone numbers.</li>
                <li><strong>Wedding Information:</strong> Dates, locations, event schedules, and registry details.</li>
                <li><strong>Guest Data:</strong> Information uploaded by hosts, including guest names and contact info for RSVP and coordination purposes.</li>
                <li><strong>Travel Details:</strong> Flight and accommodation information provided for event coordination.</li>
              </ul>
              <Typography variant="body1" sx={{ mt: 2, lineHeight: 1.7 }}>
                <strong>Payment Information:</strong> We do not store your payment or card details. All payments are processed securely through <strong>Stripe</strong>, our third-party payment processor.
              </Typography>
            </section>

            <section>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                3. How We Use Your Information
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                We use your information solely to provide and improve our wedding coordination services. Guest contact details are used exclusively for RSVP-related communications and, only if specifically opted into, for event updates via our WhatsApp service.
              </Typography>
            </section>

            <section>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                4. Third-Party Services
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
                We work with trusted third-party service providers to help us operate our platform:
              </Typography>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Supabase:</strong> Used for secure data storage and authentication.</li>
                <li><strong>Meta/WhatsApp:</strong> Used for sending automated updates and communications to guests who have opted in.</li>
                <li><strong>Stripe:</strong> Used for all payment processing needs.</li>
              </ul>
            </section>

            <section>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                5. Data Security
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                We take reasonable measures to protect your information from unauthorized access or disclosure. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </Typography>
            </section>

            <section>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                6. Contact Us
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                If you have any questions about this Privacy Policy, please contact us at:
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
                Ghumaan Ventures LLC<br />
                Email: <a href="mailto:kv@phera.io" className="text-[#DE3F5E] hover:underline">kv@phera.io</a>
              </Typography>
            </section>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}
