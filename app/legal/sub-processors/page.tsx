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

interface SubProcessor {
  name: string;
  purpose: string;
  data: string;
  region: string;
  url: string;
}

const SUB_PROCESSORS: SubProcessor[] = [
  {
    name: 'Supabase',
    purpose: 'Postgres database, auth, file storage',
    data: 'All account, wedding, guest, RSVP, message, and vendor data',
    region: 'United States (AWS us-east-1)',
    url: 'https://supabase.com/privacy',
  },
  {
    name: 'Vercel',
    purpose: 'Web hosting + edge runtime + cookieless analytics',
    data: 'IP, request metadata, aggregated page views',
    region: 'United States (global edge)',
    url: 'https://vercel.com/legal/privacy-policy',
  },
  {
    name: 'Meta (WhatsApp Business Cloud API)',
    purpose: 'Sending guest-facing WhatsApp templates and Concierge messages',
    data: 'Guest phone, name, message body, message status',
    region: 'United States / Ireland',
    url: 'https://www.whatsapp.com/legal/business-policy/',
  },
  {
    name: 'Whapi.Cloud',
    purpose: 'Mirroring WhatsApp vendor groups for the Coordinator product',
    data: 'Vendor group messages (text/voice/image), participant phone numbers',
    region: 'European Union',
    url: 'https://whapi.cloud/privacy',
  },
  {
    name: 'Anthropic (Claude)',
    purpose: 'LLM for Concierge replies, summaries, and AI builder',
    data: 'Inbound guest messages, wedding context, vendor message summaries',
    region: 'United States',
    url: 'https://www.anthropic.com/legal/privacy',
  },
  {
    name: 'Groq',
    purpose: 'LLM inference (Llama) and Whisper speech-to-text',
    data: 'Inbound guest text + voice notes, vendor voice notes',
    region: 'United States',
    url: 'https://groq.com/privacy-policy/',
  },
  {
    name: 'OpenAI',
    purpose: 'LLM and Whisper speech-to-text (where used)',
    data: 'Inbound guest text + voice notes',
    region: 'United States',
    url: 'https://openai.com/policies/row-privacy-policy/',
  },
  {
    name: 'Stripe',
    purpose: 'Payment processing and subscription billing',
    data: 'Couple billing details, last-4 of card, transaction metadata. Phera never stores full card numbers.',
    region: 'United States / Ireland / India',
    url: 'https://stripe.com/privacy',
  },
  {
    name: 'Resend',
    purpose: 'Transactional and (opt-in) marketing email',
    data: 'Recipient email, subject line, message body',
    region: 'United States',
    url: 'https://resend.com/legal/privacy-policy',
  },
  {
    name: 'Sentry',
    purpose: 'Error monitoring, traces, and source-map debugging',
    data: 'Stack traces, request metadata; PII scrubbed where possible',
    region: 'United States',
    url: 'https://sentry.io/privacy/',
  },
];

export default function SubProcessorsPage() {
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
                Sub-Processors
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
              Sub-Processors
            </Typography>

            <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 6 }}>
              Last Updated: April 26, 2026
            </Typography>

            <Stack spacing={3} sx={{ color: '#3a3a3a' }}>
              <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                Phera relies on the third-party providers listed below to deliver the Service. Each is bound by a data-processing agreement and is contractually prohibited from using your data for its own purposes (including model training, except where strictly necessary to deliver the Service back to you). We update this list when sub-processors are added or removed.
              </Typography>

              <Box
                component="table"
                sx={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  '& th, & td': { border: '1px solid #e5e5e5', p: 1.5, fontSize: '0.875rem', textAlign: 'left', verticalAlign: 'top' },
                  '& th': { bgcolor: '#f8f8f8', fontWeight: 600 },
                }}
              >
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Purpose</th>
                    <th>Data</th>
                    <th>Region</th>
                  </tr>
                </thead>
                <tbody>
                  {SUB_PROCESSORS.map((p) => (
                    <tr key={p.name}>
                      <td>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[#DE3F5E] hover:underline">
                          {p.name}
                        </a>
                      </td>
                      <td>{p.purpose}</td>
                      <td>{p.data}</td>
                      <td>{p.region}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>

              <Typography variant="body2" sx={{ lineHeight: 1.7, mt: 2 }}>
                To request notification when this list changes, email <a href="mailto:privacy@phera.io" className="text-[#DE3F5E] hover:underline">privacy@phera.io</a> with the subject &quot;Subscribe sub-processor updates.&quot; You will be notified at least 30 days before a new sub-processor begins processing your data, with the right to object as described in our <Link href="/legal/dpa" className="text-[#DE3F5E] hover:underline">DPA</Link>.
              </Typography>
            </Stack>
          </motion.div>
        </Container>
      </Box>
      <AppFooter />
    </OptimizedBackground>
  );
}
