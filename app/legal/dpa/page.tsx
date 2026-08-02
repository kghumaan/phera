'use client';

import {
  Box,
  Container,
  Typography,
  Stack,
  Breadcrumbs,
} from '@mui/material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { FONTS, COLORS } from '@/lib/theme/tokens';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const sectionTitleSx = { fontWeight: 'bold' as const, mb: 2, color: '#1a1a1a' };
const bodySx = { lineHeight: 1.7 };

export default function DataProcessingAddendumPage() {
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
              <Link href="/privacy" className="text-[#4a4a4a] hover:text-[#DE3F5E] transition-colors text-sm font-medium">
                Privacy
              </Link>
              <Typography color="text.primary" variant="body2" sx={{ fontWeight: 500 }}>
                Data Processing Addendum
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
              Data Processing Addendum
            </Typography>

            <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 6 }}>
              Last Updated: April 26, 2026 · Effective: April 26, 2026
            </Typography>

            <Box sx={{ p: 2, mb: 4, border: `1px solid ${COLORS.border.strong}`, borderRadius: 2, bgcolor: COLORS.bg.muted }}>
              <Typography variant="body2" sx={{ ...bodySx, fontWeight: 600, color: COLORS.text.strong }}>
                This Data Processing Addendum (&quot;<strong>DPA</strong>&quot;) supplements the Phera Terms of Service and applies whenever Phera processes Personal Data on behalf of the Customer. By accepting the Terms of Service or signing up for Phera, the Customer accepts this DPA.
              </Typography>
            </Box>

            <Stack spacing={4} sx={{ color: '#3a3a3a' }}>
              <section>
                <Typography variant="h5" sx={sectionTitleSx}>1. Definitions</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Capitalized terms not defined here have the meaning given in the GDPR (Regulation (EU) 2016/679), the UK GDPR, the California Consumer Privacy Act / CPRA, and India&apos;s Digital Personal Data Protection Act, 2023 (DPDPA), as applicable. &quot;<strong>Customer</strong>&quot; means the wedding host, planner, or other admin who controls a Phera account. &quot;<strong>Personal Data</strong>&quot; means data the Customer or their guests upload that identifies, relates to, or could reasonably be linked to an individual. &quot;<strong>Processing</strong>&quot; has the meaning given in the GDPR.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>2. Roles</Typography>
                <Typography variant="body2" sx={bodySx}>
                  For Personal Data uploaded to or generated through the Service about the Customer&apos;s guests, vendors, or other third parties, the Customer is the <strong>Controller</strong> (or DPDPA &quot;<strong>Data Fiduciary</strong>&quot;) and Phera is the <strong>Processor</strong> (DPDPA &quot;<strong>Data Processor</strong>&quot;). Phera will Process Personal Data only on documented instructions from the Customer (which include the Customer&apos;s use of the Service and these Terms).
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>3. Scope &amp; Subject Matter</Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li><strong>Subject matter:</strong> Provision of the Phera Service.</li>
                  <li><strong>Duration:</strong> For as long as the Customer uses the Service plus the retention periods described in Section 8 of the <Link href="/privacy" className="text-[#DE3F5E] hover:underline">Privacy Policy</Link>.</li>
                  <li><strong>Nature and purpose:</strong> Hosting, transmission, storage, AI processing, messaging, and analytics necessary to operate the Service.</li>
                  <li><strong>Categories of Data Subjects:</strong> Wedding guests, vendors, and other contacts entered into the Service by the Customer.</li>
                  <li><strong>Categories of Personal Data:</strong> Names, contact details (phone, email), RSVP responses, dietary and accessibility info, travel and accommodation data, passport-name spelling, visa status, emergency contacts, language preference, photo and audio uploads, message content.</li>
                </ul>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>4. Phera&apos;s Obligations</Typography>
                <Typography variant="body2" sx={{ ...bodySx, mb: 2 }}>Phera will:</Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Process Personal Data only as necessary to provide the Service and on the Customer&apos;s documented instructions, except where required by law (and notify the Customer of any such legal requirement before Processing, unless prohibited);</li>
                  <li>Implement and maintain the technical and organizational security measures described in Section 9 of the Privacy Policy and in Schedule A below;</li>
                  <li>Ensure that personnel authorized to Process Personal Data are subject to confidentiality obligations;</li>
                  <li>Assist the Customer in fulfilling its obligations to respond to Data Subject requests, perform Data Protection Impact Assessments, and consult with supervisory authorities;</li>
                  <li>Notify the Customer without undue delay (and within <strong>72 hours</strong>) on becoming aware of a Personal Data Breach affecting the Customer&apos;s Personal Data, providing the information required by GDPR Article 33(3) / DPDPA Section 8(6);</li>
                  <li>On termination, delete or return all Personal Data per the retention schedule in the Privacy Policy or sooner upon the Customer&apos;s written request, unless retention is required by law.</li>
                </ul>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>5. Customer Obligations</Typography>
                <Typography variant="body2" sx={{ ...bodySx, mb: 2 }}>Customer:</Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Has and will maintain a lawful basis to Process the Personal Data it provides to Phera under all applicable laws (consent, contract, legitimate interests, etc.);</li>
                  <li>Has provided notice to Data Subjects as required by law, including notice that Phera will message guests on WhatsApp on the Customer&apos;s behalf;</li>
                  <li>Will respond to Data Subject requests it receives directly, with Phera&apos;s assistance under Section 4;</li>
                  <li>Will not upload Special Categories of Personal Data (GDPR Art. 9) unless reasonably necessary for wedding logistics (e.g. dietary, accessibility);</li>
                  <li>Will configure Phera and use it in compliance with applicable law.</li>
                </ul>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>6. Sub-Processors</Typography>
                <Typography variant="body2" sx={bodySx}>
                  The Customer authorizes Phera to engage the Sub-Processors listed at <Link href="/legal/sub-processors" className="text-[#DE3F5E] hover:underline">/legal/sub-processors</Link>. Phera will provide at least <strong>30 days&apos; notice</strong> before adding or replacing a Sub-Processor (by updating the page above and, on request, by email). The Customer may object on reasonable data-protection grounds within that period; if Phera cannot accommodate the objection, the Customer may terminate the Service for that wedding and receive a pro-rata refund of pre-paid fees for the unused term.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  Phera enters into a written agreement with each Sub-Processor that imposes data-protection obligations no less protective than those in this DPA, and remains liable for the performance of each Sub-Processor.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>7. International Transfers</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Where Phera transfers Personal Data from the EEA, the United Kingdom, or Switzerland to a country that has not received an adequacy decision, the EU Standard Contractual Clauses (Decision 2021/914) and, where applicable, the UK International Data Transfer Addendum, are incorporated into this DPA by reference. The Customer is the &quot;data exporter,&quot; and Phera is the &quot;data importer.&quot; Module 2 (Controller-to-Processor) applies to the Customer&apos;s direct relationship with Phera; Module 3 (Processor-to-Processor) applies between Phera and its Sub-Processors. For transfers from India, Phera complies with DPDPA Section 16 and any restrictions notified by the Central Government from time to time.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>8. Audits</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Phera will make available to the Customer information reasonably necessary to demonstrate compliance with this DPA, including by providing summaries of recent third-party audits and answering reasonable security questionnaires once per twelve-month period (and more frequently following a confirmed Personal Data Breach). On-site audits are by appointment, are subject to confidentiality, and are at the Customer&apos;s expense.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>9. Liability</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Each party&apos;s liability under this DPA is subject to the limitations and exclusions set out in the Phera <Link href="/terms" className="text-[#DE3F5E] hover:underline">Terms of Service</Link>, including the cap in Section 17 of those Terms.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>10. Order of Precedence</Typography>
                <Typography variant="body2" sx={bodySx}>
                  In case of conflict between this DPA and the Terms of Service, this DPA prevails to the extent of the conflict and only with respect to the Processing of Personal Data.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>Schedule A — Security Measures</Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>TLS 1.2+ in transit; AES-256 encryption at rest for the Postgres database and object storage;</li>
                  <li>Row-Level Security in Postgres scoped per wedding;</li>
                  <li>Secrets stored in environment-variable vaults; rotation on personnel changes;</li>
                  <li>MFA required on all administrator accounts; principle of least privilege;</li>
                  <li>Real-time error monitoring (Sentry) with PII scrubbing;</li>
                  <li>30-day rolling backups, encrypted and access-controlled;</li>
                  <li>Quarterly internal security review; annual third-party penetration test (planned);</li>
                  <li>Documented incident-response plan with 72-hour breach-notification commitment.</li>
                </ul>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>Contact</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Questions about this DPA: <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a>.
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
