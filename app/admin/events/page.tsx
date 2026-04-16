'use client';

import { Container } from '@mui/material';
import EventBuilder from '@/components/admin/EventBuilder';

export default function EventsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <EventBuilder />
    </Container>
  );
} 