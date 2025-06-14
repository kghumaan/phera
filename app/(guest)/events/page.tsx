'use client';

import { Container } from '@mui/material';
import CulturalGuide from '@/components/guest/CulturalGuide';

export default function GuestEventsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <CulturalGuide />
    </Container>
  );
} 