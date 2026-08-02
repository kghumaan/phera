import type { Metadata } from 'next';
import { Box, Typography } from '@mui/material';
import AppHeader from '@/components/shared/AppHeader';
import AppFooter from '@/components/shared/AppFooter';
import { COLORS } from '@/lib/theme/tokens';
import { queryVendors, countVendors } from '@/lib/vendors/directory/service';
import type { VendorRecord } from '@/lib/vendors/directory/types';
import { VENDOR_DIRECTORY_REACH } from '@/lib/landing/vendor-directory-copy';
import VendorsDirectoryClient from './VendorsDirectoryClient';

// Fresh data per request — the directory is read straight from vendor_directory.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Wedding Vendor Directory | Phera' },
  description:
    "Browse photographers, planners, makeup artists, DJs, mehendi artists, and decorators across Asia's top destination-wedding cities — rated and filterable by city, budget, and NRI experience. Free to browse.",
  alternates: { canonical: '/vendors' },
  openGraph: {
    type: 'website',
    title: 'Wedding Vendor Directory | Phera',
    description:
      "Photographers, planners, makeup artists, DJs and more across Asia's top destination-wedding cities — filterable by city, budget, and NRI experience.",
    url: '/vendors',
  },
};

export default async function VendorsPage() {
  // Server-render the first page so the directory is crawlable + fast.
  let vendors: VendorRecord[] = [];
  let total = 0;
  try {
    [vendors, total] = await Promise.all([
      queryVendors({ limit: 24, offset: 0 }),
      countVendors({}),
    ]);
  } catch (err) {
    console.error('[vendors-page] initial fetch failed', err);
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.bg.paper, display: 'flex', flexDirection: 'column' }}>
      <AppHeader variant="solid" />

      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 11, md: 13 } }}>
        {/* Hero header */}
        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2.5, md: 4 }, pt: { xs: 3, md: 5 }, pb: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Typography variant="subtitleCaps" sx={{ color: COLORS.brand.primary, display: 'block', mb: 1.5 }}>
            Vendor directory
          </Typography>
          <Typography variant="h2" sx={{ color: COLORS.text.strong, mb: 2 }}>
            Find your wedding vendors.
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.text.muted, maxWidth: 620, mx: 'auto' }}>
            {total > 0 ? `${total.toLocaleString()}+ ` : ''}photographers, planners, makeup artists, DJs, and more across{' '}
            {VENDOR_DIRECTORY_REACH}. Free to browse — sign up to save a shortlist and reach out.
          </Typography>
        </Box>

        <VendorsDirectoryClient initialVendors={vendors} initialTotal={total} />
      </Box>

      <AppFooter />
    </Box>
  );
}
