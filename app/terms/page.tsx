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
import AppFooter from '@/components/shared/AppFooter';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { FONTS } from '@/lib/theme/tokens';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function TermsPage() {
  const theme = useTheme();

  return (
    <OptimizedBackground useAppDefault={true}>
      <Box sx={{ minHeight: '100vh' }}>
        <AppHeader variant="transparent" />

        <Container maxWidth="md" sx={{ pt: { xs: 12, md: 16 }, pb: 12 }}>
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <Breadcrumbs sx={{ mb: 4 }}>
              <Link href="/" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors text-sm font-medium">
                Home
              </Link>
              <Typography color="text.primary" variant="body2" sx={{ fontWeight: 500 }}>
                Terms of Service
              </Typography>
            </Breadcrumbs>

            <Typography
              variant="h2"
              sx={{
                fontFamily: FONTS.display,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                color: '#1a1a1a',
                mb: 2,
              }}
            >
              Terms of Service
            </Typography>

            <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 6 }}>
              Last Updated: Feb 27, 2026
            </Typography>

            <Stack spacing={4} sx={{ color: '#3a3a3a' }}>
              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  1. Acceptance of Terms
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  By accessing or using Phera ("the Service"), operated by Ghumaan Ventures LLC ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  2. Description of Service
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  Phera is a wedding planning and coordination platform that enables couples to create wedding websites, manage guest lists, coordinate travel logistics, send communications via WhatsApp, and facilitate RSVPs and event scheduling.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  3. User Accounts
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account and to update your information as necessary.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  4. User Content
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  You retain ownership of all content you upload to Phera, including photos, text, guest information, and event details. By uploading content, you grant us a limited license to store, display, and transmit that content solely for the purpose of providing the Service. We will not sell or share your content with third parties for marketing purposes.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  5. Guest Data & Communications
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  As a wedding host, you are responsible for ensuring you have appropriate consent to upload guest contact information. Our WhatsApp messaging features will only be used to send communications to guests who have opted in. We comply with Meta's WhatsApp Business policies for all messaging.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  6. Payments & Subscriptions
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  Certain features of Phera require a paid subscription. All payments are processed securely through Stripe. Subscription terms, pricing, and refund policies will be clearly presented at the time of purchase. We reserve the right to change pricing with reasonable notice.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  7. Prohibited Uses
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7, mb: 2 }}>
                  You agree not to:
                </Typography>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
                  <li>Upload malicious content, spam, or any material that infringes on intellectual property rights.</li>
                  <li>Attempt to gain unauthorized access to any part of the Service or its related systems.</li>
                  <li>Use the Service to send unsolicited communications or marketing messages.</li>
                </ul>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  8. Limitation of Liability
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  The Service is provided "as is" without warranties of any kind. To the fullest extent permitted by law, Ghumaan Ventures LLC shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you have paid us in the twelve months preceding the claim.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  9. Termination
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  We reserve the right to suspend or terminate your account at our discretion if you violate these Terms. You may delete your account at any time by contacting us. Upon termination, your data will be deleted in accordance with our Privacy Policy.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  10. Changes to Terms
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  We may update these Terms from time to time. We will notify registered users of material changes via email. Your continued use of the Service after changes are posted constitutes acceptance of the updated Terms.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a1a' }}>
                  11. Contact Us
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  If you have any questions about these Terms of Service, please contact us at:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                  Ghumaan Ventures LLC<br />
                  Email: <a href="mailto:contact@phera.io" className="text-[#DE3F5E] hover:underline">contact@phera.io</a>
                </Typography>
              </section>
            </Stack>
          </motion.div>
        </Container>
      </Box>
      <AppFooter />
    </OptimizedBackground>
  );
}
