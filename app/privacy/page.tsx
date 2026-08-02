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
import { FONTS } from '@/lib/theme/tokens';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const sectionTitleSx = { fontWeight: 'bold' as const, mb: 2, color: '#1a1a1a' };
const bodySx = { lineHeight: 1.7 };

export default function PrivacyPage() {
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
                Privacy Policy
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
              Privacy Policy
            </Typography>

            <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 6 }}>
              Last Updated: April 26, 2026 · Effective: April 26, 2026
            </Typography>

            <Stack spacing={4} sx={{ color: '#3a3a3a' }}>
              <section>
                <Typography variant="h5" sx={sectionTitleSx}>1. Who We Are</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Phera (&quot;<strong>Phera</strong>,&quot; &quot;<strong>we</strong>,&quot; &quot;<strong>us</strong>&quot;) is a wedding logistics platform operated by <strong>Ghumaan Ventures LLC</strong>, a Delaware limited liability company. We provide tools for couples to manage guest lists, send invitations and updates over WhatsApp, coordinate travel and accommodations, run AI-assisted guest concierge, and track vendor conversations. We process personal data in the United States, India, and Thailand and aim to comply with applicable data-protection laws in these jurisdictions, including the EU/UK GDPR, the California Consumer Privacy Act / CPRA (CCPA), and India&apos;s Digital Personal Data Protection Act, 2023 (DPDPA).
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>2. Roles — Controller vs. Processor</Typography>
                <Typography variant="body2" sx={bodySx}>
                  When you (the couple, planner, or admin) sign up and use Phera for your own wedding, we act as a <strong>controller</strong> of your account information.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  When you upload guest data (names, phone numbers, emails, dietary needs, travel info, passport names, etc.), we act as a <strong>processor</strong> on your behalf. You are the controller of your guests&apos; personal data and you warrant that you have a lawful basis (consent, legitimate interest, or another permitted basis under applicable law) to share it with us. Our Data Processing Addendum at <Link href="/legal/dpa" className="text-[#DE3F5E] hover:underline">/legal/dpa</Link> governs this relationship.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>3. Information We Collect</Typography>
                <Typography variant="body2" sx={{ ...bodySx, mb: 2 }}>
                  <strong>From the couple / admin:</strong>
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Account details — name, email, phone number, password hash, profile photo.</li>
                  <li>Wedding details — event dates, venues, schedule, FAQs, registry items, photos, design preferences.</li>
                  <li>Billing details — billing address and last 4 of payment method (full card data stays with Stripe; see Section 6).</li>
                  <li>Communications with us — support emails, chat transcripts.</li>
                </ul>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2, mb: 2 }}>
                  <strong>From guests (entered by the couple, or directly by guests via RSVP/PIN):</strong>
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Contact data — name, phone, email.</li>
                  <li>RSVP, dietary, plus-one info, party-size info, and tags.</li>
                  <li>Travel data — flight numbers, arrival/departure times, airline, accommodation.</li>
                  <li><strong>Sensitive logistics data</strong> — passport-name spelling, visa status, emergency contacts, language preferences, accessibility needs. Treated with stricter access controls.</li>
                  <li>Inbound WhatsApp messages and voice notes guests send to our Concierge number.</li>
                </ul>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2, mb: 2 }}>
                  <strong>From vendors (where Vendor Coordinator is enabled):</strong>
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>WhatsApp group messages addressed to or about the wedding (text, voice, images), captured via Whapi.Cloud.</li>
                </ul>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2, mb: 2 }}>
                  <strong>Automatically collected:</strong>
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Device, browser, and IP address.</li>
                  <li>Pages visited, features used, and time spent (Vercel Analytics; aggregated, no third-party cookies).</li>
                  <li>Crash and error telemetry (Sentry; may include redacted request data).</li>
                  <li>Auth session cookies (first-party, essential).</li>
                </ul>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>4. How We Use Your Information</Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li><strong>Provide the Service</strong> — render the wedding website, deliver RSVPs, send WhatsApp templates that the couple authors, route Concierge replies, assign rooms / shuttles, surface AI-generated summaries.</li>
                  <li><strong>AI processing</strong> — guest WhatsApp messages and voice notes are sent to large-language-model providers (Anthropic, Groq) and a speech-to-text provider (OpenAI Whisper via Groq) to generate Concierge replies and summaries. Inputs and outputs are retained per Section 8. We do not allow these providers to train their models on your data.</li>
                  <li><strong>Notifications</strong> — transactional emails (account, billing, RSVP receipts) and, where opted in, marketing emails.</li>
                  <li><strong>Payments</strong> — process subscriptions and refunds via Stripe.</li>
                  <li><strong>Security &amp; abuse prevention</strong> — rate limiting, fraud detection, audit logging.</li>
                  <li><strong>Improvement</strong> — aggregated, de-identified usage analysis.</li>
                  <li><strong>Legal compliance</strong> — respond to lawful requests, enforce our Terms.</li>
                </ul>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  <strong>Lawful bases (EU/UK GDPR):</strong> performance of contract (Service delivery, billing); legitimate interests (security, product improvement, service-related communication to admins); consent (marketing emails, WhatsApp messages to guests, voice transcription); legal obligation (tax records, lawful requests).
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>5. Automated Decision-Making</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Phera schedules automated WhatsApp messages (save-the-dates, RSVP reminders, travel collection, day-before nudges) based on a guest&apos;s outreach status and the wedding timeline. Our AI Concierge generates draft and live replies to guest questions. These do not produce decisions with legal or similarly significant effects on individuals. You can pause automation per wedding from the admin dashboard, and guests can opt out of WhatsApp at any time by replying STOP.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>6. Sub-Processors and Third Parties</Typography>
                <Typography variant="body2" sx={{ ...bodySx, mb: 2 }}>
                  We rely on the sub-processors listed at <Link href="/legal/sub-processors" className="text-[#DE3F5E] hover:underline">/legal/sub-processors</Link>. The list is updated when we add or remove a vendor. The current categories are:
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li><strong>Hosting &amp; database</strong> — Supabase (Postgres, Auth, Storage), Vercel (web hosting + analytics).</li>
                  <li><strong>Messaging</strong> — Meta WhatsApp Business Cloud API (guest-facing), Whapi.Cloud (vendor-facing groups).</li>
                  <li><strong>AI</strong> — Anthropic (Claude), Groq (LLM + Whisper), OpenAI (LLM + Whisper, where used). Data is sent only to fulfill the Service. Training opt-out is enforced contractually.</li>
                  <li><strong>Payments</strong> — Stripe (card data, subscription state). Phera does not see or store full card numbers.</li>
                  <li><strong>Email</strong> — Resend (transactional +, where opted in, marketing).</li>
                  <li><strong>Monitoring</strong> — Sentry (errors and traces; PII scrubbed where possible).</li>
                </ul>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  We do not sell your personal information. We do not share guest contact data with advertisers.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>7. International Data Transfers</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Phera and most of its sub-processors are based in the United States. Personal data is transferred from India and the EU/UK to the United States. We rely on the EU Standard Contractual Clauses (SCCs) and the UK International Data Transfer Addendum, and on appropriate safeguards permitted under DPDPA Section 16. Where a sub-processor processes data in another country (e.g. Whapi.Cloud in the EU), the same protections flow through.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>8. Data Retention</Typography>
                <Typography variant="body2" sx={{ ...bodySx, mb: 2 }}>
                  We keep personal data only as long as needed for the purposes described above. Default retention:
                </Typography>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2, '& th, & td': { border: '1px solid #e5e5e5', p: 1, fontSize: '0.875rem', textAlign: 'left' }, '& th': { bgcolor: '#f8f8f8', fontWeight: 600 } }}>
                  <thead>
                    <tr><th>Category</th><th>Retention</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Account &amp; couple-authored content</td><td>Until account deletion + 30-day grace</td></tr>
                    <tr><td>Guest data uploaded by host</td><td>12 months after the wedding date, then purged or anonymized — sooner on request</td></tr>
                    <tr><td>Guest-submitted responses &amp; comments (RSVP answers, comments)</td><td>90 days after the wedding date, then deleted</td></tr>
                    <tr><td>WhatsApp message logs (in &amp; out)</td><td>12 months</td></tr>
                    <tr><td>Voice notes &amp; Whisper transcripts</td><td>30 days</td></tr>
                    <tr><td>Vendor-group messages (Whapi)</td><td>12 months after the wedding date</td></tr>
                    <tr><td>Support transcripts</td><td>24 months</td></tr>
                    <tr><td>Payment + billing metadata</td><td>7 years (tax / chargeback)</td></tr>
                    <tr><td>Backups</td><td>30-day rolling</td></tr>
                    <tr><td>Security &amp; audit logs</td><td>12 months</td></tr>
                  </tbody>
                </Box>
                <Typography variant="body2" sx={bodySx}>
                  Couples may shorten retention or trigger early erasure from the dashboard or by emailing <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a>. Some records (tax, fraud, legal hold) may be retained beyond the windows above where required by law.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>9. Security</Typography>
                <Typography variant="body2" sx={bodySx}>
                  We use industry-standard safeguards: TLS in transit, encryption at rest, Row-Level Security in Postgres, principle-of-least-privilege access, MFA on admin accounts, secret rotation, audit logging, and 24/7 error monitoring. We do not transmit raw passwords. Despite these measures, no system is perfectly secure.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  <strong>Breach notification:</strong> if we become aware of a personal-data breach affecting your information, we will notify the relevant supervisory authority (and you, where required) without undue delay and within <strong>72 hours</strong> of becoming aware, in line with GDPR Article 33 and DPDPA Section 8(6).
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>10. Your Rights</Typography>
                <Typography variant="body2" sx={{ ...bodySx, mb: 2 }}>
                  Depending on where you live, you have some or all of the following rights regarding your personal data:
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
                  <li><strong>Correction</strong> — fix inaccurate or incomplete data.</li>
                  <li><strong>Deletion / erasure</strong> — ask us to delete data we no longer need to keep.</li>
                  <li><strong>Portability</strong> — receive your data in a machine-readable format.</li>
                  <li><strong>Restriction or objection</strong> — limit certain processing, including direct marketing.</li>
                  <li><strong>Withdraw consent</strong> — at any time, without affecting prior lawful processing.</li>
                  <li><strong>Lodge a complaint</strong> — with your local supervisory authority (e.g. EDPB member, ICO in the UK, Data Protection Board of India).</li>
                </ul>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  To exercise any of these rights, email <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a>. We respond within 30 days. Where you are a guest of a Phera couple, we may forward part of the request to that couple as the controller.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>11. California / U.S. State Rights</Typography>
                <Typography variant="body2" sx={bodySx}>
                  California residents (CCPA / CPRA) and residents of other U.S. states with comprehensive privacy laws (Colorado, Connecticut, Texas, Virginia, etc.) have the rights listed in Section 10. We do not &quot;sell&quot; or &quot;share&quot; personal information for cross-context behavioral advertising, and we honor Global Privacy Control (GPC) signals. To submit a request, email <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a>. You may use an authorized agent to act on your behalf with appropriate verification. We will not discriminate against you for exercising any of these rights.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>12. India / DPDPA</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Phera complies with the Digital Personal Data Protection Act, 2023. Data Principals (individuals whose data we hold) have the rights in Section 10 plus the right to nominate another individual to exercise rights upon death or incapacity. Our designated Grievance Officer is reachable at <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a>; we will acknowledge complaints within 7 working days and resolve within 30 days. Data of children under 18 is collected only with verifiable parental consent; we do not undertake tracking, behavioral monitoring, or targeted advertising directed at children.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>13. Children</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Phera is not directed to children under 13 (United States, COPPA) or under 18 (India, DPDPA). We do not knowingly collect personal information from such individuals. If you believe a child has provided us personal data, contact us and we will delete it.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>14. Cookies and Tracking</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Phera uses essential first-party cookies for authentication and load balancing. We use Vercel Analytics for aggregated, cookie-less page-view analytics. We do not use cross-site tracking pixels, advertising cookies, or session-replay tools. We honor Do Not Track and Global Privacy Control signals where they apply.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>15. WhatsApp Messaging &amp; Opt-Out</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Guests are messaged on WhatsApp only after the host has imported them and only via templates that the host approves. Guests can opt out at any time by replying <strong>STOP</strong> to the Phera WhatsApp number; the opt-out is recorded in our <code>whatsapp_opt_ins</code> registry and propagated to all sub-processors. Couples may also remove a guest from outreach at any time from the admin dashboard.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>16. Changes to This Policy</Typography>
                <Typography variant="body2" sx={bodySx}>
                  We will post material changes to this policy here and update the &quot;Last Updated&quot; date above. For material changes affecting how we use already-collected data, we will email account admins at least 14 days before the change takes effect.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>17. Contact</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Questions, requests, or complaints — including DPDPA grievances — go to:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                  Ghumaan Ventures LLC<br />
                  Privacy &amp; Grievance Officer<br />
                  Email: <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a>
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
