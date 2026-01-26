'use client';

import { Container, Typography, Box } from '@mui/material';
import AppHeader from '@/components/shared/AppHeader';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

export default function FeaturesPage() {
  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <AppHeader variant="transparent" />
      <Box component="main" sx={{ flexGrow: 1, pt: 20 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'var(--font-instrument-serif)',
              mb: 4,
            }}
          >
            Features
          </Typography>
          <Typography variant="body1">
            Detailed features breakdown coming soon.
          </Typography>
        </Container>
      </Box>
    </OptimizedBackground>
  );
}
