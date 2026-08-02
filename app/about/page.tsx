'use client';

import { Box } from '@mui/material';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';
import { BACKGROUNDS } from '@/lib/constants/images';
import AppFooter from '@/components/shared/AppFooter';
import AboutSection from '@/components/landing/AboutSection';

export default function AboutPage() {
  return (
    <OptimizedBackground src={BACKGROUNDS.ROSE_QUARTZ} className="min-h-screen flex flex-col">
      <AppHeader variant="transparent" />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <AboutSection variant="page" />
      </Box>
      <AppFooter />
    </OptimizedBackground>
  );
}
