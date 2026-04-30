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

export default function TermsPage() {
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
              Last Updated: April 26, 2026 · Effective: April 26, 2026
            </Typography>

            <Box sx={{ p: 2, mb: 4, border: '1px solid #e5e5e5', borderRadius: 2, bgcolor: '#fafafa' }}>
              <Typography variant="body2" sx={{ ...bodySx, fontWeight: 600 }}>
                Important: These Terms contain a binding arbitration clause and a class-action waiver in Section 18. Please read them carefully. You may opt out of arbitration within 30 days of first accepting these Terms — see Section 18(c).
              </Typography>
            </Box>

            <Stack spacing={4} sx={{ color: '#3a3a3a' }}>
              <section>
                <Typography variant="h5" sx={sectionTitleSx}>1. Acceptance of Terms</Typography>
                <Typography variant="body2" sx={bodySx}>
                  These Terms of Service (&quot;<strong>Terms</strong>&quot;) form a binding agreement between you and <strong>Ghumaan Ventures LLC</strong>, a Delaware limited liability company doing business as <strong>Phera</strong> (&quot;<strong>Phera</strong>,&quot; &quot;<strong>we</strong>,&quot; &quot;<strong>us</strong>&quot;), governing your access to and use of phera.io and its related apps, APIs, and services (the &quot;<strong>Service</strong>&quot;). By creating an account, accessing the Service, or sending a message through it, you agree to these Terms and to our <Link href="/privacy" className="text-[#DE3F5E] hover:underline">Privacy Policy</Link>. If you do not agree, do not use the Service.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>2. The Service</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Phera helps couples plan and run weddings: build a wedding website, manage guest lists, send WhatsApp invitations and updates, collect RSVPs and travel info, assign rooms and shuttles, run an AI guest concierge, track vendor conversations, and report on logistics. Some features are gated behind paid plans (see Section 9).
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>3. Account &amp; Eligibility</Typography>
                <Typography variant="body2" sx={bodySx}>
                  You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account. You are responsible for keeping your credentials confidential and for all activity under your account. Notify us at <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a> immediately on suspected unauthorized use. A wedding may have multiple admins (couple members, planners, family); each admin is bound by these Terms.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>4. Your Content</Typography>
                <Typography variant="body2" sx={bodySx}>
                  You retain all rights to the photos, copy, schedules, FAQs, and other content you upload (&quot;<strong>Your Content</strong>&quot;). You grant Phera a worldwide, non-exclusive, royalty-free license to host, store, reproduce, transmit, render, and display Your Content solely as needed to operate the Service for you and your guests, and to back it up, secure it, and create de-identified analytics. We do not sell Your Content and do not use it to train third-party AI models.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>5. Guest Data — Your Responsibility</Typography>
                <Typography variant="body2" sx={bodySx}>
                  When you upload guest contact information (names, phone numbers, emails, dietary needs, travel data, passport names, etc.) you represent and warrant that:
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm mt-2">
                  <li>You have a lawful basis to collect and share that data with us under all applicable laws (including GDPR, CCPA/CPRA, DPDPA, TCPA, CAN-SPAM, and equivalent rules in your guests&apos; jurisdictions);</li>
                  <li>You have provided your guests with notice of how their data will be used, including that Phera will message them on WhatsApp on your behalf;</li>
                  <li>You will honor opt-out and erasure requests promptly when relayed to you, and will not re-add a guest who has opted out;</li>
                  <li>You will not upload special-category data (e.g. health, religion, biometric data) beyond what is reasonably needed to coordinate the wedding (e.g. dietary, accessibility).</li>
                </ul>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  We act as your processor under our <Link href="/legal/dpa" className="text-[#DE3F5E] hover:underline">Data Processing Addendum</Link>.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>6. WhatsApp &amp; Other Messaging</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Phera sends messages over Meta&apos;s WhatsApp Business Cloud API (guest-facing) and Whapi.Cloud (vendor groups). You agree to use the Service only to send messages to recipients who have consented under applicable law. You are solely responsible for ensuring TCPA, CAN-SPAM, GDPR, DPDPA, and Meta WhatsApp Business policy compliance for the content and audience of every message you send through Phera. Phera will:
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm mt-2">
                  <li>honor STOP / unsubscribe replies and propagate them across the Service;</li>
                  <li>refuse to send to numbers flagged opted-out;</li>
                  <li>throttle and back off when the underlying provider returns frequency-cap errors.</li>
                </ul>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  Phera is not a telecom carrier. We make no guarantee that any message will be delivered, displayed, or read; delivery depends on Meta, the recipient&apos;s carrier, and the recipient&apos;s device.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>7. Vendor Coordinator &amp; Recording Notice</Typography>
                <Typography variant="body2" sx={bodySx}>
                  When you connect a WhatsApp vendor group to Phera, message content (text, voice, images) is captured, stored, and processed for summaries, action items, and risk flags. You represent that you have notified all participants of the group, including vendors, that messages are being captured by Phera, and obtained any consent required by applicable law. Where a participant objects, you must remove that group from Phera or remove the participant.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>8. AI Output</Typography>
                <Typography variant="body2" sx={bodySx}>
                  The Service uses large language models (Anthropic, Groq) and speech-to-text (OpenAI Whisper via Groq) to draft Concierge replies, summarize vendor groups, and extract action items. AI output may be inaccurate, incomplete, or out of date. <strong>You should review AI-generated content before relying on it</strong>, especially anything sent to a guest or vendor. Phera disclaims liability for losses arising from your or a guest&apos;s reliance on AI output.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>9. Plans, Billing, Auto-Renewal &amp; Refunds</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Paid plans are billed in advance via Stripe in either monthly or annual cycles. <strong>Subscriptions auto-renew</strong> at the then-current price unless cancelled before the end of the current billing period. You may cancel any time from the dashboard or by emailing <a href="mailto:billing@phera.io" className="text-[#DE3F5E] hover:underline">billing@phera.io</a>; you will keep access until the end of the paid period.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  <strong>Refunds:</strong> we offer a full refund within <strong>14 days</strong> of any new purchase if you reach out to <a href="mailto:billing@phera.io" className="text-[#DE3F5E] hover:underline">billing@phera.io</a> requesting one. After 14 days, fees are non-refundable, except where required by law. Add-ons, message overage charges, and one-time service fees are non-refundable once consumed.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  We may change pricing for new billing periods on at least 30 days&apos; notice; changes do not apply to the current paid period.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>10. Acceptable Use</Typography>
                <Typography variant="body2" sx={{ ...bodySx, mb: 2 }}>You agree not to:</Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Use the Service for any unlawful purpose or in violation of applicable laws (including TCPA, CAN-SPAM, GDPR, CCPA, DPDPA, and Meta WhatsApp Business policy);</li>
                  <li>Send spam, unsolicited marketing, scams, or any content that is harassing, defamatory, hateful, sexually explicit, violent, or that promotes such content;</li>
                  <li>Upload content that infringes anyone&apos;s intellectual-property, privacy, or publicity rights;</li>
                  <li>Reverse-engineer, scrape, attempt to access non-public APIs, evade rate limits, or probe the Service for vulnerabilities outside a coordinated disclosure;</li>
                  <li>Use the Service to build a competing product, train a machine-learning model, or resell it without our written consent;</li>
                  <li>Interfere with or disrupt the Service, including by uploading malware or by overloading any infrastructure.</li>
                </ul>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>11. Beta &amp; Preview Features</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Some features may be marked &quot;beta,&quot; &quot;preview,&quot; or similar. They are provided as-is, may change or be removed without notice, and may not have the same uptime or support as generally-available features. Use them at your own risk.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>12. Service Availability</Typography>
                <Typography variant="body2" sx={bodySx}>
                  We work to keep the Service available and performant but make no commitment to specific uptime, throughput, or absence of bugs. Planned and emergency maintenance may take the Service offline. We are not liable for downtime, lost messages, or other Service interruptions, except where prohibited by law.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>13. Suspension, Termination &amp; Data Export</Typography>
                <Typography variant="body2" sx={bodySx}>
                  We may suspend or terminate your access immediately if you breach these Terms, present a security or abuse risk, or fail to pay. You may close your account at any time. On termination:
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm mt-2">
                  <li>You have <strong>30 days</strong> to export Your Content (CSV exports are available from the dashboard or by emailing <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a>);</li>
                  <li>After the 30-day grace period, we delete or anonymize Your Content per the retention schedule in our Privacy Policy;</li>
                  <li>Any pre-paid fees for periods after the termination date are refunded; consumed fees are not.</li>
                </ul>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>14. DMCA / Copyright</Typography>
                <Typography variant="body2" sx={bodySx}>
                  We respond to valid DMCA takedown notices and counter-notices. Send notices to <a href="mailto:dmca@phera.io" className="text-[#DE3F5E] hover:underline">dmca@phera.io</a> with the elements required by 17 U.S.C. § 512(c)(3). We terminate the accounts of repeat infringers in appropriate circumstances.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>15. Indemnification</Typography>
                <Typography variant="body2" sx={bodySx}>
                  You will indemnify, defend, and hold harmless Ghumaan Ventures LLC, its officers, employees, contractors, and affiliates from and against any third-party claim, loss, demand, fine, or expense (including reasonable attorneys&apos; fees) arising out of or related to:
                </Typography>
                <ul className="list-disc pl-6 space-y-2 text-sm mt-2">
                  <li>Your Content, including any guest data you upload;</li>
                  <li>Your messages sent through the Service (including any TCPA, CAN-SPAM, GDPR, DPDPA, or Meta WhatsApp Business policy claim by a recipient);</li>
                  <li>Your breach of these Terms or any law;</li>
                  <li>Your interactions with guests, vendors, or other users.</li>
                </ul>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  We will promptly notify you of any claim, give you control of the defense (with our right to participate at our expense), and reasonably cooperate. You may not settle a claim that imposes any obligation on Phera without our written consent.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>16. Disclaimers</Typography>
                <Typography variant="body2" sx={bodySx}>
                  THE SERVICE AND ALL CONTENT IT DELIVERS ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. PHERA DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR THAT ANY MESSAGE WILL BE DELIVERED OR READ.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>17. Limitation of Liability</Typography>
                <Typography variant="body2" sx={bodySx}>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PHERA AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  <strong>Cap.</strong> Our aggregate liability for any and all claims arising out of or related to these Terms or the Service will not exceed the <strong>greater of (a) USD $100 or (b) the fees you paid Phera in the 12 months preceding the event giving rise to the claim</strong>.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  Some jurisdictions do not allow the exclusion or limitation of certain damages. The limits in this Section apply to the fullest extent permitted in your jurisdiction.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>18. Dispute Resolution — Arbitration &amp; Class-Action Waiver</Typography>
                <Typography variant="body2" sx={bodySx}>
                  <strong>(a) Informal resolution.</strong> Before filing a claim, you agree to email <a href="mailto:legal@phera.io" className="text-[#DE3F5E] hover:underline">legal@phera.io</a> describing the dispute and the relief sought. The parties will attempt in good faith to resolve the dispute within 30 days.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  <strong>(b) Binding arbitration.</strong> Any dispute, claim, or controversy arising out of or relating to these Terms or the Service that is not resolved informally will be settled by binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, before a single arbitrator. The arbitration will take place in <strong>Delaware</strong> (or by video conference, at the consumer&apos;s option). Judgment on the award may be entered in any court of competent jurisdiction. The Federal Arbitration Act governs the interpretation and enforcement of this Section.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  <strong>(c) 30-day opt-out.</strong> You may opt out of this arbitration agreement by emailing <a href="mailto:legal@phera.io" className="text-[#DE3F5E] hover:underline">legal@phera.io</a> within <strong>30 days</strong> of first accepting these Terms with the subject line &quot;Arbitration Opt-Out&quot; and your account email. Opting out has no other effect on these Terms.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  <strong>(d) Class-action waiver.</strong> Disputes will be resolved on an individual basis. <strong>You and Phera waive the right to bring or participate in a class, collective, consolidated, or representative action.</strong> If a court finds this waiver unenforceable for a particular claim, that claim must be brought in a court of competent jurisdiction in Delaware, but all other claims remain subject to arbitration.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  <strong>(e) IP carve-out.</strong> Either party may seek injunctive or equitable relief in a court of competent jurisdiction to protect its intellectual-property rights, without first proceeding through arbitration.
                </Typography>
                <Typography variant="body2" sx={{ ...bodySx, mt: 2 }}>
                  <strong>(f) Small-claims carve-out.</strong> Either party may bring an individual action in small-claims court if it qualifies.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>19. Governing Law</Typography>
                <Typography variant="body2" sx={bodySx}>
                  These Terms are governed by the laws of the State of Delaware, USA, without regard to its conflict-of-laws principles. Subject to Section 18, the state and federal courts located in <strong>New Castle County, Delaware</strong> have exclusive jurisdiction over any dispute that may proceed in court.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>20. Marketing &amp; Publicity</Typography>
                <Typography variant="body2" sx={bodySx}>
                  We may use your wedding name, photo, and quote in case studies and marketing collateral only with your prior written consent (an in-product opt-in counts as written consent). You can revoke that consent at any time, and we will remove the material from controlled channels within a reasonable period.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>21. Changes to These Terms</Typography>
                <Typography variant="body2" sx={bodySx}>
                  We may update these Terms. For material changes, we will email account admins at least 14 days before the change takes effect, post the updated Terms here, and update the &quot;Last Updated&quot; date. Continued use of the Service after the effective date constitutes acceptance.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>22. Miscellaneous</Typography>
                <Typography variant="body2" sx={bodySx}>
                  These Terms (with the Privacy Policy and DPA, where applicable) are the entire agreement between you and Phera regarding the Service, superseding any prior agreement on the same subject. If any provision is held unenforceable, the remaining provisions remain in full effect. Failure to enforce a right is not a waiver. You may not assign these Terms without our consent; we may assign in connection with a merger, acquisition, or asset sale. Notices to Phera go to <a href="mailto:legal@phera.io" className="text-[#DE3F5E] hover:underline">legal@phera.io</a>.
                </Typography>
              </section>

              <section>
                <Typography variant="h5" sx={sectionTitleSx}>23. Contact</Typography>
                <Typography variant="body2" sx={bodySx}>
                  Ghumaan Ventures LLC<br />
                  Email: <a href="mailto:legal@phera.io" className="text-[#DE3F5E] hover:underline">legal@phera.io</a> · <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a> · <a href="mailto:billing@phera.io" className="text-[#DE3F5E] hover:underline">billing@phera.io</a>
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
